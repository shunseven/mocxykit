import { Request, Response } from "express";
import { matchRouter, parseUrlToKey } from "../common/fun";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { getApiData, getMock } from "../common/fetchJsonData";
import { getCacheRequestHistory } from "../common/cacheRequestHistory";

class MocxykitResourceTemplate extends ResourceTemplate {
  constructor(...args: ConstructorParameters<typeof ResourceTemplate>) {
    super(...args);
    (this as any)._uriTemplate.match = (path: string) => {
      console.log('matchRouter', path);
      return true
    }
  }
}

const createNewServer = () => new McpServer({
  name: "mock-proxy-server",
  version: "1.0.0"
});

// 获取MCP数据的函数
async function getMcpData(hostname: string) {
  try {
    // 将hostname转换为key
    const key = parseUrlToKey(hostname);
    console.log('key', key);
    // 获取API配置和所有Mock数据
    const apiData = getApiData();
    const mockDatas = getMock();
    
    // 在ApiList中查找对应的key
    const apiConfig = apiData.apiList.find(
      (item: ApiConfig) => item.key === key || parseUrlToKey(item.url) === key
    );
    
    if (apiConfig) {
      // 根据请求方式获取数据
      switch (apiConfig.target) {
        case 'mock':
          // 获取mock数据
          const mockData = mockDatas[key];
          if (mockData && mockData.data && mockData.data.length > 0) {
            return mockData.data[0].responseData || { error: '未找到对应的mock数据' };
          }
          break;
        case 'proxy':
        case 'customProxy':
          // 从缓存历史中获取数据
          const cacheData = getCacheRequestHistory().find(item => item.key === key);
          if (cacheData) {
            return cacheData.data;
          }
          break;
      }
    } else {
      // 如果在ApiList中没有找到对应的key，尝试从缓存历史中获取数据
      const cacheData = getCacheRequestHistory().find(item => item.key === key);
      if (cacheData) {
        return cacheData.data;
      }
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
export default function createMcpServer () {
  return async function (req: Request, res: Response) {
    if (matchRouter('/see', req.path)) {
      console.log('matchRouter', req.path);
      req.setTimeout(0);
      res.setTimeout(0);
      // 设置必要的 SSE 头部
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Cache-Control', 'no-cache');
      const server = createNewServer();
      const transport = new SSEServerTransport("/mocxykit-mcp-messages", res);
      
      // 使用通配符模板 '${path}' 来匹配任何路径
      server.resource(
        "data",
        new MocxykitResourceTemplate('data://{path}', {
          list: undefined
        }),
        async (uri) => {
          // 在这里处理所有MCP请求
          const hostname = decodeURIComponent(uri.hostname);
          const data = await getMcpData(hostname);
          
          return {
            contents: [{
              uri: hostname,
              type: 'application/json',
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
