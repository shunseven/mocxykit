import { Request, Response, NextFunction, Application } from 'express';
import path from 'path';
import { matchRouter } from './mockProxy/common/fun';

var rootPath = path.join(__dirname,'../viewsDist')  
export default function (options: ProxyMockOptions) {
  return function (req: Request, res: Response) {
    if (matchRouter(options.configPath as string, req.path)){
      res.sendFile(rootPath + '/index.html');
      return true;
    }
    if (matchRouter('/expressProxyMockAsset/*', req.path)){
      res.sendFile(rootPath + req.url);
      return true;
    }
    return false;
  }
}