import { defineConfig } from 'vite'
import { ViteProxyMockPlugin } from './main/index'

export default defineConfig({
  root: './test', // 指定测试目录
  plugins: [
    ViteProxyMockPlugin({
      lang: 'zh',
      debug: true, // 开启调试模式
    })
  ],
  server: {
    port: 3200,
    open: '/vite.html', // 修改为直接指向 vite.html
  },
  define: {
    // 确保环境变量能被客户端代码访问
    __ENV__: JSON.stringify({
      NODE_ENV: 'development-vite',
      BASE_URL: 'http://localhost:3200',
      TEST_MODE: true,
      VITE_APP_BASE_API: '/api'
    })
  },
  build: {
    outDir: '../test-dist', // 测试构建输出目录
    minify: false // 不压缩，方便调试
  }
})
