// 导入必要的模块
import { ApiFoxApiTreeItem, ApiFoxDataSchema, ApiFoxApiDetailResponse } from '../../api/fox-api';
import { getApiData, setApiData, getMock, setMockData } from './fetchJsonData';
import { parseUrlToKey } from './fun';

// 处理文件夹和子文件夹，返回API配置数组
export async function processSelectedFolders(
  folders: ApiFoxApiTreeItem[],
  dataSchemas: ApiFoxDataSchema[],
  autoCompleteUrl: boolean,
  selectedApiRule: string,
  token: string,
  projectId: number,
  getApiDetail: (token: string, projectId: number, apiId: number) => Promise<ApiFoxApiDetailResponse>,
  parentFolderName: string = ''
): Promise<any[]> {
  let apiConfigs: any[] = [];
  
  // 递归处理所有文件夹
  for (const folder of folders) {
    const folderInfo = folder.folder;
    // 构建完整的文件夹名称路径
    const currentFolderName = parentFolderName 
      ? `${parentFolderName}-${folderInfo?.name}` 
      : folderInfo?.name;
    
    // 处理文件夹下的所有子项
    for (const item of folder.children || []) {
      // 如果是API详情
      if (item.type === 'apiDetail' && item.api) {
        try {
          // 获取API详情
          const apiDetail = await getApiDetail(token, projectId, item.api.id);
          if (!apiDetail.success) {
            console.error(`获取API详情失败: ${item.api.name}`);
            continue;
          }
          
          // 处理API路径，根据需要自动补全URL
          let apiPath = item.api.path;
          
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
          const apiConfig = {
            url: apiPath,
            key: apiKey,
            method: item.api.method.toUpperCase(),
            name: `${item.api.name || item.name}(ApiFox)`,
            requestSchema,
            responseSchema,
            parameters: apiDetail.data.parameters,
            forderId: folderInfo?.id, // 使用当前文件夹的ID
            forderName: currentFolderName // 使用构建的文件夹名称路径
          };
          
          apiConfigs.push(apiConfig);
          
          // 处理Mock数据
          await processMockData(apiKey, apiPath, item, apiDetail);
          
        } catch (error) {
          console.error(`处理API出错: ${item.api.name}`, error);
        }
      } 
      // 如果是文件夹，则递归处理
      else if (item.type === 'apiDetailFolder' && item.children && item.children.length > 0) {
        // 递归处理子文件夹
        const childApiConfigs = await processSelectedFolders(
          [item], // 作为单独的文件夹项处理
          dataSchemas,
          autoCompleteUrl,
          selectedApiRule,
          token,
          projectId,
          getApiDetail,
          currentFolderName // 传递当前构建的文件夹名称路径
        );
        
        // 合并子文件夹的API配置
        apiConfigs = [...apiConfigs, ...childApiConfigs];
      }
    }
  }
  
  return apiConfigs;
}

// 处理Mock数据的辅助函数
async function processMockData(apiKey: string, apiPath: string, apiItem: any, apiDetail: ApiFoxApiDetailResponse): Promise<void> {
  // 获取所有Mock数据
  const allMockData = getMock();
  
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
   
    
    // 找到选中的文件夹
    const selectedFolders = apiTreeData.filter(item => 
      folders.includes(item.key) && item.type === 'apiDetailFolder'
    );
    
    if (selectedFolders.length === 0) {
      return { success: false, message: '未找到选中的API分组' };
    }
    
    // 使用新函数处理选中的文件夹
    const apiConfigs = await processSelectedFolders(
      selectedFolders,
      dataSchemas,
      autoCompleteUrl,
      selectedApiRule,
      token,
      projectId,
      getApiDetail
    );

     const apiData = getApiData();
     const apiList = apiData.apiList || [];
    
    // 处理并合并API数据
    for (const apiConfig of apiConfigs) {
      // 查找是否已存在该API
      const existingApiIndex = apiList.findIndex(item => 
        item.key === apiConfig.key || parseUrlToKey(item.url) === apiConfig.key
      );
      
      // 给API添加必要的默认值
      const completeApiConfig = {
        ...apiConfig,
        customProxy: [],
        selectCustomProxy: '',
        target: 'proxy',
        duration: 0,
      };
      
      // 如果API已存在，更新它
      if (existingApiIndex !== -1) {
        // 只更新特定字段
        apiList[existingApiIndex].requestSchema = apiConfig.requestSchema;
        apiList[existingApiIndex].responseSchema = apiConfig.responseSchema;
        apiList[existingApiIndex].parameters = apiConfig.parameters;
        apiList[existingApiIndex].method = apiConfig.method;
        apiList[existingApiIndex].forderId = apiConfig.forderId;
        apiList[existingApiIndex].forderName = apiConfig.forderName;
      } else {
        // 添加新API
        apiList.push(completeApiConfig);
      }
    }
    // 保存更新后的API数据
    apiData.apiList = apiList;
    setApiData(apiData);
    
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
