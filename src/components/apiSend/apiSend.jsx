import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Tabs, Table, Select, message, Space, Tag } from 'antd';
import { SendOutlined, ImportOutlined } from '@ant-design/icons';
import { getCacheRequestHistory } from '../../api/api';
import { t } from '../../common/fun';
import axios from 'axios';
import ApiSendTabs from './apiSendTabs';

const { Option } = Select;

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
  
  // 使用 ref 来跟踪组件是否已经初始化
  const initializedRef = useRef(false);
  // 使用 ref 来保存初始化的 apiData
  const initialApiDataRef = useRef(null);
  // 使用 ref 来保存最新的数据，避免被外部更新影响
  const paramsDataRef = useRef(paramsData);
  const headersDataRef = useRef(headersData);
  const cookiesDataRef = useRef(cookiesData);
  const bodyDataRef = useRef(bodyData);

  // 初始化数据
  useEffect(() => {
    if (visible && apiData && !initializedRef.current) {
      // 保存初始的 apiData
      initialApiDataRef.current = JSON.parse(JSON.stringify(apiData));
      
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
      if (Object.keys(browserCookies).length > 0) {
        // 创建一个映射来存储所有 cookie
        const cookieMap = {};
        
        // 先添加浏览器中的 cookie
        Object.entries(browserCookies).forEach(([key, value]) => {
          cookieMap[key] = value;
        });
        
        // 如果有传入的 cookie，添加到映射中并覆盖同名的浏览器 cookie
        if (apiData.requestData?.cookie) {
          Object.entries(apiData.requestData.cookie).forEach(([key, value]) => {
            cookieMap[key] = String(value);
          });
        }
        
        // 转换为数组格式
        const cookies = Object.entries(cookieMap).map(([key, value]) => ({
          key,
          value
        }));
        
        // 设置 cookie 数据
        setCookiesData([...cookies, { key: '', value: '' }]);
      } else if (apiData.requestData?.cookie) {
        // 如果没有浏览器 cookie 但有传入的 cookie
        const cookies = Object.entries(apiData.requestData.cookie).map(([key, value]) => ({
          key,
          value: String(value)
        }));
        setCookiesData([...cookies, { key: '', value: '' }]);
      }
      
      // 重置响应数据
      setResponseData(null);
      
      // 标记为已初始化
      initializedRef.current = true;
    }
    
    // 当组件关闭时，重置初始化标志
    if (!visible) {
      initializedRef.current = false;
      initialApiDataRef.current = null;
    }
    
    // 更新 ref 中的数据
    paramsDataRef.current = paramsData;
    headersDataRef.current = headersData;
    cookiesDataRef.current = cookiesData;
    bodyDataRef.current = bodyData;
  }, [visible, apiData, paramsData, headersData, cookiesData, bodyData]);

  // 获取 localStorage 键
  useEffect(() => {
    if (showLocalStorageModal) {
      setLocalStorageKeys(getLocalStorageKeys());
    }
  }, [showLocalStorageModal]);

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
      // 使用 ref 中的数据
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
      // 使用 ref 中的数据
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

  // 加载历史请求数据
  const loadHistoryData = async () => {
    try {
      const data = await getCacheRequestHistory();
      // 过滤出与当前 URL 匹配的历史记录
      const filteredData = data.filter(item => item.url === url);
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
      // 更新 ref
      paramsDataRef.current = [...params, { key: '', value: '', type: 'string' }];
    }
    
    // 设置请求头
    if (selectedHistoryItem.reqHeaders) {
      const headers = Object.entries(selectedHistoryItem.reqHeaders).map(([key, value]) => ({
        key,
        value: String(value)
      }));
      setHeadersData([...headers, { key: '', value: '' }]);
      // 更新 ref
      headersDataRef.current = [...headers, { key: '', value: '' }];
    }
    
    // 设置 Cookie
    if (selectedHistoryItem.cookie) {
      const cookies = Object.entries(selectedHistoryItem.cookie).map(([key, value]) => ({
        key,
        value: String(value)
      }));
      setCookiesData([...cookies, { key: '', value: '' }]);
      // 更新 ref
      cookiesDataRef.current = [...cookies, { key: '', value: '' }];
    }
    
    // 设置请求体
    if (selectedHistoryItem.reqBody) {
      setBodyData(selectedHistoryItem.reqBody);
      // 更新 ref
      bodyDataRef.current = selectedHistoryItem.reqBody;
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
      paramsDataRef.current.forEach(param => {
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
      headersDataRef.current.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });
      
      // 设置 Content-Type
      if (method !== 'GET' && method !== 'HEAD' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      
      // 构建 Cookie
      const cookieStr = cookiesDataRef.current
        .filter(cookie => cookie.key && cookie.value)
        .map(cookie => `${cookie.key}=${cookie.value}`)
        .join('; ');
      
      if (cookieStr) {
        headers['Mocxykit-Cookie'] = cookieStr;
      }
      
      // 构建完整 URL
      const fullUrl = `${url}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      // 发送请求
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(bodyDataRef.current) : undefined,
        credentials: 'omit'
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
      
      // 如果不是从历史记录中发送的请求，自动保存到 API 列表
      if (!fromHistory) {
        saveRequestData();
      }
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
      return;
    }
    
    if (jsonEditorError && activeTab === 'body') {
      return;
    }
    
    try {
      // 构建请求数据
      const requestDataObj = {
        method,
        headers: {},
        params: {},
        cookie: {},
        body: bodyDataRef.current
      };
      
      // 添加请求头
      headersDataRef.current.forEach(header => {
        if (header.key && header.value) {
          requestDataObj.headers[header.key] = header.value;
        }
      });
      
      // 添加参数
      paramsDataRef.current.forEach(param => {
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
      cookiesDataRef.current.forEach(cookie => {
        if (cookie.key && cookie.value) {
          requestDataObj.cookie[cookie.key] = cookie.value;
        }
      });
      
      // 发送请求保存数据
      await axios.post('/express-proxy-mock/save-request-data', {
        url,
        requestData: requestDataObj
      });
      
      // 不再显示成功消息，因为已经在发送请求成功后显示了
    } catch (error) {
      console.error('保存请求数据失败', error);
      // 只在控制台记录错误，不向用户显示
    }
  };

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
          </div>

          <ApiSendTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            paramsData={paramsData}
            setParamsData={setParamsData}
            headersData={headersData}
            setHeadersData={setHeadersData}
            cookiesData={cookiesData}
            setCookiesData={setCookiesData}
            bodyData={bodyData}
            setBodyData={setBodyData}
            setJsonEditorError={setJsonEditorError}
          />
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
              <Tabs.TabPane tab={t('响应数据')} key="response">
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  <pre style={{ margin: 0 }}>
                    {responseData.error 
                      ? responseData.message 
                      : typeof responseData.body === 'object' 
                        ? JSON.stringify(responseData.body, null, 2) 
                        : responseData.body}
                  </pre>
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab={t('响应头')} key="headers">
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  {responseData.headers && Object.entries(responseData.headers).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: 4 }}>
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
                </div>
              </Tabs.TabPane>
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
