"use strict";
/**
 * Created by seven on 16/3/18.
 */
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function (app, option = {}) {
    app.set('views',  + '../views');
    app.set('view engine', 'jsx');
    app.engine('jsx', require('express-react-views').createEngine());
    app.get('/', (req, res) => {
        res.render('index', { title: 'Hello, World!' });
    });
};
process.on('uncaughtException', function (err) {
    //打印出错误hi
    console.log(err);
    //打印出错误的调用栈方便调试
    console.log(err.stack);
});
