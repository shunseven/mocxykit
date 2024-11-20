/**
 * Created by seven on 16/3/18.
 */
/// <reference path="./types/global.d.ts" />
import { NextFunction, Request, Response } from 'express';
import path from 'path';
import clientEntry from './clientEntry';
import entry from './mockProxy/entry';
import events from 'events';
import viewRequest from './mockProxy/viewRequest';
import { getApiData, getEnvData } from './mockProxy/common/fetchJsonData';

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
  
  return function (req: Request, res: Response, next: NextFunction) {
    let isClient = false;
    if (process.env.PROCY_MOCK_NODE_ENV !== 'development') {
       isClient = clientMiddleware(req, res)
    }
    const isProxyMock = entryMiddleware(req, res, next);
    const isViews = viewRequest(req, res);
    if (!isClient && !isViews && !isProxyMock) {
      next();
    }
  }
}

export class WebpackProxyMockPlugin {
  private options: ProxyMockOptions;
  private compiler: any = null;

  constructor(options: ProxyMockOptions = defaultConfig) {
    this.options = Object.assign({}, defaultConfig, options);
  }

  setupDevServer(app: any) {
    app.use(proxyMockMiddleware(this.options));
  }

  setupEnvVariables() {
    if (!this.compiler) return;

    const apiData = getApiData();
    const envId = apiData.selectEnvId;
    
    if (!envId) return;

    const envData = getEnvData();
    const currentEnv = envData.find(env => env.id === envId);
    
    if (currentEnv?.variables) {
      const definePlugin = this.compiler.options.plugins.find(
        (plugin: any) => plugin.constructor.name === 'DefinePlugin'
      );

      if (definePlugin) {
        // 构建新的环境变量对象
        const newEnvVars = currentEnv.variables.reduce((acc, { key, value }) => ({
          ...acc,
          [key]: value + Date.now()
        }), {});

        // 直接修改 definitions 对象的内容
        Object.keys(definePlugin.definitions).forEach(key => {
          delete definePlugin.definitions[key];
        });
        
        Object.assign(definePlugin.definitions, {
          'process.env': JSON.stringify(newEnvVars)
        });

        // 强制触发重新编译
        if (this.compiler.watching) {
          this.compiler.watching.invalidate();
        }
      }
    }
  }

  apply(compiler: any) {
    this.compiler = compiler;

    if (compiler.options.devServer) {
      const { setupMiddlewares } = compiler.options.devServer;
      
      if (compiler.options.devServer) {
        compiler.options.devServer.setupMiddlewares = (middlewares: any, devServer: any) => {
          this.setupDevServer(devServer.app);
          return setupMiddlewares ? setupMiddlewares(middlewares, devServer) : middlewares;
        };
      } 
    }
    
    compiler.hooks.environment.tap('WebpackProxyMockPlugin', () => {
      console.log('DefinePlugin hook');
      this.setupEnvVariables();
    });

    compiler.hooks.afterEnvironment.tap('WebpackProxyMockPlugin', () => {
      setInterval(() => {
        this.setupEnvVariables();
        // 增加重新编译的日志
        console.log('Triggering webpack recompilation...');
      }, 10000);
    });
  }
}

export default proxyMockMiddleware;