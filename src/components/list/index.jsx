
import { Space, Table, Tag, Radio, Button } from 'antd';
import { useState } from 'react';
import ApiEdit from './editModal';
const { Column } = Table;

const data = [
  {
    key: '1',
    url: 'JohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohn',
    lastName: 'Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
    tags: ['nice', 'developer'],
  },
  {
    key: '2',
    firstName: 'Jim',
    lastName: 'Green',
    age: 42,
    address: 'London No. 1 Lake Park',
    tags: ['loser'],
  },
  {
    key: '3',
    firstName: 'Joe',
    lastName: 'Black',
    age: 32,
    address: 'Sydney No. 1 Lake Park',
    tags: ['cool', 'teacher'],
  },
];
function List() {
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
      <Column title="URL" dataIndex="url" key="ur" />
      <Column
        title="当前生效"
        dataIndex="tags"
        key="tags"
        render={(tags) => (
          <>
            {tags.map((tag) => {
              let color = tag.length > 5 ? 'geekblue' : 'green';
              if (tag === 'loser') {
                color = 'volcano';
              }
              return (
                <Tag color={color} key={tag}>
                  {tag}
                </Tag>
              );
            })}
          </>
        )}
      />
      <Column 
        title="启用" 
        fixed="right"
        width={380}
        render={(_, record) => (
        <Radio.Group name="radiogroup" onChange={(event) => {
          setTargetType(event.target.value)
        }} value={targetType}>
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
    <ApiEdit visible={editVisible} onCancel={() => setEditVisible(false)} />
  </>
}

export default List;