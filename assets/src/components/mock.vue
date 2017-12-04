<template>
  <div>
  <div class="mock-box">
    <h4 class="text-success">
      mock
      <input @click="setActiveMock('')" type="button" class="btn btn-success btn-xs m-l-10" value="关闭mock"/>
    </h4>
    <div class="mock cLi">
      <span v-bind:class="{active:active=='local'}">✔</span>
      <a @click="setActiveMock('local')" href="javascript:void(0)" class="mockChange changeHost">本地全部mock</a>
    </div>
    <div class="mock cLi">
      <span v-bind:class="{active:active=='part'}">✔</span>
      <a @click="setActiveMock('part')" href="javascript:void(0)" class="mockChange changeHost">本地部分mock</a>
    </div>
    <ul class="public-mock">

    </ul>
    <div class="panel panel-default">
      <!-- Default panel contents -->
      <div class="panel-heading">
        <button type="button" class="btn btn-primary add-mock" data-toggle="modal" data-target=".bs-example-modal-lg">添加api</button>
      </div>
      <!-- Table -->
      <table class="table table-hover">
        <tr v-for="item in mocks">
          <td class="part-checkbox">
            <input @change="changeItemMock(item)" v-model="item.mock" v-if="active=='part'" type="checkbox">
          </td>
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
            <form class="form-horizontal edit-box">
              <div class="form-group edit-input">
                <label for="mock-name" class="control-label col-sm-2">name:</label>
                <div class="col-sm-10">
                  <input type="text" class="form-control" v-model="name" id="mock-name">
                </div>
              </div>
              <div class="form-group edit-input">
                <label for="mock-url" class="control-label col-sm-2">url:</label>
                <div class="col-sm-10">
                  <input type="text" class="form-control" v-model="url" id="mock-url">
                </div>
              </div>
              <div>
                <a href="javascript:void(0)" @click="moreOption = true">更多设置</a>
              </div>
              <template v-if="moreOption || n">
                <div class="form-group">
                  <label for="mock-url" class="control-label">url:</label>
                  <input type="text" class="form-control" v-model="url" id="mock-url">
                </div>
              </template>

              <div class="form-group edit-input">
                <label for="mock-url" class="control-label col-sm-2">duration:</label>
                <div class="col-sm-10">
                  <div class="input-group">
                    <input type="text" class="form-control" v-model="duration" id="mock-url">
                    <div class="input-group-addon">ms</div>
                  </div>

                </div>
              </div>
              <div class="form-group edit-editor">
                <label  class="control-label col-sm-2">data:</label>
                <div class="col-sm-10">
                  <json-editor ref="jsonEditor" :onError="onError" :onChange="onChange" :json="data"></json-editor>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" @click="initMockData" class="btn btn-default" data-dismiss="modal">关闭</button>
            <button type="button" @click="saveMock"  class="btn btn-primary save-mock">保存</button>
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
            active:'',
            duration: '',
            moreOption: false
          }
      },
      created () {
        this.$http.get('/proxy-api/get/mock').then( (mes) => {
          this.mocks = mes.data
        })
        this.$http.get('/proxy-api/get/activemock').then(function (mes) {
          this.active = mes.data.mock
          this.setActiveMock(mes.data.mock);
        })
      },
      methods:{
        changeItemMock (item) {
          this.postMock(item)
        },
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
         postMock (data) {
           this.$http.post('/proxy-api/set/mock',data).then(function (mes) {
             this.mocks=mes.data;
             this.initMockData()
             $('#mock-modal').modal('hide')
           });
         },
         saveMock(){
            let {url,data,name,id, duration}=this;
            let setData={url,
              data,
              name,
              id,
              duration};
            this.postMock(setData)
          },
          deleteMock(data){
              if(!confirm('是否删除这个mock')) return false;
              this.$http.get('/proxy-api/delete/mock',{params: data}).then(function (mes) {
                this.mocks=mes.data;
              });
          },
          setMock(data){
              this.url=data.url;
              this.name=data.name;
              this.data=data.data;
              this.id=data.id;
              this.duration = data.duration
              console.log(this.$refs.jsonEditor)
              this.setEditor()
          },
          setActiveMock(mock){
            this.$http.get('/proxy-api/set/activemock',{params: {mock:mock}}).then(function (mes) {
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
  .modal.in .modal-dialog {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: 0;
  }
  .modal .modal-content {
    height: 100%;
  }
  .modal .modal-body{
    height: 88%;
  }
  .edit-box {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .edit-editor {
    flex: 1;
  }
  .edit-editor .col-sm-10 {
    position: relative;
    height: 100%;
  }
  .jsoneditor-box {
    position: absolute;
    top:0;
    bottom: 0;
    left: 0;
    right: 0;
  }
  .part-checkbox {
    text-align: center;
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
  .mock{
    color:#468847;
    padding-left: 40px;
  }
  .mock a{
    color:#3c763d;
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
  .table-hover tr:hover{
    background: wheat;
  }
</style>
