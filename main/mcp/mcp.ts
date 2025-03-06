import { Request, Response } from "express";
import { matchRouter, parseUrlToKey } from "../mockProxy/common/fun";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { getApiData, getMock } from "../mockProxy/common/fetchJsonData";
import { getCacheRequestHistory } from "../mockProxy/common/cacheRequestHistory";
import { getMcpConfig } from "../mockProxy/common/mcpConfig";
import { z } from "zod";

const createNewServer = () => new McpServer({
  name: "mock-proxy-server",
  version: "1.0.0"
});

// 获取前缀匹配的完整key
function getFullKeyFromRule(rule: string, hostname: string): string {
  const prefix = rule.replace('*', '');
  const fullPath = prefix + hostname;
  console.log('fullPath', fullPath, parseUrlToKey(fullPath));
  return parseUrlToKey(fullPath);
}

// 检查是否通过前缀规则匹配并返回缓存数据
function findDataByPrefixMatch(key: string, hostname: string, apiRules: string[]): any {
  const cacheData = getCacheRequestHistory().find(item => {
    const fullkeys = apiRules.map(rule => getFullKeyFromRule(rule, hostname));
    return fullkeys.includes(item.key);
  });

  if (cacheData) {
    return cacheData.data;
  }

  // 尝试直接从缓存中获取数据
  const directCacheData = getCacheRequestHistory().find(item => item.key === key);
  return directCacheData?.data;
}

// 通过前缀规则查找API配置
function findApiConfigByPrefix(key: string, hostname: string, apiRules: string[], apiList: ApiConfig[]): ApiConfig | undefined {
  return apiList.find(item => {
    // 1. 直接匹配key
    if (item.key === key || parseUrlToKey(item.url) === key) {
      return true;
    }
    // 2. 尝试使用apiRule前缀匹配
    return apiRules.some(rule => {
      const fullKey = getFullKeyFromRule(rule, hostname);
      return item.key === fullKey || parseUrlToKey(item.url) === fullKey;
    });
  });
}

// 获取MCP数据的函数
async function getMcpData(hostname: string, apiRule: string | [string]) {
  try {
    // 将hostname转换为key
    const key = parseUrlToKey(hostname);
    console.log('key', key);
    // 获取API配置和所有Mock数据
    const apiData = getApiData();
    const mockDatas = getMock();
    
    // 处理apiRule，确保它是一个数组
    const apiRules = Array.isArray(apiRule) ? apiRule : [apiRule];
    
    // 在ApiList中查找对应的key
    const apiConfig = findApiConfigByPrefix(key, hostname, apiRules, apiData.apiList);
    
    if (apiConfig) {
      // 根据请求方式获取数据
      switch (apiConfig.target) {
        case 'mock':
          // 获取mock数据
          const mockData = mockDatas[apiConfig.key];
          if (mockData && mockData.data && mockData.data.length > 0) {
            return mockData.data[0].responseData || { error: '未找到对应的mock数据' };
          }
          break;
        case 'proxy':
        case 'customProxy':
          // 从缓存历史中获取数据
          const cacheData = getCacheRequestHistory().find(item => item.key === apiConfig.key);
          if (cacheData) {
            return cacheData.data;
          }
          break;
      }
    }

    // 如果没有找到API配置或没有对应的数据，尝试通过前缀匹配查找数据
    const prefixMatchData = findDataByPrefixMatch(key, hostname, apiRules);
    if (prefixMatchData) {
      return prefixMatchData;
    }
    
    // 如果未获取到数据，返回错误信息
    return { 
      error: '未找到对应的数据', 
      message: '请确保该接口已在mocxykit中目标配置，或者是否有最近请求历史缓存' 
    };
  } catch (error) {
    console.error('获取MCP数据失败:', error);
    return { 
      error: '获取数据失败', 
      message: error instanceof Error ? error.message : '未知错误' 
    };
  }
}
let servers: McpServer[] = [];
let transports: Map<string, SSEServerTransport> = new Map();
export default function createMcpServer (config: ProxyMockOptions) {
  return async function (req: Request, res: Response) {
    // 检查MCP服务是否启用
    const mcpConfig = getMcpConfig();
    
    if (!mcpConfig.open) {
      // 如果MCP服务未启用，直接返回
      if (matchRouter('/sse', req.path) || matchRouter('/mocxykit-mcp-messages', req.path)) {
        res.status(403).send({ error: 'MCP服务未启用' });
        return true;
      }
      return false;
    }

    if (matchRouter('/sse', req.path)) {
      console.log('matchRouter', req.path);
      req.setTimeout(0);
      res.setTimeout(0);
      // 设置必要的 SSE 头部
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Cache-Control', 'no-cache');
      const server = createNewServer();
      const transport = new SSEServerTransport("/mocxykit-mcp-messages", res);
      
      // 使用通配符模板 '${path}' 来匹配任何路径
      server.tool(
        "getData",
        "获取数据, 获取mcp数据",
        { path: z.string() },
        async ({ path }, extra) => {
          // 在这里处理所有MCP请求
          const hostname = decodeURIComponent(path);
          const data = await getMcpData(hostname, ['/api/*']);
          return {
            content: [{
              type: "text",
              text: JSON.stringify(data)
            }]
          }
        }
      );

      servers.push(server);
      console.log('/sse connection established', transport.sessionId);
      transports.set(transport.sessionId, transport);
      server.close = async () => {
        console.log('SSE connection closed');
        servers = servers.filter(s => s !== server);
        transports.delete(transport.sessionId);
      };

      // 连接服务器（只连接一次）
      await server.connect(transport);
      console.log('SSE connection established', transport.sessionId);
      if (!res.headersSent) {
        console.log('Sending 202 Accepted');
        res.writeHead(202).end("Accepted");
      }
      return true;
    }

    if (matchRouter('/mocxykit-mcp-messages', req.path)) {
      const sessionId = req.query.sessionId as string;
      console.log('/mocxykit-mcp-messages', sessionId);
      const transport = transports.get(sessionId);
      if (!transport) {
        console.log('Session not found');
        res.status(404).send('Session not found');
        return true;
      }

      await transport.handlePostMessage(req, res);
      
      return true;
    }

    return false;
  }
}
