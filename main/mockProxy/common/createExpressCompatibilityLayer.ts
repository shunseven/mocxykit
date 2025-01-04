import path from 'path';
import fs from 'fs';
import type { ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import { parse as parseQs } from 'querystring';

// Express 兼容层
export default function createExpressCompatibilityLayer(req: any, res: ServerResponse) {
  // 扩展 request 对象
  const enhancedReq = req as any;
  
  // 确保 url 包含完整路径
  if (!enhancedReq.url.startsWith('/')) {
    enhancedReq.url = '/' + enhancedReq.url;
  }

  // 添加 path 属性 - 从 url 中提取不包含查询参数的路径
  enhancedReq.path = enhancedReq.url.split('?')[0];

  // 添加 socket.localPort
  if (!enhancedReq.socket) {
    enhancedReq.socket = {
      localPort: process.env.PORT || 3000
    };
  }

  // 确保 method 属性存在且为大写
  if (!enhancedReq.method) {
    enhancedReq.method = (req.method || 'GET').toUpperCase();
  }

  // 添加 query 解析
  if (!enhancedReq.query) {
    const parsedUrl = parseUrl(enhancedReq.url);
    enhancedReq.query = parseQs(parsedUrl.query || '');
  }

  // 确保事件监听方法存在
  if (!enhancedReq.on) {
    const chunks: Buffer[] = [];
    
    // 保存原始数据
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      enhancedReq.body = Buffer.concat(chunks);
    });

    enhancedReq.on = (event: string, handler: (...args: any[]) => void) => {
      if (event === 'data' || event === 'end') {
        req.on(event, handler);
      }
    };
  }

  // 扩展 response 对象
  const enhancedRes = res as any;

  // 添加 send 方法
  if (!enhancedRes.send) {
    enhancedRes.send = function(body: any) {
      if (typeof body === 'string') {
        res.setHeader('Content-Type', 'text/html');
        res.end(body);
      } else if (Buffer.isBuffer(body)) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.end(body);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      }
    };
  }

  // 添加 json 方法
  if (!enhancedRes.json) {
    enhancedRes.json = function(body: any) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    };
  }

  // 添加 sendFile 方法
  if (!enhancedRes.sendFile) {
    enhancedRes.sendFile = function(filePath: string) {
      try {
        const absolutePath = path.resolve(filePath);
        const fileContent = fs.readFileSync(absolutePath);
        const ext = path.extname(filePath).toLowerCase();
        
        // 简单的 MIME 类型映射
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml'
        };

        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.end(fileContent);
      } catch (err) {
        res.statusCode = 404;
        res.end('File not found');
      }
    };
  }

  return { enhancedReq, enhancedRes };
}

// 创建事件发射器实例
