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
  
  "返回随机数据": "Return Random Data",
  "随机数据配置说明": "Use comma to separate multiple fields. Example: data.list, page.total",
  "请输入字段路径": "Enter field path, e.g., data.list"
}

export function t (key) {
  const config = window.__config__
  if (config?.lang === 'en' && dict[key]) {
    return dict[key]
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
