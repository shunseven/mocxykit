const fs=require('fs');
const path=require('path');
const url=require('url');
const {parseUrlToName, getRequestData} = require('../util/fun')
const Epm = require('./epm')
const {getMockCode, setMockStatus, setMockCode, deleteMock} = require('./codeFun')

module.exports = function  (app, option) {
  var apiRule=option&&option.apiRule?option.apiRule:'/*';
  return function (req,res,next) {
    if (option.disabled && option.disabled.includes('code')) {
      next()
      return
    }
    app.get('/proxy-api/get/mockCode',function (req,res,next) {
      // var data=JSON.parse(req.query.data);
      var mockCode=getMockCode();
      res.send(mockCode);
    });


    app.post('/proxy-api/set/mockCode',function(req,res,next){
      if (option.disabled && option.disabled.includes('setCode')) {
        next()
        return
      }
      let body = ''
      req.on('data', function (data) {
        body += data
      } )
      req.on('end', function () {
        res.send(setMockCode(JSON.parse(body.toString())));
      })
    });

    app.post('/proxy-api/set/mockCodeStatus',function(req,res,next){
      let body = ''
      req.on('data', function (data) {
        body += data
      } )
      req.on('end', function () {
        res.send(setMockStatus(JSON.parse(body.toString())));
      })
    });



    app.get('/proxy-api/delete/mockCode',function(req,res,next){
      res.send(deleteMock(req.query));
    });

    app.all(apiRule,function (req,res,next) {
      const mockCode = getMockCode()
      const pathname=parseUrlToName(url.parse(req.url).pathname)
      if(mockCode[pathname] && mockCode[pathname].code && mockCode[pathname].mock) {
          getRequestData(req).then(data => {
              try {
                  // emp处理
                  var mes = mockCode[pathname]
                  var epm = new Epm(req, res, next, data)
                  eval(mes.code)
                  return
              } catch (e) {
                  console.log('codeError', e)
                  res.send(e);
              }
          })
        return
      }
      next()
    });
    next()
  }
}
