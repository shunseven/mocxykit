// 导入必要的模块
import fs from 'fs';
import path from 'path';
import { ApiFoxApiTreeItem, ApiFoxDataSchema, ApiFoxApiDetailResponse } from '../../api/fox-api';
import { getApiData, setApiData, getMock, setMockData } from './fetchJsonData';
import { parseUrlToKey } from './fun';

// 定义必要的类型
interface CacheRequestHistoryData {
  key: string;
  [key: string]: any;
}

// 缓存请求历史
let cacheRequestHistory: CacheRequestHistoryData[] = [];

export function setCacheRequestHistory(data: CacheRequestHistoryData, max = 20) {
  cacheRequestHistory = cacheRequestHistory.filter(item => item.key !== data.key);
  cacheRequestHistory.unshift(data);
  if (cacheRequestHistory.length > max) {
    cacheRequestHistory.pop();
  }
}

export function getCacheRequestHistory(): CacheRequestHistoryData[] {
  return cacheRequestHistory;
}

export function clearCacheRequestHistory() {
  cacheRequestHistory = [];
}

export function deleteCacheRequestHistory(key: string) {
  cacheRequestHistory = cacheRequestHistory.filter(item => item.key !== key);
}

// 处理ApiFox API同步
export async function syncApiFoxApi(
  apiTreeData: ApiFoxApiTreeItem[], 
  folders: string[], 
  dataSchemas: ApiFoxDataSchema[],
  autoCompleteUrl: boolean,
  selectedApiRule: string,
  token: string,
  projectId: number,
  getApiDetail: (token: string, projectId: number, apiId: number) => Promise<ApiFoxApiDetailResponse>
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // 获取当前API数据
    const apiData = getApiData();
    // 获取所有Mock数据
    const allMockData = getMock();
    
    // 找到选中的文件夹
    const selectedFolders = apiTreeData.filter(item => 
      folders.includes(item.key) && item.type === 'apiDetailFolder'
    );
    
    if (selectedFolders.length === 0) {
      return { success: false, message: '未找到选中的API分组' };
    }
    
    // 处理每个选中的文件夹
    for (const folder of selectedFolders) {
      // 处理文件夹下的所有API
      for (const apiItem of folder.children) {
        if (apiItem.type === 'apiDetail' && apiItem.api) {
          try {
            // 获取API详情
            const apiDetail = await getApiDetail(token, projectId, apiItem.api.id);
            if (!apiDetail.success) {
              console.error(`获取API详情失败: ${apiItem.api.name}`);
              continue;
            }
            
            // 处理API路径，根据需要自动补全URL
            let apiPath = apiItem.api.path;
            
            // 如果需要自动补全URL
            if (autoCompleteUrl && selectedApiRule) {
              // 检查是否需要补全
              // 根据selectedApiRule判断是否需要补全
              const rulePrefix = selectedApiRule.replace('/*', '');
              const needsPrefix = !apiPath.startsWith(rulePrefix);
              
              if (needsPrefix) {
                // 移除通配符
                const prefix = selectedApiRule.replace('*', '');
                
                // 确保路径以/开头
                if (!apiPath.startsWith('/')) {
                  apiPath = '/' + apiPath;
                }
                
                // 补全URL
                apiPath = prefix + apiPath;
              }
            }
            
            // 生成API的key
            const apiKey = parseUrlToKey(apiPath);
            
            // 查找是否已存在该API
            const existingApiIndex = apiData.apiList.findIndex(item => 
              item.key === apiKey || parseUrlToKey(item.url) === apiKey
            );
            
            // 处理请求和响应Schema
            let requestSchema = {};
            let responsesSchema = {};
            
            // 处理请求Schema
            if (apiDetail.data.requestBody && apiDetail.data.requestBody.jsonSchema) {
              requestSchema = resolveSchemaRefs(apiDetail.data.requestBody.jsonSchema, dataSchemas);
            }
            
            // 处理响应Schema
            if (apiDetail.data.responses && apiDetail.data.responses.length > 0) {
              const firstResponse = apiDetail.data.responses[0];
              if (firstResponse.jsonSchema) {
                responsesSchema = resolveSchemaRefs(firstResponse.jsonSchema, dataSchemas);
              }
            }
            
            // 构建API配置
            const apiConfig: any = {
              url: apiPath,
              key: apiKey,
              method: apiItem.api.method.toUpperCase(),
              name: `${apiItem.api.name || apiItem.name}(apiFox)`,
              requestSchema,
              responsesSchema
            };
            
            // 如果API已存在，更新它
            if (existingApiIndex !== -1) {
              // 只更新requestSchema和responsesSchema
              apiData.apiList[existingApiIndex].requestSchema = apiConfig.requestSchema;
              apiData.apiList[existingApiIndex].responsesSchema = apiConfig.responsesSchema;
            } else {
              // 添加新API
              apiConfig.target = 'proxy';
              apiConfig.duration = 0;
              apiConfig.customProxy = [];
              apiConfig.selectCustomProxy = '';
              apiData.apiList.push(apiConfig as any);
            }
            
            // 检查是否已有Mock数据
            const mockExists = allMockData[apiKey];
            
            // 如果没有Mock数据，创建默认的Mock数据
            if (!mockExists && apiDetail.data.responseExamples && apiDetail.data.responseExamples.length > 0) {
              try {
                // 获取第一个响应示例
                const firstExample = apiDetail.data.responseExamples[0];
                let responseData = {};
                
                // 尝试解析响应示例数据
                if (firstExample.data) {
                  try {
                    responseData = JSON.parse(firstExample.data);
                  } catch (e) {
                    console.error(`解析响应示例数据失败: ${e}`);
                    responseData = { data: firstExample.data };
                  }
                }
                
                // 创建Mock数据
                const mockData: any = {
                  data: [{
                    name: firstExample.name || '默认响应',
                    requestData: {},
                    responseData
                  }],
                  key: apiKey,
                  url: apiPath,
                  name: apiItem.api.name || apiItem.name
                };
                
                // 保存Mock数据
                setMockData(apiKey, mockData);
              } catch (error) {
                console.error(`处理Mock数据出错: ${error}`);
              }
            }
          } catch (error) {
            console.error(`处理API出错: ${apiItem.api.name}`, error);
          }
        }
      }
    }
    
    // 保存更新后的API数据
    setApiData(apiData);
    
    return { 
      success: true, 
      message: '同步成功', 
      data: {
        apiCount: apiData.apiList.length
      }
    };
  } catch (error) {
    console.error('同步ApiFox API出错:', error);
    return { 
      success: false, 
      message: '同步失败: ' + (error instanceof Error ? error.message : '未知错误')
    };
  }
}

// 处理Schema中的引用
export function resolveSchemaRefs(schema: any, dataSchemas: ApiFoxDataSchema[]): any {
  if (!schema) return schema;
  
  // 深拷贝schema以避免修改原始对象
  const result = JSON.parse(JSON.stringify(schema));
  
  // 递归处理对象
  const processObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    // 处理数组
    if (Array.isArray(obj)) {
      return obj.map((item: any) => processObject(item));
    }
    
    // 处理对象
    for (const key in obj) {
      // 如果找到$ref字段
      if (key === '$ref' && typeof obj[key] === 'string') {
        const refValue = obj[key];
        // 提取引用ID
        const match = refValue.match(/#\/definitions\/(\d+)/);
        if (match && match[1]) {
          const schemaId = parseInt(match[1]);
          // 在dataSchemas中查找对应的schema
          const referencedSchema = dataSchemas.find(s => s.id === schemaId);
          if (referencedSchema) {
            // 替换引用为实际schema
            return referencedSchema.jsonSchema;
          }
        }
      } else {
        // 递归处理嵌套对象
        obj[key] = processObject(obj[key]);
      }
    }
    
    return obj;
  };
  
  return processObject(result);
}
