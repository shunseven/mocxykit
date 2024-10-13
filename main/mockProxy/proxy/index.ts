import { Request, Response, NextFunction, Application } from "express";
import httpProxy from "http-proxy";
import fs from "fs";
import path from "path";
import { parseUrlToKey, sleep } from "../common/fun";
import { getTargetApiData } from "../common/fetchJsonData";

interface ProxyConfig {
  proxyUrl: string;
  ignorePath: boolean;
}

export default function createProxyServer (app: Application, options: ProxyMockOptions) {
  const httpProxyServer = httpProxy.createProxyServer({});
  let httpsProxyServer: undefined | httpProxy;
  const serverOption: httpProxy.ServerOptions = {}
  if (options.https) {
    serverOption.agent = {
      key:  fs.readFileSync(path.resolve(__dirname, 'server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'server.csr'))
    }
    httpsProxyServer = httpProxy.createProxyServer(serverOption).listen(443);
  }
  return async function(req: Request, res: Response, next: NextFunction, proxyConfig: ProxyConfig) {
    let proxy = httpProxyServer
    const pathKey = parseUrlToKey(req.url);
    const apiData = getTargetApiData(pathKey)
    const proxyOption = {
      target: proxyConfig.proxyUrl,
      changeOrigin: true,
      autoRewrite: true,
      secure: false,
      cookieDomainRewrite: "",
      ws: true,
    }
    if (proxyConfig.proxyUrl.includes('https') && httpsProxyServer) {
      proxy = httpsProxyServer
    }
    if (apiData && apiData.duration) {
      await sleep(apiData.duration)
    }
    // 去除一些浏览的限制
    proxy.on('proxyRes', function (proxyRes, req, res) {
      const sc = proxyRes.headers['set-cookie'];
      if (Array.isArray(sc)) {
        proxyRes.headers['set-cookie'] = sc.map(sc => {
          return sc.split(';')
              .filter(v => v.trim().toLowerCase() !== 'secure' && !v.trim().toLowerCase().includes('samesite='))
              .join(';')
        });
      }
    })
    proxy.web(req, res, proxyOption);
    proxy.on('error', function (err, req, res) {
      console.error('err', err);
      next(err);
    });
  }
}