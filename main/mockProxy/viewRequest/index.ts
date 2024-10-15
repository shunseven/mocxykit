import { Application, Request, Response } from "express";
import { getApiData, getMock, getMockTargetData, getTargetApiData, setApiData, setCustomProxyAndMock } from "../common/fetchJsonData";
import { getReqBodyData } from "../common/fun";

const successData = {
  msg: 'success'
};

export default function viewRequest(app: Application) {
  // 获取代理数据
  app.get('/express-proxy-mock/get-api-list', (req: Request, res: Response) => {
    const apiData = getApiData()
    res.send(apiData)
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
    if (apiData.selectProxy === req.query.proxy) {
      apiData.selectProxy = apiData.proxy[0].proxy
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
  app.post('/express-proxy-mock/save-costommock-proxy', (req: Request, res: Response) => {
    getReqBodyData(req).then((data) => {
      setCustomProxyAndMock(data as CustomProxyAndMock)
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

}
