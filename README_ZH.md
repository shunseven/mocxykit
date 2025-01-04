# express-proxy-mock

![描述](./public/proxymock.png)

express的中间件，主要用于代理请求和 MOCK 数据，可用于所有 webpack,vite和其它所有 express 启动服务的开发项目,
此中间件应仅用于**开发**。

使用此中间件的一些好处包括：

- 代理请求和 MOCK数据
- 可视化的管理 MOCK 数据及代理功能
- 代理支持全局代理和某一个 URL 的自定义代理
- 可随时切换某一个URL进行代理转发或 MOCK 数据
- 可通过不同的入参，返回不同的MOCK 数据
- 可以快速把最近的请求返回的数据，存为 MOCK 数据

## 入门

首先，安装模块：

```console
npm install express-proxy-mock --save-dev
```

### 示例

## 用法

### webpack.config.js
```js
module.exports = {
  //...
  devServer: {
    setupMiddlewares(middlewares, devServer) {
      devServer.app.use(proxyMockMiddleware({
        apiRule: '/api/*',
        lang: 'en'
      }))
      return middlewares
   }
  },
};
```

### express
```js
const { proxyMockMiddleware } = require("express-proxy-mock");
const express = require("express");
const app = express();

app.use(
  proxyMockMiddleware({
    // express-proxy-mock options
  }),
);

app.listen(3000, () => console.log("Example app listening on port 3000!"));
```
浏览器打开 http://localhost:3000/config 就可以看到代理与 MOCK 数据的配制界面

请参阅[下文](#其他服务器)以获取 vite, 与 webpack, 及 vueConfig 使用示例。

## 选项

|                      名称                       |               类型                |                    默认值                    | 描述                                                                                                          |
| :---------------------------------------------: | :-------------------------------: | :-------------------------------------------: | :------------------------------------------------------------------------------------------------------------------- |
|            **`apiRule`**            |              `string`              |              `/api/*`              | 全局代理的匹配规则,默认为所有 api 开头的请求                                          |
|            **`https`**            |     `boolean`     |                  `true`               | 是否代理 https 请求                                                                  |
|              **`configPath`**              |         `string`         |                 `/config`                  | 打开配制页面的地址，默认为http://localhost:3000/config                     |
|          **`cacheRequestHistoryMaxLen`**          |             `number`              |                  `30`                  |  缓存请求数据的最大条数                                                          |
|          **`lang`**          |             `string`              |                  `zh`                  |  语言                                                          |
|          **`buttonPosition`**          |             `'top' \| 'middle' \| 'bottom' \| string`              |                  `bottom`                  |  配置按钮位置（仅在Vite中生效）。可选值：'top'（顶部）、'middle'（中间）、'bottom'（底部）或坐标格式如'100,100'                                                          |


## 其他服务器

这里将展示与其他服务器一起使用的示例。

### Webpack >= 5.0
修改 webpack.config.js
```js
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
const { proxyMockMiddleware } = require('express-proxy-mock')

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
import { ViteProxyMockPlugin } from 'express-proxy-mock'

export default defineConfig({
  plugins: [
    ViteProxyMockPlugin({
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
 z
### 功能特点

- 自动创建隧道连接
- 安全的 HTTPS 端点
- 持久化存储 authtoken
- 便捷的 URL 复制功能
- 一键重置隧道连接

### 注意事项

- Ngrok 免费版有一些使用限制
- 每次创建新隧道时，公网 URL 会改变

## 联系我

QQ群：930832439

## License

[MIT](./LICENSE)