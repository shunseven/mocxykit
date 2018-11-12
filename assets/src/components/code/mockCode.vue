<template>
  <div class="mock-box">
    <el-alert
      class="info"
      title="通过提供epm的sdk, 可以对mock数据增删改查，简单的模拟业务场景"
      type="info"
      :closable="false"
    >
    </el-alert>
    <div class="panel panel-default">
      <!-- Default panel contents -->
      <div class="panel-heading">
        <el-button type="waring"  @click="createMockCode">添加代码段11</el-button>
      </div>
      <!-- Table -->
      <el-table
        :data="mocks"
        tooltip-effect="dark"
        style="width: 100%"
        row-key="url"
        ref="multipleTable"
        @select-all ="changeItemMockCode"
        @select="changeItemMockCode">
        <el-table-column
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
            <el-button @click="setMockCode(scope.row)"  type="text">
              编辑
            </el-button>
            <el-button @click="deleteMockCode(scope.row)" type="text">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <mock-code-modal :data="activeData" :visible.sync="mockModalVisible" :onSuccess="onSetCode"></mock-code-modal>
  </div>
</template>

<script>
  import mockCodeModal from './mockCodeModal.vue'
  export default {
    components: {
      mockCodeModal
    },
    data(){
      return {
        mocks: [],
        active: '',
        mockModalVisible: false,
        activeData: {}
      }
    },
    mounted () {
      this.$http.get('/proxy-api/get/mockCode').then((mes) => {
        this.mocks = this.parseMock(mes.data)
        this.mocks.forEach(row => {
          if (row.mock) {
            this.$refs.multipleTable.toggleRowSelection(row)
          }
        })
      })
    },
    methods: {
      onSetCode (data) {
        this.mocks = this.parseMock(data)
      },
      parseMock (data) {
        return Object.keys(data).map(key => data[key])
      },
      changeItemMockCode (data) {
        this.$http.post('/proxy-api/set/mockCodeStatus', data).then(function (mes) {
          this.mocks = this.parseMock(mes.data)
        });
      },
      deleteMockCode(data){
        if (!confirm('是否删除这个mock')) return false;
        this.$http.get('/proxy-api/delete/mockCode', {params: data}).then(function (mes) {
          this.mocks = this.parseMock(mes.data)
        });
      },
      createMockCode () {
        this.activeData = {
          data: []
        }
        this.mockModalVisible = true
      },
      setMockCode(data){
        this.activeData = JSON.parse(JSON.stringify(data))
        this.mockModalVisible = true
      },
    }
  }
</script>
<style  scoped>
  .info {
    margin-bottom: 10px;
  }
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
  .public-mock a{
    color: forestgreen;
  }
  .table-hover tr:hover{
    background: wheat;
  }
</style>
