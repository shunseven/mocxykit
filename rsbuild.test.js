import { defineConfig } from '@rsbuild/core';
import { rsbuildProxyMockPlugin } from './main/index';

export default defineConfig({
  source: {
    entry: {
      index: './test/index.js', // 指定测试入口文件
    },
    root: './test', // 指定测试目录
  },
  // 不使用默认入口查找规则
  tools: {
    rspack: {
      resolve: {
        mainFiles: ['index'],
      },
    },
  },
  dev: {
    
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
