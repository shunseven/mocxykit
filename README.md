# express-proxy-mock

- [中文](./README_ZH.md)
- [English](./README.md)

![Description](./public/proxymock_en.png)

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
Open the browser at http://localhost:3000/config to see the configuration interface for proxy and MOCK data.

Refer to [below](#other-servers) for usage examples with vite, webpack, and vueConfig.


## Options

|                      Name                       |               Type                |                    Default                    | Description                                                                                                          |
| :---------------------------------------------: | :-------------------------------: | :-------------------------------------------: | :------------------------------------------------------------------------------------------------------------------- |
|            **`apiRule`**            |              `string`              |              `/api/*`              | Global proxy matching rule, default is all requests starting with api                                          |
|            **`https`**            |     `boolean`     |                  `true`               | Whether to proxy https requests.                                                                  |
|              **`configPath`**              |         `string`         |                 `/config`                  | Address to open the configuration page, default is http://localhost:3000/config                     |
|          **`cacheRequestHistoryMaxLen`**          |             `number`              |                  `30`                  |  Maximum number of cached request data                                                          |
|          **`lang`**          |             `number`              |                  `zh`                  |  lang (en,zh)                                                      |


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
          lang: 'en'
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
        lang: 'en'
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
    lang: 'en'
  }))

  // Use Vite's Connect instance as middleware
  app.use(vite.middlewares);

  app.listen(8800, () => {
    console.log('Server is running at http://localhost:8800');
  });
}

createServer();
```

## Environment Variables

The proxy supports environment variables management, which allows you to:
- Create multiple environment configurations
- Bind environment variables to specific proxies
- Quick switch between different environments
- Auto clear browser cache when switching environments

### Enabling Environment Variables

To enable the environment variables feature, you need to:

1. Use webpack with DefinePlugin
2. Add the WebpackProxyMockPlugin to your webpack configuration

#### Webpack Configuration Example
### webpack.config.js
```js
module.exports = {
  //...
  devServer: {
    ...
  },
  plugins: [
     // In webpack, the plugin will get the devServer and inject the proxy, so no need to configure devServer separately
      new WebpackProxyMockPlugin({
        apiRule: '/api/*',
        lang: 'zh'
      })
  ]
};
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
      // In vue config, because vue-cli injects devServer after webpack compilation is complete, the plugin cannot get the devServer configuration, so you need to manually inject the proxy middleware
      proxyMockPlugin.setupDevServer(devServer.app);
      return middlewares;
    }
  },
  plugins: [
      proxyMockPlugin
  ]
};
```

### How to use environment variables

1. Click the "+" button next to the environment selector to create a new environment
2. Add key-value pairs in the environment configuration
3. You can bind an environment to a proxy in the proxy settings
4. When switching environments, the system will prompt whether to clear the browser cache

### Features

- **Binding**: A proxy can be bound to a specific environment
- **Quick Switch**: Easy switching between different environments
- **Cache Management**: Option to clear browser cache when switching environments
- **Visual Management**: Visual interface for managing environment variables


## Contact Me

QQ Group: 930832439

## License

[MIT](./LICENSE)
