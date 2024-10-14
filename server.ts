import express from 'express';
import { mockProxy } from './main/index';


async function createServer() {
  const app = express();
  mockProxy(app, {
    apiRule: '/api/*'
  })
  // 创建 Vite 服务器
  app.listen(8822, () => {
    console.log('Server is running at http://localhost:8822');
  });
}

createServer();