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
            template: './test/index.html',
            inject: 'head'  // 确保脚本注入到 head 中
        }),
        new DefinePlugin({
            'process.env': JSON.stringify({
                NODE_ENV: 'development',
                BASE_URL: 'http://localhost:3000'
            }),
            '__PROXY_MOCK_CONFIG__': JSON.stringify({
                apiRule: '/api/*',
                configPath: '/config',
                lang: 'en'
            })
        }),
        new WebpackProxyMockPlugin({
            lang: 'en',
        }),
    ]
};
