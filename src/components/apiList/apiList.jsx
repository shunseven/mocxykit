
import { Space, Table, Tag, Radio, Button, Popconfirm } from 'antd';
import { useState } from 'react';
import ApiEdit from '../mockEditorModal/editModal';
import { fetchDeleteApiData } from '../../api/api';
import PreviewMockModal from '../previewMockModal/previewMockModal';
import CacheRequestHistoryData from '../cacheRequestHistoryData/cacheRequestHistoryData';
import eventButs from '../mockEditor/eventBus';
const { Column } = Table;

const colorMap = {
  proxy: '#f50',
  mock: '#389e0d',
  customProxy: '#1677ff'
}

function List({ data, globalProxy, onTargetChange, onBatchChangeTargetType, onApiDataChange }) {
  const [editVisible, setEditVisible] = useState(false)
  const [preveiwVisible, setPreviewVisible] = useState(false)
  const [itemTargetKey, setItemTargetKey] = useState('');
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
          }} variant="outlined"
          onClick={() => onBatchChangeTargetType('proxy')}
        >切换为全局代理</Button>
        <Button style={{
          color: '#389e0d',
          borderColor: '#389e0d'
        }} onClick={() => onBatchChangeTargetType('mock')} size='small' color="primary" variant="outlined" >MOCK数据优先</Button>
        <Button onClick={() => onBatchChangeTargetType('customProxy')} size='small' color="primary" variant="outlined">自定义代理优先</Button>

      </Space>
      <Space size={10} >
        <CacheRequestHistoryData onApiDataChange={onApiDataChange} />
        <Button
          onClick={() => {
            setItemTargetKey('')
            setEditVisible(true)
            eventButs.emit('reset')
          }} type='primary'>
          新增MOCK数据&自定义代理
        </Button>
      </Space>
    </div>

    <Table
      pagination={false}
      dataSource={data}
      scroll={{
        x: 'max-content',
      }}
    >
      <Column width={150} title="名称" dataIndex="name" key="name" />
      <Column title="URL" dataIndex="url" key="ur" />
      <Column
        title="目标"
        dataIndex="target"
        key="target"
        render={(target, itemData) => (
          <>
            {
              target && <Tag 
                style={{
                  cursor: target === 'mock' ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (target === 'mock') {
                    setItemTargetKey(itemData.key)
                    setPreviewVisible(true)
                  }
              }} color={colorMap[target]} key={target}>
              {target === 'proxy' && globalProxy}
              {target === 'mock' && '查看MOCK数据'}
              {target === 'customProxy' && itemData.selectCustomProxy}
            </Tag>
            }
          </>
        )}
      />
      <Column
        title="启用"
        fixed="right"
        width={380}
        render={(_, itemData) => (
          <Radio.Group name="radiogroup" onChange={(event) => {
            onTargetChange({
              key: itemData.key,
              target: event.target.value
            })
          }} value={itemData.target}>
            <Space >
              <Radio value={'proxy'}>全局代理</Radio>
              <Radio disabled={!itemData.hasMockData} value={'mock'}>MOCK数据</Radio>
              <Radio disabled={!itemData.selectCustomProxy} value={'customProxy'}>自定义代理</Radio>
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
            <a
              onClick={() => {
                setItemTargetKey(record.key)
                setEditVisible(true)
              }}
              style={{
                marginRight: '10px'
              }}>设置</a>
            <Popconfirm
              title="请确认"
              description="是否要删除这个代理"
              onConfirm={() => {
                fetchDeleteApiData({
                  key: record.key,
                })
                onApiDataChange()
              }}
              okText="删除"
              cancelText="取消"
            >
              <a
                onClick={() => {
                  event.stopPropagation()
                }}
                style={{
                  color: 'red'
                }}
              >删除</a>
            </Popconfirm>

          </Space>
        )}
      />
    </Table>
    <ApiEdit onApiDataChange={onApiDataChange} targetKey={itemTargetKey} visible={editVisible} onCancel={() => setEditVisible(false)} />
    <PreviewMockModal targetKey={itemTargetKey} visible={preveiwVisible} onCancel={() => setPreviewVisible(false)} />  
  </>
}

export default List;