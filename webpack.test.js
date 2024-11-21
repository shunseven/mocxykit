const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { WebpackProxyMockPlugin } = require('./serverDist/index.js');
const { DefinePlugin } = require('webpack');

module.exports = {
    mode: 'development',
    entry: './test/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'test')
        },
        port: 3000,
    },
    plugins: [
      
        new HtmlWebpackPlugin({
            template: './test/index.html'
        }),
        new DefinePlugin({
            'process.env': JSON.stringify({
                NODE_ENV: 'development',
                BASE_URL: 'http://localhost:3000'
            })  // 添加初始化的process.env对象
        }),
        new WebpackProxyMockPlugin({
            lang: 'en',
        }),
    ]
};
