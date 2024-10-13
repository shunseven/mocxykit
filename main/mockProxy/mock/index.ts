import { NextFunction, Request, Response } from "express";
import { getMock, getSendMockData, getTargetApiData } from "../common/fetchJsonData";
import { parseUrlToKey, sleep } from "../common/fun";
import url from 'url'

export default function createMock () {
  return async function (req: Request,res: Response,next: NextFunction) {
    const mock = getMock()
    const pathname=parseUrlToKey(url.parse(req.url).pathname as string)
    const apiData = getTargetApiData(pathname)
    const mes = mock[pathname];
    // 廷时功能
    if (apiData && apiData.duration) {
      await sleep(apiData.duration)
    }
    if(mes) {
      const msg = await getSendMockData(req, mes.data)
      res.send(msg);
      return
    } else {
      next();
    }
  }
}