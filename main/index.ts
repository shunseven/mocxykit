/**
 * Created by seven on 16/3/18.
 */
/// <reference path="./types/global.d.ts" />
import { Application } from 'express';
import { createServer as createViteServer, esbuildVersion } from 'vite';
import viteClientMiddleware from './viteClientMiddleware';
import clientMiddleware from './clientMiddleware';
import { ViteDevServer } from '../node_modules/vite/dist/node/index';
import entry from './mockProxy/entry';
import events from 'events';

events.EventEmitter.defaultMaxListeners = 20;

const defaultConfig: ProxyMockOptions = {
  apiRule: '/api/*',
  https: true,
  cacheRequestHistoryMaxLen: 30,
  configPath: '/config',
}

export function mockProxy(app: Application, options: ProxyMockOptions = defaultConfig) {
  const config = Object.assign({}, defaultConfig, options);
  entry(app, config);
  // 开发环境使用 Vite 的 Connect 实例作为中间件
  if (process.env.NODE_ENV === 'development') {
    createViteServer({
      server: {
        middlewareMode: true,
        port: 4343
      }
    }).then((vite: ViteDevServer) => {
      app.use(viteClientMiddleware(vite, config));
    })
  } else {
    // 生产环境使用静态资源
    app.use(clientMiddleware(config));
  }

}