import { Select, Space, Tag, Button, Form, Input, Popconfirm } from 'antd';
import { useEffect, useState } from 'react';
import { fetchCreateProxy, fetchDeleteProxy, requestApiData, fetchChangeProxy } from '../../api/api';

function Index(props) {
  const [proxyList, setProxyList] = useState([])
  const [selectProxy, setSelectProxy] = useState([])
  const [isCreate, setIsCreate] = useState(false)
  const [form] = Form.useForm()

  function fetchProxyData() {
    requestApiData().then(apiData => {
      if (apiData.selectProxy) setSelectProxy(apiData.selectProxy)
      if (apiData.proxy) setProxyList(apiData.proxy)
    });
  }

  useEffect(() => {
    fetchProxyData();
  }, []);

  let hasDelete = false;

  return (
    <Space style={{ marginTop: '15px' }}>
      {
        !isCreate && <Space>
          <div>全局代理:</div>
          <Select
            size='middle'
            value={selectProxy}
            style={{
              width: 350,
            }}
            onChange={async (proxy) => {
              if (hasDelete) {
                hasDelete = false;
                return
              };
              await fetchChangeProxy({
                proxy
              })
              fetchProxyData();
            }}
            labelRender={({ label }) => {
              return <Tag size='middle' color="#f50">{label}</Tag>
            }}
            options={proxyList.map(item => ({
              label: `${item.name}(${item.proxy})`,
              value: item.proxy
            }))}
            optionRender={(item) => {
              return <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <div>
                  {item.label}
                </div>
                <div>
                <Popconfirm
                  title="请确认"
                  description="是否要删除这个代理"
                  onConfirm={async () => {
                    await fetchDeleteProxy({
                      proxy: item.value,
                    });
                    fetchProxyData();
                  }}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button size='small' onClick={(event) => {
                    event.stopPropagation()
                    hasDelete = true;
                  }} danger>删除</Button>
                </Popconfirm>
                  
                </div>
              </div>
            }}
          />
        </Space>
      }

      {
        isCreate && <Form
          layout='inline'
          form={form}
          onFinish={async (value) => {
            await fetchCreateProxy({
              proxy: value.proxy,
              name: value.name || 'proxy',
            })
            fetchProxyData();
            setIsCreate(false)
            form.resetFields()
          }}
        >
          <Form.Item name='name' label="name">
            <Input size='middle' placeholder="请输入代理的名称" />
          </Form.Item>
          <Form.Item
            label="代理"
            name='proxy'
            rules={[
              {
                required: true,
                message: '请输入代理地址'
              },
              {
                pattern: /^(http|https):\/\/.+$/,              
                message: '请输入正确的代理地址'
              },
              {
                validator: (rule, val) => {
                  return proxyList.find(item => item.proxy === val) ? Promise.reject('代理地址已存在') : Promise.resolve()
                }
              }
            ]}
          >
            <Input size='middle' style={{width: '300px'}} placeholder="http://127.0.0.1:8800" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" size='middle' htmlType="submit">创建</Button>
          </Form.Item>
          <Form.Item>
            <Button size='middle' danger onClick={() => {
              form.resetFields()
              setIsCreate(false)
            }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      }

     {
       !isCreate && <Button onClick={() => setIsCreate(true)} color="primary" size='middle' variant="outlined">
       新增
     </Button>
     }
    </Space>
  );
}

export default Index;