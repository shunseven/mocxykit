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
        if (!Array.isArray(data.data) || (Array.isArray(data.data) && (!data.data[0] || !data.data[0].requestData) )) {
          data.data = [{
            requestData: {},
            responseData: data.data,
            name: '请求参数'
          }]
        }
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

    function setMockStatus(data) {
      var mocks=getMock();

      let checkedUrls = data.map(msg => msg.url)

      Object.keys(mocks).forEach(key => {
        if (checkedUrls.includes(mocks[key].url) && !mocks[key].mock) {
          mocks[key].mock = true
          fs.writeFileSync(`${mockPath}/${key}.json`,JSON.stringify(mocks[key], null, 2))
        } else if (!checkedUrls.includes(mocks[key].url) && mocks[key].mock){
            mocks[key].mock = false
            fs.writeFileSync(`${mockPath}/${key}.json`,JSON.stringify(mocks[key], null, 2))
        }
      })

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


    function formatMockData (data, targetData = {}, parentPath = '') {
      Object.keys(data).forEach(key => {
        if (Object.prototype.toString.call(data[key]) === '[object Object]' ) {
          targetData = formatMockData(data[key], targetData, parentPath + key)
          return
        }
        targetData[parentPath + key] = data[key]
      })

      return targetData
    }
    function getLevel (query, data) {
      let queryFormatData = formatMockData(query)
      let mockFormatData = formatMockData(data)
      if (Object.keys(mockFormatData).length === 0) {
        return 0.5
      }
      let level = Object.keys(queryFormatData).reduce((level, key) => {
        if (mockFormatData[key] !== undefined &&  mockFormatData[key] == queryFormatData[key]) {
          level++
        }
        return level
      }, 0)
      if (Object.keys(queryFormatData).length === Object.keys(mockFormatData).length && Object.keys(queryFormatData).length  === level) level++
      return level
    }

    function getMockTargetData(query, mockData) {
      let level = 0
      let targetData = mockData[0] ? mockData[0].responseData : {}
      mockData.forEach(item => {
         let newLevel = getLevel(query, item.requestData)
          console.log(item.requestData)
         if (newLevel > level) {
           level = newLevel
           targetData = item.responseData
         }
      })
      return targetData
    }

    function  getSendMockData(req, mockData) {

      let query = req.query
      let body = ''
      if (req.method.toLowerCase() === 'post' || req.method.toLowerCase() === 'put') {
        return new Promise(resolve => {
          req.on('data', function (data) {
            body += data
          } )
          req.on('end', function () {
            console.log('bodyddd', body)
            try {
              body = body ? JSON.parse(body.toString()) : {}
            } catch (e) {
              body = {}
            }
            resolve(getMockTargetData(Object.assign(query, body), mockData))
            body = null
          })
        })
      }
      return Promise.resolve(getMockTargetData(query, mockData))
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
        getSendMockData(req, mes.data).then(msg => {
          res.send(msg);
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
