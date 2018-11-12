const path = require('path')
module.exports = function (app, option) {
  var configPath=option&&option.configPath?option.configPath:'/config';
  var rootPath = path.join(__dirname,'../../')
  return function (req, res, next) {
    app.get('/favicon.ico',function (req,res, next) {
      res.send(null);
    })

    app.get(configPath, function(req, res) {
      res.sendFile(rootPath + '/assets/dist/index.html')
    });
    app.get('/proxy-api/page/entry',function (req,res) {
      if(option.pageEntry){
        res.send(option.pageEntry)
      }else{
        res.send(null);
      }
    });

    app.get('/static*',function (req,res) {
      res.sendFile(rootPath+'/assets/dist/'+req.url);
    })
    next ()
  }
}
