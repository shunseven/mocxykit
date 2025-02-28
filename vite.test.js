import { defineConfig } from 'vite'
import { viteProxyMockPlugin } from './main/index'

export default defineConfig({
  root: './test', // 指定测试目录
  plugins: [
    viteProxyMockPlugin({
      lang: 'zh',
      buttonPosition: 'bottom', // 开启调试模式
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 3200,
    open: '/vite.html', // 修改为直接指向 vite.html
  },
  build: {
    outDir: '../test-dist', // 测试构建输出目录
    minify: false // 不压缩，方便调试
  }
})
