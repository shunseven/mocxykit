/**
 * Created by seven on 16/3/18.
 */
var httpProxy = require('http-proxy');
var fs=require('fs');
var isJSON = require('is-json');
var path=require('path');
var url=require('url');
var bodyParser = require('body-parser');
module.exports=function (app,option) {
    var configPath=option&&option.configPath?option.configPath:'/config';
    var apiRule=option&&option.apiRule?option.apiRule:'/*';
    app.use(bodyParser.json());

    return function (req,res,next) {

         var activeMock=getActiveMock().mock;
        function getHost(){
            var stat=fs.existsSync('./proxy.json');
            var config=stat?JSON.parse(fs.readFileSync('./proxy.json')):'';
            return config;
        }

        var host=getHost();
        var nowHost=host?'http://'+host.host+':'+host.port:'';
        function getMock() {
            var stat=fs.existsSync('./mock.json');
            var mock=stat?JSON.parse(fs.readFileSync('./mock.json')):[];
            return mock;
        }

        function getMessage () {
          return getMock().reduce(function (reduce,data) {
            var msg=data.data;
            var message;
            if(typeof msg == 'string'){
              message=msg.replace(/\n/g,'');
            }else {
              message=msg
            }


            if(isJSON(message)){
              reduce[url.parse(data.url).pathname]=JSON.parse(message);
            }else{
              reduce[url.parse(data.url).pathname]=message;
            }
            return reduce;
          },{});
        }

      function parseMock () {
        return getMock().reduce(function (reduce,data) {
          reduce[url.parse(data.url).pathname]=data
          return reduce;
        },{});
      }

        function setMock(data) {
            var mocks=getMock();
            if(!data.id){
                data.id=(new Date()).getTime();
                mocks.push(data);
            }else {
                mocks=mocks.map(function (mock) {
                    if(data.id==mock.id){
                        return data;
                    }
                    return mock;
                })
            }
            fs.writeFileSync('./mock.json',JSON.stringify(mocks, null, 2));
            return mocks;
        }

        function deleteMock(data) {
            var mocks=getMock();
            mocks=mocks.filter(function (mock) {
                return mock.id!=data.id
            })
            fs.writeFileSync('./mock.json',JSON.stringify(mocks));
            return mocks;
        }

        function getActiveMock() {
            var stat=fs.existsSync('./activemock.json');
            var mock=stat?JSON.parse(fs.readFileSync('./activemock.json')):'';
            return mock;
        }
        function getProxies() {
            var stat=fs.existsSync('./proxies.json');
            var mock=stat?JSON.parse(fs.readFileSync('./proxies.json')):[];
            return mock;
        }

        function setProxies(data) {
            fs.writeFileSync('./proxies.json',JSON.stringify(data));
        }
        var proxy = httpProxy.createProxyServer({});

        app.get("/api/change/host*",function (req,res) {
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
        app.get('/favicon.ico',function (req,res) {
            res.send(null);
        })
        app.get('/api/get/proxies',function (req,res) {
            res.send(getProxies());
        })
        app.get("/api/get/host",function (req,res) {
            res.send(getHost());
        });
        app.get("/api/delete/host",function (req,res) {
            var deleteProxy=req.query;
            var proxies=getProxies().filter(function (data) {
                return !(deleteProxy.host==data.host&&deleteProxy.name==data.name&&deleteProxy.port==data.port);
            });
            setProxies(proxies);
            res.send(proxies);
        });
        app.get('/api/get/mock',function (req,res,next) {
           // var data=JSON.parse(req.query.data);
            var mock=getMock();
            mock=mock.map(function (item) {
              return item
            });
            res.send(mock);
        });


        app.post('/api/set/mock',function(req,res,next){
            res.send(setMock(req.body));
        });


        app.get('/api/delete/mock',function(req,res,next){
            res.send(deleteMock(req.query));
        });

        app.get('/api/get/publicmock',function (req,res) {
            option.publicMock?res.send(option.publicMock):res.send([]);
        });
        app.get(configPath, function(req, res) {
            res.sendFile(__dirname + '/assets/dist/index.html')
        });
        app.get('/api/page/entry',function (req,res) {
            if(option.pageEntry){
                res.send(option.pageEntry)
            }else{
                res.send(null);
            }
        });
        app.get('/api/get/activemock',function (req,res,next) {
            res.send(getActiveMock());
        });
        app.get('/api/set/activemock',function (req,res) {
            activeMock=req.query.mock;
            fs.writeFileSync('./activemock.json',JSON.stringify(req.query));
            res.send(req.query);
        });

        app.get('/static*',function (req,res) {
            res.sendFile(__dirname+'/assets/dist/'+req.url);
        })
        // 延迟加载处理
        app.all(apiRule,function (req,res,next) {
           var mock = parseMock()
           var pathname=url.parse(req.url).pathname
           if (mock[pathname] && mock[pathname].duration) {
               setTimeout(function () {
                 next()
               }, mock[pathname].duration)
               return
           }
           next()
        })

        app.all(apiRule,function (req,res,next) {
           var pathname=url.parse(req.url).pathname;
            if(!activeMock){
                next();
                return false;
            }
            if (activeMock === 'part') {
              var mock = parseMock()
              if (mock[pathname] && !mock[pathname].mock) {
                next()
                return
              }
            }
            var mock= getMessage()
            console.log(mock);
            if(mock[pathname]){
                var mes=mock[pathname];
            }else{
                if(nowHost){
                    next();
                    return false;
                }
                var mes={info:'这个接口没有定意'};
            }
            res.send(mes);
        });
        app.all(apiRule,function (req,res,next) {
            proxy.web(req, res, { target:nowHost });
        });
        next();
        return this;
    }
}
