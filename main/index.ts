/**
 * Created by seven on 16/3/18.
 */
/// <reference path="./types/global.d.ts" />
import {  NextFunction, Request, Response } from 'express';
import clientEntry from './clientEntry';
import entry from './mockProxy/entry';
import events from 'events';
import viewRequest from './mockProxy/viewRequest';
import { setupNodeEnvVariables } from './mockProxy/common/fun';

events.EventEmitter.defaultMaxListeners = 20;

const defaultConfig: ProxyMockOptions = {
  apiRule: '/api/*',
  https: true,
  cacheRequestHistoryMaxLen: 30,
  configPath: '/config',
  lang: 'zh',
}

export function proxyMockMiddleware(options: ProxyMockOptions = defaultConfig) {
  const config = Object.assign({}, defaultConfig, options);
  const entryMiddleware = entry(config);
  const clientMiddleware = clientEntry(config);
  
  // 初始化时设置环境变量
  setupNodeEnvVariables();

  return function (req: Request, res: Response, next: NextFunction) {
    let isClient = false;
    if (process.env.PROCY_MOCK_NODE_ENV !== 'development') {
       isClient = clientMiddleware(req, res)
    }
    const isProxyMock =entryMiddleware(req, res, next);
    const isViews = viewRequest(req, res);
    if (!isClient && !isViews && !isProxyMock) {
      // 都没成功匹配到路由
      next();
    }
  }
}

export default proxyMockMiddleware;