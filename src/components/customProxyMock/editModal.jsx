import { Modal } from "antd";
import GProxy from "../proxy/proxy";
import { Form, Input } from 'antd'
import './editModal.css'
import MockEditor from "./mockEditor";
import { useState } from "react";
import { saveCustomProxyData } from "../../api/api";
import { parseUrlToKey } from "../../common/fun";

const initMockData = {
  url: '',
  key: '',
  data: [
    {
      "name": "请求参数1",
      "requestData": {},
      "responseData": {}
    }
  ]
}

export default function ApiEdit(props) {
  const { onCancel } = props;
  const [form] = Form.useForm();
  const [mockData, setMockData] = useState(initMockData);
  const [hasError, setHasError] = useState(false);
  const [customProxy, setCustomProxy] = useState([]);
  const [selectCustomProxy, setSelectCustomProxy] = useState('');

  return <Modal
    className="edit-modal"
    centered={true}
    onCancel={() => {
      onCancel()
      setMockData(initMockData)
      setCustomProxy([])
      setHasError(false)
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
      onFinish={async (value) => {
        if (hasError) {
          return
        }
        mockData.url = value.url;
        mockData.key = parseUrlToKey(value.url);
        await saveCustomProxyData({
          ...value,
          mockData,
          customProxy,
          selectCustomProxy
        })
        onCancel()
      }}
      style={{ width: ' 100%' }}
      layout="inline"
    >
      <Form.Item className="ant-form-mock-item" width="30%" name="name" layout="inline" label="名称" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item className="ant-form-mock-item" width="30%" name="url" layout="inline" label="URL" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item className="ant-form-mock-item" width="30%" name="duration" layout="inline" label="延时">
        <Input />
      </Form.Item>
    </Form>
    <GProxy
      label="自定义代理:"
      deleteComfirm={true}
      proxyList={customProxy}
      selectProxy={selectCustomProxy}
      onProxyChange={async ({proxy}) => {
        setSelectCustomProxy(proxy);
      }}
      onProxyDelete={async ({proxy}) => {
        setCustomProxy(customProxy.filter(item => item.proxy !== proxy));
        if(proxy === selectCustomProxy) {
          setSelectCustomProxy(customProxy[0]?.proxy || '');
        }
      }}
      onProxyCreate={async (data) => {
        setCustomProxy([...customProxy, data]);
        setSelectCustomProxy(data.proxy);
      }}
    />
    <MockEditor value={mockData} onChange={setMockData} onStateChange={setHasError} />
  </Modal>
}