
import { Space, Table, Tag, Radio, Button } from 'antd';
import { useState } from 'react';
import ApiEdit from '../customProxyMock/editModal';
const { Column } = Table;

function List({data, globalProxy, onTargetChange}) {
  const [targetType, setTargetType] = useState('proxy')
  const [editVisible, setEditVisible] = useState(false)

  return <>
    <div style={{
      marginBottom: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      paddingLeft: '14px',
      paddingRight: '14px'
    }}>
      <Space size={10}>
        <Button 
        size='small'
        style={{
          borderColor: '#f50',
          color: '#f50'
        }} variant="outlined">切换为全局代理</Button>
        <Button size='small' color="primary"  variant="outlined" >首选MOCK</Button>
        <Button size='small' color="primary"  variant="outlined">首选自定义代理</Button>
       
      </Space>
      <Button
      onClick={() => setEditVisible(true)}  type='primary'>
          新增MOCK数据&自定义代理
      </Button>
    </div>
   
    <Table 
      pagination={false} 
      dataSource={data}
      scroll={{
        x: 'max-content',
      }}
    >
      <Column title="名称" dataIndex="name" key="name" />
      <Column title="URL" dataIndex="url" key="ur" />
      <Column
        title="当前生效"
        dataIndex="target"
        key="target"
        render={(target, itemData) => (
          <>
            <Tag color='green' key={target}>
              {target === 'proxy' && globalProxy}
              {target === 'mock' && 'MOCK数据'}
              {target === 'customProxy' &&  itemData.selectCustomProxy}
            </Tag>
          </>
        )}
      />
      <Column 
        title="启用" 
        fixed="right"
        width={380}
        render={(_, itemData) => (
        <Radio.Group name="radiogroup" onChange={(event) => {
          
        }} value={itemData.target}>
          <Space >
            <Radio value={'proxy'}>全局代理</Radio>
            <Radio value={'mock'}>MOCK数据</Radio>
            <Radio value={'customProxy'}>自定义代理</Radio>
          </Space>
        </Radio.Group>
      )} key="address" />

      <Column
        title="操作"
        key="action"
        fixed="right"
        width={120}
        render={(_, record) => (
          <Space size="middle">
            <a style={{
              marginRight: '10px'
            }}>设置</a>
            <a
              style={{
                color: 'red'
              }}
            >删除</a>
          </Space>
        )}
      />
    </Table>
    {
      editVisible && <ApiEdit visible={editVisible} onCancel={() => setEditVisible(false)} />
    }
  </>
}

export default List;