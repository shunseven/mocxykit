import express from 'express';
import { proxyMockMiddleware } from './main/index';
import { Request, Response, NextFunction } from 'express';

process.env.PROCY_MOCK_NODE_ENV = 'development';
import { createServer as createViteServer, ViteDevServer } from 'vite';
function viteClientMiddleware(vite: ViteDevServer) {
  return function(req: Request, res: Response, next: NextFunction) {
    if (['/src', '/vite', '/@react', '/@vite', '/node_modules'].some(url => req.url.indexOf(url) === 0) || req.url === '/config') {
      vite.middlewares(req, res, next)
    } else {
      next();
    }
  }
}

async function createServer() {
  const app = express();
  app.use(proxyMockMiddleware())
  createViteServer({
    server: {
      middlewareMode: true,
      port: 4343
    }
  }).then((vite: ViteDevServer) => {
    app.use(viteClientMiddleware(vite));
  })
  // 创建 Vite 服务器
  app.listen(8822, () => {
    console.log('Server is running at http://localhost:8822');
  });
}

createServer();