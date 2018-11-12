<template>
  <el-dialog :fullscreen="true" :modal="false" @open="initDialog" :visible.sync="currentVisible" title="设置mock" :before-close="close">
    <el-form  :model="formData" label-width="80px">
      <el-form-item label="name">
        <el-input v-model="formData.name"></el-input>
      </el-form-item>
      <el-form-item label="url" required>
        <el-input v-model="formData.url"></el-input>
      </el-form-item>
      <el-form-item label="延时" required>
        <el-input placeholder="请输入内容" v-model.number="formData.duration">
          <template slot="append">ms</template>
        </el-input>
      </el-form-item>
      <span class="info">注：优先返回参数字段最多个相等那个</span>
      <section class="dataBox">
        <article class="tabs">
          <div :class="{active: activeData === item}" v-for="item in formData.data" @click="selectData(item)">
            <span>
              <input @blur="nameInputBlur" disabled class="name" v-model="item.name" type="text">
            </span>
            <span class="iconBox">
              <i @click.prevent="editName" class="el-icon-edit"></i>
              <i v-if="formData.data.length > 1" @click.prevent="deleteItemMock(item)" class="el-icon-delete"></i>
            </span>
          </div>
          <el-button style="margin-left: 20px" @click="addData" icon="el-icon-circle-plus" type="info" size="mini">添加参数</el-button>
        </article>
        <article class="content">
          <div class="paramJsonEditorBox">
            <json-editor title="入参" ref="jsonEditorParam" :onError="onError" :onChange="onParamChange" :json="activeData.requestData || {}"></json-editor>
          </div>
          <div class="jsonEditorBox">
            <json-editor title="出参" ref="jsonEditor" :onError="onError" :onChange="onResChange" :json="activeData.responseData || {}"></json-editor>
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
  import JsonEditor from '../JsonEditor/index.vue'
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
      nameInputBlur (event) {
        event.target.disabled = true
      },
      editName (event) {
        let nameInput = event.target.parentNode.parentNode.querySelector('.name')
        nameInput.disabled = false
        nameInput.focus()
      },
      deleteItemMock (data) {
        this.formData.data = this.formData.data.filter(itemData => itemData !== data )
        this.activeData = this.formData.data[0]
        this.setEditor()
      },
      initDialog () {
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
      },
      addData () {
        let data = {
          name: `请求参数${this.formData.data.length + 1}`,
          requestData: {},
          responseData: {}
        }
        this.formData.data.push(data)
        this.activeData = data
        this.setEditor()
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
  .info {
    color: #f57639;
  }
  .dataBox .tabs .name {
    border: none;
    color: #ddd;
    width: 80px;
    background: transparent;
  }
  .dataBox .tabs .name:disabled {
    cursor: pointer;
  }
  .dataBox .tabs .name:focus {
    border: none;
    outline: none;
  }
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
  .dataBox .tabs div {
    display: flex;
    justify-content: space-between;
    line-height: 30px;
    height: 30px;
    padding: 0 10px;
    margin: 0;
    text-decoration: none;
    color: #ddd;
    list-style-type: none;

  }
  .dataBox .tabs div:hover {
    background: #1E2E45;
    cursor: pointer;
  }
  .dataBox .tabs div .iconBox {
    display: none;
  }
  .dataBox .tabs div:hover .iconBox {
    display: block;
  }
  .dataBox .content {
    flex: 1;
  }
</style>
