[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/shunseven-mocxykit-badge.png)](https://mseep.ai/app/shunseven-mocxykit)

# mocxykit

![描述](./public/proxymock.png)
- [中文](./README.md)
- [English](./README_EN.md)

前端开发服务的中间件，主要用于代理请求和 MOCK 数据，可用于所有 webpack,vite和其它所有前端开发服务启动服务的开发项目,
此中间件应仅用于**开发**。

## 主要功能：

- 代理请求和 MOCK数据
- 可视化的管理 MOCK 数据及代理功能
- 代理支持全局代理和某一个 URL 的自定义代理
- 可随时切换某一个URL进行代理转发或 MOCK 数据
- 可通过不同的入参，返回不同的MOCK 数据
- 可以快速把最近的请求返回的数据，存为 MOCK 数据
- 支持 faker 随机MOCK数据生成
- 支持多环境变量管理，随时切换环境变量
- 支持 Ngrok 公网访问
- 支持自动同步ApiFox文档及生成的mock数据
- 支持 MCP 协议，让 AI 编程时，自动获取 MOCK 数据或最近浏览器请求的数据及文档
- 内置API请求工具，可直接发送和测试API请求

## 入门

首先，安装模块：

```console
npm install mocxykit --save-dev
```

### 示例

## 用法

### Webpack >= 5.0
修改 webpack.config.js
```js
const { WebpackProxyMockPlugin } = require('mocxykit')
module.exports = {
  //...
  devServer: {
    ...
  },
  plugins: [
      // 在 wepback 中会在插件里获取 devServer 并注入代理，devServer 不需要再配制
      new WebpackProxyMockPlugin({
        apiRule: '/api/*',
        lang: 'zh'
      })
  ]
};
```

### Webpack <= 4+

```js
// vue.config.js 或者其它 webpack config 文件 
const { proxyMockMiddleware } = require('mocxykit')

module.exports = {
  //...
   devServer: {
     before(app) {
      app.use(proxyMockMiddleware({
        apiRule: '/api/*',
        lang: 'en'
      }))
    }
   }
};
```

### vite
```js
// vite.config.js
import { defineConfig } from 'vite'
import { viteProxyMockPlugin } from 'mocxykit'

export default defineConfig({
  plugins: [
    viteProxyMockPlugin({
      apiRule: '/api/*',
      lang: 'zh',
      buttonPosition: 'bottom', // 可选：'top'(顶部)、'middle'(中间)、'bottom'(底部) 或坐标格式如 '100,100'
    })
  ]
})
```

### vue.config.js
```js
const proxyMockPlugin = new WebpackProxyMockPlugin({
        apiRule: '/api/*',
        lang: 'zh'
      })
module.exports = {
  //...
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // 在vue中，因 vue-cli在webpack 编译完成后,才注入 devServer,插件中获取不到 devServer配制，需要手动注入代理中间件
      proxyMockPlugin.setupDevServer(devServer.app);
      return middlewares;
    }
  },
  plugins: [
      proxyMockPlugin
  ]
};
```

### express
```js
const { proxyMockMiddleware } = require("mocxykit");
const express = require("express");
const app = express();

app.use(
  proxyMockMiddleware({
    // express-proxy-mock options
  }),
);

app.listen(3000, () => console.log("Example app listening on port 3000!"));
```

### Rsbuild
```js
// rsbuild.config.js
import { defineConfig } from '@rsbuild/core';
import { rsbuildProxyMockPlugin } from 'mocxykit';

export default defineConfig({
  // Rsbuild 配置
  plugins: [
    rsbuildProxyMockPlugin({
      apiRule: '/api/*',
      lang: 'zh',
      buttonPosition: 'bottom', // 可选：'top'(顶部)、'middle'(中间)、'bottom'(底部) 或坐标格式如 '100,100'
    }),
  ],
});
```

浏览器打开 http://localhost:3000/config 就可以看到代理与 MOCK 数据的配制界面
vite, Rsbuild 项目会在页面右下角显示一个按钮，点击按钮即可打开配置页面

请参阅[下文](#其他服务器)以获取 vite, 与 webpack, 及 vueConfig 使用示例。

## 选项

|                      名称                       |               类型                |                    默认值                    | 描述                                                                                                          |
| :---------------------------------------------: | :-------------------------------: | :-------------------------------------------: | :------------------------------------------------------------------------------------------------------------------- |
|            **`apiRule`**            |              `string`              |              空值              | 全局代理的匹配规则如“/api/\*“为代理api开头的请求, 有多个规则用','隔开如'/api/\*，/test/\*, 当空值时代理所有的 Accept 头是否包含 application/json 或 text/xml 及 Ajax 请求'                                          |
|            **`https`**            |     `boolean`     |                  `true`               | 是否代理 https 请求                                                                  |
|              **`configPath`**              |         `string`         |                 `/config`                  | 打开配制页面的地址，默认为http://localhost:3000/config                     |
|          **`cacheRequestHistoryMaxLen`**          |             `number`              |                  `30`                  |  缓存请求数据的最大条数                                                          |
|          **`lang`**          |             `string`              |                  `zh`                  |  语言                                                          |
|          **`buttonPosition`**          |             `'top' \| 'middle' \| 'bottom' \| string`              |                  `bottom`                  |  配置按钮位置（仅在Vite中生效）。可选值：'top'（顶部）、'middle'（中间）、'bottom'（底部）或坐标格式如'100,100'                                                          |


## 代理与MOCK 数据

### 代理请求和 MOCK 数据
- 支持配置多个代理服务器，可同时处理多个后端服务
- 支持 HTTP 和 HTTPS 协议的代理转发
- 提供简单的界面进行代理配置和管理

### 可视化管理界面
- 直观的 Web 界面，轻松管理所有代理和 MOCK 配置
- 实时预览和编辑 MOCK 数据
- 支持 JSON 格式的数据编辑和校验
- 提供请求历史记录查看功能

### 灵活的代理配置
- 支持全局代理：统一配置所有 API 请求的转发规则
- 支持单个 URL 的自定义代理：针对特定接口配置不同的代理规则
- 可以随时在全局代理和自定义代理间切换
- 支持正则表达式匹配 URL 路径

### 动态切换代理和 MOCK
- 每个 API 接口都可以独立控制使用代理或 MOCK 数据
- 实时切换无需重启服务
- 切换时自动保存当前配置
![mock_proxy](./public/mock_proxy.png)

## API请求发送

mocxykit 内置了强大的API请求发送工具，让您可以直接在配置界面中测试和调试API接口，无需切换到其他工具。

### 功能特点

- **多种请求方法支持**：支持GET、POST、PUT、DELETE、PATCH等常用HTTP方法
- **参数配置**：可配置查询参数、请求头、Cookie和请求体
- **自动填写配置**：请求头、Cookie 默认自动导入最近请求的请求头和cookie
- **参数类型设置**：支持字符串、数字和布尔值类型的参数
- **JSON编辑器**：内置JSON编辑器，方便编辑请求体和查看响应数据
- **历史记录**：可从最近请求中从重新发送请求
- **导入功能**：支持从localStorage和cookie中导入数据
- **响应查看**：清晰展示响应状态、响应头和响应数据
- **一键导入Mock**：可将响应数据一键导入为Mock数据

### 使用方法

1. 在API列表或最近请求中点击"发送请求"按钮
2. 配置请求方法和URL
3. 在不同选项卡中设置参数、请求体、请求头和Cookie
4. 点击"发送"按钮发送请求
5. 查看响应数据
6. 可选择将响应数据导入为Mock数据

### 数据导入功能

- **从localStorage导入**：可将localStorage中的数据导入为请求头或Cookie
- **从cookie导入**：可将浏览器cookie导入为请求Cookie
- **从历史记录导入**：可导入之前发送过的请求配置

### 响应数据处理

- 自动识别JSON响应并格式化显示
- 显示响应状态码和状态文本
- 展示完整的响应头信息
- 支持将响应数据一键导入为Mock数据

![send_api](./public/send_api.png)

## 同步ApiFox数据

mocxykit 支持与 ApiFox 平台集成，让您可以轻松同步 ApiFox 中的 API 数据到本地开发环境，包括MOCK数据及文档。

### 功能特点

- **一键同步**：一键将 ApiFox 中的 API 数据同步到本地开发环境
- **选择性同步**：可以选择特定的 API 分组进行同步
- **自动补全 URL**：可以自动为 API 路径添加前缀
- **自动同步**：支持每次打开页面时自动同步 ApiFox 数据

### 使用方法

1. 在配置界面中点击"同步 ApiFox 数据"按钮
2. 输入 ApiFox Access Token
   - 登录 ApiFox 网站 (https://app.apifox.com/user/login)
   - 登录后，从浏览器的 localStorage 中复制 common.accessToken 字段值
3. 选择要同步的项目
4. 选择要同步的 API 分组
5. 配置同步选项：
   - 自动补全 URL：开启后，将在同步数据时自动为 API 路径添加前缀
   - 自动同步：开启后，将在每次打开页面时自动同步 ApiFox 数据
   - API 规则：选择适用的 API 规则（如果配置了多个规则）

### 自动同步功能

启用自动同步功能后，mocxykit 将在每次页面加载时自动从 ApiFox 获取最新的 API 数据，确保您的本地开发环境始终使用最新的 API 定义。

### API 文档查看

同步 ApiFox 数据后，您可以在 mocxykit 界面中查看详细的 API 文档，包括：

- 请求参数文档
- 响应参数文档
- 参数类型和描述
- 必填字段标识
- 数组和对象结构展示

![文档](./public/doc.png)

## MCP (Model Context Protocol)

### 功能介绍
MCP是一个基于SSE（Server-Sent Events）的实时数据通信协议实现，它提供了以下功能：
 
 在 cursor 等，支持 MCP 的 AI 编辑器，通过MCP协议，实现了在 AI 编程的时候，只要告诉 AI 对应的接口路径，AI就可以自动获取到对应的 MOCK 数据或浏览最近请求过的数据，无需人工干预。具体是MOCK 数据或浏览最近请求过的数据，根据你的数据目标设定，如果设定 mock 就会从MOCK 数据中获取，如果是代理就会比浏览器最近请求的数据中获取。如果是没有配制的URL，但符合全局代理也会从浏览器最近请求的数据中获取。

### 配制方法

  点击 mocxykit 配制界面的右上角的设置ICON，切换到 MCP设置，启用 MCP 服务勾选对于的编辑器就可以了，最后还需要在cursor的设置中，在 MCP的设置项中的右边是否显示 disabled（默认是不开启）,如果是，则点一下开启这个服务。

### 使用方法
在AI 编程中要让 AI 主动请求数据，需要写关键词 mcpData


1. 比如我想写一个 todoList： 

`在@todoList.tsx一个文件中实现一个 todoList 的功能，有展示列表及增加列表的功能，请求 mcpData api/todo-list获取列表数据结构，请求 mcpData api/todo-list/add 增加列表数据。 `

这样 AI 就会主动请求数据，然后根据数据结构生成代码。

2. 比如我在浏览上测试的时候，发现某一个接口的业务逻辑返回的数据没有覆盖到，我可以在 AI 编程中写：

`在 @todoList.tsx 文件中，请求 mcpData api/todo-list 获取数据，根据返回的错误数据，弹层显示错误信息。`

这样 AI 就会主动获取到错误数据，分析结构然后弹层显示错误信息。

![mcp](./public/mcp.png)
![mcp2](./public/mcp2.png)

## faker MOCK 数据
- 支持静态 MOCK 数据和动态 MOCK 数据
- 根据请求参数返回不同的 MOCK 数据
- 支持faker随机数据生成
  - 自动识别数据类型（如邮箱、手机号、URL等）并生成对应格式的随机数据
  - 支持中英文混合数据的智能生成
  - 通过特殊语法控制数组长度：`data.list<100>` 生成100条随机数据
  - 支持多字段随机化：`data.list,page.total`
  - 自动保持字符串格式：数字字符串保持位数，字母数字混合保持格式
- 配置方式：
  1. 在MOCK数据编辑页面勾选"返回随机数据"
  2. 在输入框中填写需要随机化的字段路径
  3. 支持的语法格式：
     - `data` - 随机化整个data对象
     - `data.list` - 只随机化list字段
     - `data.list<100>` - 生成100条随机数据
     - `data,page.total` - 多个字段随机化

## 环境变量

代理支持环境变量管理功能，您可以：
- 创建多个环境配置
- 将环境变量绑定到特定代理
- 快速切换不同环境
- 切换环境时自动清理浏览器缓存

### 开启环境变量功能

要启用环境变量功能，您需要：

1. 使用带有 DefinePlugin 的 webpack
2. 在 webpack 配置中添加 WebpackProxyMockPlugin
3. 或者用的是 vite 插件，直接在 vite.config.js 中添加 viteProxyMockPlugin


### 如何使用环境变量

1. 点击环境选择器旁边的"+"按钮创建新环境
2. 在环境配制中添加键值对
3. 可以在代理设置中将环境绑定到代理
4. 切换环境时，系统会提示是否清理浏览器缓存

### 功能特点

- **绑定功能**：代理可以绑定到特定环境
- **快速切换**：轻松切换不同环境
- **缓存管理**：切换环境时可选择清理浏览器缓存
- **可视化管理**：环境变量的可视化管理界面

## Ngrok 公网访问

本中间件支持使用 Ngrok 进行公网访问，让您的本地开发环境可以：

- 与外部用户共享本地开发环境
- 在不同设备上测试应用
- 向客户演示开发进度

### 设置外网访问

1. 打开配置页面 `http://localhost:3000/config`
2. 点击右上角的设置图标
3. 在 https://dashboard.ngrok.com/signup 注册免费的 Ngrok 账号
4. 从 Ngrok 控制台复制您的 authtoken
5. 将 authtoken 粘贴到设置弹窗中
6. 点击"开启外网访问"
 
### 功能特点

- 自动创建隧道连接
- 安全的 HTTPS 端点
- 持久化存储 authtoken
- 便捷的 URL 复制功能
- 一键重置隧道连接

### 注意事项

- Ngrok 免费版有一些使用限制
- 每次创建新隧道时，公网 URL 会改变

![public_net](./public/public_net.png)

## 联系我

QQ群：930832439

## License

[MIT](./LICENSE)