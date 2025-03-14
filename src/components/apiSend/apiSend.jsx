import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Tabs, Table, Select, Tooltip, Checkbox, message, Space, Tag } from 'antd';
import { SendOutlined, ImportOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import MockEditor from '../mockEditor/mockEditor';
import { getCacheRequestHistory } from '../../api/api';
import { t } from '../../common/fun';
import axios from 'axios';

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

// 解析 cookie 字符串
const parseCookies = () => {
  const cookies = {};
  document.cookie.split(';').forEach(cookie => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) cookies[key] = value;
  });
  return cookies;
};

// 从 localStorage 获取所有键
const getLocalStorageKeys = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i));
  }
  return keys;
};

const ApiSend = ({ visible, onClose, apiData, fromHistory }) => {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [activeTab, setActiveTab] = useState('params');
  const [paramsData, setParamsData] = useState([{ key: '', value: '', type: 'string' }]);
  const [headersData, setHeadersData] = useState([{ key: '', value: '' }]);
  const [cookiesData, setCookiesData] = useState([{ key: '', value: '' }]);
  const [bodyData, setBodyData] = useState({});
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localStorageKeys, setLocalStorageKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [showLocalStorageModal, setShowLocalStorageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [jsonEditorError, setJsonEditorError] = useState(false);

  // 初始化数据
  useEffect(() => {
    if (visible && apiData) {
      // 设置 URL 和方法
      setUrl(apiData.url || '');
      
      // 如果有 requestData，优先使用它
      if (apiData.requestData) {
        setMethod(apiData.requestData.method || 'GET');
        
        // 设置参数
        if (apiData.requestData.params) {
          const params = Object.entries(apiData.requestData.params).map(([key, value]) => ({
            key,
            value: String(value),
            type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string'
          }));
          setParamsData([...params, { key: '', value: '', type: 'string' }]);
        }
        
        // 设置请求头
        if (apiData.requestData.headers) {
          const headers = Object.entries(apiData.requestData.headers).map(([key, value]) => ({
            key,
            value: String(value)
          }));
          setHeadersData([...headers, { key: '', value: '' }]);
        }
        
        // 设置 Cookie
        if (apiData.requestData.cookie) {
          const cookies = Object.entries(apiData.requestData.cookie).map(([key, value]) => ({
            key,
            value: String(value)
          }));
          setCookiesData([...cookies, { key: '', value: '' }]);
        }
        
        // 设置请求体
        if (apiData.requestData.body) {
          setBodyData(apiData.requestData.body);
        }
      } else if (apiData.parameters || apiData.requestSchema) {
        // 如果有 docInfo，使用它初始化
        
        // 设置方法
        setMethod(apiData.method || 'GET');
        
        // 从 parameters 设置查询参数
        if (apiData.parameters && apiData.parameters.query) {
          const params = apiData.parameters.query
            .filter(param => param.enable !== false)
            .map(param => ({
              key: param.name,
              value: '',
              type: param.type === 'integer' || param.type === 'number' ? 'number' : 
                    param.type === 'boolean' ? 'boolean' : 'string'
            }));
          setParamsData([...params, { key: '', value: '', type: 'string' }]);
        }
        
        // 如果有 requestSchema，设置为 body 的初始值
        if (apiData.requestSchema) {
          try {
            // 这里可以根据 schema 生成示例数据，简单起见，我们使用空对象
            setBodyData({});
          } catch (error) {
            console.error('解析 requestSchema 失败', error);
            setBodyData({});
          }
        }
      } else {
        // 默认值
        setMethod('GET');
        setParamsData([{ key: '', value: '', type: 'string' }]);
        setHeadersData([{ key: '', value: '' }]);
        setCookiesData([{ key: '', value: '' }]);
        setBodyData({});
      }
      
      // 初始化 cookie 数据
      const browserCookies = parseCookies();
      if (Object.keys(browserCookies).length > 0 && !apiData.requestData?.cookie) {
        const cookies = Object.entries(browserCookies).map(([key, value]) => ({
          key,
          value
        }));
        setCookiesData([...cookies, { key: '', value: '' }]);
      }
      
      // 重置响应数据
      setResponseData(null);
    }
  }, [visible, apiData]);

  // 获取 localStorage 键
  useEffect(() => {
    if (showLocalStorageModal) {
      setLocalStorageKeys(getLocalStorageKeys());
    }
  }, [showLocalStorageModal]);

  // 处理参数变化
  const handleParamChange = (index, field, value) => {
    const newData = [...paramsData];
    newData[index][field] = value;
    
    // 如果是最后一行且有值，添加新行
    if (index === newData.length - 1 && (newData[index].key || newData[index].value)) {
      newData.push({ key: '', value: '', type: 'string' });
    }
    
    setParamsData(newData);
  };

  // 处理头信息变化
  const handleHeaderChange = (index, field, value) => {
    const newData = [...headersData];
    newData[index][field] = value;
    
    // 如果是最后一行且有值，添加新行
    if (index === newData.length - 1 && (newData[index].key || newData[index].value)) {
      newData.push({ key: '', value: '' });
    }
    
    setHeadersData(newData);
  };

  // 处理 Cookie 变化
  const handleCookieChange = (index, field, value) => {
    const newData = [...cookiesData];
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
      const newData = [...paramsData];
      if (index === newData.length - 1) {
        // 如果是最后一行，清空值
        newData[index] = { key: '', value: '', type: 'string' };
      } else {
        // 否则删除行
        newData.splice(index, 1);
      }
      setParamsData(newData);
    } else if (dataType === 'headers') {
      const newData = [...headersData];
      if (index === newData.length - 1) {
        newData[index] = { key: '', value: '' };
      } else {
        newData.splice(index, 1);
      }
      setHeadersData(newData);
    } else if (dataType === 'cookies') {
      const newData = [...cookiesData];
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
      const newHeaders = [...headersData.filter(item => item.key && item.value)];
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
      const newCookies = [...cookiesData.filter(item => item.key && item.value)];
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

  // 加载历史请求数据
  const loadHistoryData = async () => {
    try {
      const data = await getCacheRequestHistory();
      // 过滤出与当前 URL 匹配的历史记录
      const filteredData = data.filter(item => item.url === apiData.url);
      setHistoryData(filteredData);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('获取历史请求数据失败', error);
      message.error(t('获取历史请求数据失败'));
    }
  };

  // 导入历史请求数据
  const importHistoryData = () => {
    if (!selectedHistoryItem) {
      message.warning(t('请选择一条历史记录'));
      return;
    }
    
    // 设置方法
    setMethod(selectedHistoryItem.method || 'GET');
    
    // 设置参数
    if (selectedHistoryItem.params) {
      const params = Object.entries(selectedHistoryItem.params).map(([key, value]) => ({
        key,
        value: String(value),
        type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string'
      }));
      setParamsData([...params, { key: '', value: '', type: 'string' }]);
    }
    
    // 设置请求头
    if (selectedHistoryItem.reqHeaders) {
      const headers = Object.entries(selectedHistoryItem.reqHeaders).map(([key, value]) => ({
        key,
        value: String(value)
      }));
      setHeadersData([...headers, { key: '', value: '' }]);
    }
    
    // 设置 Cookie
    if (selectedHistoryItem.cookie) {
      const cookies = Object.entries(selectedHistoryItem.cookie).map(([key, value]) => ({
        key,
        value: String(value)
      }));
      setCookiesData([...cookies, { key: '', value: '' }]);
    }
    
    // 设置请求体
    if (selectedHistoryItem.reqBody) {
      setBodyData(selectedHistoryItem.reqBody);
    }
    
    setShowHistoryModal(false);
  };

  // 发送请求
  const sendRequest = async () => {
    if (!url) {
      message.warning(t('请输入 URL'));
      return;
    }
    
    if (jsonEditorError && activeTab === 'body') {
      message.warning(t('请求体 JSON 格式错误，请修正后再发送'));
      return;
    }
    
    setLoading(true);
    setResponseData(null);
    
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      paramsData.forEach(param => {
        if (param.key && param.value) {
          let value = param.value;
          if (param.type === 'number') {
            value = Number(param.value);
          } else if (param.type === 'boolean') {
            value = param.value === 'true';
          }
          queryParams.append(param.key, value);
        }
      });
      
      // 构建请求头
      const headers = {};
      headersData.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });
      
      // 设置 Content-Type
      if (method !== 'GET' && method !== 'HEAD' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      
      // 构建 Cookie
      const cookieStr = cookiesData
        .filter(cookie => cookie.key && cookie.value)
        .map(cookie => `${cookie.key}=${cookie.value}`)
        .join('; ');
      
      if (cookieStr) {
        headers['Cookie'] = cookieStr;
      }
      
      // 构建完整 URL
      const fullUrl = `${url}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      // 发送请求
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(bodyData) : undefined,
        credentials: 'include'
      });
      
      // 解析响应
      let responseBody;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
      
      // 获取响应头
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // 设置响应数据
      setResponseData({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody
      });
      
      message.success(t('请求发送成功'));
    } catch (error) {
      console.error('请求发送失败', error);
      setResponseData({
        error: true,
        message: error.message
      });
      message.error(t('请求发送失败') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 保存请求数据到 ApiList
  const saveRequestData = async () => {
    if (!url) {
      message.warning(t('请输入 URL'));
      return;
    }
    
    if (jsonEditorError && activeTab === 'body') {
      message.warning(t('请求体 JSON 格式错误，请修正后再发送'));
      return;
    }
    
    try {
      // 构建请求数据
      const requestDataObj = {
        method,
        headers: {},
        params: {},
        cookie: {},
        body: bodyData
      };
      
      // 添加请求头
      headersData.forEach(header => {
        if (header.key && header.value) {
          requestDataObj.headers[header.key] = header.value;
        }
      });
      
      // 添加参数
      paramsData.forEach(param => {
        if (param.key && param.value) {
          let value = param.value;
          if (param.type === 'number') {
            value = Number(param.value);
          } else if (param.type === 'boolean') {
            value = param.value === 'true';
          }
          requestDataObj.params[param.key] = value;
        }
      });
      
      // 添加 Cookie
      cookiesData.forEach(cookie => {
        if (cookie.key && cookie.value) {
          requestDataObj.cookie[cookie.key] = cookie.value;
        }
      });
      
      // 发送请求保存数据
      const response = await axios.post('/express-proxy-mock/save-request-data', {
        url,
        requestData: requestDataObj
      });
      
      if (response.data.success) {
        message.success(t('保存请求数据成功'));
      } else {
        message.error(t('保存请求数据失败') + ': ' + response.data.message);
      }
    } catch (error) {
      console.error('保存请求数据失败', error);
      message.error(t('保存请求数据失败') + ': ' + error.message);
    }
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

  // 历史记录表格列
  const historyColumns = [
    {
      title: t('请求时间'),
      dataIndex: 'time',
      key: 'time',
      width: '30%'
    },
    {
      title: t('请求方法'),
      dataIndex: 'method',
      key: 'method',
      width: '20%',
      render: method => <Tag color="blue">{method}</Tag>
    },
    {
      title: t('参数数量'),
      key: 'paramsCount',
      width: '20%',
      render: (_, record) => (
        <Space>
          {record.params && Object.keys(record.params).length > 0 && (
            <Tag color="green">{t('参数')}: {Object.keys(record.params).length}</Tag>
          )}
          {record.reqBody && Object.keys(record.reqBody).length > 0 && (
            <Tag color="purple">{t('请求体')}</Tag>
          )}
        </Space>
      )
    },
    {
      title: t('状态'),
      key: 'status',
      width: '30%',
      render: (_, record) => (
        <Space>
          {record.resHeaders && record.resHeaders['content-type'] && (
            <Tag color="cyan">{record.resHeaders['content-type'].split(';')[0]}</Tag>
          )}
          {record.data && record.data.apifoxError ? (
            <Tag color="red">{t('错误')}</Tag>
          ) : (
            <Tag color="green">{t('成功')}</Tag>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      <Modal
        title={t('发送请求')}
        open={visible}
        onCancel={onClose}
        width={1000}
        footer={null}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', marginBottom: 16 }}>
            <Select
              value={method}
              onChange={setMethod}
              style={{ width: 100 }}
            >
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
              <Option value="PATCH">PATCH</Option>
              <Option value="HEAD">HEAD</Option>
              <Option value="OPTIONS">OPTIONS</Option>
            </Select>
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={t('请输入请求 URL')}
              style={{ flex: 1, marginLeft: 8, marginRight: 8 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendRequest}
              loading={loading}
            >
              {t('发送')}
            </Button>
            {!fromHistory && !selectedHistoryItem && (
              <Button
                style={{ marginLeft: 8 }}
                icon={<ImportOutlined />}
                onClick={loadHistoryData}
              >
                {t('导入最近请求数据')}
              </Button>
            )}
            {!fromHistory && (
              <Button
                style={{ marginLeft: 8 }}
                icon={<SaveOutlined />}
                onClick={saveRequestData}
              >
                {t('保存到 API 列表')}
              </Button>
            )}
          </div>

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
        </div>

        {responseData && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <h3>
                {t('响应')}
                {responseData.status && (
                  <Tag 
                    color={responseData.status >= 200 && responseData.status < 300 ? 'green' : 'red'}
                    style={{ marginLeft: 8 }}
                  >
                    {responseData.status} {responseData.statusText}
                  </Tag>
                )}
              </h3>
            </div>
            <Tabs defaultActiveKey="response">
              <TabPane tab={t('响应数据')} key="response">
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  <pre style={{ margin: 0 }}>
                    {responseData.error 
                      ? responseData.message 
                      : typeof responseData.body === 'object' 
                        ? JSON.stringify(responseData.body, null, 2) 
                        : responseData.body}
                  </pre>
                </div>
              </TabPane>
              <TabPane tab={t('响应头')} key="headers">
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  {responseData.headers && Object.entries(responseData.headers).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: 4 }}>
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
                </div>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Modal>

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

      {/* 历史记录模态框 */}
      <Modal
        title={t('导入最近请求数据')}
        open={showHistoryModal}
        onCancel={() => setShowHistoryModal(false)}
        onOk={importHistoryData}
        okText={t('导入')}
        cancelText={t('取消')}
        width={800}
      >
        <Table
          dataSource={historyData}
          columns={historyColumns}
          pagination={false}
          rowKey="key"
          rowSelection={{
            type: 'radio',
            onChange: (selectedRowKeys, selectedRows) => {
              setSelectedHistoryItem(selectedRows[0]);
            }
          }}
        />
      </Modal>
    </>
  );
};

export default ApiSend;
