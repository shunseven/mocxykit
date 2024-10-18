import { Request, Response, NextFunction, Application } from 'express';
import path from 'path';

var rootPath = path.join(__dirname,'../viewsDist')  
export default function (app: Application, options: ProxyMockOptions) {
  app.get(options.configPath as string, (req: Request, res: Response) => {
    res.sendFile(rootPath + '/index.html');
  });
  
  app.get('/expressProxyMockAsset*', (req: Request, res: Response) => {
    res.sendFile(rootPath + req.url);
  });
}