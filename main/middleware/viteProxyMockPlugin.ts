import { getApiData, getEnvData, setApiData, getMocxykitConfig } from '../mockProxy/common/fetchJsonData';
import proxyMockMiddleware from './proxyMockMiddleWare';
import defaultConfig from './defaultConfig';
import { envUpdateEmitter } from '../index';
import createExpressCompatibilityLayer from '../mockProxy/common/createExpressCompatibilityLayer';
import { getInjectCode } from '../mockProxy/common/injectCode';

declare global {
  var originEnv: typeof process.env;
}

function viteProxyMockPlugin(options: ProxyMockOptions = defaultConfig) {
  // 添加环境检查
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 获取mocxykit.config.json文件配置
  const fileConfig = getMocxykitConfig();
  
  // 合并配置：默认配置 < 文件配置 < 传入的配置
  options = Object.assign({}, defaultConfig, options, fileConfig);

  if (!global.originEnv) {
    global.originEnv =  Object.entries(process.env).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: value || ''
    }), {} as Record<string, string>);
  }
  const originEnv = global.originEnv;

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

    if (!envId) {
      return originEnv;
    }

    const envData = getEnvData();
    const currentEnv = envData.find(env => env.id === envId);
    if (currentEnv?.variables) {
      const newEnvVars = currentEnv.variables.reduce((acc, { key, value }) => ({
        ...acc,
        [key]: value
      }), {});

      return {
        ...originEnv,
        ...newEnvVars
      };
    }

    return null;
  }

  return {
    name: 'vite-plugin-proxy-mock',

    transformIndexHtml(html: string) {
      // 仅在开发环境下注入按钮
      if (!isDevelopment || !options.buttonPosition) return html;

      const injectCode = getInjectCode({
        configPath: options.configPath as string,
        lang: options.lang as string,
        buttonPosition: options.buttonPosition as string
      });
      
      return html.replace('</body>', injectCode + '</body>');
    },

    configureServer(server: any) { 
      // 仅在开发环境下启用中间件
      if (!isDevelopment) return;

      // 添加中间件，包装请求和响应对象
      server.middlewares.use((req: any, res: any, next: any) => {
        const { enhancedReq, enhancedRes } = createExpressCompatibilityLayer(req, res);
        // @ts-ignore
        return proxyMockMiddleware(options)(enhancedReq, enhancedRes, next);
      });

      envUpdateEmitter.on('serverRestart', () => {
        console.log('服务器已重新启动');
         server.restart();
      })

      // 监听环境变量更新事件
      envUpdateEmitter.on('updateEnvVariables', async () => {
        console.log('更新环境变量');
        const newEnv = setupEnvVariables();
        if (newEnv) {
          // 更新 process.env
          Object.entries(newEnv).forEach(([key, value]) => {
            process.env[key] = value as string;
          });

          // 重新构建并重启开发服务器
          try {
            // 重新构建
            await server.restart();
            
            console.log('服务器已重新启动，环境变量已更新');
          } catch (error) {
            console.error('重启服务器时出错:', error);
          }
        }
      });
    },

    config(config: any) {
      // 仅在开发环境下处理环境变量
      if (!isDevelopment) return config;

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
            ...defineEntries
          }
        };
      }
      return config;
    }
  };
}



export default viteProxyMockPlugin;
