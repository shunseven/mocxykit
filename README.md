
# express-proxy-mock

- [中文](./README_ZH.md)
- [English](./README.md)

![Description](./public/proxymock.png)

Middleware for express, mainly used for proxy requests and MOCK data. It can be used for all development projects that start services with webpack, vite, and other express-based servers. This middleware should only be used for **development**.

Some benefits of using this middleware include:

- Proxy requests and MOCK data
- Visual management of MOCK data and proxy functions
- Proxy support for global proxy and custom proxy for a specific URL
- Switch between proxy forwarding or MOCK data for a specific URL at any time
- Return different MOCK data based on different parameters
- Quickly save the data returned by the most recent request as MOCK data

## Getting Started

First, install the module:

```console
npm install express-proxy-mock --save-dev
```

## Usage

### webpack.config.js
```js
module.exports = {
  //...
  devServer: {
    setupMiddlewares(middlewares, devServer) {
      devServer.app.use(proxyMockMiddleware({
        apiRule: '/api/*',
        language: 'en'
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
Open the browser at http://localhost:3000/config to see the configuration interface for proxy and MOCK data.

Refer to [below](#other-servers) for usage examples with vite, webpack, and vueConfig.

## Options

|                      Name                       |               Type                |                    Default                    | Description                                                                                                          |
| :---------------------------------------------: | :-------------------------------: | :-------------------------------------------: | :------------------------------------------------------------------------------------------------------------------- |
|            **`apiRule`**            |              `string`              |              `/api/*`              | Global proxy matching rule, default is all requests starting with api                                          |
|            **`https`**            |     `boolean`     |                  `true`               | Whether to proxy https requests.                                                                  |
|              **`configPath`**              |         `string`         |                 `/config`                  | Address to open the configuration page, default is http://localhost:3000/config                     |
|          **`cacheRequestHistoryMaxLen`**          |             `number`              |                  `30`                  |  Maximum number of cached request data                                                          |
|          **`language`**          |             `number`              |                  `zh`                  |  Language (en,zh)                                                      |


## Other Servers

Here are examples of usage with other servers.

### Webpack >= 5.0
Modify the config file, such as vue.config.js

```js
// vue.config.js or other webpack config files
const { proxyMockMiddleware } = require('express-proxy-mock')

module.exports = {
  //...
  devServer: {
     setupMiddlewares(middlewares, devServer) {
        devServer.app.use(proxyMockMiddleware({
          apiRule: '/api/*',
          language: 'en'
        }))
        return middlewares
    }
  }
};
```

### Webpack <= 4+

```js
// vue.config.js or other webpack config files 
const { proxyMockMiddleware } = require('express-proxy-mock')

module.exports = {
  //...
   devServer: {
     before(app) {
      app.use(proxyMockMiddleware({
        apiRule: '/api/*',
        language: 'en'
      }))
    }
   }
  };
```

### vite

Create a server.js file in the root directory, and change the value of dev under scripts in package.json to "node server.js"

```js
import express from 'express';
import { createServer as createViteServer } from 'vite';
const { proxyMockMiddleware } = require('express-proxy-mock')

async function createServer() {
  const app = express();
  
  // Create Vite server
  const vite = await createViteServer({
    server: {
      middlewareMode: 'ssr',
      hmr: {
        // Configure HMR options, such as specifying the WebSocket server port
        port: 8838
      }
    }
  });

  // Introduce our proxy tool
  app.use(proxyMockMiddleware({
    apiRule: '/api/*',
    language: 'en'
  }))

  // Use Vite's Connect instance as middleware
  app.use(vite.middlewares);

  app.listen(8800, () => {
    console.log('Server is running at http://localhost:8800');
  });
}

createServer();
```

## Contact Me

QQ Group: 930832439

## License

[MIT](./LICENSE)
