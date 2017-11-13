/**
 * Created by seven on 16/3/18.
 */

var mockApp = require('./src/mock/index')
const proxyApp = require('./src/proxy/index')
const staticApp = require('./src/static/index')
module.exports=function (app,option) {
    app.use(staticApp(app, option))
    app.use(mockApp(app, option))
    app.use(proxyApp(app, option))
}
