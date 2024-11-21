import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = 'proxyMockData';
const LOG_FILE = 'proxy-mock.log';

function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    // 对于函数，返回函数名称或 [Function]
    if (typeof value === 'function') {
      return value.name || '[Function]';
    }
    return value;
  }, 2);
}

function ensureLogDirectory(): string {
  const logDir = path.join(process.cwd(), LOG_DIR);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return path.join(logDir, LOG_FILE);
}

export function logger(content: string | object): void {
  const logPath = ensureLogDirectory();
  const timestamp = new Date().toISOString();
  const logContent = typeof content === 'string' 
    ? content 
    : safeStringify(content);
  console.log(`[${timestamp}] ${logContent}`);
  const logEntry = `[${timestamp}] ${logContent}\n`;

  try {
    fs.appendFileSync(logPath, logEntry, 'utf8');
  } catch (error) {
    console.error('写入日志失败:', error);
  }
}
