<template>
  <div>
    <el-form required style="margin-top: 10px" :inline="true" class="demo-form-inline">
      <el-form-item required label="url">
        <el-input v-model="proxyData.url" placeholder="要代理的url"></el-input>
      </el-form-item>
      <el-form-item required label="代理地址">
        <el-input v-model="proxyData.target" placeholder="http://localhost:7000"></el-input>
      </el-form-item>
      <el-form-item >
        <el-checkbox v-model="proxyData.ignorePath">不代理path</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="addProxy">添加</el-button>
      </el-form-item>
    </el-form>
    <el-table
      ref="multipleTable"
      :data="tableData"
      tooltip-effect="dark"
      style="width: 100%"
      @select="handleSelectionChange"
      @select-all="handleSelectionChange"
    >
      <el-table-column
        type="selection"
        width="55">
      </el-table-column>
      <el-table-column
        prop="url"
        label="url"
        width="400"
      >
      </el-table-column>
      <el-table-column
        prop="target"
        label="代理地址"
      >
      </el-table-column>
      <el-table-column
        prop="target"
        label="是否代理path"
      >
        <template slot-scope="scope">
          {{scope.row.ignorePath ? '否' : '是'}}
        </template>
      </el-table-column>
      <el-table-column
        label="操作">
        <template slot-scope="scope">
          <el-button @click="deleteProxy(scope.$index)" type="text">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
import cloneDeep from 'lodash/cloneDeep'
export default {
  data() {
    return {
      proxyData: {
        url: '',
        target: '',
        hasProxy: true,
        ignorePath: false
      },
      proxyDataAry: [],
      tableData: [],
      multipleSelection: []
    }
  },
  created () {
    this.getProxy()
  },
  methods: {
    getProxy () {
      this.$http.get('/proxy-api/get/itemProxy').then((mes) => {
        this.proxyDataAry = mes.data
        this.tableData = mes.data
        this.initMultipleSelection()
      });
    },
    setProxy () {
      this.$http.post('/proxy-api/set/itemProxy', this.proxyDataAry).then((mes) => {
        this.proxyDataAry = mes.data
        this.tableData = mes.data
        this.initMultipleSelection()
      });
    },
    addProxy () {
      const proxyData = cloneDeep(this.proxyData)
      this.proxyDataAry.push(proxyData)
      this.setProxy()
    },
    initMultipleSelection () {
      this.tableData.forEach(item => {
        if (item.hasProxy) {
          setTimeout(() => {
            this.$refs.multipleTable.toggleRowSelection(item, true)
          })
        }
      })
    },

    handleSelectionChange(val) {
      console.log(val)
      this.proxyDataAry.forEach(item => item.hasProxy = false)
      val.forEach(item => item.hasProxy = true)
      this.setProxy()
    },
    deleteProxy (index) {
      this.proxyDataAry.splice(index, 1)
      this.setProxy()
    }
  }
}
</script>
<style scoped>

</style>
