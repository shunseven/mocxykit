/**
 * Created by seven on 16/3/18.
 */
/// <reference path="./types/global.d.ts" />
import { Request, Response, Application } from 'express';
import { createServer as createViteServer } from 'vite';
import viteClientMiddleware from './viteClientMiddleware';
import { ViteDevServer } from '../node_modules/vite/dist/node/index';
import entry from './mockProxy/entry';
import events from 'events';

events.EventEmitter.defaultMaxListeners = 20; 

const defaultConfig = {
  apiRule: '/api/*',
  https: true,
  cacheRequestHistoryMaxLen: 20,
}

export function mockProxy (app: Application, options: ProxyMockOptions = defaultConfig) {
   entry(app, options);
  // 使用 Vite 的 Connect 实例作为中间件
   createViteServer({
    server: {
      middlewareMode: true,
      port: 4343
    }
  }).then((vite: ViteDevServer) =>{
    app.use(viteClientMiddleware(vite, options));
  })
}