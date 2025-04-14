import { Request } from "express";
import { pathToRegexp } from "path-to-regexp";
import { getEnvData, getApiData } from "./fetchJsonData";
import { Faker, zh_CN, en, base } from '@faker-js/faker';
import path from "path";
import fs from "fs";

// 创建自定义的 faker 实例，设置 locale 优先级
const customFaker = new Faker({
  locale: [zh_CN, en, base], // 优先使用中文，找不到的内容fallback到英文，最后是基础locale
});

// 创建英文专用的faker实例
const englishFaker = new Faker({
  locale: [en] // 只使用英文locale
});

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
    if (req.body) {
      return resolve(req.body)
    }
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
  path = path.replace('https://', '')
  path = path.replace('http://', '')
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

function inferDataType(value: string): string {
  // 字母数字混合
  if (/^[a-zA-Z0-9]+$/.test(value)) return 'alphanumeric';
  
  // 纯数字字符串
  if (/^\d+$/.test(value)) return 'numberString';
  
  // 邮箱格式
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  
  // 日期格式 (ISO, yyyy-mm-dd, yyyy/mm/dd等)
  if (/^\d{4}[-/](0?[1-9]|1[012])[-/](0?[1-9]|[12][0-9]|3[01])/.test(value) || 
      /^\d{4}[-/]\d{2}[-/]\d{2}T\d{2}:\d{2}/.test(value)) return 'date';
  
  // 时间格式 (HH:mm:ss)
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(value)) return 'time';
  
  // 手机号格式
  if (/^1[3-9]\d{9}$/.test(value)) return 'phone';
  
  // 图片URL
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value)) return 'image';
  
  // 普通URL
  if (/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(value)) return 'url';
  
  // IP地址
  if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)) return 'ip';
  
  // 中文姓名
  if (/^[\u4e00-\u9fa5]{2,4}$/.test(value)) return 'cnName';
  
  // 英文姓名
  if (/^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/.test(value)) return 'enName';
  
  // 身份证号
  if (/^\d{17}[\dXx]$/.test(value)) return 'idCard';
  
  // 颜色代码
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) return 'color';
  
  // 经度
  if (/^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(value)) return 'longitude';
  
  // 纬度
  if (/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(value)) return 'latitude';

  // 判断纯英文
  if (/^[a-zA-Z\s]+$/.test(value)) return 'englishText';

  return 'unknown';
}

function generateAlphanumeric(template: string): string {
  // 分析模板中字母和数字的位置和数量
  const letterPositions = [...template].map((char, index) => /[a-zA-Z]/.test(char) ? index : -1).filter(pos => pos !== -1);
  const numberPositions = [...template].map((char, index) => /[0-9]/.test(char) ? index : -1).filter(pos => pos !== -1);
  
  // 生成结果数组
  const result = new Array(template.length).fill('');
  
  // 填充字母
  letterPositions.forEach(pos => {
    result[pos] = englishFaker.string.alpha(1);
  });
  
  // 填充数字
  numberPositions.forEach(pos => {
    result[pos] = englishFaker.number.int({ min: 0, max: 9 }).toString();
  });
  
  return result.join('');
}

// 添加检测是否包含中文的函数
function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}

