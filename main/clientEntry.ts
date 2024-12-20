import { Request, Response, NextFunction, Application } from 'express';
import path from 'path';
import { matchRouter } from './mockProxy/common/fun';
import fs from 'fs';

// 检查是否为本地或局域网IP
function isLocalOrLanIP(ip: string): boolean {
  // 移除 IPv6 前缀（如果存在）
  ip = ip.replace(/^::ffff:/, '');
  
  return ip === '127.0.0.1' || 
         ip === 'localhost' ||
         ip.startsWith('192.168.') ||
         ip.startsWith('10.') ||
         ip.startsWith('172.16.');
}

var rootPath = path.join(__dirname,'../viewsDist')  
export default function (options: ProxyMockOptions) {
  return function (req: Request, res: Response): boolean {
    if (matchRouter(options.configPath as string, req.path)){
      const clientIP = req.ip || req.socket.remoteAddress || '';
      
      if (!isLocalOrLanIP(clientIP)) {
        res.status(403).send('Access denied. Only local or LAN access is allowed.');
        return true;
      }

      const file = fs.readFileSync(rootPath + '/index.html')
      const fileStr = file.toString().replace('<!--config-->', `<script>window.__config__ = ${JSON.stringify(options)}</script>`)

      res.send(fileStr);
      return true;
    }
    if (matchRouter('/expressProxyMockAsset/*', req.path)){
      res.sendFile(rootPath + req.url);
      return true;
    }
    return false;
  }
}