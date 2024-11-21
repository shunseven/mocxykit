import { Select, Space, Tag, Button, Form, Input, Popconfirm } from 'antd';
import { LinkOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import EnvSelect from '../envSelect/envSelect';
import { useState } from 'react';
import './proxy.css'
import { t } from '../../common/fun';

function GProxy(props) {
  const [isCreate, setIsCreate] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const {
    proxyList, 
    selectProxy, 
    onProxyChange, 
    onProxyDelete, 
    onSaveProxy, 
    deleteComfirm, 
    label, 
    color='#f50', 
    hasEnvPlugin,
    hasEditFeature = true, // 默认开启编辑功能
    showBindIcon = true // 添加新的prop控制绑定图标显示
  } = props

  let hasDelete = false;

  const handleSubmit = (value) => {
    onSaveProxy({
      proxy: value.proxy,
      name: value.name || 'proxy',
      bindEnvId: value.bindEnvId,
    })
    setIsCreate(false)
    setEditingItem(null)
    form.resetFields()
  }

  return (
    <Space style={{ marginTop: '15px' }}>
      {
        !isCreate && <Space>
          <div>{label}</div>
          <Select
            size='middle'
            value={selectProxy}
            style={{
              width: 350,
            }}
            onChange={(proxy) => {
              if (hasDelete) {
                hasDelete = false;
                return
              };
              onProxyChange({
                proxy
              })
            }}
            labelRender={({ label }) => {
              return label && <Tag size='middle' color={color}>{label}</Tag>
            }}
            options={proxyList.map(item => ({
              label: `${item.name}(${item.proxy})`,
              value: item.proxy
            }))}
            optionRender={(item) => {
              const proxyItem = proxyList.find(p => p.proxy === item.value);
              
              return <div className="proxy-item" style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  overflow: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {showBindIcon && proxyItem?.bindEnvId && <LinkOutlined style={{ color: '#1890ff' }} />}
                  {item.label}
                </div>
                <Space className="action-buttons">
                  {hasEditFeature && ( // 根据prop控制是否显示编辑按钮
                    <Button
                      size='small'
                      type="text"
                      className='proxy-edit'
                      icon={<EditOutlined />}
                      onClick={(event) => {
                        event.stopPropagation()
                        setEditingItem(proxyItem)
                        setIsCreate(true)
                        form.setFieldsValue(proxyItem)
                        hasDelete = true
                      }}
                    />
                  )}
                  {deleteComfirm ? (
                    <Popconfirm
                      title={t('请确认')}
                      description={t('是否删除该代理')}
                      onConfirm={() => onProxyDelete({proxy: item.value})}
                      okText={t('确认')}
                      cancelText={t('取消')}
                    >
                      <Button
                        className='proxy-delete'
                        size='small'
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(event) => {
                          event.stopPropagation()
                          hasDelete = true
                        }}
                      />
                    </Popconfirm>
                  ) : (
                    <Button
                      size='small'
                      type="text" 
                      className='proxy-delete'
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(event) => {
                        event.stopPropagation()
                        onProxyDelete({proxy: item.value})
                        hasDelete = true
                      }}
                    />
                  )}
                </Space>
              </div>
            }}
          />
        </Space>
      }

      {isCreate && (
        <Form
          layout='inline'
          form={form}
          onFinish={handleSubmit}
        >
          <Form.Item name='name' label={t('名称')}>
            <Input size='middle' placeholder={t('请输入代理的名称')} />
          </Form.Item>
          <Form.Item
            label={t('代理')}
            name='proxy'
            rules={[
              {
                required: true,
                message: t('请输入代理地址')
              },
              {
                pattern: /^(http|https):\/\/.+$/,              
                message: t('请输入正确的代理地址')
              },
              {
                validator: (rule, val) => {
                  // 如果是编辑状态且输入值与当前编辑项的proxy相同,则通过校验
                  if (editingItem && editingItem.proxy === val) {
                    return Promise.resolve();
                  }
                  // 否则检查是否与其他项重复
                  return proxyList.find(item => item.proxy === val) 
                    ? Promise.reject(t('代理地址已存在')) 
                    : Promise.resolve();
                }
              }
            ]}
          >
            <Input size='middle' style={{width: '300px'}} placeholder="http://127.0.0.1:8800" />
          </Form.Item>
          {hasEnvPlugin && (
            <Form.Item name="bindEnvId" label={t('绑定环境')}>
              <EnvSelect style={{ width: '200px' }} />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" size='middle' htmlType="submit">
              {editingItem ? t('保存') : t('创建')}
            </Button>
          </Form.Item>
          <Form.Item>
            <Button size='middle' danger onClick={() => {
              form.resetFields()
              setIsCreate(false)
              setEditingItem(null)
            }}>
              {t('取消')}
            </Button>
          </Form.Item>
        </Form>
      )}

     {
       !isCreate && <Button onClick={() => setIsCreate(true)} color="primary" size='middle' variant="outlined">
       {t('新增')}
     </Button>
     }
    </Space>
  );
}

export default GProxy;