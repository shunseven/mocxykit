import { Space, Table, Tag, Radio, Button, Popconfirm, Input, Tooltip } from 'antd';
import { useState } from 'react';
import ApiEdit from '../mockEditorModal/editModal';
import { fetchDeleteApiData } from '../../api/api';
import PreviewMockModal from '../previewMockModal/previewMockModal';
import CacheRequestHistoryData from '../cacheRequestHistoryData/cacheRequestHistoryData';
import eventButs from '../mockEditor/eventBus';
import { t } from '../../common/fun';
import { PushpinOutlined } from '@ant-design/icons';
const { Column } = Table;

const colorMap = {
  proxy: '#f50',
  mock: '#389e0d',
  customProxy: '#1677ff'
}

function List({ data, globalProxy, onTargetChange, onBatchChangeTargetType, onApiDataChange, proxyList }) {
  const [editVisible, setEditVisible] = useState(false)
  const [preveiwVisible, setPreviewVisible] = useState(false)
  const [itemTargetKey, setItemTargetKey] = useState('');
  const [searchText, setSearchText] = useState('');
  const [pinnedItems, setPinnedItems] = useState(() => {
    return JSON.parse(localStorage.getItem('pinnedItems') || '[]');
  });

  const handleBatchChange = (type) => {
    onBatchChangeTargetType(type, pinnedItems);
  };

  const togglePin = (key) => {
    const newPinnedItems = pinnedItems.includes(key)
      ? pinnedItems.filter(item => item !== key)
      : [...pinnedItems, key];
    setPinnedItems(newPinnedItems);
    localStorage.setItem('pinnedItems', JSON.stringify(newPinnedItems));
  };

  const filteredData = data.filter(item => 
    item.url.toLowerCase().includes(searchText.toLowerCase())
  );

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
          onClick={() => handleBatchChange('proxy')}
        >{t('切换为全局代理')}</Button>
        <Button style={{
          color: '#389e0d',
          borderColor: '#389e0d'
        }} 
        onClick={() => handleBatchChange('mock')} 
        size='small' 
        color="primary" 
        variant="outlined" 
        >{t('MOCK数据优先')}</Button>
        <Button 
        onClick={() => handleBatchChange('customProxy')} 
        size='small' 
        color="primary" 
        variant="outlined"
        >{t('自定义代理优先')}</Button>
      </Space>
      <Space size={10} >
        <CacheRequestHistoryData onApiDataChange={onApiDataChange} />
        <Button
          onClick={() => {
            setItemTargetKey('')
            setEditVisible(true)
            eventButs.emit('reset')
          }} type='primary'>
          {t('新增MOCK数据&自定义代理')}
        </Button>
      </Space>
    </div>

    <Table
      pagination={false}
      dataSource={filteredData}
      scroll={{
        x: 'max-content',
      }}
    >
      <Column 
        width={50} 
        title="" 
        key="pin"
        render={(_, record) => (
          <Tooltip title={pinnedItems.includes(record.key) ? t('取消固定') : t('固定')}>
            <PushpinOutlined
              style={{ 
                cursor: 'pointer',
                color: pinnedItems.includes(record.key) ? '#1890ff' : '#d9d9d9'
              }}
              onClick={() => togglePin(record.key)}
            />
          </Tooltip>
        )}
      />
      <Column width={150} title={t('名称')} dataIndex="name" key="name" />
      <Column 
        title="URL" 
        dataIndex="url" 
        key="url"
        filterDropdown={() => (
          <Input
            placeholder={t('搜索 URL')}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200, margin: 8 }}
          />
        )}
      />
      <Column
        title={t('目标')}
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
              {target === 'mock' && t('查看MOCK数据')}
              {target === 'customProxy' && itemData.selectCustomProxy}
            </Tag>
            }
          </>
        )}
      />
      <Column
        title={t('启用')}
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
              <Radio value={'proxy'}>{t('全局代理')}</Radio>
              <Radio disabled={!itemData.hasMockData} value={'mock'}>{t('MOCK数据')}</Radio>
              <Radio disabled={!itemData.selectCustomProxy} value={'customProxy'}>{t('自定义代理')}</Radio>
            </Space>
          </Radio.Group>
        )} key="address" />

      <Column
        title={t('操作')}
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
              }}>{t('设置')}</a>
            <Popconfirm
              title={t('请确认')}
              description={t('是否要删除这个代理')}
              onConfirm={() => {
                fetchDeleteApiData({
                  key: record.key,
                })
                onApiDataChange()
              }}
              okText={t('删除')}
              cancelText={t('取消')}
            >
              <a
                onClick={() => {
                  event.stopPropagation()
                }}
                style={{
                  color: 'red'
                }}
              >{t('删除')}</a>
            </Popconfirm>

          </Space>
        )}
      />
    </Table>
    <ApiEdit proxyList={proxyList} onApiDataChange={onApiDataChange} targetKey={itemTargetKey} visible={editVisible} onCancel={() => setEditVisible(false)} />
    <PreviewMockModal targetKey={itemTargetKey} visible={preveiwVisible} onCancel={() => setPreviewVisible(false)} />  
  </>
}

export default List;