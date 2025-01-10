interface ProxyMockOptions {
  apiRule: string | [string];
  configPath?: string;
  https?: boolean; // 是否启用 https
  cacheRequestHistoryMaxLen?: number;  // 缓存请求历史的最大长度
  lang?: 'en' | 'zh'// 缓存请求历史的最大长度
  debug?: boolean; // 是否启用调试模式
  buttonPosition?: 'top' | 'middle' | 'bottom' | string; // 按钮位置
}

interface ProxyList {
  name: string;
  proxy: string;
  bindEnvId?: number; // 同时在代理配置中也添加环境变量绑定
}

interface ApiConfig {
  url: string;
  key: string;
  customProxy: string[];
  selectCustomProxy: string;
  target: 'proxy' | 'mock' | 'customProxy';
  duration: number;
  name: string;
  hasMockData?: boolean;
  bindEnvId?: number; // 添加绑定环境变量ID字段
  fakerKey?: string;
  hasFaker?: boolean;
}

interface ApiData {
  proxy: ProxyList[];
  selectProxy: string;
  apiList: ApiConfig[];
  selectEnvId?: number;   // 用户手动选择的环境变量ID
  currentEnvId?: number;  // 当前实际使用的环境��量ID
  hasEnvPlugin?: boolean; // 是否启用环境变量插件
}

interface MockRequestData {
  name: string;
  requestData: object;
  responseData: object;
}

interface MockData {
  data: MockRequestData[];
  key: string;
  url: string;
  name: string;
}

interface CustomProxyAndMock{
  name: string;
  url: string;
  duration: number;
  customProxy: string[];
  mockData: MockData;
  selectCustomProxy: string;
  target?: 'proxy' | 'mock' | 'customProxy';
  fakerKey?: string;
  hasFaker?: boolean;
}

interface AllMockData {
  [key: string]: MockData;
}

interface CacheRequestHistoryData {
  url: string;
  key: string;
  data: Record<string, any>;
  time: string;
}

interface EnvVariable {
  key: string;
  value: string;
}

interface EnvConfig {
  id: number;
  name: string;
  variables: EnvVariable[];
}