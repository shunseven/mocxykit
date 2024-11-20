/**
 * Created by seven on 16/3/18.
 */
/// <reference path="./types/global.d.ts" />
import { NextFunction, Request, Response } from 'express';
import clientEntry from './clientEntry';
import entry from './mockProxy/entry';
import { EventEmitter } from './common/event';
import viewRequest from './mockProxy/viewRequest';
import { getApiData, getEnvData } from './mockProxy/common/fetchJsonData';

// 创建事件发射器实例
export const envUpdateEmitter = new EventEmitter();
envUpdateEmitter.setMaxListeners(20);

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
  originEnv: Record<string, string> = {};

  constructor(options: ProxyMockOptions = defaultConfig) {
    this.options = Object.assign({}, defaultConfig, options);
  }

  setupDevServer(app: any) {
    app.use(proxyMockMiddleware(this.options));
  }

  setupEnvVariables(isInitial: boolean) {
    if (!this.compiler) return;
    const definePlugin = this.compiler.options.plugins.find(
      (plugin: any) => plugin.constructor.name === 'DefinePlugin'
    );

    if (!definePlugin) return;

    const apiData = getApiData();
    const envId = apiData.currentEnvId; // 使用 currentEnvId 替代 selectEnvId

    if (!envId) return;

    const envData = getEnvData();
    const currentEnv = envData.find(env => env.id === envId);

    if (currentEnv?.variables) {
      const existingEnv = definePlugin.definitions['process.env']
        ? JSON.parse(definePlugin.definitions['process.env'])
        : {};
      if (isInitial) this.originEnv = existingEnv;

      // 构建新的环境变量对象，并与现有值合并
      const newEnvVars = currentEnv.variables.reduce((acc, { key, value }) => ({
        ...acc,
        [key]: value
      }), {});

      // 合并现有值和新值
      const mergedEnv = {
        ...this.originEnv,
        ...newEnvVars
      };

      // 更新 DefinePlugin 的 definitions
      definePlugin.definitions['process.env'] = JSON.stringify(mergedEnv);

      console.log('环境变量已更新:', {
        originEnv: this.originEnv,
        new: newEnvVars,
        merged: mergedEnv
      });

      // 强制触发重新编译
      if (this.compiler.watching) {
        this.compiler.watching.invalidate();
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