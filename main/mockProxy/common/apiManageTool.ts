// 导入必要的模块
import { ApiFoxApiTreeItem, ApiFoxDataSchema, ApiFoxApiDetailResponse } from '../../api/fox-api';
import { getApiData, setApiData, getMock, setMockData } from './fetchJsonData';
import { parseUrlToKey } from './fun';

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
    const apiList = apiData.apiList || [];
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
              // 提取规则的基本部分（移除通配符和末尾斜杠）
              const ruleBase = selectedApiRule
                .replace(/\*/g, '') // 移除所有星号
                .replace(/\/+$/, ''); // 移除末尾的斜杠
              
              // 标准化apiPath，确保以/开头
              if (!apiPath.startsWith('/')) {
                apiPath = '/' + apiPath;
              }
              
              // 检查路径是否已经以规则基本部分开头
              // 对于像 /api-server/ec/api/process 这样的路径，我们需要检查它是否已经包含了规则
              // 例如，如果规则是 /api，那么 /api-server 不应该被认为是匹配的
              const needsPrefix = !apiPath.startsWith(ruleBase + '/') && 
                                 !(ruleBase === '/' && apiPath.startsWith('/'));
              
              if (needsPrefix) {
                // 构建前缀，确保以斜杠结尾
                const prefix = ruleBase + '/';
                
                // 确保apiPath不以斜杠开头（因为前缀已经有了）
                const pathWithoutLeadingSlash = apiPath.replace(/^\//, '');
                
                // 补全URL
                apiPath = prefix + pathWithoutLeadingSlash;
              }
            }
            
            // 生成API的key
            const apiKey = parseUrlToKey(apiPath);
            
            // 查找是否已存在该API
            const existingApiIndex = apiList.findIndex(item => 
              item.key === apiKey || parseUrlToKey(item.url) === apiKey
            );
            
            // 处理请求和响应Schema
            let requestSchema = {};
            let responseSchema = {};
            
            // 处理请求Schema
            if (apiDetail.data.requestBody && apiDetail.data.requestBody.jsonSchema) {
              requestSchema = resolveSchemaRefs(apiDetail.data.requestBody.jsonSchema, dataSchemas);
            }
            
            // 处理响应Schema
            if (apiDetail.data.responses && apiDetail.data.responses.length > 0) {
              const firstResponse = apiDetail.data.responses[0];
              if (firstResponse.jsonSchema) {
                responseSchema = resolveSchemaRefs(firstResponse.jsonSchema, dataSchemas);
              }
            }
            
            // 构建API配置
            const apiConfig: ApiConfig = {
              url: apiPath,
              key: apiKey,
              method: apiItem.api.method.toUpperCase(),
              name: `${apiItem.api.name || apiItem.name}(ApiFox)`,
              requestSchema,
              responseSchema,
              parameters: apiDetail.data.parameters,
              customProxy: [],
              selectCustomProxy: '',
              target: 'proxy',
              duration: 0,
            };
            
            // 如果API已存在，更新它
            if (existingApiIndex !== -1) {
              // 只更新requestSchema和responseSchema
              apiList[existingApiIndex].requestSchema = apiConfig.requestSchema;
              apiList[existingApiIndex].responseSchema = apiConfig.responseSchema;
              apiList[existingApiIndex].parameters = apiConfig.parameters;
              apiList[existingApiIndex].method = apiConfig.method;
            } else {
              // 添加新API
              apiList.push(apiConfig);
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
    const saveApiData = getApiData();
    saveApiData.apiList = apiList;
    setApiData(saveApiData);
    
    return { 
      success: true, 
      message: '同步成功', 
      data: {
        apiCount: apiList.length
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
            // 获取引用的schema
            let resolvedSchema = referencedSchema.jsonSchema;
            
            // 递归处理引用的schema中可能存在的$ref
            resolvedSchema = processObject(resolvedSchema);
            
            // 替换引用为实际schema
            return resolvedSchema;
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
