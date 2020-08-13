const proxyFun = require('./fun')
const httpProxy = require('http-proxy');
const path = require('path')
const fs=require('fs');
const url=require('url');
const {getHost, getProxies, setProxies} = proxyFun
const HttpsProxyAgent = require('https-proxy-agent')
const HttpProxyAgent = require('http-proxy-agent')
var proxy = httpProxy.createProxyServer({});
module.exports = function (app, option = {}) {
  let host=getHost();
  const pre = option.https ? 'https://' : 'http://'
  let nowHost= host? pre + host.host+':'+host.port:'';
  let apiRule=option&&option.apiRule?option.apiRule:'/*';
  let serverOption = {}
  if (option.https) {
    serverOption.ssh = {
      key:  fs.readFileSync(path.resolve(__dirname, 'server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'server.csr'))
    }
    proxy = httpProxy.createProxyServer(serverOption).listen(443);
  }
  return function () {
    app.get("/proxy-api/change/host*",function (req,res) {
      console.log('change host success');
      const pre = option.https ? 'https://' : 'http://'
      nowHost= pre + req.query.host+':'+req.query.port;
      if(!req.query.host){
        nowHost='';
      }
      let proxy=req.query;
      let proxies=getProxies();
      let hasProxy=proxies.some(function (data) {
        return proxy.host==data.host && proxy.name==data.name && proxy.port==data.port;
      })
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
      let deleteProxy=req.query;
      let proxies=getProxies().filter(function (data) {
        return !(deleteProxy.host==data.host&&deleteProxy.name==data.name&&deleteProxy.port==data.port);
      });
      setProxies(proxies);
      res.send(proxies);
    });

    // 部分代理


    // 全局代理
    app.all(apiRule,function (req,res,next) {
      console.log('set all proxy')
      if (option.disabled && option.disabled.includes('proxy')) {
        next()
        return
      }
      const proxyOption = {
        target: nowHost,
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
        cookieDomainRewrite: "",
        ws: true
      }
      proxy.on('proxyRes', function (proxyRes, req, res) {
        const sc = proxyRes.headers['set-cookie'];
        if (Array.isArray(sc)) {
          proxyRes.headers['set-cookie'] = sc.map(sc => {
            return sc.split(';')
                .filter(v => v.trim().toLowerCase() !== 'secure' && !v.trim().toLowerCase().includes('samesite='))
                .join(';')
          });
        }
      })
      if (option.agentProxy) {
        if (option.https) {
          proxyOption.agent = new HttpsProxyAgent(option.agentProxy)
        } else {
          proxyOption.agent = new HttpProxyAgent(option.agentProxy)
        }
      }
      if (host.host) {
        proxy.web(req, res, proxyOption);
      }
      proxy.on('error', function (err, req, res) {
        console.log('err')
      });
    });
  }
}
