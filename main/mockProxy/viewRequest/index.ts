import { Application, Request, Response } from "express";
import { getApiData, setApiData } from "../common/fetchJsonData";

const successData = {
  msg: 'success'
};

export default function viewRequest(app: Application) {
  // 获取代理数据
  app.get('/express-proxy-mock/get-api-list', (req: Request, res: Response) => {
     const apiData = getApiData()
     res.send(apiData)
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
  // 修改代理
  app.get('/express-proxy-mock/change-proxy', (req: Request, res: Response) => {
    const apiData = getApiData()
    apiData.selectProxy = req.query.proxy as string
    setApiData(apiData)
    res.send(successData)
 })
}
