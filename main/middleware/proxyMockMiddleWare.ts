import { NextFunction, Request, Response } from 'express';
import clientEntry from '../clientEntry';
import entry from '../mockProxy/entry';
import viewRequest from '../mockProxy/viewRequest';
import defaultConfig from './defaultConfig';
import createMcpServer from '../mcp/mcp';
import fs from 'fs';
import path from 'path';

export function proxyMockMiddleware(options: ProxyMockOptions = defaultConfig) {
  // 尝试读取mocxykit.config.json文件
  let fileConfig: Partial<ProxyMockOptions> = {};
  const configFilePath = path.resolve(process.cwd(), 'mocxykit.config.json');
  
  try {
    if (fs.existsSync(configFilePath)) {
      const configData = fs.readFileSync(configFilePath, 'utf-8');
      fileConfig = JSON.parse(configData);
      console.log('已加载mocxykit.config.json配置文件');
    }
  } catch (error) {
    console.error('读取mocxykit.config.json配置文件失败:', error);
  }
  
  // 合并配置：默认配置 < 文件配置 < 传入的配置
  const config = Object.assign({}, defaultConfig, fileConfig, options);
  const entryMiddleware = entry(config);
  const clientMiddleware = clientEntry(config);
  const mcpServer = createMcpServer(config);

  return async function (req: Request, res: Response, next: NextFunction) {
    let isClient = false;
    if (process.env.PROCY_MOCK_NODE_ENV !== 'development') {
      isClient = clientMiddleware(req, res)
    }
    const isProxyMock = entryMiddleware(req, res, next);
    const isViews = viewRequest(req, res, config);
    const isMcp = await mcpServer(req, res);
    if (!isClient && !isViews && !isProxyMock && !isMcp) {
      next();
    }
  }
}

export default proxyMockMiddleware;