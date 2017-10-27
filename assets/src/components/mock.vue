<template>
  <div>
  <div class="mock-box">
    <h4 class="text-success">
      mock
      <input @click="setActiveMock('')" type="button" class="btn btn-success btn-xs m-l-10" value="关闭mock"/>
    </h4>
    <div class="mock cLi">
      <span v-bind:class="{active:active=='local'}">✔</span>
      <a @click="setActiveMock('local')" href="javascript:void(0)" class="mockChange changeHost">本地mock</a>
    </div>
    <ul class="public-mock">

    </ul>
    <div class="panel panel-default">
      <!-- Default panel contents -->
      <div class="panel-heading">
        <button type="button" class="btn btn-primary add-mock" data-toggle="modal" data-target=".bs-example-modal-lg">添加api</button>
      </div>
      <!-- Table -->
      <table class="table">
        <tr v-for="item in mocks">
          <td>{{item.name}}({{item.url}})</td>
          <td>
            <span @click="setMock(item)"  data-toggle="modal"  data-target=".bs-example-modal-lg" class="glyphicon mock-edit glyphicon-edit"></span>
            <span @click="deleteMock(item)" class="glyphicon glyphicon-trash delete-mock"></span>
          </td>
        </tr>
      </table>
    </div>
  </div>
  <div id="mock-modal" class="modal  fade bs-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel">
    <div class="modal-dialog modal-lg">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            <h4 class="modal-title" id="myLargeModalLabel">设置mock</h4>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-group">
                <label for="mock-name" class="control-label">name:</label>
                <input type="text" class="form-control" v-model="name" id="mock-name">
              </div>
              <div class="form-group">
                <label for="mock-url" class="control-label">url:</label>
                <input type="text" class="form-control" v-model="url" id="mock-url">
              </div>
              <div class="form-group">
                <label  class="control-label">data:</label>
                <json-editor ref="jsonEditor" :onError="onError" :onChange="onChange" :json="data"></json-editor>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" @click="initMockData" class="btn btn-default" data-dismiss="modal">Close</button>
            <button type="button" @click="saveMock"  class="btn btn-primary save-mock">Save changes</button>
          </div>
        </div><!-- /.modal-content -->
      </div>
    </div>
  </div>
  </div>
</template>

<script>
    import JsonEditor from './JsonEditor/index.vue'
   export default {
      components: {
        JsonEditor
      },
      data(){
          return {
            mocks:[],
            url:'',
            data: {},
            name:'',
            id:'',
            active:''
          }
      },
      created () {
        this.$http.get('/api/get/mock').then( (mes) => {
          this.mocks = mes.data
        })
        this.$http.get('/api/get/activemock').then(function (mes) {
          this.active = mes.data.mock
          this.setActiveMock(mes.data.mock);
        })
      },
      methods:{
        onError () {
          console.log(1111)
        },
        setEditor () {
          this.$refs.jsonEditor.editor.set(this.data)
        },
        initMockData () {
           this.url=''
           this.data= {}
           this.name=''
           this.id=''
           this.setEditor()
         },
         saveMock(){
            let {url,data,name,id}=this;
            let setData={url,
              data,
              name,
              id};
            this.$http.post('/api/set/mock',setData).then(function (mes) {
               this.mocks=mes.data;
               this.initMockData()
               $('#mock-modal').modal('hide')
            });
          },
          deleteMock(data){
              let {id}=data;
              if(!confirm('是否删除这个mock')) return false;
              this.$http.get('/api/delete/mock',{params: {id}}).then(function (mes) {
                this.mocks=mes.data;
              });
          },
          setMock(data){
              this.url=data.url;
              this.name=data.name;
              this.data=data.data;
              this.id=data.id;
              console.log(this.$refs.jsonEditor)
              this.setEditor()
          },
          setActiveMock(mock){
            this.$http.get('/api/set/activemock',{params: {mock:mock}}).then(function (mes) {
              this.active = mes.data.mock
            });
          },
          onChange (newVal) {
            console.log(newVal)
            this.data = newVal
          }
      }
   }
</script>
<style>
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
  .mock{
    color:#468847;
    padding-left: 40px;
  }
  .mock a{
    color:#B73333;
  }
  .mock span{
    opacity: 0;
    color:#468847;
  }
  .mock span.active{
    opacity: 1;
  }
  .glyphicon{
    font-size: 20px;
    color: #607fa6;
    cursor: pointer;
    margin-right: 10px;
  }
  .public-mock a{
    color: forestgreen;
  }
</style>
