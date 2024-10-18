import {  NextFunction, Request, Response } from "express";
import { getApiData } from "./common/fetchJsonData";
import { parseUrlToKey } from "./common/fun";
import createProxyServer from "./proxy";
import createMock from "./mock";
import {  match } from 'path-to-regexp';


export default function entry(options: ProxyMockOptions) {
  const proxyServer = createProxyServer(options);
  const mockFun = createMock();
  const matchRoute = match('/api/*');
  return (req: Request, res: Response, next: NextFunction) => {
    if (matchRoute(req.path)) {
      const apiData = getApiData();
      const key = parseUrlToKey(req.url);
      const apiConfig = apiData.apiList.find(item => item.key === key || parseUrlToKey(item.url) === key);
      if (apiConfig?.target === 'proxy' || !apiConfig) {
        // 走全局代理
        console.log(`${req.url} 代理 => ${apiData.selectProxy}`);
        proxyServer(req, res, next, {
          proxyUrl: apiData.selectProxy,
          ignorePath: false,
        });
      } else if (apiConfig?.target === 'mock') {
        // 走 mock 数据
        console.log(`${req.url} => mock数据`);
        mockFun(req, res, next)
      } else if (apiConfig?.target === 'customProxy') {
        // 走自定义代理
        console.log(`${req.url} 自定义代理 => ${apiConfig.selectCustomProxy}`);
        proxyServer(req, res, next, {
          proxyUrl: apiConfig.selectCustomProxy,
          ignorePath: false,
        });
      } else {
        console.log(`${req.url} 未匹配`);
        next();
      }
    } else {
      next();
    }
  }
}