/**
 * Created by seven on 16/3/18.
 */
var express=require('express');
var app=express();
var proxyMock=require('./index.js');

app.use(proxyMock(app,{configPath:'/',pageEntry:[{name:'后台',href:'1111'}]}));

var http = require('http');
var server = http.createServer(app);
server.listen(3000, 'localhost', function(err) {
    if (err) throw err;
    var addr = server.address();
    console.log('Listening at http://%s:%d', addr.address, addr.port);
});
