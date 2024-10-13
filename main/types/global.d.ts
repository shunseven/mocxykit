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
  customProxy: any[];
  selectCustomProxy: string;
  selectMock: string;
  target: 'proxy' | 'mock' | 'customProxy';
}

interface ApiData {
  proxy: ProxyList[];
  selectProxy: string;
  apiList: ApiConfig[];
}