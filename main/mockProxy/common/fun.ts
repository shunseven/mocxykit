import { Request } from "express";
import { pathToRegexp } from "path-to-regexp";
import { getEnvData, getApiData } from "./fetchJsonData";

function firstUpperCase(str: string): string {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

export function parseUrlToKey(url: string): string {
  const cleanUrl = url.split('?')[0];
  return cleanUrl.split('/').map(item => firstUpperCase(item)).join('');
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

export function matchRouter(path: string, reqPath: string) {
  path = path.replace("*", '*path')
  const regexp = pathToRegexp(path);
  return regexp.regexp.test(reqPath);
}

export function setupNodeEnvVariables(): void {
  const apiData = getApiData();
  const envId = apiData.selectEnvId;
  
  if (!envId) return;

  const envData: EnvConfig[] = getEnvData();
  const currentEnv = envData.find(env => env.id === envId);
  
  if (currentEnv?.variables) {
    currentEnv.variables.forEach(({ key, value }: EnvVariable) => {
      if (key) {
        process.env[key] = value;
      }
    });
  }
}