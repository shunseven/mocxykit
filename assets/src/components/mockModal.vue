<template>
  <el-dialog :fullscreen="true" :modal="false" :visible.sync="currentVisible" title="设置mock" :before-close="close">
    <el-form  :model="formData" label-width="80px">
      <el-form-item label="name">
        <el-input v-model="formData.name"></el-input>
      </el-form-item>
      <el-form-item label="url" required>
        <el-input v-model="formData.url"></el-input>
      </el-form-item>
      <el-form-item label="duration" required>
        <el-input placeholder="请输入内容" v-model.number="formData.duration">
          <template slot="append">ms</template>
        </el-input>
      </el-form-item>
      <el-form-item class="jsonEditorBox" label="data" required="">
        <json-editor ref="jsonEditor" :onError="onError" :onChange="onChange" :json="formData.data"></json-editor>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
        <el-button @click="close">取 消</el-button>
        <el-button @click="saveMock" type="primary">确 定</el-button>
    </div>
  </el-dialog>
</template>
<script>
  import JsonEditor from './JsonEditor/index.vue'
  export default {
    components: {
      JsonEditor
    },
    props: {
      data: {
        type: Object
      },
      onSuccess: {
        type: Function
      },
      visible: {
        type: Boolean,
        required: true
      }
    },
    computed: {
      currentVisible: {
        get () {
          if (this.visible) {
            console.log('data', this.data)
            this.formData = this.data
            this.$nextTick(() => {
              if (this.data.data) this.setEditor()
            })
          }
          return this.visible
        },
        set (val) {
          this.$emit('update:visible', val)
        }
      }
    },
    data () {
      return {
        formData: {
          name: '',
          url: '',
          duration: 0,
          data: {}
        }
      }
    },
    methods: {
      onChange (newVal) {
        console.log('val', newVal)
        this.formData.data = newVal
      },
      onError () {
        console.log(1111)
      },
      saveMock () {
        this.$http.post('/proxy-api/set/mock',this.formData).then(function (mes) {
          this.onSuccess(mes.data)
          this.initMockData()
          this.currentVisible = false
        });
      },
      initMockData () {
      },
      setEditor () {
        this.$refs.jsonEditor.editor.set(this.data.data)
      },
      close () {
        this.initMockData()
        this.currentVisible = false
      }
    }
  }
</script>
<style scoped>
 >>> .jsonEditorBox .el-form-item__content{
    height: 400px;
  }
</style>
