<template>
  <div>
    <props></props>
    <mock></mock>
  </div>
</template>

<script>
  import Props from './components/props.vue'
  import Mock from './components/mock.vue'

  export default {
    components: {
      Props,
      Mock
    }
  }
</script>

<style>
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
