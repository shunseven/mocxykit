import React, { useState } from 'react';
import { Modal, Tabs, Card, Collapse, Table, Tag, Typography, Space } from 'antd';
import { t } from '../../common/fun';

const { Panel } = Collapse;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;



/**
 * API文档弹层组件
 * @param {boolean} visible - 是否显示弹层
 * @param {function} onClose - 关闭弹层的回调函数
 * @param {object} apiData - API数据，包含requestSchema和responsesSchema
 */
const ApiDocModal = ({ visible, onClose, apiData }) => {
  const [activeTab, setActiveTab] = useState('request');

  // 渲染JSON Schema为文档
  const renderSchema = (schema, name = '根对象', level = 0) => {
    if (!schema) return <Text type="secondary">{t('无数据')}</Text>;
    
    const properties = schema.properties || {};
    const required = schema.required || [];
    
    const columns = [
      {
        title: t('字段名'),
        dataIndex: 'name',
        key: 'name',
        width: '20%',
      },
      {
        title: t('类型'),
        dataIndex: 'type',
        key: 'type',
        width: '15%',
        render: (type) => <Tag color="blue">{type}</Tag>,
      },
      {
        title: t('必填'),
        dataIndex: 'required',
        key: 'required',
        width: '10%',
        render: (isRequired) => isRequired ? 
          <Tag color="red">{t('是')}</Tag> : 
          <Tag color="green">{t('否')}</Tag>,
      },
      {
        title: t('描述'),
        dataIndex: 'description',
        key: 'description',
      },
    ];
    
    const data = Object.keys(properties).map(key => {
      const prop = properties[key];
      return {
        key,
        name: key,
        type: prop.type || (prop.items ? `array<${prop.items.type}>` : t('对象')),
        required: required.includes(key),
        description: (
          <Space direction="vertical">
            <Text>{prop.description || t('无描述')}</Text>
            {prop.enum && (
              <Text>
                {t('可选值')}: {prop.enum.join(', ')}
              </Text>
            )}
            {prop.default !== undefined && (
              <Text>
                {t('默认值')}: {JSON.stringify(prop.default)}
              </Text>
            )}
          </Space>
        ),
      };
    });
    
    return (
      <Card 
        title={<Title level={level + 3}>{name}</Title>} 
        style={{ marginBottom: 16 }}
      >
        <Paragraph>{schema.description || t('无描述')}</Paragraph>
        
        <Table 
          columns={columns} 
          dataSource={data} 
          pagination={false}
          expandable={{
            expandedRowRender: record => {
              const prop = properties[record.name];
              if (prop.type === 'object' && prop.properties) {
                return renderSchema(prop, record.name, level + 1);
              }
              if (prop.type === 'array' && prop.items && prop.items.type === 'object') {
                return renderSchema(prop.items, `${record.name} ${t('项')}`, level + 1);
              }
              return null;
            },
            rowExpandable: record => {
              const prop = properties[record.name];
              return (
                (prop.type === 'object' && prop.properties) || 
                (prop.type === 'array' && prop.items && prop.items.type === 'object')
              );
            },
          }}
        />
      </Card>
    );
  };

  return (
    <Modal
      title={
        <div>
          <div>{apiData?.name || t('API文档')}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {apiData?.method} {apiData?.url}
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={t('请求参数')} key="request">
          {apiData?.requestSchema ? (
            renderSchema(apiData.requestSchema)
          ) : (
            <Text type="secondary">{t('无请求参数文档')}</Text>
          )}
        </TabPane>
        <TabPane tab={t('响应参数')} key="response">
          {apiData?.responsesSchema ? (
            renderSchema(apiData.responsesSchema)
          ) : (
            <Text type="secondary">{t('无响应参数文档')}</Text>
          )}
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default ApiDocModal; 