import { Space, Button, Popconfirm, Radio, Table } from 'antd';
import { useState } from 'react';
import ApiEdit from '../mockEditorModal/editModal';
import { fetchDeleteApiData } from '../../api/api';
import PreviewMockModal from '../previewMockModal/previewMockModal';
import CacheRequestHistoryData from '../cacheRequestHistoryData/cacheRequestHistoryData';
import eventButs from '../mockEditor/eventBus';
import { t } from '../../common/fun';
import { SearchOutlined, InfoCircleOutlined, AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import ApiFox from '../apiMangeTool/apifox'; 
import ApiDocModal from '../apiDoc/apiDocModal';
import ApiSend from '../apiSend/apiSend';
import ApiTable from '../apiTable/apiTable';
const { Column } = Table;

// 删除重复的样式定义，现在已经移到 ApiTable 组件中

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
  // 视图模式：flat (平铺) 或 grouped (分组)，从本地存储中加载
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'flat';
  });
  // 展开的分组 keys，从本地存储中加载
  const [expandedRowKeys, setExpandedRowKeys] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('expandedRowKeys') || '[]');
    } catch (e) {
      return [];
    }
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const handleBatchChange = (type) => {
    onBatchChangeTargetType(type, {
      pinnedItems
    });
  };

  const togglePin = (key) => {
    const newPinnedItems = pinnedItems.includes(key)
      ? pinnedItems.filter(item => item !== key)
      : [...pinnedItems, key];
    setPinnedItems(newPinnedItems);
    localStorage.setItem('pinnedItems', JSON.stringify(newPinnedItems));
  };

  // 切换视图模式
  const toggleViewMode = (newMode) => {
    setViewMode(newMode);
    localStorage.setItem('viewMode', newMode);
  };

  // 根据搜索文本过滤数据
  const filteredData = data.filter(item => 
    item.url.toLowerCase().includes(searchText.toLowerCase())
  );
  
  // 生成分组数据
  const groupedData = () => {
    // 先创建分组映射
    const groups = {};
    
    filteredData.forEach(item => {
      const folderId = item.forderId || 'ungrouped';
      const folderName = item.forderName || t('未分组');
      
      if (!groups[folderId]) {
        groups[folderId] = {
          key: folderId,
          name: folderName,
          items: []
        };
      }
      
      groups[folderId].items.push(item);
    });
    
    // 转换为数组格式
    return Object.values(groups);
  };

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

  // 在分组模式下对表格进行自定义渲染
  const expandedRowRender = (group) => {
    return (
      <ApiTable
        data={group.items}
        globalProxy={globalProxy}
        onTargetChange={onTargetChange}
        onApiDataChange={onApiDataChange}
        selectedRowKeys={selectedRowKeys}
        onSelectedRowsChange={setSelectedRowKeys}
        recentlyImported={recentlyImported}
        pinnedItems={pinnedItems}
        onTogglePin={togglePin}
        onItemEdit={(key) => {
          setItemTargetKey(key);
          setEditVisible(true);
        }}
        onPreviewMock={(key) => {
          setItemTargetKey(key);
          setPreviewVisible(true);
        }}
        onViewDoc={(record) => {
          setCurrentApiData(record);
          setDocVisible(true);
        }}
        onSendRequest={(record) => {
          setCurrentApiData(record);
          setApiSendVisible(true);
        }}
        handleBatchChange={(type) => {
          // 在分组视图中，只对当前展开的组内数据应用批量操作
          const keysInGroup = group.items.map(item => item.key);
          const relevantKeys = selectedRowKeys.filter(key => keysInGroup.includes(key));
          
          // 如果没有选中的项目，则对整个组的所有项应用操作
          const keysToChange = relevantKeys.length > 0 ? relevantKeys : keysInGroup;
          onBatchChangeTargetType(type, {
            selectedRowKeys: keysToChange,
            pinnedItems
          });
        }}
      />
    );
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
        
        <Radio.Group 
          value={viewMode} 
          onChange={(e) => toggleViewMode(e.target.value)}
          optionType="button" 
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="flat"><BarsOutlined /> {t('平铺')}</Radio.Button>
          <Radio.Button value="grouped"><AppstoreOutlined /> {t('分组')}</Radio.Button>
        </Radio.Group>
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

    {viewMode === 'flat' ? (
      // 平铺视图
      <ApiTable
        data={filteredData}
        globalProxy={globalProxy}
        onTargetChange={onTargetChange}
        onApiDataChange={onApiDataChange}
        selectedRowKeys={selectedRowKeys}
        onSelectedRowsChange={setSelectedRowKeys}
        recentlyImported={recentlyImported}
        pinnedItems={pinnedItems}
        onTogglePin={togglePin}
        searchText={searchText}
        onSearchChange={setSearchText}
        onItemEdit={(key) => {
          setItemTargetKey(key);
          setEditVisible(true);
        }}
        onPreviewMock={(key) => {
          setItemTargetKey(key);
          setPreviewVisible(true);
        }}
        onViewDoc={(record) => {
          setCurrentApiData(record);
          setDocVisible(true);
        }}
        onSendRequest={(record) => {
          setCurrentApiData(record);
          setApiSendVisible(true);
        }}
        handleBatchChange={handleBatchChange}
      />
    ) : (
      // 分组视图
      <Table
        pagination={false}
        dataSource={groupedData()}
        expandable={{
          expandedRowRender: record => expandedRowRender(record),
          expandedRowKeys: expandedRowKeys,
          onExpandedRowsChange: (expandedKeys) => {
            setExpandedRowKeys(expandedKeys);
            localStorage.setItem('expandedRowKeys', JSON.stringify(expandedKeys));
          }
        }}
        rowKey="key"
        scroll={{
          x: 'max-content',
        }}
        onRow={(record) => {
          return {
            onClick: () => {
              // 找到当前行的展开按钮并触发点击
              const expandButton = document.querySelector(`[data-row-key="${record.key}"] .ant-table-row-expand-icon`);
              if (expandButton) {
                expandButton.click();
              }
            },
            style: { 
              cursor: 'pointer' 
            }
          };
        }}
      >
        <Column title={t('分组名称')} dataIndex="name" key="name" />
      </Table>
    )}
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
      onApiDataChange={onApiDataChange}
    />
  </>
}

export default List;