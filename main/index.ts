/**
 * Created by seven on 16/3/18.
 */
/// <reference path="./types/global.d.ts" />
import { NextFunction, Request, Response } from 'express';
import clientEntry from './clientEntry';
import entry from './mockProxy/entry';
import { EventEmitter } from './mockProxy/common/event';
import viewRequest from './mockProxy/viewRequest';
import { getApiData, getEnvData, setApiData } from './mockProxy/common/fetchJsonData';
import { logger } from './mockProxy/common/log';

// 创建事件发射器实例
export const envUpdateEmitter = new EventEmitter();
envUpdateEmitter.setMaxListeners(20);

const defaultConfig: ProxyMockOptions = {
  apiRule: '/api/*',
  https: true,
  cacheRequestHistoryMaxLen: 30,
  configPath: '/config',
  lang: 'zh'
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
  originEnv: Record<string, string> | null = null;

  constructor(options: ProxyMockOptions = defaultConfig) {
    this.options = Object.assign({}, defaultConfig, options);
  }

  setupDevServer(app: any) {
    app.use(proxyMockMiddleware(this.options));
  }

  // 添加处理环境变量值的辅助方法
  private cleanEnvValue(envObj: Record<string, any>): Record<string, any> {
    return Object.keys(envObj).reduce((acc, key) => ({
      ...acc,
      [key]: typeof envObj[key] === 'string' ? 
        envObj[key].replace(/^"(.*)"$/, '$1') : // 移除首尾的双引号
        envObj[key]
    }), {});
  }

  setupEnvVariables(isInitial: boolean) {
    if (!this.compiler) return;
    const definePlugin = this.compiler.options.plugins.find(
      (plugin: any) => plugin.constructor.name === 'DefinePlugin'
    );
   
    const apiData = getApiData();
    if (definePlugin && !apiData.hasEnvPlugin) {
      apiData.hasEnvPlugin = true;
      setApiData(apiData);
    }

    if (!definePlugin) return;

    const envId = apiData.currentEnvId;
    
    if (!envId && !this.originEnv) return;

    if (!envId) {
      definePlugin.definitions['process.env'] = JSON.stringify(this.originEnv);
      if (this.compiler.watching) {
        this.compiler.watching.invalidate();
      }
      return;
    };

    const envData = getEnvData();
    const currentEnv = envData.find(env => env.id === envId);

    if (currentEnv?.variables) {
      // 处理 process.env 可能是对象的情况
      let existingEnv = {};
      const processEnv = definePlugin.definitions['process.env'];
      
      if (typeof processEnv === 'string') {
        try {
          existingEnv = this.cleanEnvValue(JSON.parse(processEnv));
        } catch (e) {
          logger({
            error: 'Failed to parse process.env string',
            processEnv
          });
        }
      } else if (typeof processEnv === 'object' && processEnv !== null) {
        existingEnv = this.cleanEnvValue(processEnv);
      }

      if (!this.originEnv) this.originEnv = existingEnv;

      const newEnvVars = currentEnv.variables.reduce((acc, { key, value }) => ({
        ...acc,
        [key]: value
      }), {});

      const mergedEnv = {
        ...this.originEnv,
        ...newEnvVars,
        VUE_APP_BASE_API: '/api'
      };

      // 确保输出的是字符串格式
      definePlugin.definitions['process.env'] = JSON.stringify(mergedEnv);

      if (this.compiler.watching) {
        this.compiler.watching.invalidate();
      }
    }
  }

  apply(compiler: any) {
    this.compiler = compiler;

    if (compiler.options.devServer) {
      const { setupMiddlewares } = compiler.options.devServer;
      console.log('setupMiddlewares:', setupMiddlewares);
      console.log('devServer:', compiler.options.devServer);
      if (compiler.options.devServer) {
        compiler.options.devServer.setupMiddlewares = (middlewares: any, devServer: any) => {
          this.setupDevServer(devServer.app);
          return setupMiddlewares ? setupMiddlewares(middlewares, devServer) : middlewares;
        };
      }
    }

    compiler.hooks.environment.tap('WebpackProxyMockPlugin', () => {
      this.setupEnvVariables(true);
    });

    compiler.hooks.afterEnvironment.tap('WebpackProxyMockPlugin', () => {
      // 添加环境变量更新事件监听
      envUpdateEmitter.on('updateEnvVariables', () => {
        console.log('Received environment update event');
        this.setupEnvVariables(false);
      });
    });
  }
}

export default proxyMockMiddleware;