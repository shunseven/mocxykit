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
      <section class="dataBox">
        <article class="tabs">
          <span :class="{active: activeData === item}" v-for="item in formData.data" @click="selectData(item)">
            {{item.name}}
          </span>
          <el-button style="margin-left: 20px" @click="addData" icon="el-icon-circle-plus" type="info" size="mini">添加参数</el-button>
        </article>
        <article class="content">
          <div class="paramJsonEditorBox">
            <json-editor ref="jsonEditorParam" :onError="onError" :onChange="onParamChange" :json="activeData.requestData"></json-editor>
          </div>
          <div class="jsonEditorBox">
            <json-editor ref="jsonEditor" :onError="onError" :onChange="onResChange" :json="activeData.responseData"></json-editor>
          </div>
        </article>
      </section>

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
            this.formData = this.data
            if(!this.data.data || this.data.data.length === 0 ) {
              this.data.data = [
                {
                  name: '请求参数1',
                  requestData: {},
                  responseData: {}
                }
              ]
            }
            this.$nextTick(() => {
              this.activeData = this.data.data[0]
              this.setEditor()
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
          data: [
            {
              name: '请求参数1',
              requestData: {},
              responseData: {}
            }
          ]
        },
        activeData: {
          requestData: {},
          responseData: {}
        }
      }
    },
    methods: {
      addData () {
        this.formData.data.push({
          name: `请求参数${this.formData.data.length}`,
          requestData: {},
          responseData: {}
        })
      },
      selectData (data) {
        this.activeData = data
        this.setEditor()
      },
      onResChange (newVal) {
        this.activeData.responseData = newVal
      },
      onParamChange (newVal) {
        this.activeData.requestData = newVal
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
        this.$refs.jsonEditor.editor.set(this.activeData.responseData)
        this.$refs.jsonEditorParam.editor.set(this.activeData.requestData)
      },
      close () {
        this.initMockData()
        this.currentVisible = false
      }
    }
  }
</script>
<style scoped>
  .active {
    background: #2f4463;
    color: #fff;
  }
  .jsonEditorBox{
    height: 400px;
   position: relative;
  }
  .paramJsonEditorBox {
    height: 220px;
    position: relative;
  }
  .dataBox {
    background: #525e65;
    padding: 1px;
    display: flex;
     }
  .dataBox .tabs {
    width: 150px;
    padding: 0;
    margin: 0;
  }
  .dataBox .tabs span {
    display: block;
    text-indent: 10px;
    line-height: 30px;
    height: 30px;
    padding: 0;
    margin: 0;
    text-decoration: none;
    color: #ddd;
    list-style-type: none;
  }
  .dataBox .tabs span:hover {
    background: #1E2E45;
    cursor: pointer;
  }
  .dataBox .content {
    flex: 1;
  }
</style>
