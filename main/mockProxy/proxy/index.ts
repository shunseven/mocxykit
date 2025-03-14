import { Request, Response, NextFunction, Application } from "express";
import httpProxy from "http-proxy";
import fs from "fs";
import path from "path";
import { parseUrlToKey, sleep } from "../common/fun";
import { getTargetApiData } from "../common/fetchJsonData";
import { setCacheRequestHistory } from "../common/cacheRequestHistory";

// 解析 cookie 字符串为对象
function parseCookies(cookieString: string): Record<string, any> {
  return cookieString.split(';')
    .map(cookie => cookie.trim().split('='))
    .reduce((acc, [key, value]) => {
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
}

// 存储请求体数据
const requestBodies = new Map<string, any>();

interface ProxyConfig {
  proxyUrl: string;
  ignorePath: boolean;
}

interface proxyOptionTarget {
  protocol: 'https:' | 'http:';
  host: string;
  port: number;
  pfx: any;
  passphrase: string;
}

interface proxyOption {
  target: string | proxyOptionTarget;
  changeOrigin?: boolean;
  autoRewrite?: boolean;
  secure?: boolean;
  cookieDomainRewrite?: string;
  [s: string]: any;
}

export default function createProxyServer (options: ProxyMockOptions) {
  const p12 = fs.readFileSync(path.resolve(__dirname, 'certificate', 'certificate.p12'))
  let config = {}
  if(options.https) {
    config = {
      target: {
        protocol: 'https:',
        host: 'localhost',
        port: 443,
        pfx: p12,
        passphrase: '',
      },
      changeOrigin: true,
    }
  }
  const proxy = httpProxy.createProxyServer(config);
  
  // 捕获请求体数据
  proxy.on('proxyReq', function(proxyReq, req, res, options) {
    const requestKey = req.url as string;
    if (requestBodies.has(requestKey)) {
      requestBodies.delete(requestKey);
    }
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      let bodyData = '';
      req.on('data', (chunk) => {
        bodyData += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const jsonBody = bodyData ? JSON.parse(bodyData) : {};
          requestBodies.set(requestKey, jsonBody);
        } catch (e) {
          requestBodies.set(requestKey, {});
        }
      });
    }
  });
  
  proxy.on('proxyRes', function (proxyRes, req, res) {
    const contentType = proxyRes.headers['content-type'] || '';
    const isJsonData = contentType.includes('application/json');
    // 如果不是 JSON 数据，直接返回，不进行缓存
    if (!isJsonData) {
      return;
    }
    const sc = proxyRes.headers['set-cookie'];
    if (Array.isArray(sc)) {
      proxyRes.headers['set-cookie'] = sc.map(sc => {
        return sc.split(';')
            .filter(v => v.trim().toLowerCase() !== 'secure' && !v.trim().toLowerCase().includes('samesite='))
            .join(';')
      });
    }
    
    // 检查是否为 JSON 数据
    let body = '';
    proxyRes.on('data', (chunk) => {
      body += chunk;
    });

    proxyRes.on('end', () => {
      // 缓存响应数据
      try{
        const urlObj = new URL(req.url as string, `http://${req.headers.host || 'localhost'}`);
        const queryParams = Object.fromEntries(urlObj.searchParams.entries());
        const requestKey = req.url as string;
        
        setCacheRequestHistory({
          url: (req.url as string).split('?')[0],
          key: parseUrlToKey(req.url as string),
          data: JSON.parse(body.toString()),
          time: new Date().toLocaleString(),
          reqHeaders: req.headers as Record<string, any>,
          resHeaders: proxyRes.headers as Record<string, any>,
          params: queryParams,
          cookie: req.headers.cookie ? parseCookies(req.headers.cookie as string) : {},
          reqBody: requestBodies.get(requestKey) || {},
          method: req.method
        }, options.cacheRequestHistoryMaxLen);
        
        // 清理请求体数据
        if (requestBodies.has(requestKey)) {
          requestBodies.delete(requestKey);
        }
      } catch(e) {
        console.log('缓存响应数据失败', body.toString());
      }
    });
  })
  proxy.on('error', function (err, req, res,) {
    console.error('err', err);
  });

  return async function(req: Request, res: Response, next: NextFunction, proxyConfig: ProxyConfig) {
    if (!proxyConfig.proxyUrl) {
      return res.send('请设置代理');
    }

    const pathKey = parseUrlToKey(req.url);
    const apiData = getTargetApiData(pathKey)
    let proxyOption: proxyOption = {
      target: proxyConfig.proxyUrl,
      changeOrigin: true,
      autoRewrite: true,
      secure: true,
      cookieDomainRewrite: "",
    }
    if (apiData && apiData.duration) {
      await sleep(apiData.duration)
    }
   
    proxy.web(req, res, proxyOption);
     // 去除一些浏览器的限制
  }
}