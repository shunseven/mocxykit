interface ProxyMockOptions {
  apiRule: string;
  https?: boolean; // 是否启用 https
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
  url: string;
  name: string;
}