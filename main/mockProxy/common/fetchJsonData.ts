import fs from 'fs';
import { parseUrlToKey } from './fun';
import { Request } from 'express';

export function getApiData():ApiData {
  const stat=fs.existsSync('./proxyMockData/api.json');
  const config=stat ? JSON.parse(fs.readFileSync('./proxyMockData/api.json').toString()) : {};
  return config;
}

interface AllMockData {
  [key: string]: MockData
}

const mockPath = './proxyMockData/mockData'
export function getMock(): AllMockData {
  const mock: AllMockData = {}
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
  let body = ''
  let bodyData: Record<string, any> | null = {};
  if (req.method.toLowerCase() === 'post' || req.method.toLowerCase() === 'put') {
    return new Promise(resolve => {
      req.on('data', function (data) {
        body += data
      })
      req.on('end', function () {
        try {
          bodyData = body ? JSON.parse(body.toString()) : {}
        } catch (e) {
          bodyData = {}
        }
        resolve(getMockTargetData(Object.assign(query, body), mockData))
        bodyData = null
      })
    })
  }
  return Promise.resolve(getMockTargetData(query, mockData))
}