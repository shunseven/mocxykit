function firstUpperCase(str) {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

export function parseUrlToKey(url) {
  const cleanUrl = url.split('?')[0];
  return cleanUrl.split('/').map(item => firstUpperCase(item)).join('');
}

export class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(type, callback, scope, ...args) {
    if (typeof this.listeners[type] !== "undefined") {
      this.listeners[type].push({ scope, callback, args });
    } else {
      this.listeners[type] = [{ scope, callback, args }];
    }
  }

  off(type, callback, scope) {
    if (typeof this.listeners[type] !== "undefined") {
      this.listeners[type] = this.listeners[type].filter(
        listener => listener.scope !== scope || listener.callback !== callback
      );
    }
  }

  hasEventListener(type, callback, scope) {
    if (typeof this.listeners[type] !== "undefined") {
      if (callback === undefined && scope === undefined) {
        return this.listeners[type].length > 0;
      }
      return this.listeners[type].some(
        listener => (scope ? listener.scope === scope : true) && listener.callback === callback
      );
    }
    return false;
  }

  emit(type, target, ...args) {
    const event = { type, target };
    const eventArgs = [event, ...args];

    if (typeof this.listeners[type] !== "undefined") {
      const listeners = this.listeners[type].slice();
      listeners.forEach(listener => {
        if (listener && listener.callback) {
          listener.callback.apply(listener.scope, [...eventArgs, ...listener.args]);
        }
      });
    }
  }

  getEvents() {
    let str = "";
    for (const type in this.listeners) {
      this.listeners[type].forEach(listener => {
        str += listener.scope && listener.scope.className ? listener.scope.className : "anonymous";
        str += ` listen for '${type}'\n`;
      });
    }
    return str;
  }
  
}

