const proxyFun = require('./fun')
const httpProxy = require('http-proxy');
const path = require('path')
const fs=require('fs');
const url=require('url');
const {getItemProxy} = proxyFun
const proxy = httpProxy.createProxyServer({});
const routeMatch = require('path-match')({
  // path-to-regexp options
  sensitive: false,
  strict: false,
  end: true,
})
module.exports = function (app, option) {
  var apiRule=option&&option.apiRule?option.apiRule:'/*';
  return function (req, res, next) {
    if (option.disabled && option.disabled.includes('itemProxy')) {
      next()
      return
    }
    app.get("/proxy-api/get/itemProxy",function (req,res) {
      res.send(getItemProxy())
    });

    app.post("/proxy-api/set/itemProxy",function (req,res) {
      console.log('set itemProxy');
      let body = ''
      req.on('data', function (data) {
        body += data
      } )
      req.on('end', function () {
        const bodyData = body.toString()
        fs.writeFileSync('./itemProxy.json', bodyData);
        res.send(JSON.parse(bodyData));
      })
    });

    app.all(apiRule, function (req, res, next) {
      let itemProxy = getItemProxy()
      if (typeof itemProxy === 'string') {
        itemProxy = JSON.parse(itemProxy)
      }
      const pathname = url.parse(req.url).pathname
      const refererPath = req.headers.referer ? url.parse(req.headers.referer).pathname : ''
      const proxyItem = itemProxy.find(proxyData => {
        const match = routeMatch(proxyData.url)
        return (match(pathname) || match(refererPath)) && proxyData.hasProxy
      })
      if (proxyItem) {
        proxy.web(req, res, {
          target: proxyItem.target,
          changeOrigin: true,
          /**
           * This ensures targets are more likely to
           * accept each request
           */
          changeOrigin: true,
          /**
           * This handles redirects
           */
          autoRewrite: true,
          /**
           * This allows our self-signed certs to be used for development
           */
          secure: false,
          ws: true,
          ignorePath: proxyItem.ignorePath
        });
        return
      }
      next()
    })


    next();
  }
}
