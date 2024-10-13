import { Request, Response, NextFunction, Application } from 'express';
import { ViteDevServer } from 'vite';

export default function (vite: ViteDevServer, options: ProxyMockOptions) {
  return function(req: Request, res: Response, next: NextFunction) {
    if (['/src', '/vite', '/@react', '/@vite', '/node_modules'].some(url => req.url.indexOf(url) === 0) || req.url === '/config') {
      vite.middlewares(req, res, next)
    } else {
      next();
    }
  }
}