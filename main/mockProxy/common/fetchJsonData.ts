import fs from 'fs';
import path from 'path';
import { getReqBodyData, hasMockData, parseUrlToKey, updateGitignore } from './fun';
import { Request } from 'express';
import { get } from 'http';

const apiDataFilePath = './proxyMockData/api.json'

/**
 * 读取mocxykit.config.json文件
 * @returns 配置数据，如果文件不存在则返回空对象
 */
export function getMocxykitConfig(): Partial<ProxyMockOptions> {
  const configFilePath = path.resolve(process.cwd(), 'mocxykit.config.json');
  try {
    if (fs.existsSync(configFilePath)) {
      const configData = fs.readFileSync(configFilePath, 'utf-8');
      const config = JSON.parse(configData);
      return config;
    }
  } catch (error) {
    console.error('读取mocxykit.config.json配置文件失败:', error);
  }
  return {};
}

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
  try {
    fs.unlinkSync(`${mockPath}/${key}.json`)
  } catch (error) {
    console.error('删除mock数据失败:', error);
  }
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

export function saveEnvData(data: EnvConfig) {
  const stat = fs.existsSync('./proxyMockData');
  if (!stat) {
    fs.mkdirSync('./proxyMockData');
  }
  
  // 确保env.json被添加到.gitignore
  updateGitignore('proxyMockData/env.json');
  
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

/**
 * 深度比较两个对象是否相等
 * @param obj1 第一个对象
 * @param obj2 第二个对象
 * @returns 是否相等
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  // 如果两个值完全相等，直接返回true
  if (obj1 === obj2) {
    return true;
  }
  
  // 如果其中一个是null或不是对象，则不相等
  if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }
  
  // 获取两个对象的所有键
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  // 如果键的数量不同，则不相等
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  // 检查所有键值对是否相等
  for (const key of keys1) {
    // 如果obj2中不存在该键，或者递归比较值不相等，则不相等
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  
  // 所有检查都通过，两个对象相等
  return true;
}

/**
 * 更新Mock数据
 * @param requestData 请求数据
 * @param responseData 响应数据
 * @param url API的URL
 * @param key API的唯一标识
 * @param name 数据名称，默认为"导入数据"
 * @returns 更新后的MockData对象
 */
export function updateMockData(data: {
  requestData: Record<string, any>,
  responseData: Record<string, any>,
  url: string,
  key: string,
  name: string
}) {
  // 确保目录存在
  const { requestData, responseData, url, key, name } = data;
  const stat = fs.existsSync(mockPath);
  if (!stat) {
    fs.mkdirSync(mockPath, { recursive: true });
  }
  
  let mockData: MockData;
  const mockFilePath = `${mockPath}/${key}.json`;
  
  // 检查是否已存在该key的mock数据
  if (fs.existsSync(mockFilePath)) {
    // 读取现有的mock数据
    mockData = getMock()[key];
    // 查找是否有匹配的requestData
    const matchIndex = mockData.data.findIndex(item => {
      // 使用深比对方法比较requestData是否相等
      return deepEqual(item.requestData, requestData);
    });
    
    if (matchIndex !== -1) {
      // 如果找到匹配的requestData，更新responseData
      mockData.data[matchIndex].responseData = responseData;
    } else {
      // 如果没有匹配的requestData，添加新的数据项
      mockData.data.push({
        name,
        requestData,
        responseData
      });
    }
  } else {
    // 创建新的mock数据
    mockData = {
      key,
      url,
      data: [{
        name,
        requestData,
        responseData
      }],
      name: url // 添加name属性，默认使用url作为名称
    };
  }
  
  // 保存更新后的mock数据
  setMockData(key, mockData);
}