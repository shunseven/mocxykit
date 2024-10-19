
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
|            **`https`**            |     `boolean`     |                  `true`               | 是否代理 https 请求。                                                                  |
|              **`configPath`**              |         `string`         |                 `/config`                  | 打开配制页面的地址，默认为http://localhost:3000/config                     |
|          **`cacheRequestHistoryMaxLen`**          |             `number`              |                  `30`                  |  缓存请求数据的最大条数                                                          |
|          **`lang`**          |             `number`              |                  `zh`                  |  语言                                                          |


## 其他服务器

这里将展示与其他服务器一起使用的示例。

### Webpack >= 5.0
修改 config 文件，如 vue.config.js

```js
// vue.config.js 或者其它 webpack config 文件
const { proxyMockMiddleware } = require('express-proxy-mock')

module.exports = {
  //...
  devServer: {
    setupMiddlewares(middlewares, devServer) {
      devServer.app.use(proxyMockMiddleware({
        apiRule: '/api/*',
        configPath: '/config'
      }))
      return middlewares
   }
  }
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

在根目录中创建 server.js 文件，并把package.json 中的 scripts下 dev 改为值"node server.js" 

```js
import express from 'express';
import { createServer as createViteServer } from 'vite';
const { proxyMockMiddleware } = require('express-proxy-mock')

async function createServer() {
  const app = express();
  
  // 创建 Vite 服务器
  const vite = await createViteServer({
    server: {
      middlewareMode: 'ssr',
      hmr: {
        // 配置 HMR 选项，例如指定 WebSocket 服务器的端口
        port: 8838
      }
    }
  });

  // 引入我们的的代理工具
  app.use(proxyMockMiddleware())

  // 使用 Vite 的 Connect 实例作为中间件
  app.use(vite.middlewares);

 

  app.listen(8800, () => {
    console.log('Server is running at http://localhost:8800');
  });
}

createServer();
```

## 联系我

QQ群：930832439

## License

[MIT](./LICENSE)