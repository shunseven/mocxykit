var fs=require('fs');
var path=require('path');
var url=require('url');
var {parseUrlToName} = require('../util/fun')
var epm = require('./epm')
const codePath = './mockCode'

module.exports = function  (app, option) {
  var apiRule=option&&option.apiRule?option.apiRule:'/*';
  return function (req,res,next) {

    function getMockCode() {
      const mockCode = {}
      if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
      }
      const files=fs.readdirSync(codePath);
      if (files.length < 1) return mockCode
      files.forEach(filePath => {
        let data = fs.readFileSync(`${codePath}/${filePath}`)
        data = JSON.parse(data)
        const name = parseUrlToName(data.url)
        mockCode[name] = data
      })
      return mockCode;
    }

    function setMock(data) {
      var mocksCode=getMockCode();

      if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
      }
      const name = parseUrlToName(data.url)
      mocksCode[name] = data
      fs.writeFileSync(`${codePath}/${name}.json`,JSON.stringify(data, null, 2));
      return mocksCode;
    }

    function setMockStatus(data) {
      var mocksCode=getMockCode();

      let checkedUrls = data.map(msg => msg.url)

      Object.keys(mocksCode).forEach(key => {
        if (checkedUrls.includes(mocksCode[key].url) && !mocksCode[key].mock) {
          mocksCode[key].mock = true
          fs.writeFileSync(`${codePath}/${key}.json`,JSON.stringify(mocksCode[key], null, 2))
        } else if (!checkedUrls.includes(mocksCode[key].url) && mocksCode[key].mocksCode){
          mocksCode[key].mock = false
            fs.writeFileSync(`${codePath}/${key}.json`,JSON.stringify(mocksCode[key], null, 2))
        }
      })

      return mocksCode;
    }


    function deleteMock(data) {
      let name = parseUrlToName(data.url)
      var mocksCode=getMockCode();
      fs.unlinkSync(`${codePath}/${name}.json`)
      delete mocksCode[name]
      return mocksCode;
    }


    app.get('/proxy-api/get/mockCode',function (req,res,next) {
      // var data=JSON.parse(req.query.data);
      var mockCode=getMockCode();
      res.send(mockCode);
    });


    app.post('/proxy-api/set/mockCode',function(req,res,next){
      let body = ''
      req.on('data', function (data) {
        body += data
      } )
      req.on('end', function () {
        res.send(setMock(JSON.parse(body.toString())));
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
      if(mockCode[pathname] && mockCode[pathname].code) {
        var mes = mockCode[pathname];
        try {
          // emp处理
          emp = epm
          epm.send = function (...ary) {
            res.send(...ary)
          }
          // 跳过处理
          epm.next = function () {
            next()
          }
          eval(mes.code)
          return
        } catch (e) {
          console.log('codeError', e)
          res.send(e);
          return
        }
        return
      }
      next()
    });
    next()
  }
}
