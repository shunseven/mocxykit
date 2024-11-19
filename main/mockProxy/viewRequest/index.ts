import { Request, Response } from "express";
import { deleteMock, getApiData, getApiDataHasMockStatus, getMock, getTargetApiData, setApiData, setCustomProxyAndMock, saveEnvData, getEnvData } from "../common/fetchJsonData";
import { getReqBodyData, hasMockData, matchRouter } from "../common/fun";
import { clearCacheRequestHistory, deleteCacheRequestHistory, getCacheRequestHistory } from "../common/cacheRequestHistory";

const successData = {
  msg: 'success'
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

  // 添加代理
  if (matchRouter('/express-proxy-mock/create-proxy', req.path)) {
    const apiData = getApiData()
    apiData.proxy.push({
      proxy: req.query.proxy as string,
      name: req.query.name as string
    })
    apiData.selectProxy = req.query.proxy as string
    setApiData(apiData)
    res.send(successData)
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
    res.send(successData);
    return true
  }

  // 修改代理
  if (matchRouter('/express-proxy-mock/change-proxy', req.path)) {
    const apiData = getApiData()
    apiData.selectProxy = req.query.proxy as string
    setApiData(apiData)
    res.send(successData)
    return true
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

  // 保存环境变量
  if (matchRouter('/express-proxy-mock/save-env-variables', req.path)) {
    getReqBodyData(req).then((data) => {
      saveEnvData(data);
      res.send(successData);
    });
    return true;
  }

  // 获取环境变量数据
  if (matchRouter('/express-proxy-mock/get-env-variables', req.path)) {
    res.send(getEnvData());
    return true;
  }

  // 切换环境变量
  if (matchRouter('/express-proxy-mock/change-env-variable', req.path)) {
    const apiData = getApiData();
    apiData.selectEnvId = Number(req.query.envId);
    setApiData(apiData);
    res.send(successData);
    return true;
  }

  return false
}

