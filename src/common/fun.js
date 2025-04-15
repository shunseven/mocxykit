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
  "最近请求数据": "Recent Request Data",
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
  "公网访问": "Public Access",
  
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
  "全局代理的匹配规则，有多个规则用','隔开如'api/*，/test/*'，当空值时代理所有的 Accept 头是否包含 application/json 或 text/xml 及 Ajax 请求": "Global proxy matching rule. Multiple rules can be separated by commas, e.g. 'api/*,/test/*'. When empty, proxy all requests with Accept header containing application/json or text/xml, and Ajax requests",
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
  
  // 来自 apiDocModal.jsx
  "API文档": "API Documentation",
  "无数据": "No Data",
  "请求参数": "Request Parameters",
  "响应参数": "Response Parameters",
  "无请求参数文档": "No request parameter documentation",
  "无响应参数文档": "No response parameter documentation",
  "必填": "Required",
  "数组项": "Array Item",
  "可选值": "Optional Values",
  "Path 参数": "Path Parameters",
  "Query 参数": "Query Parameters",
  "Body 参数": "Body Parameters",
  "参数名": "Parameter Name",
  "类型": "Type",
  "描述": "Description",
  "是": "Yes",
  "否": "No",
  "文档": "Document",
  
  // 来自 apifox.jsx 和 apifoxModal.jsx
  "同步ApiFox数据": "Sync ApiFox Data",
  "ApiFox 数据自动同步成功": "ApiFox data auto sync successful",
  "ApiFox 数据自动同步失败": "ApiFox data auto sync failed",
  "ApiFox 数据自动同步出错": "Error auto syncing ApiFox data",
  "ApiFox 数据自动同步出错:": "Error auto syncing ApiFox data:",
  "同步 ApiFox 数据": "Sync ApiFox Data",
  "输入 Token": "Enter Token",
  "选择项目": "Select Project",
  "选择 API": "Select API",
  "请输入 ApiFox Access Token": "Please Enter ApiFox Access Token",
  "获取 Token": "Get Token",
  "点击登录 ApiFox": "Click to Login ApiFox",
  "，登录完成后，复制 localStorage 的common.accessToken字段值": ", after logging in, copy the value of the common.accessToken field in localStorage",
  "注：不用使用官方设置后台生成的API 访问令牌。": "Note: Do not use the API access token generated from the official settings.",
  "下一步": "Next",
  "未获取到团队和项目数据": "No team and project data retrieved",
  "上一步": "Previous",
  "项目 ID": "Project ID",
  "当前项目": "Current Project",
  "切换项目": "Switch Project",
  "自动补全URL": "Auto Complete URL",
  "开启后，将在同步数据时自动为API路径添加前缀": "When enabled, prefix will be automatically added to API paths during synchronization",
  "自动同步": "Auto Sync",
  "开启后，将自动每次打开页面时同步ApiFox数据": "When enabled, ApiFox data will be automatically synchronized each time the page is opened",
  "未获取到 API 数据": "No API data retrieved",
  "同步": "Sync",
  "获取团队和项目数据失败": "Failed to get team and project data",
  "获取团队和项目数据出错": "Error getting team and project data",
  "获取团队和项目数据出错:": "Error getting team and project data:",
  "获取 API 列表失败": "Failed to get API list",
  "获取 API 列表出错": "Error getting API list",
  "获取 API 列表出错:": "Error getting API list:",
  "解析保存的勾选项出错:": "Error parsing saved checked items:",
  "请至少选择一个 API 分组": "Please select at least one API group",
  "API 同步成功": "API sync successful",
  "API 同步失败": "API sync failed",
  "API 同步出错": "Error syncing API",
  "API 同步出错:": "Error syncing API:",
  "发送请求": "Send Request",
  "发送": "Send",
  
  // 来自 apiResponse.jsx
  "导入Mock数据成功": "Import Mock data successful",
  "导入Mock数据失败": "Failed to import Mock data",
  "响应": "Response",
  "导入Mock数据": "Import Mock Data",
  "响应数据": "Response Data",
  "响应头": "Response Headers",
  
  // 来自 apiSend.jsx
  "获取历史请求数据失败": "Failed to get historical request data",
  "请选择一条历史记录": "Please select a historical record",
  "请输入 URL": "Please enter URL",
  "请求发送成功": "Request sent successfully",
  "请求发送失败": "Request sending failed",
  "参数": "Parameters",
  "请求体": "Request Body",
  "错误": "Error",
  "成功": "Success",
  "请输入请求 URL": "Please enter request URL",
  "从 localStorage 导入": "Import from localStorage",
  "导入": "Import",
  "导入最近请求数据": "Import recent request data",
  
  // 来自 apiSendTabs.jsx
  "Params": "Params",
  "Body": "Body",
  "Headers": "Headers",
  "Cookies": "Cookies",
  "从 cookie 中导入": "Import from cookie",
  "分组视图": "Group View",
  "平铺视图": "Tile View",
  "未分组": "Ungrouped",
  "自定义": "Custom",
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

// Cookie 相关操作方法
/**
 * 解析 cookie 字符串，返回键值对对象
 * @returns {Object} cookie 键值对对象
 */
export function parseCookies() {
  const cookies = {};
  document.cookie.split(';').forEach(cookie => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) cookies[key] = value;
  });
  return cookies;
}

/**
 * 获取所有 cookie 键
 * @returns {Array} cookie 键数组
 */
export function getCookieKeys() {
  const cookies = document.cookie.split(';');
  return cookies.map(cookie => {
    const [key] = cookie.trim().split('=');
    return key;
  }).filter(key => key);
}

/**
 * 获取指定 cookie 的值
 * @param {string} key - cookie 键
 * @returns {string|null} cookie 值，如果不存在则返回 null
 */
export function getCookieValue(key) {
  try {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${key}=`))
      ?.split('=')[1];
    
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  } catch (e) {
    console.error(`无法获取 cookie 键 ${key}:`, e);
    return null;
  }
}

/**
 * 从 cookie 中导入数据
 * @param {Array} selectedKeys - 选中的 cookie 键数组
 * @returns {Object} 导入的数据对象
 */
export function importDataFromCookie(selectedKeys) {
  const importData = {};
  selectedKeys.forEach(key => {
    const value = getCookieValue(key);
    if (value) {
      importData[key] = value;
    }
  });
  return importData;
}

// localStorage 相关操作方法
/**
 * 获取所有 localStorage 键
 * @returns {Array} localStorage 键数组
 */
export function getLocalStorageKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i));
  }
  return keys;
}

/**
 * 从 localStorage 中导入数据
 * @param {Array} selectedKeys - 选中的 localStorage 键数组
 * @returns {Object} 导入的数据对象
 */
export function importDataFromLocalStorage(selectedKeys) {
  const importData = {};
  selectedKeys.forEach(key => {
    try {
      importData[key] = localStorage.getItem(key);
    } catch (e) {
      console.error(`无法获取 localStorage 键 ${key}:`, e);
    }
  });
  return importData;
}
