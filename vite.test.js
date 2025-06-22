import { defineConfig } from 'vite'
import { viteProxyMockPlugin } from './main/index'

export default defineConfig({
  root: './test', // 指定测试目录
  plugins: [
     // 新增 test-plugin
    {
      name: 'test-plugin',
      configureServer() {
        console.log('[test-plugin] loaded')
      }
    },
    viteProxyMockPlugin({
      lang: 'zh',
      buttonPosition: 'bottom', // 开启调试模式
    }),
   
  ],
  server: {
    port: 3200,
    open: '/vite.html', // 修改为直接指向 vite.html
  },
  build: {
    outDir: '../test-dist', // 测试构建输出目录
    minify: false // 不压缩，方便调试
  }
})
