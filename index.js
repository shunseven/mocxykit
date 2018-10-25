/**
 * Created by seven on 16/3/18.
 */

var mockApp = require('./src/mock/index')
const proxyApp = require('./src/proxy/index')
const staticApp = require('./src/static/index')
const itemProxyApp = require('./src/itemProxy/index')
module.exports=function (app,option) {
    app.use(staticApp(app, option))
    app.use(mockApp(app, option))
    app.use(itemProxyApp(app, option))
    app.use(proxyApp(app, option))
}

process.on('uncaughtException', function (err) {
  //打印出错误
  console.log(err);
  //打印出错误的调用栈方便调试
  console.log(err.stack);
});
