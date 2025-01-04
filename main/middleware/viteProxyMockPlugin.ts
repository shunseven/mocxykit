import { Plugin } from 'vite';
import { getApiData, getEnvData, setApiData } from '../mockProxy/common/fetchJsonData';
import proxyMockMiddleware from './proxyMockMiddleWare';
import defaultConfig from './defaultConfig';
import { envUpdateEmitter } from '../index';
import type { Connect } from 'vite';
import path from 'path';
import fs from 'fs';
import type { ServerResponse } from 'http';

// Express 兼容层
function createExpressCompatibilityLayer(req: Connect.IncomingMessage, res: ServerResponse) {
  // 扩展 request 对象
  const enhancedReq = req as any;
  
  // 确保 url 包含完整路径
  if (!enhancedReq.url.startsWith('/')) {
    enhancedReq.url = '/' + enhancedReq.url;
  }

  // 添加 path 属性 - 从 url 中提取不包含查询参数的路径
  enhancedReq.path = enhancedReq.url.split('?')[0];

  // 添加 socket.localPort
  if (!enhancedReq.socket) {
    enhancedReq.socket = {
      localPort: process.env.PORT || 3000
    };
  }

  // 扩展 response 对象
  const enhancedRes = res as any;

  // 添加 send 方法
  if (!enhancedRes.send) {
    enhancedRes.send = function(body: any) {
      if (typeof body === 'string') {
        res.setHeader('Content-Type', 'text/html');
        res.end(body);
      } else if (Buffer.isBuffer(body)) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.end(body);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      }
    };
  }

  // 添加 json 方法
  if (!enhancedRes.json) {
    enhancedRes.json = function(body: any) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    };
  }

  // 添加 sendFile 方法
  if (!enhancedRes.sendFile) {
    enhancedRes.sendFile = function(filePath: string) {
      try {
        const absolutePath = path.resolve(filePath);
        const fileContent = fs.readFileSync(absolutePath);
        const ext = path.extname(filePath).toLowerCase();
        
        // 简单的 MIME 类型映射
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml'
        };

        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.end(fileContent);
      } catch (err) {
        res.statusCode = 404;
        res.end('File not found');
      }
    };
  }

  return { enhancedReq, enhancedRes };
}

// 创建事件发射器实例

function ViteProxyMockPlugin(options: ProxyMockOptions = defaultConfig): Plugin {
  const debug = options.debug || false;
  
  // 添加日志打印函数
  const log = {
    info: (...args: any[]) => {
      if (debug) console.log(...args);
    },
    warn: (...args: any[]) => {
      if (debug) console.warn(...args);
    },
    error: (...args: any[]) => {
      if (debug) console.error(...args);
    }
  };

  log.info('🚀 ViteProxyMockPlugin initialized with options:', options);
  let originEnv: Record<string, string> | null = null;

  // 清理环境变量值的辅助方法
  function cleanEnvValue(envObj: Record<string, any>): Record<string, any> {
    return Object.keys(envObj).reduce((acc, key) => ({
      ...acc,
      [key]: typeof envObj[key] === 'string' ? 
        envObj[key].replace(/^"(.*)"$/, '$1') : 
        envObj[key]
    }), {});
  }

  // 处理环境变量更新
  function setupEnvVariables() {
    const apiData = getApiData();
    log.info('📦 Current API Data:', apiData);

    if (!apiData.hasEnvPlugin) {
      apiData.hasEnvPlugin = true;
      setApiData(apiData);
    }

    const envId = apiData.currentEnvId;
    if (!envId && !originEnv) {
      log.warn('⚠️ No environment ID found and no original environment saved');
      return null;
    }

    if (!envId) {
      log.info('↩️ Returning to original environment');
      return originEnv;
    }

    const envData = getEnvData();
    log.info('🌍 Current Environment Data:', envData);
    const currentEnv = envData.find(env => env.id === envId);

    if (currentEnv?.variables) {
      if (!originEnv) {
        originEnv = Object.entries(process.env).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value || ''
        }), {} as Record<string, string>);
      }

      const newEnvVars = currentEnv.variables.reduce((acc, { key, value }) => ({
        ...acc,
        [key]: value
      }), {});

      return {
        ...originEnv,
        ...newEnvVars,
        VITE_APP_BASE_API: '/api'
      };
    }

    return null;
  }

  return {
    name: 'vite-plugin-proxy-mock',

    configureServer(server) {
      log.info('🔧 Configuring Vite server with proxy mock middleware');
      
      // 添加中间件，包装请求和响应对象
      server.middlewares.use((req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        const { enhancedReq, enhancedRes } = createExpressCompatibilityLayer(req, res);
        // @ts-ignore
        return proxyMockMiddleware(options)(enhancedReq, enhancedRes, next);
      });

      // 监听环境变量更新事件
      envUpdateEmitter.on('updateEnvVariables', () => {
        log.info('🔄 Environment variables update triggered');
        const newEnv = setupEnvVariables();
        if (newEnv) {
          log.info('✅ New environment variables applied:', newEnv);
          // 更新 Vite 的环境变量
          Object.entries(newEnv).forEach(([key, value]) => {
            process.env[key] = value as string;
          });
          // 触发 Vite 重新构建
          server.ws.send({ type: 'full-reload' });
        }
      });
    },

    config(config) {
      log.info('⚙️ Processing Vite config');
      const envVars = setupEnvVariables();
      if (envVars) {
        log.info('📝 Defining environment variables in Vite config');
        return {
          define: Object.entries(envVars).reduce((acc, [key, value]) => ({
            ...acc,
            [`process.env.${key}`]: JSON.stringify(value)
          }), {})
        };
      }
      return config;
    }
  };
}

export default ViteProxyMockPlugin;
