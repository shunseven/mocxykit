import { Request, Response, NextFunction, Application } from "express";
import httpProxy from "http-proxy";
import fs from "fs";
import path from "path";
import { parseUrlToKey, sleep } from "../common/fun";
import { getTargetApiData } from "../common/fetchJsonData";
import { c, s } from "vite/dist/node/types.d-aGj9QkWt";
import { setCacheRequestHistory } from "../common/cacheRequestHistory";

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

export default function createProxyServer (app: Application, options: ProxyMockOptions) {
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
    const sc = proxyRes.headers['set-cookie'];
    if (Array.isArray(sc)) {
      proxyRes.headers['set-cookie'] = sc.map(sc => {
        return sc.split(';')
            .filter(v => v.trim().toLowerCase() !== 'secure' && !v.trim().toLowerCase().includes('samesite='))
            .join(';')
      });
    }
    let body = '';
    proxyRes.on('data', (chunk) => {
      body += chunk;
    });

    proxyRes.on('end', () => {
      // 缓存响应数据
      try{
        setCacheRequestHistory({
          url: req.url as string,
          key: parseUrlToKey(req.url as string),
          data: JSON.parse(body.toString()),
          time: new Date().toLocaleString()
        }, options.cacheRequestHistoryMaxLen);
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