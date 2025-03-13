import fs from 'fs';
import path from 'path';
import { updateGitignore } from './fun';

const cacheRequestHistoryDir = path.join(process.cwd(), 'proxyMockData');
const cacheRequestHistoryPath = path.join(cacheRequestHistoryDir, 'CacheRequestHistoryData.json');

// 确保目录和文件存在
if (!fs.existsSync(cacheRequestHistoryDir)) {
  fs.mkdirSync(cacheRequestHistoryDir, { recursive: true });
}
if (!fs.existsSync(cacheRequestHistoryPath)) {
  fs.writeFileSync(cacheRequestHistoryPath, '[]', 'utf8');
}

// 更新.gitignore文件
updateGitignore('proxyMockData/CacheRequestHistoryData.json');

function readCacheRequestHistory(): CacheRequestHistoryData[] {
  try {
    const data = fs.readFileSync(cacheRequestHistoryPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading cache request history:', error);
    return [];
  }
}

function writeCacheRequestHistory(data: CacheRequestHistoryData[]) {
  try {
    fs.writeFileSync(cacheRequestHistoryPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing cache request history:', error);
  }
}

export function setCacheRequestHistory(data: CacheRequestHistoryData, max = 20) {
  const history = readCacheRequestHistory();
  const filteredHistory = history.filter(item => item.key !== data.key);
  filteredHistory.unshift(data);
  if (filteredHistory.length > max) {
    filteredHistory.pop();
  }
  writeCacheRequestHistory(filteredHistory);
}

export function getCacheRequestHistory(): CacheRequestHistoryData[] {
  return readCacheRequestHistory();
}

export function clearCacheRequestHistory() {
  writeCacheRequestHistory([]);
}

export function deleteCacheRequestHistory(key: string) {
  const history = readCacheRequestHistory();
  const filteredHistory = history.filter(item => item.key !== key);
  writeCacheRequestHistory(filteredHistory);
}