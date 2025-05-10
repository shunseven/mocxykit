import { defineConfig } from '@rsbuild/core';
import { rsbuildProxyMockPlugin } from './main/index';

export default defineConfig({
  source: {
    entry: {
      index: './test/index.js', // 指定测试入口文件
    },
    root: './test', // 指定测试目录
     define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.env.TEST_ENV': JSON.stringify('rsbuild-test')
      },
  },
  // 不使用默认入口查找规则
  tools: {
    rspack: {
      resolve: {
        mainFiles: ['index'],
      },
      // 预先配置一些基本环境变量，这些会被动态环境变量覆
    },
  },
  dev: {
    // 启用热更新，帮助环境变量动态更新
    hmr: true,
  },
  server:{
    port: 3300,
    open: true, // 自动打开浏览器
  },
  html: {
    template: './test/rsbuild.html', // 使用特定的HTML模板
  },
  output: {
    distPath: {
      root: './test-rsbuild-dist', // 测试构建输出目录
    },
    minify: false, // 不压缩，方便调试
  },
  plugins: [
    rsbuildProxyMockPlugin({
      lang: 'zh',
      buttonPosition: 'bottom', // 开启调试模式
    }),
  ],
});
