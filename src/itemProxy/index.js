const proxyFun = require('./fun')
const httpProxy = require('http-proxy');
const path = require('path')
const fs=require('fs');
const url=require('url');
const {getItemProxy} = proxyFun
var proxy = httpProxy.createProxyServer({});
module.exports = function (app, option) {
  var apiRule=option&&option.apiRule?option.apiRule:'/*';
  return function (req, res, next) {
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
        fs.writeFileSync('./itemProxy.json',JSON.stringify(bodyData));
        res.send(JSON.parse(bodyData));
      })
    });

    app.all(apiRule, function (req, res, next) {
      const itemProxy = JSON.parse(getItemProxy())
      const pathname = url.parse(req.url).pathname
      const proxyItem = itemProxy.find(proxyData => proxyData.url === pathname)
      if (proxyItem) {
        proxy.web(req, res, {
          target: proxyItem.target,
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
          ws: true
        });
        return
      }
      next()
    })


    next();
  }
}
