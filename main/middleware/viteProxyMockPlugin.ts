import { getApiData, getEnvData, setApiData } from '../mockProxy/common/fetchJsonData';
import proxyMockMiddleware from './proxyMockMiddleWare';
import defaultConfig from './defaultConfig';
import { envUpdateEmitter } from '../index';
import createExpressCompatibilityLayer from '../mockProxy/common/createExpressCompatibilityLayer';

// 创建事件发射器实例

function viteProxyMockPlugin(options: ProxyMockOptions = defaultConfig) {
  // 添加环境检查
  const isDevelopment = process.env.NODE_ENV === 'development';
  options = Object.assign({}, defaultConfig, options);
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

    transformIndexHtml(html: string) {
      // 仅在开发环境下注入按钮
      if (!isDevelopment || !options.buttonPosition) return html;

      const buttonStyles = getButtonStyles(options.buttonPosition);
      const buttonText = options.lang === 'en' ? 'Proxy & Mock Config' : 'proxy&mock配置';
      const injectCode = `
        <style>
          #proxy-mock-btn {
            position: fixed;
            z-index: 9999;
            padding: 8px 16px;
            background: #1890ff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            ${buttonStyles}
          }
          #proxy-mock-iframe {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 95%;
            height: 95%;
            z-index: 10000;
            border: none;
            box-shadow: 0 0 20px rgba(0,0,0,0.2);
            background: white;
          }
          #proxy-mock-mask {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
          }
        </style>
        <button id="proxy-mock-btn">${buttonText}</button>
        <div id="proxy-mock-mask"></div>
        <iframe id="proxy-mock-iframe"></iframe>
        <script>
          (function(){
            const btn = document.getElementById('proxy-mock-btn');
            const iframe = document.getElementById('proxy-mock-iframe');
            const mask = document.getElementById('proxy-mock-mask');
            
            btn.addEventListener('click', () => {
              iframe.src = '${options.configPath}';
              iframe.style.display = 'block';
              mask.style.display = 'block';
            });
            
            mask.addEventListener('click', () => {
              iframe.style.display = 'none';
              mask.style.display = 'none';
              iframe.src = '';
            });
          })();
        </script>
      `;
      
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

function getButtonStyles(position: string): string {
  if (position.includes(',')) {
    const [x, y] = position.split(',').map(n => parseInt(n.trim()));
    return `left: ${x}px; top: ${y}px;`;
  }
  
  switch (position) {
    case 'top':
      return 'right: 20px; top: 20px;';
    case 'middle':
      return 'right: 20px; top: 50%; transform: translateY(-50%);';
    case 'bottom':
      return 'right: 20px; bottom: 20px;';
    default:
      return 'right: 20px; top: 50%; transform: translateY(-50%);';
  }
}

export default viteProxyMockPlugin;
