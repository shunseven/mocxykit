/**
 * Created by seven on 16/3/18.
 */

var mockApp = require('./src/mock/index')
const proxyApp = require('./src/proxy/index')
const staticApp = require('./src/static/index')
const itemProxyApp = require('./src/itemProxy/index')
const mockCodeApp = require('./src/code/index')
const commonApp = require('./src/common/index')
module.exports=function (app,option = {}) {
    commonApp(app, option)()
    staticApp(app, option)()
    mockCodeApp(app, option)()
    mockApp(app, option)()
    itemProxyApp(app, option)()
    proxyApp(app, option)()
}

process.on('uncaughtException', function (err) {
  //打印出错误
  console.log(err);
  //打印出错误的调用栈方便调试
  console.log(err.stack);
});
