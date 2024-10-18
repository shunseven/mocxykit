/**
 * Created by seven on 16/3/18.
 */
/// <reference path="./types/global.d.ts" />
import { Application } from 'express';
import clientMiddleware from './clientMiddleware';
import entry from './mockProxy/entry';
import events from 'events';

events.EventEmitter.defaultMaxListeners = 20;

const defaultConfig: ProxyMockOptions = {
  apiRule: '/api/*',
  https: true,
  cacheRequestHistoryMaxLen: 30,
  configPath: '/config',
}

export function proxyMock(app: Application, options: ProxyMockOptions = defaultConfig) {
  const config = Object.assign({}, defaultConfig, options);
  if (process.env.NODE_ENV !== 'development') {
    clientMiddleware(app, config)
  }
  entry(app, config);
  // 开发环境使用 Vite 的 Connect 实例作为中间件
  
}

export default proxyMock;