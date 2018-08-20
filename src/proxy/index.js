let propsFun = require('./fun')
var httpProxy = require('http-proxy');
var path = require('path')
var fs=require('fs');
var url=require('url');
const {getHost, getProxies, setProxies} = propsFun
module.exports = function (app, option) {
  var host=getHost();
  var nowHost=host?'http://'+host.host+':'+host.port:'';
  var apiRule=option&&option.apiRule?option.apiRule:'/*';
  var serverOption = {}
  if (option.https) {
    serverOption.ssh = {
      key:  fs.readFileSync(path.resolve(__dirname, 'server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'server.csr'))
    }
    var proxy = httpProxy.createProxyServer(serverOption).listen(443);
  }
  return function (req, res, next) {
    app.get("/proxy-api/change/host*",function (req,res) {

      console.log('change host success');
      nowHost='http://'+req.query.host+':'+req.query.port;
      if(!req.query.host){
        nowHost='';
      }
      var proxy=req.query;
      var proxies=getProxies();
      var hasProxy=proxies.some(function (data) {
        return proxy.host==data.host&&proxy.name==data.name&&proxy.port==data.port;
      })
      console.log(hasProxy);
      if(!hasProxy&&req.query.host){
        proxies.push(proxy);
        setProxies(proxies);
      }
      fs.writeFileSync('./proxy.json',JSON.stringify(proxy));
      res.send(req.query);
    });

    app.get('/proxy-api/get/proxies',function (req,res) {
      res.send(getProxies());
    })

    app.get("/proxy-api/get/host",function (req,res) {
      res.send(getHost());
    });

    app.get("/proxy-api/delete/host",function (req,res) {
      var deleteProxy=req.query;
      var proxies=getProxies().filter(function (data) {
        return !(deleteProxy.host==data.host&&deleteProxy.name==data.name&&deleteProxy.port==data.port);
      });
      setProxies(proxies);
      res.send(proxies);
    });

    app.all(apiRule,function (req,res,next) {
      proxy.web(req, res, {
        target:nowHost,
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
    });

    next();
    return this;
  }
}
