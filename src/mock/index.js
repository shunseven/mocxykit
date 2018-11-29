var fs=require('fs');
var url=require('url');
var {parseUrlToName} = require('../util/fun')
var {setMock, getMock, setMockStatus, deleteMock, getActiveMock, getSendMockData} = require('./mockFun')
const mockjs = require('mockjs')

module.exports = function  (app, option) {
  var apiRule=option&&option.apiRule?option.apiRule:'/*';
  return function (req,res,next) {
    if (option.disabled && option.disabled.includes('mock')) {
      next()
      return
    }
    var activeMock=getActiveMock().mock;

    app.get('/proxy-api/get/mock',function (req,res,next) {
      // var data=JSON.parse(req.query.data);
      var mock=getMock();
      res.send(mock);
    });


    app.post('/proxy-api/set/mock',function(req,res,next){
      let body = ''
      req.on('data', function (data) {
        body += data
      } )
      req.on('end', function () {
        res.send(setMock(JSON.parse(body.toString())));
      })
    });

    app.post('/proxy-api/set/mockStatus',function(req,res,next){
      let body = ''
      req.on('data', function (data) {
        body += data
      } )
      req.on('end', function () {
        res.send(setMockStatus(JSON.parse(body.toString())));
      })
    });



    app.get('/proxy-api/delete/mock',function(req,res,next){
      res.send(deleteMock(req.query));
    });

    app.get('/proxy-api/get/activemock',function (req,res,next) {
      res.send(getActiveMock());
    });

    app.get('/proxy-api/set/activemock',function (req,res) {
      activeMock=req.query.mock;
      fs.writeFileSync('./activemock.json',JSON.stringify(req.query));
      res.send(req.query);
    });

    // 延迟加载处理
    app.all(apiRule,function (req,res,next) {
      var mock = getMock()
      var pathname=parseUrlToName(url.parse(req.url).pathname)
      if (mock[pathname] && mock[pathname].duration) {
        setTimeout(function () {
          next()
        }, mock[pathname].duration)
        return
      }
      next()
    })

    app.all(apiRule,function (req,res,next) {
      const mock = getMock()
      const pathname=parseUrlToName(url.parse(req.url).pathname)
      if(!activeMock){
        next();
        return false;
      }
      if (activeMock === 'part') {
        if (mock[pathname] && !mock[pathname].mock) {
          next()
          return
        }
      }
      if(mock[pathname]) {
        var mes = mock[pathname];
        getSendMockData(req, mes.data).then(msg => {
          res.send(mockjs.mock(msg));
        })
        return
      } else if(req.originalUrl.indexOf('proxy-api') !== -1) {
        next()
        return false;
      }else if (activeMock === 'part') {
        next();
        return
      }
      next()
    });
    next()
  }
}
