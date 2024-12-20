import { Request, Response, NextFunction, Application } from 'express';
import path from 'path';
import { matchRouter } from './mockProxy/common/fun';
import fs from 'fs';

// 检查是否为本地或局域网IP
function isLocalOrLanIP(ip: string): boolean {
  // 检查是否是ngrok域名
  if (/ngrok|tunnel/i.test(ip)) {
    return false;
  }
  
  // 移除 IPv6 前缀（如果存在）
  ip = ip.replace(/^::ffff:/, '');
  
  return ip === '127.0.0.1' || 
         ip === 'localhost' ||
         ip.startsWith('192.168.') ||
         ip.startsWith('10.') ||
         ip.startsWith('172.16.') ||
         ip.startsWith('172.17.') ||
         ip.startsWith('172.18.') ||
         ip.startsWith('172.19.') ||
         ip.startsWith('172.20.') ||
         ip.startsWith('172.21.') ||
         ip.startsWith('172.22.') ||
         ip.startsWith('172.23.') ||
         ip.startsWith('172.24.') ||
         ip.startsWith('172.25.') ||
         ip.startsWith('172.26.') ||
         ip.startsWith('172.27.') ||
         ip.startsWith('172.28.') ||
         ip.startsWith('172.29.') ||
         ip.startsWith('172.30.') ||
         ip.startsWith('172.31.');
}

var rootPath = path.join(__dirname,'../viewsDist')  
export default function (options: ProxyMockOptions) {
  return function (req: Request, res: Response): boolean {
    if (matchRouter(options.configPath as string, req.path)){
      const clientIP = req.ip || req.socket.remoteAddress || '';
      const host = req.headers.host || '';
      
      // 检查 host 和 IP
      if (!isLocalOrLanIP(clientIP) || /ngrok|tunnel/i.test(host)) {
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