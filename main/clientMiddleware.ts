import { Request, Response, NextFunction } from 'express';
import path from 'path';

var rootPath = path.join(__dirname,'../viewsDist')  
export default function (options: ProxyMockOptions) {
  return function(req: Request, res: Response, next: NextFunction) {
    console.log('req.url', req.url);
    if (req.url === options.configPath) {
      res.sendFile(rootPath + '/index.html');
    }
    if(req.url.includes('/expressProxyMockAsset')){
      res.sendFile(rootPath + req.url);
    }
  }
}