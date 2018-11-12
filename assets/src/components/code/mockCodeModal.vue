<template>
  <el-dialog :fullscreen="true" :modal="false" @open="initDialog" :visible.sync="currentVisible" title="编写代码片段" :before-close="close">
    <el-form  :model="formData" label-width="80px">
      <el-form-item label="name">
        <el-input v-model="formData.name"></el-input>
      </el-form-item>
      <el-form-item label="url" required>
        <el-input v-model="formData.url"></el-input>
      </el-form-item>
      <section class="codeBox">
        <article class="content">
          <div class="codeEditor" ref="codeEditor" ></div>
        </article>
      </section>
    </el-form>
    <div slot="footer" class="dialog-footer">
        <el-button @click="close">取 消</el-button>
        <el-button @click="saveCode" type="primary">确 定</el-button>
    </div>
  </el-dialog>
</template>
<script>
  import 'brace/mode/javascript';
  import 'brace/theme/monokai';

  export default {
    components: {
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
        editor: null,
        formData: {
          name: '',
          url: '',
          code: ''
        }
      }
    },
    methods: {
      saveCode () {
        this.$http.post('/proxy-api/set/mockCode',this.formData).then(function (mes) {
          this.onSuccess(mes.data)
          this.initMockCodeData()
          this.currentVisible = false
        });
      },
      initMockCodeData () {
        this.editor.setValue('')
      },
      initDialog () {
        this.formData = this.data
        setTimeout(()=> {
          const editor = ace.edit(this.$refs.codeEditor);
          editor.getSession().setMode('ace/mode/javascript');
          editor.setTheme('ace/theme/monokai');
          if (this.formData.code) editor.setValue( this.formData.code)
          this.editor = editor
          editor.on('change', () => {
            var code = editor.getValue();
            this.formData.code = code
          })
        })
      },
      close () {
        this.currentVisible = false
        this.initMockCodeData()
      }
    }
  }
</script>
<style scoped>
  .info {
    color: #f57639;
  }
  .codeBox {

  }
  .codeEditor {
    height: 500px;
  }
</style>
