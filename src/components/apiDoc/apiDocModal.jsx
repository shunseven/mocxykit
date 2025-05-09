import React, { useState } from 'react';
import { Modal, Tabs, Card, Tree, Tag, Typography, Space, Divider, Table } from 'antd';
import PropTypes from 'prop-types';
import { t } from '../../common/fun';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * API文档弹层组件
 * @param {boolean} visible - 是否显示弹层
 * @param {function} onClose - 关闭弹层的回调函数
 * @param {object} apiData - API数据，包含requestSchema和responseSchema
 */
const ApiDocModal = ({ visible, onClose, apiData }) => {
  const [activeTab, setActiveTab] = useState('request');
  const [expandedKeys, setExpandedKeys] = useState([]);

  // 将JSON Schema转换为Tree数据结构
  const convertSchemaToTreeData = (schema, parentKey = '0') => {
    // 处理没有属性的情况
    if (!schema) {
      return [];
    }
    
    // 如果schema没有properties属性，但有type属性，则可能是简单类型或数组
    if (!schema.properties) {
      if (schema.type === 'array' && schema.items) {
        // 处理数组类型
        const arrayKey = `${parentKey}-array`;
        const arrayTitle = (
          <Space>
            <Text strong>{t('数组')}</Text>
            <Tag color="blue">array</Tag>
            {schema.description && (
              <Text type="secondary">{schema.description}</Text>
            )}
          </Space>
        );
        
        // 如果数组项是对象类型
        if (schema.items.type === 'object' && schema.items.properties) {
          return [{
            title: arrayTitle,
            key: arrayKey,
            children: convertSchemaToTreeData(schema.items, arrayKey),
          }];
        }
        
        // 如果数组项是简单类型
        return [{
          title: arrayTitle,
          key: arrayKey,
          children: [{
            title: (
              <Space>
                <Text italic>{t('数组项')}</Text>
                <Tag color="blue">{schema.items.type || '对象'}</Tag>
                {schema.items.description && (
                  <Text type="secondary">{schema.items.description}</Text>
                )}
              </Space>
            ),
            key: `${arrayKey}-item`,
            isLeaf: true,
          }],
        }];
      }
      
      // 如果是其他简单类型
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
        
        // 如果数组项是对象类型且有属性
        if (prop.items.type === 'object' && prop.items.properties) {
          return {
            title: arrayTitle,
            key: currentKey,
            children: convertSchemaToTreeData(prop.items, currentKey),
          };
        }
        
        // 如果数组项是对象类型但没有指定属性（可能是空对象）
        if (prop.items.type === 'object' && !prop.items.properties) {
          return {
            title: arrayTitle,
            key: currentKey,
            children: [{
              title: (
                <Space>
                  <Text italic>{t('空对象')}</Text>
                  <Tag color="blue">object</Tag>
                </Space>
              ),
              key: `${currentKey}-empty-object`,
              isLeaf: true,
            }],
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
            isLeaf: true,
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
    
    let treeData = [];
    
    // 处理顶层为数组类型的情况
    if (schema.type === 'array' && schema.items) {
      const arrayTitle = (
        <Space>
          <Tag color="blue">array</Tag>
          {schema.description && (
            <Text type="secondary">{schema.description}</Text>
          )}
        </Space>
      );
      
      // 如果数组项是对象类型且有属性
      if (schema.items.type === 'object' && schema.items.properties) {
        treeData = [{
          title: arrayTitle,
          key: 'root-array',
          children: convertSchemaToTreeData(schema.items, 'root-array'),
        }];
      } else {
        // 如果数组项是简单类型
        treeData = [{
          title: arrayTitle,
          key: 'root-array',
          children: [{
            title: (
              <Space>
                <Text italic>{t('数组项')}</Text>
                <Tag color="blue">{schema.items.type || '对象'}</Tag>
                {schema.items.description && (
                  <Text type="secondary">{schema.items.description}</Text>
                )}
              </Space>
            ),
            key: 'root-array-item',
            isLeaf: true,
          }],
        }];
      }
    } else {
      // 非数组类型
      treeData = convertSchemaToTreeData(schema);
    }
    
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

  // 渲染参数文档（Path参数和Query参数）
  const renderParametersDoc = (parameters) => {
    if (!parameters || (!parameters.path?.length && !parameters.query?.length)) {
      return null;
    }

    const columns = [
      {
        title: t('参数名'),
        dataIndex: 'name',
        key: 'name',
        width: '20%',
      },
      {
        title: t('类型'),
        dataIndex: 'type',
        key: 'type',
        width: '15%',
        render: (text) => <Tag color="blue">{text || 'string'}</Tag>,
      },
      {
        title: t('必填'),
        dataIndex: 'required',
        key: 'required',
        width: '10%',
        render: (required) => required ? <Tag color="red">{t('是')}</Tag> : <Tag>{t('否')}</Tag>,
      },
      {
        title: t('描述'),
        dataIndex: 'description',
        key: 'description',
      },
    ];

    return (
      <>
        {parameters.path && parameters.path.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>{t('Path 参数')}</Title>
            <Table
              columns={columns}
              dataSource={parameters.path.map((item, index) => ({ ...item, key: `path-${index}` }))}
              pagination={false}
              size="small"
              bordered
            />
          </div>
        )}
        
        {parameters.query && parameters.query.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>{t('Query 参数')}</Title>
            <Table
              columns={columns}
              dataSource={parameters.query.map((item, index) => ({ ...item, key: `query-${index}` }))}
              pagination={false}
              size="small"
              bordered
            />
          </div>
        )}
      </>
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
          {apiData?.parameters && renderParametersDoc(apiData.parameters)}
          
          {apiData?.requestSchema && Object.keys(apiData.requestSchema).length > 0 && (
            <Title level={5}>{t('Body 参数')}</Title>
          )}
          
          {apiData?.requestSchema && Object.keys(apiData.requestSchema).length > 0 ? (
            renderSchemaDoc(apiData.requestSchema)
          ) : (
            !apiData?.parameters && <Text type="secondary">{t('无请求参数文档')}</Text>
          )}
        </TabPane>
        <TabPane tab={t('响应参数')} key="response">
          {apiData?.responseSchema ? (
            renderSchemaDoc(apiData.responseSchema)
          ) : (
            <Text type="secondary">{t('无响应参数文档')}</Text>
          )}
        </TabPane>
      </Tabs>
    </Modal>
  );
};

// 定义组件的PropTypes
ApiDocModal.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  apiData: PropTypes.shape({
    name: PropTypes.string,
    method: PropTypes.string,
    url: PropTypes.string,
    parameters: PropTypes.object,
    requestSchema: PropTypes.object,
    responseSchema: PropTypes.object
  })
};

// 默认属性值
ApiDocModal.defaultProps = {
  visible: false,
  onClose: () => {},
  apiData: {}
};

export default ApiDocModal; 