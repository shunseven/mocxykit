const path = require('path')
module.exports = function (app, option) {
  var configPath=option&&option.configPath?option.configPath:'/config';
  var rootPath = path.join(__dirname,'../../')
  return function () {
    app.get('/favicon.ico',function (req,res, next) {
      res.send(null);
    })

    app.get(configPath, function(req, res) {
      res.sendFile(rootPath + '/assets/dist/index.html')
    });

    // if (req.url === configPath) {
    //   res.type('.html');
    //   res.send(fs.readFileSync(rootPath + '/assets/dist/index.html'))
    //   return
    // }

    app.get('/proxy-api/page/entry',function (req,res) {
      if(option.pageEntry){
        res.send(option.pageEntry)
      }else{
        res.send(null);
      }
    });

    app.get('/eptStatic*',function (req,res) {
      res.sendFile(rootPath+'/assets/dist/'+req.url);
    })
  }
}
