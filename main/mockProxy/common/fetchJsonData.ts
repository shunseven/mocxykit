
import fs from 'fs';

export function getApiData():ApiData {
  const stat=fs.existsSync('./proxyMockData/api.json');
  const config=stat ? JSON.parse(fs.readFileSync('./proxyMockData/api.json').toString()) : {};
  return config;
}