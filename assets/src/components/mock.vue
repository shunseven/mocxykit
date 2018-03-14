<template>
  <div class="mock-box">
    <h4 class="text-success">
      mock
      <el-button @click="setActiveMock('')" type="success" size="mini">关闭mock</el-button>
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
        <el-button type="primary"  @click="createMock">添加api</el-button>
      </div>
      <!-- Table -->
      <el-table
        :data="mocks"
        tooltip-effect="dark"
        style="width: 100%"
        row-key="url"
        ref="multipleTable"
        @select-all ="changeItemMock"
        @select="changeItemMock">
        <el-table-column
          v-if="active=='part'"
          :reserve-selection="true"
          type="selection"
          width="55">
        </el-table-column>
        <el-table-column
          label="url">
          <template slot-scope="scope">
            {{scope.row.name}}({{scope.row.url}})
          </template>
        </el-table-column>
        <el-table-column
          label="操作">
          <template slot-scope="scope">
            <el-button @click="setMock(scope.row)"  type="text">
              编辑
            </el-button>
            <el-button @click="deleteMock(scope.row)" type="text">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <mock-modal :data="activeData" :visible.sync="mockModalVisible" :onSuccess="setMockSuccess"></mock-modal>
  </div>
</template>

<script>
  import mockModal from './mockModal.vue'
  export default {
    components: {
      mockModal
    },
    data(){
      return {
        mocks: [],
        active: '',
        mockModalVisible: false,
        activeData: {}
      }
    },
    created () {
      this.$http.get('/proxy-api/get/mock').then((mes) => {
        this.mocks = this.parseMock(mes.data)
        this.mocks.forEach(row => {
          if (row.mock) {
            this.$refs.multipleTable.toggleRowSelection(row)
          }
        })
      })
      this.$http.get('/proxy-api/get/activemock').then(function (mes) {
        this.active = mes.data.mock
        this.setActiveMock(mes.data.mock);
      })
    },
    methods: {
      setMockSuccess (data) {
        this.mocks = this.parseMock(data)
      },
      parseMock (data) {
        return Object.keys(data).map(key => data[key])
      },
      changeItemMock (data) {
        this.$http.post('/proxy-api/set/mockStatus', data).then(function (mes) {
          this.mocks = this.parseMock(mes.data)
        });
      },
      deleteMock(data){
        if (!confirm('是否删除这个mock')) return false;
        this.$http.get('/proxy-api/delete/mock', {params: data}).then(function (mes) {
          this.mocks = this.parseMock(mes.data)
        });
      },
      createMock () {
        this.activeData = {
          data: {}
        }
        this.mockModalVisible = true
      },
      setMock(data){
        console.log('active', data)
        this.activeData = data
        this.mockModalVisible = true
      },
      setActiveMock(mock){
        this.$http.get('/proxy-api/set/activemock', {params: {mock: mock}}).then(function (mes) {
          this.active = mes.data.mock
        });
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
  .text-success {
    color: #3c763d;
  }
</style>
