import { Space, Table, Tag, Radio, Button, Popconfirm, Input, Tooltip } from 'antd';
import { PushpinOutlined, SearchOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { t } from '../../common/fun';

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

function ApiTable({
  data,
  globalProxy,
  onTargetChange,
  onApiDataChange,
  selectedRowKeys,
  onSelectedRowsChange,
  recentlyImported,
  pinnedItems,
  onTogglePin,
  searchText,
  onItemEdit,
  onPreviewMock,
  onViewDoc,
  onSendRequest,
  showRowSelection = true,
  handleBatchChange,
}) {

  const rowSelection = showRowSelection ? {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      onSelectedRowsChange(newSelectedRowKeys);
    },
  } : null;

  return (
    <Table
      rowSelection={rowSelection}
      pagination={false}
      dataSource={data}
      onRow={(record) => {
        const isImported = recentlyImported?.includes(record.key);
        const isSelected = selectedRowKeys?.includes(record.key);

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
              onChange={e => onSearchChange(e.target.value)}
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (target === 'mock') {
                    onPreviewMock(itemData.key);
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
        title={<>
          {t('启用')}
          <Space size="small" style={{ marginLeft: '10px' }}>
            <Button
              size='small'
              style={{
                borderColor: '#f50',
                color: '#f50'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleBatchChange('proxy');
              }}
            >{t('全局代理')}</Button>
            <Button
              style={{
                color: '#389e0d',
                borderColor: '#389e0d'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleBatchChange('mock');
              }}
              size='small'
            >{t('MOCK数据')}</Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleBatchChange('customProxy');
              }}
              size='small'
            >{t('自定义代理')}</Button>
          </Space>
        </>}
        width={380}
        render={(record, itemData) => (
          <>
           <Tooltip title={pinnedItems?.includes(record.key) ? t('取消固定') : t('固定')}>
            <PushpinOutlined
              style={{
                cursor: 'pointer',
                color: pinnedItems?.includes(record.key) ? '#1890ff' : '#d9d9d9'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(record.key);
              }}
            />
          </Tooltip>
          <Radio.Group style={{ marginLeft: 10 }} name="radiogroup" onChange={(event) => {
            event.stopPropagation();
            onTargetChange({
              key: itemData.key,
              target: event.target.value
            });
          }} value={itemData.target}>
            <Space>
              <Radio value={'proxy'}>{t('全局代理')}</Radio>
              <Radio disabled={!itemData.hasMockData} value={'mock'}>{t('MOCK数据')}</Radio>
              <Radio disabled={!itemData.selectCustomProxy} value={'customProxy'}>{t('自定义代理')}</Radio>
            </Space>
          </Radio.Group>
          </>
        )} key="address" />

      <Column
        title={t('操作')}
        key="action"
        fixed="right"
        width={260}
        render={(_, record) => (
          <Space size="middle">
            <a
              onClick={(e) => {
                e.stopPropagation();
                onItemEdit(record.key);
              }}
              style={{
                marginRight: '10px'
              }}>{t('设置')}</a>
            {(record.requestSchema || record.responseSchema) && (
              <a
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDoc(record);
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
              onClick={(e) => {
                e.stopPropagation();
                onSendRequest(record);
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
              onConfirm={(e) => {
                fetchDeleteApiData({
                  key: record.key,
                });
                onApiDataChange();
              }}
              okText={t('删除')}
              cancelText={t('取消')}
            >
              <a
                onClick={(e) => {
                  e.stopPropagation();
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
  );
}

export default ApiTable;
