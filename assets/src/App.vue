<template>
  <el-tabs v-model="activeType">
    <el-tab-pane label="全局代理" name="proxy"> <Proxy></Proxy></el-tab-pane>
    <el-tab-pane label="单独代理" name="itemProxy"><item-proxy></item-proxy></el-tab-pane>
    <el-tab-pane label="mock数据" name="mock">  <mock></mock></el-tab-pane>
    <el-tab-pane label="代码片段" name="code"> <mock-code></mock-code></el-tab-pane>
  </el-tabs>
</template>

<script>
  import Proxy from './components/proxy/proxy.vue'
  import Mock from './components/mock/mock.vue'
  import MockCode from './components/code/mockCode.vue'
  import ItemProxy from './components/proxy/itemProxy'
  export default {
    components: {
      Proxy,
      Mock,
      ItemProxy,
      MockCode
    },
    data () {
      return {
        activeType: 'proxy'
      }
    }
  }
</script>

<style scoped>
  h1 {
    font-size: 22px;
  }
  body{
    padding:0 20px;
  }
  h4{
    margin-top:20px;
    margin-bottom: 10px;
  }
  p{
    padding: 5px;
  }
  .fr{
    float: right;
  }
  .m-r-10{
    margin-right: 10px;
  }
  .m-l-10{
    margin-left: 10px;
  }
</style>