export function generateFakeData(jsonData: any, fakerKeys: string): any {
  const keys = fakerKeys.split(',').map(k => k.trim());
  
  function parseKeyAndCount(key: string): { key: string; count?: number } {
    const match = key.match(/^(.*?)<(\d+)>$/);
    if (match) {
      return {
        key: match[1],
        count: parseInt(match[2], 10)
      };
    }
    return { key };
  }

  function processValue(value: any, customArrayLength?: number): any {
    switch (typeof value) {
      case 'string':
        
        // 检查是否包含中文
        if (containsChinese(value)) {
          if (value.length <= 4) {
            return customFaker.person.fullName(); 
          } else if (value.length <= 10) {
            return customFaker.company.name();
          } else {
            return customFaker.lorem.sentence();
          }
        }
        
        // 先检查@格式的显式标记
        if (value.includes('@email')) return customFaker.internet.email();
        if (value.includes('@name')) return containsChinese(value) ? customFaker.person.fullName() : customFaker.person.fullName();
        if (value.includes('@date')) return customFaker.date.recent().toISOString();
        if (value.includes('@phone')) return customFaker.phone.number();
        if (value.includes('@url')) return customFaker.internet.url();
        if (value.includes('@address')) return containsChinese(value) ? customFaker.location.streetAddress() : customFaker.location.streetAddress();
        
        // 如果没有显式标记，则通过值的格式推断类型
        const type = inferDataType(value);
        switch (type) {
          case 'alphanumeric':
            // 保持原始字符串的字母数字格式
            return generateAlphanumeric(value);
          case 'englishText':
            // 使用英文专用faker实例生成英文内容
            if (value.length <= 4) {
              return englishFaker.word.sample(); // 单个英文词
            } else if (value.length <= 10) {
              return englishFaker.word.words(2); // 英文短语
            } else if (value.length <= 20) {
              return englishFaker.lorem.sentence(3); // 英文短句
            } else {
              return englishFaker.lorem.paragraph(1); // 英文段落
            }
          case 'numberString':
            const length = value.length;
            const min = Math.pow(10, length - 1);
            const max = Math.pow(10, length) - 1;
            return customFaker.number.int({ min, max }).toString();
          case 'email':
            return customFaker.internet.email();
          case 'date':
            return customFaker.date.recent().toISOString();
          case 'time':
            return customFaker.date.recent().toLocaleTimeString();
          case 'phone':
            return customFaker.phone.number({style: 'human'});
          case 'image':
            return customFaker.image.url();
          case 'url':
            return customFaker.internet.url();
          case 'ip':
            return customFaker.internet.ip();
          case 'cnName':
            return customFaker.person.fullName();
          case 'enName':
            return customFaker.person.fullName();
          case 'idCard':
            return customFaker.number.int({ min: 100000000000000000, max: 999999999999999999 }).toString();
          case 'color':
            return customFaker.color.rgb();
          case 'longitude':
            return customFaker.location.longitude().toString();
          case 'latitude':
            return customFaker.location.latitude().toString();
          default:
            if (containsChinese(value)) {
              return customFaker.lorem.sentence();
            }
            return customFaker.word.sample();
        }
      
      case 'number':
        if (value % 1 !== 0) {
          return customFaker.number.float({ 
            min: 0, 
            max: 1000, 
            fractionDigits: 2
          });
        }
        return customFaker.number.int({ min: 0, max: 1000 });
      
      case 'boolean':
        return customFaker.datatype.boolean();
      
      case 'object':
        if (value === null) return null;
        
        if (Array.isArray(value)) {
          // 使用自定义长度或默认随机长度
          const randomLength = customArrayLength || customFaker.number.int({ min: 1, max: 20 });
          return Array(randomLength).fill(null).map(() => ({
            ...processValue(value[0])
          }));
        }
        
        const newObj: any = {};
        for (const key in value) {
          newObj[key] = processValue(value[key]);
        }
        return newObj;
      
      default:
        return value;
    }
  }

  let result = JSON.parse(JSON.stringify(jsonData));
  
  keys.forEach(rawKey => {
    const { key, count } = parseKeyAndCount(rawKey);
    const path = key.split('.');
    let current = result;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) return;
      current = current[path[i]];
    }
    
    const lastKey = path[path.length - 1];
    if (current[lastKey] !== undefined) {
      current[lastKey] = processValue(current[lastKey], count);
    }
  });

  return result;
}

// 请求体管理器类
export class RequestBodyManager {
  private requestBodies: Array<{
    key: string;
    data: any;
    timestamp: number;
  }> = [];
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  // 添加请求体数据
  add(key: string | undefined, data: any): void {
    if (!key) return;
    
    // 添加新项，带时间戳
    this.requestBodies.push({
      key,
      data,
      timestamp: Date.now()
    });
    
    // 如果超出最大容量，删除最早添加的项
    if (this.requestBodies.length > this.maxSize) {
      this.requestBodies.sort((a, b) => a.timestamp - b.timestamp);
      this.requestBodies.shift();
    }
  }

  // 获取请求体数据
  get(key: string | undefined): any {
    if (!key) return {};
    
    const item = this.requestBodies.find(item => item.key === key);
    return item ? item.data : {};
  }

  // 删除请求体数据
  remove(key: string | undefined): void {
    if (!key) return;
    
    const index = this.requestBodies.findIndex(item => item.key === key);
    if (index !== -1) {
      this.requestBodies.splice(index, 1);
    }
  }

  // 获取当前存储的请求体数量
  get size(): number {
    return this.requestBodies.length;
  }

  // 清空所有请求体数据
  clear(): void {
    this.requestBodies = [];
  }
}

export function updateGitignore(ignorePattern: string): void {
  const gitIgnorePath = path.join(process.cwd(), '.gitignore');
  try {
    let gitignoreContent = '';
    if (fs.existsSync(gitIgnorePath)) {
      gitignoreContent = fs.readFileSync(gitIgnorePath, 'utf8');
    }
    
    if (!gitignoreContent.includes(ignorePattern)) {
      const newContent = gitignoreContent.endsWith('\n') || gitignoreContent === ''
        ? `${gitignoreContent}${ignorePattern}\n`
        : `${gitignoreContent}\n${ignorePattern}\n`;
      fs.writeFileSync(gitIgnorePath, newContent, 'utf8');
    }
  } catch (error) {
    console.error('Error updating .gitignore:', error);
  }
}