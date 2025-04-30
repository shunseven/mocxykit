// filepath: /Users/seven/projects/express-proxy-mock/main/mcp/mcpServer.ts
import { Request, Response } from "express";
import { getReqBodyData, parseUrlToKey } from "../mockProxy/common/fun";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { getApiData, getMock } from "../mockProxy/common/fetchJsonData";
import { getCacheRequestHistory } from "../mockProxy/common/cacheRequestHistory";
import { z } from "zod";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types";
import { randomUUID } from "node:crypto";

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
async function getMcpData(hostname: string, apiRules: string[]) {
  try {
    // 将hostname转换为key
    const key = parseUrlToKey(hostname);
    console.log('key', key);
    // 获取API配置和所有Mock数据
    const apiData = getApiData();
    const mockDatas = getMock();
    
    // 在ApiList中查找对应的key
    const apiConfig = findApiConfigByPrefix(key, hostname, apiRules, apiData.apiList);
    let targeMockData = null;
    
    if (apiConfig) {
      // 根据请求方式获取数据
      switch (apiConfig.target) {
        case 'mock':
          // 获取mock数据
          const mockData = mockDatas[apiConfig.key];
          if (mockData && mockData.data && mockData.data.length > 0) {
            targeMockData = mockData.data[0].responseData || { error: '未找到对应的mock数据' };
          }
          break;
        case 'proxy':
        case 'customProxy':
          // 从缓存历史中获取数据
          const cacheData = getCacheRequestHistory().find(item => item.key === apiConfig.key);
          if (cacheData) {
            targeMockData = cacheData.data;
          }
          break;
      }
      return {
        responseExample: targeMockData,
        requestSchema: apiConfig.requestSchema,
        responseSchema: apiConfig.responseSchema,
        method: apiConfig.method,
        params: apiConfig.parameters,
      }
    }

    // 如果没有找到API配置或没有对应的数据，尝试通过前缀匹配查找数据
    const prefixMatchData = findDataByPrefixMatch(key, hostname, apiRules);
    if (prefixMatchData) {
      return {
        responseExample: prefixMatchData,
      };
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

/**
 * McpServerHandler 类用于处理MCP服务器相关的请求
 */
export class McpServerHandler {
  private servers: McpServer[] = [];
  private transports: Map<string, SSEServerTransport> = new Map();
  private httpTransports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
  private config: ProxyMockOptions;

  constructor(config: ProxyMockOptions) {
    this.config = config;
  }

  /**
   * 创建一个新的MCP服务器实例
   */
  private createNewServer(): McpServer {
    return new McpServer({
      name: "mock-proxy-server",
      version: "1.0.0"
    });
  }

  private handleServerAction (server: McpServer) {
    server.tool(
      "getData",
      "获取数据, 获取mcp数据",
      { apiUrl: z.string() },
      async ({ apiUrl }, extra) => {
        // 在这里处理所有MCP请求
        const apiRules = this.config.apiRule.split(',');
        const hostname = decodeURIComponent(apiUrl);
        const data = await getMcpData(hostname, apiRules);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(data)
          }]
        }
      }
    );
  }

  /**
   * 处理SSE请求
   */
  public async handleSseRequest(req: Request, res: Response) {
    console.log('matchRouter', req.path);
    req.setTimeout(0);
    res.setTimeout(0);
    // 设置必要的 SSE 头部
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache');
    const server = this.createNewServer();
    const transport = new SSEServerTransport("/mocxykit-mcp-messages", res);
    
    // 使用通配符模板来匹配任何路径
    this.handleServerAction(server);

    this.servers.push(server);
    console.log('/sse connection established', transport.sessionId);
    this.transports.set(transport.sessionId, transport);
    server.close = async () => {
      console.log('SSE connection closed');
      this.servers = this.servers.filter(s => s !== server);
      this.transports.delete(transport.sessionId);
    };

    // 连接服务器（只连接一次）
    await server.connect(transport);
    console.log('SSE connection established', transport.sessionId);
    if (!res.headersSent) {
      console.log('Sending 202 Accepted');
      res.writeHead(202).end("Accepted");
    }
  }

  /**
   * 处理MCP消息请求
   */
  public async handleMcpMessagesRequest(req: Request, res: Response) {
    const sessionId = req.query.sessionId as string;
    console.log('/mocxykit-mcp-messages', sessionId);
    const transport = this.transports.get(sessionId);
    if (!transport) {
      console.log('Session not found');
      res.status(404).send('Session not found');
      return;
    }

    await transport.handlePostMessage(req, res);
  }

  /**
   * 处理MCP请求 (用于 /mcp 路径)
   */
  public async handleMcpRequest(req: Request, res: Response) {
    console.log('MCP request', req.method, req.path);
    
    if (req.method === 'POST') {
      // 检查现有会话ID
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      const body = await getReqBodyData(req);
      console.log('mcp sessionId', sessionId);
      console.log('mcp body', body);
      let transport: StreamableHTTPServerTransport;
      
      if (sessionId && this.httpTransports[sessionId]) {
        // 重用现有传输
        transport = this.httpTransports[sessionId];
      } else if (!sessionId && isInitializeRequest(body)) {
        console.log('Initializing new session');
        // 新的初始化请求
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            // 通过会话ID存储传输
            this.httpTransports[sid] = transport;
          }
        });
        
        // 在关闭时清理传输
        transport.onclose = () => {
          if (transport.sessionId) {
            delete this.httpTransports[transport.sessionId];
          }
        };
        
        const server = new McpServer({
          name: "mock-proxy-server",
          version: "1.0.0"
        });
        
        // 使用通配符模板来匹配任何路径
        this.handleServerAction(server);
        
        // 连接到MCP服务器
        try {
          await server.connect(transport);
        } catch (error) {
          console.error('连接到MCP服务器失败:', error);
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: '服务器内部错误：连接MCP服务器失败',
            },
            id: null,
          });
        }
      } else {
        // 无效请求
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: '错误请求：未提供有效的会话ID',
          },
          id: null,
        });
        return;
      }
      
      // 处理请求
      console.log('处理请求', body);
      try {
        await transport.handleRequest(req, res, body);
      } catch (error) {
        console.error('处理MCP请求时出错:', error);
        // 如果响应尚未发送，则发送错误响应
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: '服务器内部错误：' + (error instanceof Error ? error.message : '未知错误'),
            },
            id: null,
          });
        }
      }
    } else if (['GET', 'DELETE'].includes(req.method)) {
      
      // 处理GET和DELETE请求
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !this.httpTransports[sessionId]) {
        res.status(400).send('无效或缺失的会话ID');
        return;
      }
      console.log('处理GET/DELETE请求', req.method, sessionId);
      const transport = this.httpTransports[sessionId];
      try {
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error('处理MCP GET/DELETE请求时出错:', error);
        // 如果响应尚未发送，则发送错误响应
        if (!res.headersSent) {
          res.status(500).send('服务器内部错误：' + (error instanceof Error ? error.message : '未知错误'));
        }
      }
    }
  }

  /**
   * 获取当前所有服务器实例
   */
  public getServers(): McpServer[] {
    return this.servers;
  }

  /**
   * 获取当前所有传输实例
   */
  public getTransports(): Map<string, SSEServerTransport> {
    return this.transports;
  }
}