const dict = {
  "全局代理": "Global Proxy",
  "切换为全局代理": "Switch to Global Proxy",
  "MOCK数据优先": "MOCK Data First",
  "自定义代理优先": "Custom Proxy First",
  "新增MOCK数据&自定义代理": "Add MOCK Data & Custom Proxy",
  "名称": "Name",
  "目标": "Target",
  "查看MOCK数据": "View MOCK Data",
  "启用": "Enable",
  "MOCK数据": "MOCK Data",
  "自定义代理": "Custom Proxy",
  "操作": "Action",
  "设置": "Settings",
  "请确认": "Please Confirm",
  "是否要删除这个代理": "Do you want to delete this proxy?",
  "删除": "Delete",
  "取消": "Cancel",
  "转换最近请求为MOCK数据": "Convert Recent Request to MOCK Data",
  "查看数据": "View Data",
  "请求地址": "Request URL",
  "请求时间": "Request Time",
  "历史请求数据": "Historical Request Data",
  "请输入URL": "Please Enter URL",
  "批量导入MOCK数据": "Batch Import MOCK Data",
  "清空当前数据": "Clear Current Data",
  "导入数据": "Import Data",
  "请求参数": "Request Parameters",
  "修改入参": "Modify Input Parameters",
  "增加入参MOCK数据": "Add Input MOCK Data",
  "入参": "Input Parameters",
  "优化返回入参匹配最多的数据": "Optimize Return Input Matching Most Data",
  "出参": "Output Parameters",
  "MOCK数据&自定义代理": "MOCK Data & Custom Proxy",
  "延时": "Delay",
  "输入请求参数名称": "Enter Request Parameter Name",
  "查看MOCK数据": "View MOCK Data",
  "是否要删除这个代理": "Do you want to delete this proxy?",
  "请输入代理的名称": "Please Enter Proxy Name",
  "请输入代理地址": "Please Enter Proxy Address",
  "请输入正确的代理地址": "Please Enter a Valid Proxy Address",
  "代理地址已存在": "Proxy Address Already Exists",
  "创建": "Create",
  "编辑": "Edit",
  "保存": "Save",
  "代理": "Proxy",
  "新增": "Add",
  
  // 来自 envConfig
  "提示": "Prompt",
  "是否清除本页所有缓存数据": "Do you want to clear all cached data on this page?",
  "环境变量": "Environment Variables:",
  
  // 来自 envForm
  "编辑环境变量": "Edit Environment Variable",
  "新增环境变量": "New Environment Variable",
  "请输入环境变量名称": "Please Enter Environment Variable Name",
  
  // 来自 envSelect
  "选择环境变量": "Select Environment Variable",
  "确认删除": "Confirm Delete",
  "是否确认删除该环境变量": "Are you sure to delete this environment variable?",
  "确认": "Confirm",
  "无": "None",
  "刷新成功": "Refresh Successful",
  "刷新失败": "Refresh Failed",

  // 来自 settingsModal
  "设置": "Settings",
  "请输入 Ngrok Authtoken": "Please Enter Ngrok Authtoken",
  "获取Ngrok authtoken": "Get Ngrok Authtoken",
  "开启公网访问": "Enable Public Access",
  "已开启公网访问": "Public Access Enabled",
  "开启公网访问失败": "Failed to Enable Public Access",
  "公网访问地址：": "Public Access URL:",
  
  // MCP设置相关
  "MCP 设置": "MCP Settings",
  "启用 MCP 服务": "Enable MCP Service",
  "编辑器支持": "Editor Support",
  "暂不支持": "(Not Supported Yet)",
  "服务地址": "Service URL",
  "复制服务地址": "Copy Service URL",
  "服务地址已复制到剪贴板": "Service URL copied to clipboard",
  "复制失败": "Copy Failed",
  "公共访问": "Public Access",
  
  "返回随机数据": "Return Random Data",
  "随机数据配置说明": "Use comma to separate multiple fields. Example: data.list, page.total",
  "请输入字段路径": "Enter field path, e.g., data.list",
  
  // faker相关配置说明
  "随机数据配置示例": {
    "zh": `
根据你配制 Mock数据的转换成随机数据。<br/>    
配置示例：<br/>
1. data - 随机化整个data对象数据<br/>
2. data.list - 只随机化list字段数据<br/>
3. data.list<100> - 生成100条随机数据<br/>
4. data,page.total - 多个字段随机化<br/>`,
    "en": `
Examples:
1. data - Randomize entire data object<br/>
2. data.list - Only randomize list field<br/>
3. data.list<100> - Generate 100 random items<br/>
4. data,page.total - Randomize multiple fields<br/>`
  },

  // 添加延时相关的翻译
  "延时": "Delay",
  "固定": "Pin",
  "取消固定": "Unpin",

  // 添加随机数据相关翻译
  "随机数据": "Random Data",
  "已开启": "Enabled",
  "未开启": "Disabled",

  // 基本配置相关
  "基本配置": "Basic Settings",
  "API规则": "API Rules",
  "全局代理的匹配规则，有多个规则用','隔开如'api/*，/test/*'": "Global proxy matching rule. Multiple rules can be separated by commas, e.g. 'api/*,/test/*'",
  "请输入API规则": "Please enter API rules",
  "例如: /api": "Example: /api/*",
  "配制页面的地址": "Config Page Path",
  "打开配制页面的地址，默认为http://localhost:xxxx/config": "Path to the configuration page, default is http://localhost:3000/config",
  "例如: ./config": "Example: /config",
  "启用HTTPS": "Enable HTTPS",
  "是否启用HTTPS": "Whether to proxy HTTPS requests",
  "缓存请求历史最大个数": "Max Cache Request History Count",
  "缓存请求历史的最大个数": "Maximum number of cached request history items",
  "语言": "Language",
  "设置界面语言": "Interface language",
  "中文": "Chinese",
  "英文": "English",
  "调试模式": "Debug Mode",
  "是否启用调试模式": "Whether to enable debug mode",
  "按钮位置": "Button Position",
  "设置按钮的位置": "Button position (only works in Vite). Options: 'top', 'middle', 'bottom' or coordinate format like '100,100'",
  "顶部": "Top",
  "中间": "Middle",
  "底部": "Bottom",
  "保存配置": "Save Configuration",
  "重置": "Reset",
  "基本配置保存成功": "Basic configuration saved successfully",
  "基本配置保存失败": "Failed to save basic configuration",
  "获取基本配置失败": "Failed to get basic configuration",
  "获取基本配置失败:": "Failed to get basic configuration:",
  "保存基本配置失败:": "Failed to save basic configuration:",
}

export function t (key) {
  const config = window.__config__
  if (config?.lang === 'en' && typeof dict[key] === 'string') {
    return dict[key]
  }
  if (typeof dict[key] === 'object') {
    return dict[key][config?.lang] || dict[key]['zh']
  }
  return key
}

export function clearLocalCache() {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(";").forEach((cookie) => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });
}
