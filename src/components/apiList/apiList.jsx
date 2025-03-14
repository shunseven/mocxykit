import { Space, Table, Tag, Radio, Button, Popconfirm, Input, Tooltip, message } from 'antd';
import { useState } from 'react';
import ApiEdit from '../mockEditorModal/editModal';
import { fetchDeleteApiData } from '../../api/api';
import PreviewMockModal from '../previewMockModal/previewMockModal';
import CacheRequestHistoryData from '../cacheRequestHistoryData/cacheRequestHistoryData';
import eventButs from '../mockEditor/eventBus';
import { t } from '../../common/fun';
import { PushpinOutlined, SearchOutlined, InfoCircleOutlined, QuestionCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import ApiFox from '../apiMangeTool/apifox'; 
import ApiDocModal from '../apiDoc/apiDocModal';
import ApiSend from '../apiSend/apiSend';
const { Column } = Table;

const colorMap = {
  proxy: '#f50',
  mock: '#389e0d',
  customProxy: '#1677ff'
}

// 在组件外部定义样式对象
const styles = {
  recentlyImported: {
    backgroundColor: 'rgba(82, 196, 26, 0.1) !important',
  },
  recentlyImportedHover: {
    backgroundColor: 'rgba(82, 196, 26, 0.2) !important',
  },
  recentlyImportedSelected: {
    backgroundColor: 'rgba(82, 196, 26, 0.15) !important',
  }
};

function List({ data, globalProxy, onTargetChange, onBatchChangeTargetType, onApiDataChange, proxyList }) {
  const [editVisible, setEditVisible] = useState(false)
  const [preveiwVisible, setPreviewVisible] = useState(false)
  const [itemTargetKey, setItemTargetKey] = useState('');
  const [searchText, setSearchText] = useState('');
  const [pinnedItems, setPinnedItems] = useState(() => {
    return JSON.parse(localStorage.getItem('pinnedItems') || '[]');
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [recentlyImported, setRecentlyImported] = useState([]);
  const [docVisible, setDocVisible] = useState(false);
  const [currentApiData, setCurrentApiData] = useState(null);
  const [apiSendVisible, setApiSendVisible] = useState(false);

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

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

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t('请选择要删除的项'));
      return;
    }

    try {
      await fetchDeleteApiData({
        key: selectedRowKeys.join(','),
      });
      message.success(t('删除成功'));
      setSelectedRowKeys([]);
      onApiDataChange();
    } catch (error) {
      message.error(t('删除失败'));
    }
  };

  const handleImportData = async (importedKeys) => {
    // 先等待数据更新完成
    await onApiDataChange();
    
    // 设置高亮，不再添加定时器清除
    if (importedKeys && importedKeys.length) {
      setRecentlyImported(importedKeys);
    }
  };

  return <>
    <div style={{
      marginBottom: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      paddingLeft: '14px',
      paddingRight: '14px'
    }}>
      <Space size={10}>
      {selectedRowKeys.length > 0 && (
          <Popconfirm
            title={t('批量删除确认')}
            description={t('确定要删除选中的') + ` ${selectedRowKeys.length} ` + t('项吗？')}
            onConfirm={handleBatchDelete}
            okText={t('删除')}
            cancelText={t('取消')}
          >
            <Button danger size='small'>{t('批量删除')}</Button>
          </Popconfirm>
        )}
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
        <ApiFox onApiDataChange={handleImportData} />
        <CacheRequestHistoryData onApiDataChange={handleImportData} />
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
      rowSelection={rowSelection}
      pagination={false}
      dataSource={filteredData}
      onRow={(record) => {
        const isImported = recentlyImported.includes(record.key);
        const isSelected = selectedRowKeys.includes(record.key);
        
        return {
          style: {
            ...(isImported && {
              backgroundColor: isSelected 
                ? 'rgba(82, 196, 26, 0.15)'
                : 'rgba(82, 196, 26, 0.1)',
            }),
          },
          onMouseEnter: (e) => {
            if (isImported) {
              e.currentTarget.style.backgroundColor = 'rgba(82, 196, 26, 0.2)';
            }
          },
          onMouseLeave: (e) => {
            if (isImported) {
              e.currentTarget.style.backgroundColor = isSelected 
                ? 'rgba(82, 196, 26, 0.15)'
                : 'rgba(82, 196, 26, 0.1)';
            }
          }
        };
      }}
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
          <div style={{ padding: '8px' }}>
            <Input
              placeholder={t('搜索 URL')}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={() => {}}
              style={{ width: 200 }}
              allowClear
              prefix={<SearchOutlined />}
              autoFocus
            />
          </div>
        )}
        filterIcon={() => (
          <SearchOutlined style={{ color: searchText ? '#1890ff' : undefined }} />
        )}
      />
      <Column
        width={100}
        title={t('延时')}
        dataIndex="duration"
        key="duration"
        render={(duration) => (
          <span>{duration ? `${duration}ms` : '-'}</span>
        )}
      />
      <Column
        width={120}
        title={
          <span>
            {t('随机数据')}
            <Tooltip 
              title={
                <span dangerouslySetInnerHTML={{ 
                  __html: t('随机数据配置示例')
                }}>
                </span>
              }
            >
              <QuestionCircleOutlined style={{ marginLeft: '4px' }} />
            </Tooltip>
          </span>
        }
        dataIndex="hasFaker"
        key="hasFaker"
        render={(hasFaker, record) => {
          return hasFaker && record.target === 'mock' ? (
            <Tooltip title={record.fakerKey}>
              <Tag color='#87d068'>
                {t('已开启')}
              </Tag>
            </Tooltip>
          ) : '--'
        }}
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
        width={180}
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
            {(record.requestSchema || record.responseSchema) && (
              <a
                onClick={() => {
                  setCurrentApiData(record)
                  setDocVisible(true)
                }}
                style={{
                  marginRight: '10px'
                }}>
                <Tooltip title={t('查看文档')}>
                  {t('文档')}
                </Tooltip>
              </a>
            )}
            <a
              onClick={() => {
                setCurrentApiData(record)
                setApiSendVisible(true)
              }}
              style={{
                marginRight: '10px'
              }}>
              <Tooltip title={t('发送请求')}>
                {t('发送请求')}
              </Tooltip>
            </a>
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
    <ApiDocModal 
      visible={docVisible} 
      onClose={() => setDocVisible(false)} 
      apiData={currentApiData} 
    />
    <ApiSend 
      visible={apiSendVisible} 
      onClose={() => setApiSendVisible(false)} 
      apiData={currentApiData} 
    />
  </>
}

export default List;