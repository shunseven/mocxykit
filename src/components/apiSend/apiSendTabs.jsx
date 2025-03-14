import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Table, Button, Input, Select, Checkbox, Modal } from 'antd';
import { ImportOutlined, DeleteOutlined } from '@ant-design/icons';
import MockEditor from '../mockEditor/mockEditor';
import { t } from '../../common/fun';

const { TabPane } = Tabs;
const { Option } = Select;

// 参数类型映射
const paramTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' }
];

// 布尔值选项
const booleanOptions = [
  { label: t('是'), value: 'true' },
  { label: t('否'), value: 'false' }
];

// 从 localStorage 获取所有键
const getLocalStorageKeys = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i));
  }
  return keys;
};

const ApiSendTabs = ({ 
  activeTab, 
  setActiveTab, 
  paramsData, 
  setParamsData, 
  headersData, 
  setHeadersData, 
  cookiesData, 
  setCookiesData, 
  bodyData, 
  setBodyData,
  setJsonEditorError
}) => {
  const [localStorageKeys, setLocalStorageKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [showLocalStorageModal, setShowLocalStorageModal] = useState(false);
  
  // 使用 ref 来保存最新的数据，避免被外部更新影响
  const paramsDataRef = useRef(paramsData);
  const headersDataRef = useRef(headersData);
  const cookiesDataRef = useRef(cookiesData);
  const bodyDataRef = useRef(bodyData);
  
  // 更新 ref 中的数据
  useEffect(() => {
    paramsDataRef.current = paramsData;
    headersDataRef.current = headersData;
    cookiesDataRef.current = cookiesData;
    bodyDataRef.current = bodyData;
  }, [paramsData, headersData, cookiesData, bodyData]);

  // 获取 localStorage 键
  useEffect(() => {
    if (showLocalStorageModal) {
      setLocalStorageKeys(getLocalStorageKeys());
    }
  }, [showLocalStorageModal]);

  // 处理参数变化
  const handleParamChange = (index, field, value) => {
    const newData = [...paramsDataRef.current];
    newData[index][field] = value;
    
    // 如果是最后一行且有值，添加新行
    if (index === newData.length - 1 && (newData[index].key || newData[index].value)) {
      newData.push({ key: '', value: '', type: 'string' });
    }
    
    setParamsData(newData);
  };

  // 处理头信息变化
  const handleHeaderChange = (index, field, value) => {
    const newData = [...headersDataRef.current];
    newData[index][field] = value;
    
    // 如果是最后一行且有值，添加新行
    if (index === newData.length - 1 && (newData[index].key || newData[index].value)) {
      newData.push({ key: '', value: '' });
    }
    
    setHeadersData(newData);
  };

  // 处理 Cookie 变化
  const handleCookieChange = (index, field, value) => {
    const newData = [...cookiesDataRef.current];
    newData[index][field] = value;
    
    // 如果是最后一行且有值，添加新行
    if (index === newData.length - 1 && (newData[index].key || newData[index].value)) {
      newData.push({ key: '', value: '' });
    }
    
    setCookiesData(newData);
  };

  // 删除行
  const handleDeleteRow = (index, dataType) => {
    if (dataType === 'params') {
      const newData = [...paramsDataRef.current];
      if (index === newData.length - 1) {
        // 如果是最后一行，清空值
        newData[index] = { key: '', value: '', type: 'string' };
      } else {
        // 否则删除行
        newData.splice(index, 1);
      }
      setParamsData(newData);
    } else if (dataType === 'headers') {
      const newData = [...headersDataRef.current];
      if (index === newData.length - 1) {
        newData[index] = { key: '', value: '' };
      } else {
        newData.splice(index, 1);
      }
      setHeadersData(newData);
    } else if (dataType === 'cookies') {
      const newData = [...cookiesDataRef.current];
      if (index === newData.length - 1) {
        newData[index] = { key: '', value: '' };
      } else {
        newData.splice(index, 1);
      }
      setCookiesData(newData);
    }
  };

  // 从 localStorage 导入
  const handleImportFromLocalStorage = () => {
    const importData = {};
    selectedKeys.forEach(key => {
      try {
        importData[key] = localStorage.getItem(key);
      } catch (e) {
        console.error(`无法获取 localStorage 键 ${key}:`, e);
      }
    });
    
    if (activeTab === 'headers') {
      const newHeaders = [...headersDataRef.current.filter(item => item.key && item.value)];
      Object.entries(importData).forEach(([key, value]) => {
        const existingIndex = newHeaders.findIndex(item => item.key === key);
        if (existingIndex >= 0) {
          newHeaders[existingIndex].value = value;
        } else {
          newHeaders.push({ key, value });
        }
      });
      newHeaders.push({ key: '', value: '' });
      setHeadersData(newHeaders);
    } else if (activeTab === 'cookies') {
      const newCookies = [...cookiesDataRef.current.filter(item => item.key && item.value)];
      Object.entries(importData).forEach(([key, value]) => {
        const existingIndex = newCookies.findIndex(item => item.key === key);
        if (existingIndex >= 0) {
          newCookies[existingIndex].value = value;
        } else {
          newCookies.push({ key, value });
        }
      });
      newCookies.push({ key: '', value: '' });
      setCookiesData(newCookies);
    }
    
    setShowLocalStorageModal(false);
    setSelectedKeys([]);
  };

  // 参数表格列
  const paramsColumns = [
    {
      title: t('参数名'),
      dataIndex: 'key',
      key: 'key',
      width: '30%',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={e => handleParamChange(index, 'key', e.target.value)}
          placeholder={t('参数名')}
        />
      )
    },
    {
      title: t('类型'),
      dataIndex: 'type',
      key: 'type',
      width: '20%',
      render: (text, record, index) => (
        <Select
          value={text}
          onChange={value => handleParamChange(index, 'type', value)}
          style={{ width: '100%' }}
        >
          {paramTypeOptions.map(option => (
            <Option key={option.value} value={option.value}>{option.label}</Option>
          ))}
        </Select>
      )
    },
    {
      title: t('参数值'),
      dataIndex: 'value',
      key: 'value',
      width: '40%',
      render: (text, record, index) => (
        record.type === 'boolean' ? (
          <Select
            value={text}
            onChange={value => handleParamChange(index, 'value', value)}
            style={{ width: '100%' }}
          >
            {booleanOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        ) : (
          <Input
            value={text}
            onChange={e => handleParamChange(index, 'value', e.target.value)}
            placeholder={t('参数值')}
          />
        )
      )
    },
    {
      title: t('操作'),
      key: 'action',
      width: '10%',
      render: (_, record, index) => (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteRow(index, 'params')}
          danger
        />
      )
    }
  ];

  // 头信息表格列
  const headersColumns = [
    {
      title: t('参数名'),
      dataIndex: 'key',
      key: 'key',
      width: '40%',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={e => handleHeaderChange(index, 'key', e.target.value)}
          placeholder={t('参数名')}
        />
      )
    },
    {
      title: t('参数值'),
      dataIndex: 'value',
      key: 'value',
      width: '50%',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={e => handleHeaderChange(index, 'value', e.target.value)}
          placeholder={t('参数值')}
        />
      )
    },
    {
      title: t('操作'),
      key: 'action',
      width: '10%',
      render: (_, record, index) => (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteRow(index, 'headers')}
          danger
        />
      )
    }
  ];

  // Cookie 表格列
  const cookiesColumns = [
    {
      title: t('参数名'),
      dataIndex: 'key',
      key: 'key',
      width: '40%',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={e => handleCookieChange(index, 'key', e.target.value)}
          placeholder={t('参数名')}
        />
      )
    },
    {
      title: t('参数值'),
      dataIndex: 'value',
      key: 'value',
      width: '50%',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={e => handleCookieChange(index, 'value', e.target.value)}
          placeholder={t('参数值')}
        />
      )
    },
    {
      title: t('操作'),
      key: 'action',
      width: '10%',
      render: (_, record, index) => (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteRow(index, 'cookies')}
          danger
        />
      )
    }
  ];

  return (
    <>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={t('Params')} key="params">
          <Table
            dataSource={paramsData}
            columns={paramsColumns}
            pagination={false}
            rowKey={(record, index) => index}
            size="small"
          />
        </TabPane>
        <TabPane tab={t('Body')} key="body">
          <div style={{ height: 300 }}>
            <MockEditor
              value={{ data: [{ responseData: bodyData }] }}
              onChange={(value) => setBodyData(value.data[0].responseData)}
              onStateChange={setJsonEditorError}
              mode="code"
            />
          </div>
        </TabPane>
        <TabPane tab={t('Headers')} key="headers">
          <div style={{ marginBottom: 8 }}>
            <Button
              onClick={() => setShowLocalStorageModal(true)}
              icon={<ImportOutlined />}
              size="small"
            >
              {t('从 localStorage 导入')}
            </Button>
          </div>
          <Table
            dataSource={headersData}
            columns={headersColumns}
            pagination={false}
            rowKey={(record, index) => index}
            size="small"
          />
        </TabPane>
        <TabPane tab={t('Cookies')} key="cookies">
          <div style={{ marginBottom: 8 }}>
            <Button
              onClick={() => setShowLocalStorageModal(true)}
              icon={<ImportOutlined />}
              size="small"
            >
              {t('从 localStorage 导入')}
            </Button>
          </div>
          <Table
            dataSource={cookiesData}
            columns={cookiesColumns}
            pagination={false}
            rowKey={(record, index) => index}
            size="small"
          />
        </TabPane>
      </Tabs>

      {/* localStorage 选择模态框 */}
      <Modal
        title={t('从 localStorage 导入')}
        open={showLocalStorageModal}
        onCancel={() => setShowLocalStorageModal(false)}
        onOk={handleImportFromLocalStorage}
        okText={t('导入')}
        cancelText={t('取消')}
      >
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {localStorageKeys.map(key => (
            <div key={key} style={{ marginBottom: 8 }}>
              <Checkbox
                checked={selectedKeys.includes(key)}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedKeys([...selectedKeys, key]);
                  } else {
                    setSelectedKeys(selectedKeys.filter(k => k !== key));
                  }
                }}
              >
                {key}
              </Checkbox>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default ApiSendTabs;