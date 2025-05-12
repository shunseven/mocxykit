import { getApiData, getEnvData, setApiData, getMocxykitConfig } from '../mockProxy/common/fetchJsonData';
import proxyMockMiddleware from './proxyMockMiddleWare';
import defaultConfig from './defaultConfig';
// 直接引入 EventEmitter 以避免循环依赖问题
import createExpressCompatibilityLayer from '../mockProxy/common/createExpressCompatibilityLayer';
import { getInjectCode } from '../mockProxy/common/injectCode';
import { envUpdateEmitter } from '../index';
import { restartApp } from '../mockProxy/common/restart';

declare global {
  var originEnv: typeof process.env;
}

function rsbuildProxyMockPlugin(options: ProxyMockOptions = defaultConfig) {
  // 添加环境检查
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 获取mocxykit.config.json文件配置
  const fileConfig = getMocxykitConfig();
  
  // 合并配置：默认配置 < 文件配置 < 传入的配置
  options = Object.assign({}, defaultConfig, options, fileConfig);

  if (!global.originEnv) {
    global.originEnv = Object.entries(process.env).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: value || ''
    }), {} as Record<string, string>);
  }
  const originEnv = global.originEnv;

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

  // 返回Rsbuild插件对象
  return {
    name: 'rsbuild-plugin-proxy-mock',

    // Rsbuild的插件设置
    setup(api: any) {
      // 仅在开发环境下执行
      if (!isDevelopment) return;
      
      // 使用modifyHtml API (如果存在)
      if (api.modifyHTML) {
        api.modifyHTML((html: string) => {
          if (!isDevelopment || !options.buttonPosition) return html;
          
          const injectCode = getInjectCode({
            configPath: options.configPath as string,
            lang: options.lang as string,
            buttonPosition: options.buttonPosition as string
          });
          
          return html.replace('</body>', injectCode + '</body>');
        });
      }

      
      // 为了在其他钩子中访问服务器实例，声明在更高作用域
      let server: any = null;

      // 添加中间件，需要使用 Rsbuild 的正确 API
      api.onBeforeStartDevServer((params: any) => {
        console.log('调用 onBeforeStartDevServer 钩子');
        
        // Rsbuild 2.0+ 版本参数可能是 { server } 结构
        // 早期版本可能直接是 server 对象
        server = params?.server || params;
        
        // 检查 server 是否可用
        if (!server && typeof api.getServerConfig === 'function') {
          // 尝试从 API 获取服务器配置
          server = api.getServerConfig();
          console.log('通过 getServerConfig 获取服务器:', server);
        }
        
        if (server && server.middlewares) {
          console.log('找到服务器中间件，注册代理中间件');
          // 添加中间件，包装请求和响应对象
          server.middlewares.use((req: any, res: any, next: any) => {
            const { enhancedReq, enhancedRes } = createExpressCompatibilityLayer(req, res);
            // @ts-ignore
            return proxyMockMiddleware(options)(enhancedReq, enhancedRes, next);
          });
        } else {
          console.warn('无法获取Rsbuild服务器实例，中间件未注册');
          console.log('服务器对象结构:', server);
        }
      });
      
      // 添加重启和环境变量更新监听
      api.onAfterStartDevServer(() => {
        envUpdateEmitter.on('serverRestart', () => {
          restartApp({
            exitDelay: 300,
            beforeExit: () => {
              console.log('即将重启应用以应用新的环境变量...');
            }
          });
        })
        envUpdateEmitter.on('updateEnvVariables', () => {
          restartApp({
            exitDelay: 300,
            beforeExit: () => {
              console.log('即将重启应用以应用新的环境变量...');
            }
          });
        });
      });
      
      // 保留原有的 modifyEnvironmentConfig 作为备选方案
      api.modifyEnvironmentConfig((rspackConfig: any) => {
        console.log("modifyEnvironmentConfig")
        if (!isDevelopment) return rspackConfig;
        
        const envVars = setupEnvVariables();
        if (envVars) {
          
          // 构建环境变量对象
          const defineEntries: Record<string, string> = {};
          
          Object.entries(envVars).forEach(([key, value]) => {
            defineEntries[`process.env.${key}`] = JSON.stringify(value);
            // 同时支持 import.meta.env 格式
            // defineEntries[`import.meta.env.${key}`] = JSON.stringify(value);
          });
          
          // 直接修改 Rspack 配置中的 define 属性
          if (!rspackConfig.source) {
            rspackConfig.source = {};
          }
          if (!rspackConfig.source.define) {
            rspackConfig.source.define = {};
          }
          
          rspackConfig.source.define = {
            ...rspackConfig.source.define,
            ...defineEntries
          };
        }
        
        return rspackConfig;
      });
    }
  };
}

export default rsbuildProxyMockPlugin;