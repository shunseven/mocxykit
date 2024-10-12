/**
 * Created by seven on 16/3/18.
 */

import { Express } from 'express';
import path from 'path';

module.exports=function (app: Express, option = {}) {
  const rootDir = path.resolve(__dirname, '..');
  app.set('views', rootDir + '/views');
  app.set('view engine', 'jsx');
  app.engine('jsx', require('express-react-views').createEngine({
    babel: {
      presets: ['@babel/preset-env', '@babel/preset-react'],
      plugins: [['import', { libraryName: 'antd', style: 'css' }]]
    }
  }));
  app.get('/', (req, res) => {
    res.render('index', { title: 'Hello, World!' });
  });
}

process.on('uncaughtException', function (err) {
  //打印出错误hi
  console.log(err);
  //打印出错误的调用栈方便调试
  console.log(err.stack);
});
