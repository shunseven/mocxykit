import React, { useState } from 'react';
import { Modal, Tabs, Card, Tree, Tag, Typography, Space, Divider } from 'antd';
import { t } from '../../common/fun';

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
  const [expandedKeys, setExpandedKeys] = useState([]);

  // 将JSON Schema转换为Tree数据结构
  const convertSchemaToTreeData = (schema, parentKey = '0') => {
    if (!schema || !schema.properties) {
      return [];
    }

    const properties = schema.properties || {};
    const required = schema.required || [];
    
    return Object.keys(properties).map((key, index) => {
      const prop = properties[key];
      const currentKey = `${parentKey}-${index}`;
      const isRequired = required.includes(key);
      
      // 构建标题，包含字段名、类型和是否必填
      const title = (
        <Space>
          <Text strong>{key}</Text>
          <Tag color="blue">{prop.type || '对象'}</Tag>
          {isRequired && <Tag color="red">{t('必填')}</Tag>}
          {prop.description && (
            <Text type="secondary">{prop.description}</Text>
          )}
        </Space>
      );
      
      // 处理嵌套对象
      if (prop.type === 'object' && prop.properties) {
        return {
          title,
          key: currentKey,
          children: convertSchemaToTreeData(prop, currentKey),
        };
      }
      
      // 处理数组类型
      if (prop.type === 'array' && prop.items) {
        const arrayTitle = (
          <Space>
            <Text strong>{key}</Text>
            <Tag color="blue">array</Tag>
            {isRequired && <Tag color="red">{t('必填')}</Tag>}
            {prop.description && (
              <Text type="secondary">{prop.description}</Text>
            )}
          </Space>
        );
        
        // 如果数组项是对象类型
        if (prop.items.type === 'object' && prop.items.properties) {
          return {
            title: arrayTitle,
            key: currentKey,
            children: convertSchemaToTreeData(prop.items, currentKey),
          };
        }
        
        // 如果数组项是简单类型
        return {
          title: arrayTitle,
          key: currentKey,
          children: [{
            title: (
              <Space>
                <Text italic>{t('数组项')}</Text>
                <Tag color="blue">{prop.items.type || '对象'}</Tag>
                {prop.items.description && (
                  <Text type="secondary">{prop.items.description}</Text>
                )}
              </Space>
            ),
            key: `${currentKey}-item`,
          }],
        };
      }
      
      // 处理简单类型
      return {
        title,
        key: currentKey,
        isLeaf: true,
        // 添加额外信息
        ...(prop.enum && {
          children: [{
            title: (
              <Text type="secondary">
                {t('可选值')}: {prop.enum.join(', ')}
              </Text>
            ),
            key: `${currentKey}-enum`,
            isLeaf: true,
          }]
        }),
      };
    });
  };

  // 收集所有树节点的key，用于默认展开
  const collectAllKeys = (treeData) => {
    let keys = [];
    const traverse = (nodes) => {
      if (!nodes) return;
      nodes.forEach(node => {
        keys.push(node.key);
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(treeData);
    return keys;
  };

  // 渲染Schema文档
  const renderSchemaDoc = (schema) => {
    if (!schema) return <Text type="secondary">{t('无数据')}</Text>;
    
    const treeData = convertSchemaToTreeData(schema);
    
    // 设置所有节点的key用于默认展开
    if (expandedKeys.length === 0 && treeData.length > 0) {
      const allKeys = collectAllKeys(treeData);
      setExpandedKeys(allKeys);
    }
    
    return (
      <Card>
        {schema.description && (
          <>
            <Paragraph>{schema.description}</Paragraph>
            <Divider />
          </>
        )}
        
        <Tree
          showLine
          defaultExpandAll={true}
          expandedKeys={expandedKeys}
          onExpand={setExpandedKeys}
          treeData={treeData}
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
            renderSchemaDoc(apiData.requestSchema)
          ) : (
            <Text type="secondary">{t('无请求参数文档')}</Text>
          )}
        </TabPane>
        <TabPane tab={t('响应参数')} key="response">
          {apiData?.responsesSchema ? (
            renderSchemaDoc(apiData.responsesSchema)
          ) : (
            <Text type="secondary">{t('无响应参数文档')}</Text>
          )}
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default ApiDocModal; 