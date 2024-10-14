import { Modal } from "antd";
import GProxy from "../proxy/proxy";
import { Form, Input, Button } from 'antd'
import './editModal.css'
import MockEditor from "./mockEditor";
import { useState } from "react";


export default function ApiEdit(props) {
  const { onCancel } = props;
  const [form] = Form.useForm();
  const [showRequest, setShowRequest] = useState()

  return <Modal
    className="edit-modal"
    centered={true}
    onCancel={() => {
      onCancel()
      setShowRequest(false)
    }}
    title="MOCK数据&自定义代理"
    okText="保存"
    cancelText="取消"
    onOk={() => {
      form.submit()
    }}
    open={props.visible}>
    <Form
      form={form}
      onFinish={() => { }}
      style={{ width: ' 100%' }}
      layout="inline"
    >
      <Form.Item className="ant-form-mock-item" width="30%" name="name" layout="inline" label="名称" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item className="ant-form-mock-item" width="30%" name="name" layout="inline" label="URL" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item className="ant-form-mock-item" width="30%" name="duration" layout="inline" label="延时">
        <Input />
      </Form.Item>
    </Form>
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
    <div className="mock-editor-title">
      <div>MOCK数据</div> <Button variant="outlined" onClick={()=>setShowRequest(true)} color="primary">添加入参</Button>
    </div>
    <MockEditor showRequest={showRequest} />
  </Modal>
}