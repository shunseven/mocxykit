import { NextFunction, Request, Response } from 'express';
import clientEntry from '../clientEntry';
import entry from '../mockProxy/entry';
import viewRequest from '../mockProxy/viewRequest';
import defaultConfig from './defaultConfig';
// 根据Node.js版本有条件地导入MCP模块
let createMcpServer: ((config: ProxyMockOptions) => (req: Request, res: Response) => Promise<boolean>) | null = null;
try {
  // 检查Node.js版本是否大于等于18
  const nodeVersionMatch = process.version.match(/^v(\d+)\./);
  const nodeVersionMajor = nodeVersionMatch ? parseInt(nodeVersionMatch[1], 10) : 0;
  
  if (nodeVersionMajor >= 18) {
    // 只在Node.js 18+版本导入MCP模块
    createMcpServer = require('../mcp/mcp').default;
  } else {
    console.warn('MCP功能需要Node.js 18或更高版本，当前版本:', process.version);
  }
} catch (error) {
  console.warn('无法加载MCP功能:', error);
}

import { getMocxykitConfig } from '../mockProxy/common/fetchJsonData';

export function proxyMockMiddleware(options: ProxyMockOptions = defaultConfig) {
  // 获取mocxykit.config.json文件配置
  const fileConfig = getMocxykitConfig();
  
  // 合并配置：默认配置 < 文件配置 < 传入的配置
  const config = Object.assign({}, defaultConfig, options, fileConfig);
  const entryMiddleware = entry(config);
  const clientMiddleware = clientEntry(config);
  // 根据Node.js版本是否支持初始化MCP服务
  const mcpServer = createMcpServer ? createMcpServer(config) : null;

  return async function (req: Request, res: Response, next: NextFunction) {

    if (req.headers['mocxykit-cookie']) {
      req.headers.cookie = req.headers['mocxykit-cookie'] as string;
      delete req.headers['mocxykit-cookie'];
    }

    let isClient = false;
    if (process.env.PROCY_MOCK_NODE_ENV !== 'development') {
      isClient = clientMiddleware(req, res)
    }
    const isViews = viewRequest(req, res, config);
    // 只有在MCP服务可用时才调用
    const isMcp = mcpServer ? await mcpServer(req, res) : false;
    const isProxyMock = !isMcp && !isViews && entryMiddleware(req, res, next);
    if (!isClient && !isViews && !isProxyMock && !isMcp) {
      next();
    }
  }
}

export default proxyMockMiddleware;