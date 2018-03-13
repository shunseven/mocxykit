<template>
  <div>
    <h4 class="text-success">
      切换proxy
      <el-button @click="selectHost({host:'',port:'',id:'',name:''})" type="success" size="mini">关闭proxy</el-button>
    </h4>
    <el-alert
      :title="`当前proxy:${active.host}:${active.port}(${active.name})`"
      type="warning"
      :closable="false">
    </el-alert>
    <el-form style="margin-top: 10px" :inline="true" class="demo-form-inline">
      <el-form-item label="Name">
        <el-input v-model="name" placeholder="测试"></el-input>
      </el-form-item>
      <el-form-item required label="host">
        <el-input v-model="host" placeholder="localhost"></el-input>
      </el-form-item>
      <el-form-item required label="port">
        <el-input v-model.num="port"  placeholder="80"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="changeHost">新建并切换</el-button>
      </el-form-item>
    </el-form>
      <ul class='host-list'>
        <li class="cLi" v-for="item in hosts">
          <span  v-bind:class="{'active':item.host==active.host&&item.port==active.port&&item.name==active.name}" class="checked">✔</span>
          <el-button size="medium" @click="selectHost(item)" type="text">
            {{item.host}}:{{item.port}}({{item.name}})
          </el-button>
          <button type="button" @click="deleteHost(item)" class="delete-proxy"><span>&times;</span></button>
        </li>
      </ul>
  </div>
</template>

<script>
export default {
  data () {
    return {
      host:'',
      port:'',
      name:'',
      hosts:[],
      active:{}
    }
  },
  created () {
    this.$http.get("/proxy-api/get/host").then((mes) => {
      this.active = mes.data
      this.selectHost(mes.data);
    })
    this.$http.get("/proxy-api/get/proxies").then((mes) => {
      this.hosts = mes.data
    })
  },
  methods:{
    changeHost(){
       let {host,port,name} =this;
       let proxy={host,port,name};
      this.$http.get('/proxy-api/change/host',{params: proxy}).then(function () {
            this.host='';
            this.name='';
            this.port='';
            this.hosts.push(proxy);
            this.active=proxy;
        });
    },
    selectHost(proxy){
      this.$http.get('/proxy-api/change/host',{params: proxy}).then(function () {
        this.active=proxy;
      });
    },
    deleteHost(data){
      this.$http.get('/proxy-api/delete/host',{params: data}).then(function (mes) {
        this.hosts=mes.data;
      });
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .text-success {
    color: #3c763d;
  }
  .host-list{
    margin-top: 10px;
  }
  .delete-proxy{
    float: none;
    margin-left: 0px;
    transform: translateY(-5px);
    border: none;
    background: #fff;
    font-size: 20px;
    color: #B1B0B0;
  }
  .cLi{
    font-size: 16px;
    list-style-type: none;
  }
  .checked{
    display: inline-block;
    width: 15px;
    color:#468847;
    opacity: 0;
  }
  .active{
    opacity: 1;
  }
</style>
