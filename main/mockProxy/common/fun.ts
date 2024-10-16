import { Request } from "express";

function firstUpperCase(str: string): string {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

export function parseUrlToKey (url: string): string {
  return url.split('/').map(item => firstUpperCase(item)).join('')
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getReqBodyData(req: Request): Promise<Record<string, any>> {
  let body = ''
  return new Promise(resolve => {
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      try {
        resolve(body ? JSON.parse(body.toString()) : {})
      } catch (e) {
        resolve({})
      }
    })
  })
}


export function hasMockData (apiItemData: ApiConfig, mockDatas: AllMockData): boolean {
  let hasMockData = false
  const mockData = mockDatas[apiItemData.key]
  hasMockData = mockData && mockData.data.find(item => Object.keys(item.responseData).length > 0 || Object.keys(item.requestData).length > 0) ? true : false 
  return hasMockData
}