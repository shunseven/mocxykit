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
      name: data.name
    })
  } else {
    apiData.apiList[apiIndex].customProxy = data.customProxy;
    apiData.apiList[apiIndex].duration = data.duration;
    apiData.apiList[apiIndex].name = data.name;
    apiData.apiList[apiIndex].selectCustomProxy = data.selectCustomProxy;
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