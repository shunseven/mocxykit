import { Request, Response } from "express";
import { deleteMock, getApiData, getApiDataHasMockStatus, getMock, getTargetApiData, setApiData, setCustomProxyAndMock, saveEnvData, getEnvData, deleteEnvData } from "../common/fetchJsonData";
import { getReqBodyData, hasMockData, matchRouter, setupNodeEnvVariables } from "../common/fun";
import { clearCacheRequestHistory, deleteCacheRequestHistory, getCacheRequestHistory } from "../common/cacheRequestHistory";
import { envUpdateEmitter } from "../../index";
import { getMcpConfig, saveMcpConfig, createEditorMcpConfig, deleteEditorMcpConfig, McpConfig } from "../common/mcpConfig";
import fs from 'fs';
import path from 'path';

const successData = {
  msg: 'success'
};

const handleEnvChange = (apiData: ApiData, envId?: number) => {
  if (envId !== apiData.currentEnvId) {
    apiData.currentEnvId = envId;
    setApiData(apiData);
    envUpdateEmitter.emit('updateEnvVariables');
  }
};

let ngrokModule: any = null;
let tunnelUrl: string | null = null;

// 检查 Node.js 版本并加载 ngrok
function loadNgrok() {
  const nodeVersion = process.version.match(/^v(\d+)/);
  const majorVersion = nodeVersion ? parseInt(nodeVersion[1]) : 0;
  
  if (majorVersion >= 20) {
    try {
      ngrokModule = require('ngrok');
      return true;
    } catch (error) {
      console.error('Failed to load ngrok:', error);
      return false;
    }
  }
  return false;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createTunnel(port: number, authtoken: string) {
  if (!loadNgrok()) {
    throw new Error('Ngrok 功能仅支持 Node.js 20 及以上版本');
  }

  let lastError: any;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // 清理现有连接
      if (tunnelUrl) {
        try {
          await ngrokModule.disconnect(tunnelUrl);
        } catch (e) {
          console.log('Disconnect error:', e);
        }
      }

      try {
        await ngrokModule.kill();
      } catch (e) {
        console.log('Kill error:', e);
      }

      // 等待进程完全终止
      await wait(1000);

      // 设置新的 authtoken
      await ngrokModule.authtoken(authtoken);

      // 启动新连接
      console.log(`Attempting to connect (attempt ${i + 1}/${MAX_RETRIES})...`);
      const url = await ngrokModule.connect({
        addr: port,
        proto: 'http',
        onLogEvent: (log: any) => {
          console.log('Ngrok log:', log);
        }
      });
      
      tunnelUrl = url;
      return url;
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i < MAX_RETRIES - 1) {
        await wait(RETRY_DELAY);
      }
    }
  }

  throw new Error(`Failed after ${MAX_RETRIES} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
}

// 基码配置文件路径
const baseConfigFilePath = path.resolve(process.cwd(), 'mocxykit.config.json');

// 获取基码配置


// 保存基码配置
const saveBaseConfig = (config: ProxyMockOptions): boolean => {
  try {
    fs.writeFileSync(baseConfigFilePath, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('保存基码配置文件失败:', error);
    return false;
  }
};

export default function viewRequest(req: Request, res: Response, config: ProxyMockOptions): boolean {
  // 获取代理数据
  if (matchRouter('/express-proxy-mock/get-api-list', req.path)) {
    const apiData = getApiDataHasMockStatus()
    res.send(apiData)
    return true
  }

  // 删除代理数据
  if (matchRouter('/express-proxy-mock/delete-api-data', req.path)) {
    const apiData = getApiData()
    const keys = (req.query.key as string).split(',')
    apiData.apiList = apiData.apiList.filter(item => !keys.includes(item.key))
    setApiData(apiData)
    // 批量删除mock数据
    keys.forEach(key => deleteMock(key))
    res.send(successData)
    return true
  }

  // 替换原来的 create-proxy 路由
  if (matchRouter('/express-proxy-mock/save-proxy', req.path)) {
    const apiData = getApiData();
    const proxy = req.query.proxy as string;
    const name = req.query.name as string;
    const bindEnvId = req.query.bindEnvId ? Number(req.query.bindEnvId) : undefined;
    
    // 查找是否存在相同proxy的记录
    const existingIndex = apiData.proxy.findIndex(p => p.proxy === proxy);
    
    if (existingIndex !== -1) {
      // 更新现有代理
      apiData.proxy[existingIndex] = { proxy, name, bindEnvId };
    } else {
      // 创建新代理
      apiData.proxy.push({ proxy, name, bindEnvId });
    }
    
    apiData.selectProxy = proxy;
    handleEnvChange(apiData, bindEnvId);
    setApiData(apiData);
    res.send(successData);
    return true
  }

  // 删除代理
  if (matchRouter('/express-proxy-mock/delete-proxy', req.path)) {
    const apiData = getApiData()
    apiData.proxy = apiData.proxy.filter(item => item.proxy !== req.query.proxy)
    if (apiData.selectProxy === req.query.proxy && apiData.proxy.length > 0) {
      apiData.selectProxy = apiData.proxy[0].proxy
    }
    if (apiData.proxy.length === 0) {
      apiData.selectProxy = ''
    }
    setApiData(apiData)
    res.send(successData)
    return true
  }

  // 修改代理
  if (matchRouter('/express-proxy-mock/change-proxy', req.path)) {
    const apiData = getApiData();
    const selectedProxy = apiData.proxy.find(p => p.proxy === req.query.proxy);
    apiData.selectProxy = req.query.proxy as string;
    
    // 使用代理绑定的环境变量，如果没有则使用手动选择的环境变量
    handleEnvChange(apiData, selectedProxy?.bindEnvId || apiData.selectEnvId);
    
    setApiData(apiData);
    res.send(successData);
    return true;
  }

  // 添加mock
  if (matchRouter('/express-proxy-mock/save-customproxy-mock', req.path)) {
    getReqBodyData(req).then((data) => {
      setCustomProxyAndMock(data as CustomProxyAndMock)
      res.send(successData)
    })
    return true
  }

  // 获取mock数据
  if (matchRouter('/express-proxy-mock/get-costommock-proxy', req.path)) {
    const apiData = getTargetApiData(req.query.key as string)
    const mockDatas = getMock()
    const mockData = mockDatas[req.query.key as string] || {}
    res.send({
      ...apiData,
      mockData
    })
    return true
  }


  // 获取 API 列表
  if (matchRouter('/express-proxy-mock/get-api-list', req.path)) {
    const apiData = getTargetApiData(req.query.key as string)
    const mockDatas = getMock()
    const mockData = mockDatas[req.query.key as string] || {}
    res.send({
      ...apiData,
      mockData
    })
    return true
  }

  // 修改目标
  if (matchRouter('/express-proxy-mock/change-target', req.path)) {
    const apiData = getApiData()
    const key = req.query.key as string
    const target = req.query.target as 'proxy' | 'mock' | 'customProxy'
    apiData.apiList.forEach(item => {
      if (item.key === key) {
        item.target = target
      }
    })
    setApiData(apiData)
    res.send(successData)
    return true
  }

  // 批量修改目标
  if (matchRouter('/express-proxy-mock/batch-change-target', req.path)) {
    const apiData = getApiData()
    const AllMockData = getMock()
    const target = req.query.target as 'proxy' | 'mock' | 'customProxy'
    const pinnedItems = (req.query.pinnedItems as string || '').split(',').filter(Boolean)
    
    apiData.apiList.forEach(item => {
      // 如果是固定项则跳过
      if (pinnedItems.includes(item.key)) {
        return;
      }
      
      switch (target) {
        case 'proxy':
          item.target = 'proxy'
          break
        case 'mock':
          item.target = hasMockData(item, AllMockData) ? 'mock' : item.target
          break
        case 'customProxy':
          item.target = item.selectCustomProxy ? 'customProxy' : item.target
          break
      }
    })
    setApiData(apiData)
    res.send(successData)
    return true
  }

  // 获取单个请求数据
  if (matchRouter('/express-proxy-mock/get-api-item-and-mock', req.path)) {
    const key = req.query.key as string
    const apiData = getTargetApiData(key)
    const AllMockData = getMock()
    const mockData = AllMockData[key] || null
    res.send({
      apiData,
      mockData
    })
    return true
  }

  // 获取请求历史
  if (matchRouter('/express-proxy-mock/get-request-cache', req.path)) {
    res.send(getCacheRequestHistory())
    return true
  }

  // 获取请求历史的长度
  if (matchRouter('/express-proxy-mock/get-request-cache-length', req.path)) {
    const cacheRequestHistory = getCacheRequestHistory()
    res.send({
      length: cacheRequestHistory.length
    })
    return true
  }

  // 批量导入请求历史
  if (matchRouter('/express-proxy-mock/batch-import-request-cache-to-mock', req.path)) {
    getReqBodyData(req).then(result => {
      const { keys } = result as { keys: string[] }
      const cacheRequestHistory = getCacheRequestHistory()
      const AllMockData = getMock()
      keys.forEach(key => {
        const data = cacheRequestHistory.find(item => item.key === key)
        if (data) {
          const mockData = AllMockData[key] || {
            data: [],
            key,
            url: data.url,
          }

          const mockDataIndex = mockData.data.findIndex(item => Object.keys(item.requestData).length === 0)
          if (mockDataIndex !== -1) {
            mockData.data[mockDataIndex] = {
              name: '导入数据',
              requestData: {},
              responseData: data.data
            }
          } else {
            mockData.data.unshift({
              name: '导入数据',
              requestData: {},
              responseData: data.data
            })
          }
          setCustomProxyAndMock({
            mockData,
            name: '导入数据',
            url: data.url,
            duration: 0,
            customProxy: [],
            selectCustomProxy: '',
          })
          deleteCacheRequestHistory(key)
        }
      })
      res.send(successData)
    })

    return true
  }

  // 删除请求历史
  if (matchRouter('/express-proxy-mock/clear-request-cache', req.path)) {
    clearCacheRequestHistory()
    res.send(successData)
    return true
  }

  // 修改保存环境变量部分
  if (matchRouter('/express-proxy-mock/save-env-variables', req.path)) {
    getReqBodyData(req).then((data) => {
      const envData: EnvConfig = {
        id: data.id || Date.now(),
        name: data.name,
        variables: data.variables
      };
      const allEnvData = getEnvData();
      const index = allEnvData.findIndex(env => env.id === envData.id);
      
      if (index !== -1) {
        // 更新已存在的环境变量
        allEnvData[index] = envData;
        saveEnvData(envData);
      } else {
        // 添加新的环境变量
        saveEnvData(envData);
      }

      // 检查是否为当前使用的环境变量
      const apiData = getApiData();
      if (apiData.currentEnvId === envData.id) {
        envUpdateEmitter.emit('updateEnvVariables');
      }
      
      res.send(successData);
    });
    return true;
  }

  // 获取环境变量数据
  if (matchRouter('/express-proxy-mock/get-env-variables', req.path)) {
    res.send(getEnvData());
    return true;
  }

  // 切换环境变量（用户手动选择）
  if (matchRouter('/express-proxy-mock/change-env-variable', req.path)) {
    const apiData = getApiData();
    const envId = Number(req.query.envId) || undefined;
    apiData.selectEnvId = envId;
    
    // 检查当前代理是否有绑定环境，如果没有则使用手动选择的环境
    const currentProxy = apiData.proxy.find(p => p.proxy === apiData.selectProxy);
    handleEnvChange(apiData, currentProxy?.bindEnvId || envId);
    
    setApiData(apiData);
    res.send(successData);
    return true;
  }

  // 删除环境变量
  if (matchRouter('/express-proxy-mock/delete-env-variable', req.path)) {
    const envId = Number(req.query.envId);
    
    // 删除环境变量
    deleteEnvData(envId);
    
    // 如果删除的是当前使用的环境,需要更新 apiData
    const apiData = getApiData();
    if (apiData.currentEnvId === envId) {
      apiData.currentEnvId = undefined;
      apiData.selectEnvId = undefined;
      setApiData(apiData);
      envUpdateEmitter.emit('updateEnvVariables');
    }
    
    res.send(successData);
    return true;
  }

  // 刷新环境变量
  if (matchRouter('/express-proxy-mock/refresh-env-variable', req.path)) {
    envUpdateEmitter.emit('updateEnvVariables');
    res.send(successData);
    return true;
  }

  // 修改外网访问处理逻辑
  if (matchRouter('/express-proxy-mock/enable-public-access', req.path)) {
    getReqBodyData(req).then(async (data) => {
      const { authtoken } = data as { authtoken: string };
      if (!authtoken) {
        res.json({
          success: false,
          error: '请提供有效的 authtoken'
        });
        return;
      }

      const port = req.socket.localPort || 3000;
      
      try {
        const url = await createTunnel(port, authtoken);
        res.json({
          success: true,
          url
        });
      } catch (error: any) {
        console.error('Tunnel creation failed:', error);
        res.json({
          success: false,
          error: `创建隧道失败: ${error.message || '未知错误'}`
        });
      }
    }).catch(error => {
      res.json({
        success: false,
        error: '请求处理失败'
      });
    });
    
    return true;
  }

  // 获取MCP配置
  if (matchRouter('/express-proxy-mock/get-mcp-config', req.path)) {
    try {
      // 获取MCP配置，此时已经检查了编辑器配置文件
      const mcpConfig = getMcpConfig();
      
      res.send({
        code: 0,
        data: mcpConfig
      });
    } catch (error) {
      console.error('获取MCP配置失败:', error);
      res.status(500).send({
        code: 1,
        msg: '获取MCP配置失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
    return true;
  }

  // 更新MCP配置
  if (matchRouter('/express-proxy-mock/update-mcp-config', req.path)) {
    getReqBodyData(req).then((bodyData) => {
      try {
        // 从请求中获取配置和端口
        const requestData = bodyData as any;
        const port = requestData.port || 3200; // 从请求中获取端口
        
        // 保存MCP配置（不包含端口）
        const mcpConfig: McpConfig = {
          editors: requestData.editors || []
        };
        
        const oldConfig = getMcpConfig();
        
        // 保存基本配置
        saveMcpConfig(mcpConfig);
        
        // 处理编辑器配置文件
        // 判断MCP服务是否启用（通过editors数组是否有内容）
        const isMcpEnabled = mcpConfig.editors.length > 0;
        
        if (isMcpEnabled) {
          // 如果有选中的编辑器（MCP服务启用），为选中的编辑器创建配置文件
          mcpConfig.editors.forEach(editor => {
            createEditorMcpConfig(editor, port);
          });
          
          // 对于之前选中但现在未选中的编辑器，删除其配置
          oldConfig.editors.forEach(editor => {
            if (!mcpConfig.editors.includes(editor)) {
              deleteEditorMcpConfig(editor);
            }
          });
        } else {
          // 如果没有选中的编辑器（MCP服务未启用），删除所有编辑器配置
          oldConfig.editors.forEach(editor => {
            deleteEditorMcpConfig(editor);
          });
        }
        
        // 获取更新后的配置（包括检查编辑器配置文件）
        const updatedConfig = getMcpConfig();
        res.send({
          code: 0,
          msg: 'MCP配置更新成功',
          data: updatedConfig
        });
       
      } catch (error) {
        console.error('更新MCP配置失败:', error);
        res.status(500).send({
          code: 1,
          msg: '更新MCP配置失败',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    });
    return true;
  }

  // 获取基码配置
  if (matchRouter('/express-proxy-mock/get-base-config', req.path)) {
    res.send({
      success: true,
      data: config
    });
    return true;
  }

  // 设置基码配置
  if (matchRouter('/express-proxy-mock/set-base-config', req.path)) {
    getReqBodyData(req).then((data: Record<string, any>) => {
      const configData = data as ProxyMockOptions;
      const success = saveBaseConfig(configData);
      envUpdateEmitter.emit('serverRestart');
      res.send({
        success,
        data: success ? configData : null
      });
    });
    return true;
  }

  // ApiFox 用户团队和项目获取
  if (matchRouter('/express-proxy-mock/apifox-user-teams-and-projects', req.path)) {
    getReqBodyData(req).then(async (data: Record<string, any>) => {
      try {
        const { token } = data;
        if (!token) {
          res.send({
            success: false,
            message: '缺少 token 参数'
          });
          return;
        }

        // 导入 fox-api 模块
        const foxApi = await import('../../api/fox-api');
        const result = await foxApi.getUserTeamsAndProjects(token);
        
        res.send(result);
      } catch (error) {
        res.send({
          success: false,
          message: '获取团队和项目数据失败',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    });
    return true;
  }

  // ApiFox API 树形列表获取
  if (matchRouter('/express-proxy-mock/apifox-tree-list', req.path)) {
    getReqBodyData(req).then(async (data: Record<string, any>) => {
      try {
        const { token, projectId } = data;
        if (!token || !projectId) {
          res.send({
            success: false,
            message: '缺少必要参数'
          });
          return;
        }

        // 导入 fox-api 模块
        const foxApi = await import('../../api/fox-api');
        const result = await foxApi.getApiTreeList(token, projectId);
        
        res.send({
          success: true,
          data: result.data
        });
      } catch (error) {
        res.send({
          success: false,
          message: '获取 API 树形列表失败',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    });
    return true;
  }

  // ApiFox 同步 API
  if (matchRouter('/express-proxy-mock/apifox-sync-api', req.path)) {
    getReqBodyData(req).then(async (data: Record<string, any>) => {
      try {
        const { token, projectId, folders, autoCompleteUrl, autoSync, selectedApiRule } = data;
        if (!token || !projectId || !folders || !Array.isArray(folders) || folders.length === 0) {
          res.send({
            success: false,
            message: '缺少必要参数'
          });
          return;
        }

        // 导入必要的模块
        const foxApi = await import('../../api/fox-api');
        const apiManageTool = await import('../common/apiManageTool');
        
        try {
          // 1. 获取API树形结构
          const apiTreeResult = await foxApi.getApiTreeList(token, projectId);
          if (!apiTreeResult.success) {
            res.send({
              success: false,
              message: '获取API树形结构失败'
            });
            return;
          }
          
          // 2. 获取数据模型Schema
          const dataSchemasResult = await foxApi.getProjectDataSchemas(token, projectId);
          const dataSchemas = dataSchemasResult.success ? dataSchemasResult.data : [];
          
          // 3. 同步API数据
          const syncResult = await apiManageTool.syncApiFoxApi(
            apiTreeResult.data,
            folders,
            dataSchemas,
            autoCompleteUrl === true,
            selectedApiRule || '',
            token,
            projectId,
            foxApi.getApiDetail
          );
          
          // 4. 返回同步结果
          res.send(syncResult);
        } catch (error) {
          console.error('同步API数据出错:', error);
          res.send({
            success: false,
            message: '同步API数据出错',
            error: error instanceof Error ? error.message : '未知错误'
          });
        }
      } catch (error) {
        console.error('处理同步API请求出错:', error);
        res.send({
          success: false,
          message: '处理同步API请求出错',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    });
    return true;
  }

  // 获取 ApiFox 配置
  if (matchRouter('/express-proxy-mock/get-apifox-config', req.path)) {
    try {
      // 获取 ApiFox 配置
      const configPath = path.resolve(process.cwd(), 'proxyMockData', 'manageTool.json');
      let config: Record<string, any> = {};
      
      // 检查文件是否存在
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configData);
      }
      
      res.send({
        success: true,
        data: config.ApiFox || {}
      });
    } catch (error) {
      console.error('获取 ApiFox 配置失败:', error);
      res.send({
        success: false,
        message: '获取 ApiFox 配置失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
    return true;
  }

  // 保存 ApiFox 配置
  if (matchRouter('/express-proxy-mock/save-apifox-config', req.path)) {
    getReqBodyData(req).then(async (data: Record<string, any>) => {
      try {
        const configPath = path.resolve(process.cwd(), 'proxyMockData', 'manageTool.json');
        const dirPath = path.resolve(process.cwd(), 'proxyMockData');
        
        // 确保目录存在
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // 读取现有配置或创建新配置
        let config: Record<string, any> = {};
        if (fs.existsSync(configPath)) {
          const configData = fs.readFileSync(configPath, 'utf-8');
          try {
            config = JSON.parse(configData);
          } catch (e) {
            config = {};
          }
        }
        
        // 更新 ApiFox 配置
        config.ApiFox = data;
        
        // 保存配置
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        
        // 检查并更新 .gitignore 文件
        const gitignorePath = path.resolve(process.cwd(), '.gitignore');
        if (fs.existsSync(gitignorePath)) {
          let gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
          const ignoreEntry = 'proxyMockData/manageTool.json';
          
          // 检查是否已经包含了该条目
          if (!gitignoreContent.includes(ignoreEntry)) {
            // 添加到 .gitignore 文件
            gitignoreContent += `\n${ignoreEntry}`;
            fs.writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
            console.log('已将 proxyMockData/manageTool.json 添加到 .gitignore 文件');
          }
        }
        
        res.send({
          success: true,
          message: '保存 ApiFox 配置成功'
        });
      } catch (error) {
        console.error('保存 ApiFox 配置失败:', error);
        res.send({
          success: false,
          message: '保存 ApiFox 配置失败',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    });
    return true;
  }

  // 保存请求数据到 ApiList
  if (matchRouter('/express-proxy-mock/save-request-data', req.path)) {
    getReqBodyData(req).then(async (data: Record<string, any>) => {
      try {
        const { url, requestData } = data;
        if (!url || !requestData) {
          res.send({
            success: false,
            message: '缺少必要参数'
          });
          return;
        }

        // 获取当前 API 数据
        const apiData = getApiData();
        
        // 查找是否已存在相同 URL 的 API
        const existingApiIndex = apiData.apiList.findIndex(api => api.url === url);
        
        if (existingApiIndex !== -1) {
          // 更新现有 API 的 requestData
          apiData.apiList[existingApiIndex].requestData = requestData;
        } else {
          // 创建新的 API 配置
          const urlParts = url.split('/');
          const apiKey = urlParts.map((part: string) => {
            if (part) {
              return part.charAt(0).toUpperCase() + part.slice(1);
            }
            return '';
          }).join('');
          
          // 添加新的 API
          apiData.apiList.push({
            url,
            key: apiKey,
            customProxy: [],
            selectCustomProxy: '',
            target: 'proxy',
            duration: 0,
            name: url,
            requestData
          });
        }
        
        // 保存 API 数据
        setApiData(apiData);
        
        res.send({
          success: true,
          message: '保存请求数据成功'
        });
      } catch (error) {
        console.error('保存请求数据失败:', error);
        res.send({
          success: false,
          message: '保存请求数据失败',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    });
    return true;
  }

  return false
}

// 修改清理函数
process.on('SIGTERM', async () => {
  if (tunnelUrl && ngrokModule) {
    await ngrokModule.disconnect(tunnelUrl);
    await ngrokModule.kill();
  }
});

