import { Request, Response, NextFunction, Application } from 'express';
import path from 'path';
import { matchRouter } from './mockProxy/common/fun';
import fs from 'fs';

var rootPath = path.join(__dirname,'../viewsDist')  
export default function (options: ProxyMockOptions) {
  return function (req: Request, res: Response): boolean {
    if (matchRouter(options.configPath as string, req.path)){
      const file = fs.readFileSync(rootPath + '/index.html')
      const fileStr = file.toString().replace('<!--config-->', `<script>window.__config__ = ${JSON.stringify(options)}</script>`)

      res.send(fileStr);
      return true;
    }
    if (matchRouter('/expressProxyMockAsset/*', req.path)){
      res.sendFile(rootPath + req.url);
      return true;
    }
    return false;
  }
}