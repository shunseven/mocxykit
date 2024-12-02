import { NextFunction, Request, Response } from "express";
import { getApiData } from "./common/fetchJsonData";
import { matchRouter, parseUrlToKey } from "./common/fun";
import createProxyServer from "./proxy";
import createMock from "./mock";

// 使用对象来存储常量值，方便引用
const TARGET_TYPES = {
  PROXY: 'proxy',
  MOCK: 'mock',
  CUSTOM_PROXY: 'customProxy'
} as const;

function handleProxyRequest(
  req: Request,
  res: Response,
  next: NextFunction,
  proxyServer: ReturnType<typeof createProxyServer>,
  proxyUrl: string
) {
  proxyServer(req, res, next, {
    proxyUrl,
    ignorePath: false,
  });
}

export default function entry(options: ProxyMockOptions) {
  const proxyServer = createProxyServer(options);
  const mockFun = createMock();

  return (req: Request, res: Response, next: NextFunction): boolean => {
    try {
      const apiRules = Array.isArray(options.apiRule) ? options.apiRule : [options.apiRule];
      const apiData = getApiData();
      const key = parseUrlToKey(req.url);
      const apiConfig = apiData.apiList.find(
        (item: ApiConfig) => item.key === key || parseUrlToKey(item.url) === key
      );

      if (!apiRules.some(rule => matchRouter(rule, req.path)) && !apiConfig) {
        return false;
      }

      switch (apiConfig?.target) {
        case TARGET_TYPES.MOCK:
          console.log(`${req.url} => mock数据`);
          mockFun(req, res, next);
          break;
        case TARGET_TYPES.CUSTOM_PROXY:
          if (apiConfig.selectCustomProxy) {
            console.log(`${req.url} 自定义代理 => ${ apiConfig.selectCustomProxy}`);
            handleProxyRequest(req, res, next, proxyServer, apiConfig.selectCustomProxy);
          }
          break;
        case TARGET_TYPES.PROXY:
        default:
          console.log(`${req.url} 代理 => ${ apiData.selectProxy}`);
          handleProxyRequest(req, res, next, proxyServer, apiData.selectProxy);
          break;
      }

      return true;
    } catch (error) {
      console.error('Proxy/Mock processing error:', error);
      next(error);
      return false;
    }
  };
}