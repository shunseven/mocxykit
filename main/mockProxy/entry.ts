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

// 判断是否是 AJAX 或 Fetch 请求
function isAjaxOrFetchRequest(req: Request): boolean {
  // 检查请求头
  const headers = req.headers;
  
  // 检查是否是 AJAX 请求
  if (headers['x-requested-with'] === 'XMLHttpRequest') {
    return true;
  }
  
  // 检查是否是 Fetch 请求
  if (headers['is-mocxykit-fetch'] === 'true') {
    return true;
  }

  // 检查是否包含 sec-fetch-* 请求头（现代浏览器的 fetch 请求特征）
  const hasSecFetchHeaders = Object.keys(headers).some(key => key.startsWith('sec-fetch-'));
  if (hasSecFetchHeaders) {
    return true;
  }
  
  return false;
}

export default function entry(options: ProxyMockOptions) {
  const proxyServer = createProxyServer(options);
  const mockFun = createMock();

  return (req: Request, res: Response, next: NextFunction): boolean => {
    try {
      const apiRules = options.apiRule.split(',');
      const apiData = getApiData();
      const key = parseUrlToKey(req.url);
      const apiConfig = apiData.apiList.find(
        (item: ApiConfig) => item.key === key || parseUrlToKey(item.url) === key || matchRouter(item.url, req.url)
      );

      // 检查 apiRule 是否为空字符串、不存在、为/或为/*
      const isEmptyApiRule = !options.apiRule || 
                            options.apiRule === '' || 
                            options.apiRule === '/' || 
                            options.apiRule === '/*';

      // 判断是否需要代理
      const shouldProxy = isEmptyApiRule 
        ? isAjaxOrFetchRequest(req) || !!apiConfig  // 空规则时，检查是否是 AJAX/Fetch 请求或存在 API 配置
        : apiRules.some(rule => matchRouter(rule, req.path)) || !!apiConfig;  // 有规则时，检查路径匹配或存在 API 配置
        
      if (!shouldProxy) {
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