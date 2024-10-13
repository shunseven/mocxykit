
import { Space, Table, Tag, Radio, Button } from 'antd';
import { useState } from 'react';
const { Column } = Table;

const data = [
  {
    key: '1',
    firstName: 'John',
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

  return <>
    <Space style={{marginBottom: '15px'}} size={10}>
      <Button 
      size='small'
      style={{
        background: '#f50'
      }} type="primary">切换为全局代理</Button>
      <Button size='small' type="primary">首选MOCK</Button>
      <Button size='small' type="primary">首选自定义代理</Button>
    </Space>
    <Table pagination={false} dataSource={data}>
      <Column title="URL" dataIndex="URL" key="firstName" />
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
      <Column title="启用" render={(_, record) => (
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
        render={(_, record) => (
          <Space size="middle">
            <a style={{
              marginRight: '10px'
            }}>MOCK设置</a>
            <a style={{
              marginRight: '10px'
            }}>自定义代理设置</a>
            <a
              style={{
                color: 'red'
              }}
            >删除</a>
          </Space>
        )}
      />
    </Table>
  </>
}

export default List;