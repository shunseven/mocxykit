var fs=require('fs');
var path=require('path');
var url=require('url');
const mockPath = './mockData'
module.exports = function  (app, option) {
  var apiRule=option&&option.apiRule?option.apiRule:'/*';
  return function (req,res,next) {
    var activeMock=getActiveMock().mock;

    function firstUpperCase(str) {
      return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
    }

    function parseUrlToName (url) {
      return url.split('/').map(item => firstUpperCase(item)).join('')
    }

    function getMock() {
      const mock = {}
      if (!fs.existsSync(mockPath)) {
        fs.mkdirSync(mockPath);
      }
      const files=fs.readdirSync(mockPath);
      if (files.length < 1) return mock
      files.forEach(filePath => {
        let data = fs.readFileSync(`${mockPath}/${filePath}`)
        data = JSON.parse(data)
        const name = parseUrlToName(data.url)
        mock[name] = data
      })
      return mock;
    }

    function setMock(data) {
      var mocks=getMock();

      if (!fs.existsSync(mockPath)) {
        fs.mkdirSync(mockPath);
      }
      const name = parseUrlToName(data.url)
      mocks[name] = data
      fs.writeFileSync(`${mockPath}/${name}.json`,JSON.stringify(data, null, 2));
      return mocks;
    }

    function deleteMock(data) {
      let name = parseUrlToName(data.url)
      var mocks=getMock();
      fs.unlinkSync(`${mockPath}/${name}.json`)
      delete mocks[name]
      return mocks;
    }

    function getActiveMock() {
      var stat=fs.existsSync('./activemock.json');
      var mock=stat?JSON.parse(fs.readFileSync('./activemock.json')):'';
      return mock;
    }
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


    app.get('/proxy-api/delete/mock',function(req,res,next){
      res.send(deleteMock(req.query));
    });

    app.get('/proxy-api/get/publicmock',function (req,res) {
      option.publicMock?res.send(option.publicMock):res.send([]);
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
      } else if(req.originalUrl.indexOf('proxy-api') !== -1) {
        next()
        return false;
      }else if (activeMock === 'part') {
        next();
        return
      }
      res.send(mes.data);
    });
    next()
  }
}