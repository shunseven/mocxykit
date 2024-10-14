import { Modal } from "antd";
import GProxy from "../proxy/proxy";
import { Menu, Form, Input } from 'antd'
import './editModal.css'
import JSONEditor from './jsonEditor'

export default function ApiEdit(props) {
  const { onCancel } = props;
  const [form] = Form.useForm();

  return <Modal 
    className="edit-modal" 
    centered={true} 
    onCancel={onCancel} 
    title="Basic Modal"
    okText="保存"
    cancelText="取消"
    onOk={() => {
      form.submit()
    }}
    open={props.visible}>
    <Form
      form={form}
      onFinish={() =>{}}
      style={{ width:' 100%' }}
    >
      <Form.Item name="name" label="名称" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="duration" label="延时" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item>
        <GProxy
          label="自定义代理:"
          deleteComfirm={true}
          proxyList={[]} 
          selectProxy={''}
          onProxyChange={async (data) => {
          }}
          onProxyDelete={async (data) => {
          }}
          onProxyCreate={async (data) => {
          }}
        />
      </Form.Item>
      <Form.Item className="form-item-mock-editor" name="mock" layout="vertical" label="Mock数据">
        <div className="mock-editor-box">
           <div className="mock-editor-menu">
           <Menu
              onClick={() => {}}
              defaultSelectedKeys={['1']}
              defaultOpenKeys={['sub1']}
              mode="inline"
              items={[{
                key: '1',
                label: '接口信息'
              }, {
                key: '2',
                label: '接口信息3'
              }]}
            />
           </div>
           <div className="mock-editor-warp">
             <div>
               入参:
             </div>
             <JSONEditor
                htmlElementProps={{
                  className: 'editor-req'
                }} 
                mode="code"/>
             <div>
                出参:
             </div>
             <JSONEditor htmlElementProps={{
              className: 'editor-res'
             }} mode="code" />
           </div>
          
        </div>
      </Form.Item>
    </Form>
  </Modal>
}