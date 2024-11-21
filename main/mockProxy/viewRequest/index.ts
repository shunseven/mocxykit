import { Request, Response } from "express";
import { deleteMock, getApiData, getApiDataHasMockStatus, getMock, getTargetApiData, setApiData, setCustomProxyAndMock, saveEnvData, getEnvData, deleteEnvData } from "../common/fetchJsonData";
import { getReqBodyData, hasMockData, matchRouter, setupNodeEnvVariables } from "../common/fun";
import { clearCacheRequestHistory, deleteCacheRequestHistory, getCacheRequestHistory } from "../common/cacheRequestHistory";
import { envUpdateEmitter } from "../../index";

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

export default function viewRequest(req: Request, res: Response): boolean {
  // 获取代理数据
  if (matchRouter('/express-proxy-mock/get-api-list', req.path)) {
    const apiData = getApiDataHasMockStatus()
    res.send(apiData)
    return true
  }

  // 删除代理数据
  if (matchRouter('/express-proxy-mock/delete-api-data', req.path)) {
    const apiData = getApiData()
    const key = req.query.key as string
    apiData.apiList = apiData.apiList.filter(item => item.key !== key)
    setApiData(apiData)
    deleteMock(key)
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
    return true;
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
    apiData.apiList.forEach(item => {
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

  return false
}

