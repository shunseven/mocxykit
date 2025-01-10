import fs from 'fs';
import { getReqBodyData, hasMockData, parseUrlToKey } from './fun';
import { Request } from 'express';

const apiDataFilePath = './proxyMockData/api.json'
export function getApiData():ApiData {
  const stat=fs.existsSync(apiDataFilePath);
  const config=stat ? JSON.parse(fs.readFileSync(apiDataFilePath).toString()) : {
    proxy: [],
    selectProxy: '',
    apiList: []
  };
  return config;
}

export function getTargetApiDataIndex(key: string, apiData: ApiData): number{
  if(!apiData) apiData = getApiData()
  return apiData.apiList.findIndex(item => item.key === key || parseUrlToKey(item.url) === key);
}

export function getTargetApiData(key: string, apiData?: ApiData): ApiConfig | null {
  if(!apiData) apiData = getApiData()
  return apiData.apiList.find(item => item.key === key || parseUrlToKey(item.url) === key) || null;
}

export function setApiData(data: ApiData) {
  const stat=fs.existsSync('./proxyMockData');
  if (!stat) {
    fs.mkdirSync('./proxyMockData');
  }
  fs.writeFileSync(apiDataFilePath,JSON.stringify(data), 'utf-8');
}

const mockPath = './proxyMockData/mockData'

export function setMockData(key: string, data: MockData) {
  const stat=fs.existsSync(mockPath);
  if (!stat) {
    fs.mkdirSync(mockPath);
  }
  fs.writeFileSync(`${mockPath}/${key}.json`,JSON.stringify(data));
}

export function setCustomProxyAndMock(data: CustomProxyAndMock) {
  const key = parseUrlToKey(data.url);
  const apiData = getApiData();
  const apiIndex = getTargetApiDataIndex(key, apiData);
  if (apiIndex === -1) {
    apiData.apiList.push({
      url: data.url,
      key,
      customProxy: data.customProxy,
      selectCustomProxy: data.selectCustomProxy,
      target: data.target || 'proxy',
      duration: data.duration,
      name: data.name,
      fakerKey: data.fakerKey || '',
      hasFaker: data.hasFaker || false,
    })
  } else {
    apiData.apiList[apiIndex].customProxy = data.customProxy;
    apiData.apiList[apiIndex].duration = data.duration;
    apiData.apiList[apiIndex].name = data.name;
    apiData.apiList[apiIndex].selectCustomProxy = data.selectCustomProxy;
    apiData.apiList[apiIndex].fakerKey = data.fakerKey || '';
    apiData.apiList[apiIndex].hasFaker = data.hasFaker || false;
  }
  setMockData(key, data.mockData);
  setApiData(apiData);
}

export function getMock(): AllMockData {
  const mock: AllMockData = {}
  if (!fs.existsSync('./proxyMockData')) {
    fs.mkdirSync('./proxyMockData');
  }
  if (!fs.existsSync(mockPath)) {
    fs.mkdirSync(mockPath);
  }
  const files = fs.readdirSync(mockPath);
  if (files.length < 1) return mock
  files.forEach(filePath => {
    const dataStr = fs.readFileSync(`${mockPath}/${filePath}`).toString()
    const data: MockData = JSON.parse(dataStr)
    const name = parseUrlToKey(data.url)
    mock[name] = data
  })
  return mock;
}

export function deleteMock(key: string) {
  fs.unlinkSync(`${mockPath}/${key}.json`)
}

export function formatMockData(data: Record<string, any>, targetData: Record<string, any> = {}, parentPath = '') {
  Object.keys(data).forEach(key => {
    if (Object.prototype.toString.call(data[key]) === '[object Object]') {
      targetData = formatMockData(data[key], targetData, parentPath + key)
      return
    }
    targetData[parentPath + key] = data[key]
  })

  return targetData
}


export function getLevel(query: Record<string, any>, data: Record<string, any>) {
  let queryFormatData = formatMockData(query)
  let mockFormatData = formatMockData(data)
  if (Object.keys(mockFormatData).length === 0) {
    return 0.5
  }
  let level = Object.keys(queryFormatData).reduce((level, key) => {
    if (mockFormatData[key] !== undefined && mockFormatData[key] == queryFormatData[key]) {
      level++
    }
    return level
  }, 0)
  if (Object.keys(queryFormatData).length === Object.keys(mockFormatData).length && Object.keys(queryFormatData).length === level) level++
  return level
}

export function getMockTargetData(query: Record<string, any>, mockData: MockRequestData[]):MockRequestData | {} {
  let level = 0
  let targetData = mockData[0] ? mockData[0].responseData : {}
  mockData.forEach(item => {
    let newLevel = getLevel(query, item.requestData)
    if (newLevel > level) {
      level = newLevel
      targetData = item.responseData
    }
  })
  return targetData
}


export function getSendMockData(req: Request, mockData: MockRequestData[]) {
  let query = req.query
  if (req.method.toLowerCase() === 'post' || req.method.toLowerCase() === 'put') {
    return getReqBodyData(req).then((data) => {
      return getMockTargetData(Object.assign(query, data), mockData)
    })
  }
  return Promise.resolve(getMockTargetData(query, mockData))
}


export function getApiDataHasMockStatus() {
    const apiData = getApiData()
    const mockDatas = getMock()
    apiData.apiList = apiData.apiList.map(item => {
      item.hasMockData = hasMockData(item, mockDatas)
      return item
    })
    return apiData
}

const envDataFilePath = './proxyMockData/env.json';

function ensureGitIgnore(filePath: string) {
  const gitIgnorePath = './.gitignore';
  let content = '';
  
  if (fs.existsSync(gitIgnorePath)) {
    content = fs.readFileSync(gitIgnorePath, 'utf-8');
  }

  // 检查文件是否已经在.gitignore中
  if (!content.split('\n').some(line => line.trim() === filePath)) {
    // 添加新行（如果文件末尾没有换行符，先添加换行符）
    const newLine = content.endsWith('\n') ? filePath : '\n' + filePath;
    fs.appendFileSync(gitIgnorePath, newLine + '\n');
  }
}

export function saveEnvData(data: EnvConfig) {
  const stat = fs.existsSync('./proxyMockData');
  if (!stat) {
    fs.mkdirSync('./proxyMockData');
  }
  
  // 确保env.json被添加到.gitignore
  ensureGitIgnore('proxyMockData/env.json');
  
  let envData = getEnvData();
  const existingIndex = envData.findIndex(env => env.id === data.id);
  
  if (existingIndex !== -1) {
    envData[existingIndex] = data;
  } else {
    envData.push(data);
  }
  
  fs.writeFileSync(envDataFilePath, JSON.stringify(envData), 'utf-8');
}

export function getEnvData(): EnvConfig[] {
  if (!fs.existsSync(envDataFilePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(envDataFilePath).toString());
}

export function deleteEnvData(envId: number) {
  const envData = getEnvData();
  const newEnvData = envData.filter(env => env.id !== envId);
  const stat = fs.existsSync('./proxyMockData');
  if (!stat) {
    fs.mkdirSync('./proxyMockData');
  }
  fs.writeFileSync(envDataFilePath, JSON.stringify(newEnvData), 'utf-8');
}