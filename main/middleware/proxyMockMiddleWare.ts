import { NextFunction, Request, Response } from 'express';
import clientEntry from '../clientEntry';
import entry from '../mockProxy/entry';
import viewRequest from '../mockProxy/viewRequest';
import defaultConfig from './defaultConfig';
import createMcpServer from '../mcp/mcp';
import { getMocxykitConfig } from '../mockProxy/common/fetchJsonData';

export function proxyMockMiddleware(options: ProxyMockOptions = defaultConfig) {
  // 获取mocxykit.config.json文件配置
  const fileConfig = getMocxykitConfig();
  
  // 合并配置：默认配置 < 文件配置 < 传入的配置
  const config = Object.assign({}, defaultConfig, options, fileConfig);
  const entryMiddleware = entry(config);
  const clientMiddleware = clientEntry(config);
  const mcpServer = createMcpServer(config);

  return async function (req: Request, res: Response, next: NextFunction) {

    if (req.headers['mocxykit-cookie']) {
      req.headers.cookie = req.headers['mocxykit-cookie'] as string;
      delete req.headers['mocxykit-cookie'];
    }

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