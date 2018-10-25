<template>
  <div>
    <h1>全局代理</h1>
    <Proxy></Proxy>
    <h2>单独代理</h2>
    <item-proxy></item-proxy>
    <h1>mock数据</h1>
    <mock></mock>
  </div>
</template>

<script>
  import Proxy from './components/proxy.vue'
  import Mock from './components/mock.vue'
  import ItemProxy from './components/itemProxy'
  export default {
    components: {
      Proxy,
      Mock,
      ItemProxy
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
