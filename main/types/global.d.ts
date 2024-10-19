interface ProxyMockOptions {
  apiRule: string;
  configPath?: string;
  https?: boolean; // 是否启用 https
  cacheRequestHistoryMaxLen?: number; 
  lang?: 'en' | 'zh'// 缓存请求历史的最大长度
}

interface ProxyList {
  name: string;
  proxy: string;
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
}

interface ApiData {
  proxy: ProxyList[];
  selectProxy: string;
  apiList: ApiConfig[];
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