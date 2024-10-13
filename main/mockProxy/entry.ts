import { Application, NextFunction, Request, Response } from "express";
import { getApiData } from "./common/fetchJsonData";
import { parseUrlToKey } from "./common/fun";
import createProxyServer from "./proxy";

export default function entry(app: Application, options: ProxyMockOptions) {
  const proxyServer = createProxyServer(app, options);
  app.get(options.apiRule, (req: Request, res: Response, next: NextFunction) => {
     const apiData = getApiData();
     const key = parseUrlToKey(req.url);
     const apiConfig = apiData.apiList.find(item => item.key === key);
     if (apiConfig?.target === 'proxy' || !apiConfig) {
       // 走全局代理
       console.log(`${req.url} 代理 => ${apiData.selectProxy}`);
       proxyServer(req, res, next, apiData);
     } else if (apiConfig?.target === 'mock') {
       // 走 mock 数据
       console.log(`${req.url} mock => ${apiConfig.selectMock}`);
     } else if (apiConfig?.target === 'customProxy') {
       // 走自定义代理
       console.log(`${req.url} 自定义代理 => ${apiConfig.selectCustomProxy}`);
     } else {
        console.log(`${req.url} 未匹配`);
        next();
     }
  });
}