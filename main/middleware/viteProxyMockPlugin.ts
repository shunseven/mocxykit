import { getApiData, getEnvData, setApiData } from '../mockProxy/common/fetchJsonData';
import proxyMockMiddleware from './proxyMockMiddleWare';
import defaultConfig from './defaultConfig';
import { envUpdateEmitter } from '../index';
import createExpressCompatibilityLayer from '../mockProxy/common/createExpressCompatibilityLayer';

// 创建事件发射器实例

function viteProxyMockPlugin(options: ProxyMockOptions = defaultConfig) {

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

    if (!apiData.hasEnvPlugin) {
      apiData.hasEnvPlugin = true;
      setApiData(apiData);
    }

    const envId = apiData.currentEnvId;
    if (!envId && !originEnv) {
      return null;
    }

    if (!envId) {
      return originEnv;
    }

    const envData = getEnvData();
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

    configureServer(server: any) { 
      // 添加中间件，包装请求和响应对象
      server.middlewares.use((req: any, res: any, next: any) => {
        const { enhancedReq, enhancedRes } = createExpressCompatibilityLayer(req, res);
        // @ts-ignore
        return proxyMockMiddleware(options)(enhancedReq, enhancedRes, next);
      });

      // 监听环境变量更新事件
      envUpdateEmitter.on('updateEnvVariables', () => {
        console.log('更新环境变量');
        const newEnv = setupEnvVariables();
        if (newEnv) {
          // 更新 Vite 的环境变量
          Object.entries(newEnv).forEach(([key, value]) => {
            process.env[key] = value as string;
          });
          // 触发 Vite 重新构建
          server.ws.send({ type: 'full-reload' });
        }
      });
    },

    config(config: any) {
      const envVars = setupEnvVariables();
      if (envVars) {
        // 为每个环境变量创建单独的 define 条目
        const defineEntries = Object.entries(envVars).reduce((acc, [key, value]) => ({
          ...acc,
          [`import.meta.env.${key}`]: JSON.stringify(value),
          // 同时保持 process.env 的兼容性
          [`process.env.${key}`]: JSON.stringify(value)
        }), {});

        return {
          define: {
            ...defineEntries,
            // 确保基础环境变量存在
            'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV || 'development'),
            'import.meta.env.DEV': 'true',
            'import.meta.env.PROD': 'false',
          }
        };
      }
      return config;
    }
  };
}

export default viteProxyMockPlugin;
