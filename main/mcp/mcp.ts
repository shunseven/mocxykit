import { Request, Response } from "express";
import { matchRouter, parseUrlToKey } from "../mockProxy/common/fun";
import { McpServerHandler } from "./mcpServer";

export default function createMcpServer(config: ProxyMockOptions) {
  const mcpServerHandler = new McpServerHandler(config);
  return async function (req: Request, res: Response) {
    // 检查MCP服务是否启用
    if (matchRouter('/sse', req.path)) {
      await mcpServerHandler.handleSseRequest(req, res);
      return true;
    }

    // 处理MCP消息请求
    if (matchRouter('/mocxykit-mcp-messages', req.path)) {
      await mcpServerHandler.handleMcpMessagesRequest(req, res);
      return true;
    }

    // 处理MCP请求
    if (matchRouter('/mcp', req.path)) {
      await mcpServerHandler.handleMcpRequest(req, res);
      return true;
    }

    return false;
  }
}
