<template>
  <div>
    <h4 class="text-success">
      切换proxy
      <input @click="selectHost({host:'',port:'',id:'',name:''})" type="button" class="btn btn-success btn-xs m-l-10" value="关闭proxy"/>
    </h4>
    <p class="bg-warning"><strong>当前proxy:</strong><span class='now-host'>{{active.host}}:{{active.port}}({{active.name}})</span></p>
    <div class="form-inline ip-form">
      <div class="form-group ip-form">
        <label for="name">Name</label>
        <input type="text" name="name" v-model="name" class="form-control" id="name" placeholder="测试">
      </div>
      <div class="form-group">
        <label for="host">host</label>
        <input type="text" name="host" v-model="host" required class="form-control" id="host" placeholder="localhost">
      </div>
      <div class="form-group">
        <label for="port">port</label>
        <input value="80" name="port" v-model="port" required type="number" class="form-control" id="port" placeholder="80">
      </div>
      <button type="buttom" @click="changeHost" class="btn btn-default">新建并切换</button>
      <ul class='host-list'>
        <li class="cLi" v-for="item in hosts">
          <span  v-bind:class="{'active':item.host==active.host&&item.port==active.port&&item.name==active.name}" class="checked">✔</span>
          <a @click="selectHost(item)" href="javascript:void(0)">{{item.host}}:{{item.port}}({{item.name}})</a>
          <button type="button" @click="deleteHost(item)" class="delete-proxy"><span>&times;</span></button>
        </li>
      </ul>
    </div>
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
  .host-list{
    margin-top: 10px;
  }
  .cLi{
    margin-bottom: 5px;
    font-size: 16px;
    list-style-type: none;
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
    margin-bottom: 5px;
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
