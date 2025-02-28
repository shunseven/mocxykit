import { NextFunction, Request, Response } from 'express';
import clientEntry from '../clientEntry';
import entry from '../mockProxy/entry';
import viewRequest from '../mockProxy/viewRequest';
import defaultConfig from './defaultConfig';
import createMcpServer from '../mockProxy/mcp/mcp';

export function proxyMockMiddleware(options: ProxyMockOptions = defaultConfig) {
  const config = Object.assign({}, defaultConfig, options);
  const entryMiddleware = entry(config);
  const clientMiddleware = clientEntry(config);
  const mcpServer = createMcpServer();

  return async function (req: Request, res: Response, next: NextFunction) {
    let isClient = false;
    if (process.env.PROCY_MOCK_NODE_ENV !== 'development') {
      isClient = clientMiddleware(req, res)
    }
    const isProxyMock = entryMiddleware(req, res, next);
    const isViews = viewRequest(req, res);
    const isMcp = await mcpServer(req, res);
    if (!isClient && !isViews && !isProxyMock && !isMcp) {
      next();
    }
  }
}

export default proxyMockMiddleware;