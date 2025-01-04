import { defineConfig } from 'vite'
import { ViteProxyMockPlugin } from './main/index'

export default defineConfig({
  root: './test', // 指定测试目录
  plugins: [
    ViteProxyMockPlugin({
      lang: 'en',
      debug: true, // 开启调试模式
    })
  ],
  server: {
    port: 3200,
    open: '/index.html', // 自动打开测试页面
  },
  define: {
    'process.env': {
      NODE_ENV: 'development-vite',
      BASE_URL: 'http://localhost:3200',
      TEST_MODE: true // 添加测试标识
    }
  },
  build: {
    outDir: '../test-dist', // 测试构建输出目录
    minify: false // 不压缩，方便调试
  }
})
