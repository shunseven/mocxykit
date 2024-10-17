import { Application, Request, Response } from "express";
import { deleteMock, getApiData, getApiDataHasMockStatus, getMock, getMockTargetData, getTargetApiData, setApiData, setCustomProxyAndMock } from "../common/fetchJsonData";
import { getReqBodyData, hasMockData } from "../common/fun";
import { clearCacheRequestHistory, getCacheRequestHistory } from "../common/cacheRequestHistory";

const successData = {
  msg: 'success'
};

export default function viewRequest(app: Application) {
  // 获取代理数据
  app.get('/express-proxy-mock/get-api-list', (req: Request, res: Response) => {
    const apiData = getApiDataHasMockStatus()
    res.send(apiData)
  })

   // 删除代理数据
   app.get('/express-proxy-mock/delete-api-data', (req: Request, res: Response) => {
    const apiData = getApiData()
    const key = req.query.key as string
    apiData.apiList = apiData.apiList.filter(item => item.key !== key)
    setApiData(apiData)
    deleteMock(key)
    res.send(successData)
  })

  // 添加代理
  app.get('/express-proxy-mock/create-proxy', (req: Request, res: Response) => {
    const apiData = getApiData()
    apiData.proxy.push({
      proxy: req.query.proxy as string,
      name: req.query.name as string
    })
    apiData.selectProxy = req.query.proxy as string
    setApiData(apiData)
    res.send(successData)
  })
  // 删除代理
  app.get('/express-proxy-mock/delete-proxy', (req: Request, res: Response) => {
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
  })
  // 修改代理
  app.get('/express-proxy-mock/change-proxy', (req: Request, res: Response) => {
    const apiData = getApiData()
    apiData.selectProxy = req.query.proxy as string
    setApiData(apiData)
    res.send(successData)
  })

  // 添加mock
  app.post('/express-proxy-mock/save-customproxy-mock', (req: Request, res: Response) => {
    getReqBodyData(req).then((data) => {
      setCustomProxyAndMock(data as CustomProxyAndMock)
      res.send(successData)
    })
  })
  // 获取mock数据
  app.get('/express-proxy-mock/get-costommock-proxy', (req: Request, res: Response) => {
    const apiData = getTargetApiData(req.query.key as string)
    const mockDatas = getMock()
    const mockData = mockDatas[req.query.key as string] || {}
    res.send({
      ...apiData,
      mockData
    })
  })

  app.get('/express-proxy-mock/get-api-list', (req: Request, res: Response) => {
    const apiData = getTargetApiData(req.query.key as string)
    const mockDatas = getMock()
    const mockData = mockDatas[req.query.key as string] || {}
    res.send({
      ...apiData,
      mockData
    })
  })

  app.get('/express-proxy-mock/change-target', (req: Request, res: Response) => {
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
  })
 
  app.get('/express-proxy-mock/batch-change-target', (req: Request, res: Response) => {
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
  })

  app.get('/express-proxy-mock/get-api-item-and-mock', (req: Request, res: Response) => {
    const key = req.query.key as string
    const apiData = getTargetApiData(key)
    const AllMockData = getMock()
    const mockData = AllMockData[key] || null
    res.send({
      apiData,
      mockData
    })
  })

  app.get('/express-proxy-mock/get-request-cache', (req: Request, res: Response) => {
    res.send(getCacheRequestHistory())
  })

  app.get('/express-proxy-mock/get-request-cache-length', (req: Request, res: Response) => {
    const cacheRequestHistory = getCacheRequestHistory()
    res.send({
      length: cacheRequestHistory.length
    })
  })

  app.post('/express-proxy-mock/batch-import-request-cache-to-mock', async (req: Request, res: Response) => {
    const result =  await getReqBodyData(req);
    const {keys} = result as {keys: string[]}
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
      }
    })
    res.send(successData)
  })

  app.get('/express-proxy-mock/clear-request-cache', (req: Request, res: Response) => {
    clearCacheRequestHistory()
    res.send(successData)
  })

}

