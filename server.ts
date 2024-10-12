/**
 * Created by seven on 16/3/18.
 */
var express=require('express');
var app=express();
var proxyMock=require('./src/index');
proxyMock(app,{configPath:'/', disabled: ['setCode']})

var http = require('http');
var server = http.createServer(app);
server.listen(3008, '0.0.0.0', function(err: any) {
    if (err) throw err;
    var addr = server.address();
    console.log('Listening at http://%s:%d', addr.address, addr.port);
});

module.exports = app
process.on('uncaughtException', function (err: any) {
    //打印出错误
    console.log(err);
    //打印出错误的调用栈方便调试
    console.log(err.stack);
});
