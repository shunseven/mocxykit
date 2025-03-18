import { Request, Response, NextFunction, Application } from "express";
import httpProxy from "http-proxy";
import fs from "fs";
import path from "path";
import { parseUrlToKey, sleep, RequestBodyManager } from "../common/fun";
import { getTargetApiData } from "../common/fetchJsonData";
import { setCacheRequestHistory } from "../common/cacheRequestHistory";
import { Readable } from "stream";

// 解析 cookie 字符串为对象
function parseCookies(cookieString: string): Record<string, any> {
  return cookieString.split(';')
    .map(cookie => cookie.trim().split('='))
    .reduce((acc, [key, value]) => {
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
}

// 创建请求体管理器实例
const requestBodyManager = new RequestBodyManager(50);

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
  buffer?: any;
  [s: string]: any;
}

// 获取请求体数据的函数
async function getRequestBody(req: Request): Promise<any> {
  return new Promise((resolve) => {
    let bodyData = '';
    
    req.on('data', (chunk) => {
      bodyData += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const jsonBody = bodyData ? JSON.parse(bodyData) : {};
        resolve(jsonBody);
      } catch (e) {
        resolve({});
      }
    });
  });
}

// 创建一个可读流
function createReadableStream(data: any): Readable {
  const stream = new Readable();
  stream.push(typeof data === 'string' ? data : JSON.stringify(data));
  stream.push(null); // 表示流结束
  return stream;
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
        const isMocxykitFetch = req.headers['is-mocxykit-fetch']
        
        // 需要过滤的请求头字段
        const headersToFilter = [
          'host',
          'connection',
          'sec-ch-ua-platform',
          'accept-language',
          'accept',
          'sec-ch-ua',
          'user-agent',
          'sec-ch-ua-mobile',
          'sec-fetch-site',
          'sec-fetch-mode',
          'sec-fetch-dest',
          'referer',
          'accept-encoding',
          'content-length',
          'content-type',
          'transfer-encoding',
          'connection',
          'keep-alive',
          'proxy-connection', 
          'expect',
          'if-modified-since',
          'if-none-match',
          'if-unmodified-since',
          'if-match',
          'if-range',
          'cache-control',
          'pragma',
          'expires',
          'date',
          'cookie',
          'origin',
          'is-mocxykit-fetch'
        ];
        
        // 过滤请求头
        const filteredReqHeaders = { ...req.headers };
        headersToFilter.forEach(header => {
          delete filteredReqHeaders[header];
        });
       
        console.log(requestKey, requestBodyManager.get(requestKey));
        if(!isMocxykitFetch) {
          setCacheRequestHistory({
            url: (req.url as string).split('?')[0],
            key: parseUrlToKey(req.url as string),
            data: JSON.parse(body.toString()),
            time: new Date().toLocaleString(),
            reqHeaders: filteredReqHeaders as Record<string, any>,
            resHeaders: proxyRes.headers as Record<string, any>,
            params: queryParams,
            cookie: req.headers.cookie ? parseCookies(req.headers.cookie as string) : {},
            reqBody: requestBodyManager.get(requestKey) || {},
            method: req.method
          }, options.cacheRequestHistoryMaxLen);
        }
        // 清理请求体数据
        requestBodyManager.remove(requestKey);
        
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
    const apiData = getTargetApiData(pathKey);
    
    // 构建基本代理选项
    const proxyOption: proxyOption = {
      target: proxyConfig.proxyUrl,
      changeOrigin: true,
      autoRewrite: true,
      secure: true,
      cookieDomainRewrite: "",
    };
    
    // 对于 POST、PUT、PATCH 请求，处理请求体数据
    if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
      const bodyData = await getRequestBody(req);
      requestBodyManager.add(req.url, bodyData);
      
      // 创建一个可读流来传递请求体数据
      proxyOption.buffer = createReadableStream(bodyData);
    }
    
    // 处理 API 延迟
    if (apiData?.duration) {
      await sleep(apiData.duration);
    }
    
    // 执行代理请求
    proxy.web(req, res, proxyOption);
  }
}