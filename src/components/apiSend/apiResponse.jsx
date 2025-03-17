import React from 'react';
import { Tabs, Tag, Button, message } from 'antd';
import { ImportOutlined } from '@ant-design/icons';
import JsonEditor from '../mockEditor/jsonEditor';
import { t } from '../../common/fun';
import { saveRequestData } from '../../api/api';

const ApiResponse = ({ responseData, jsonEditorRef, url, method, paramsData, headersData, cookiesData, bodyData, onApiDataChange, key }) => {
  // 导入到Mock数据
  const handleImportToMock = async () => {
    try {
      // 构建请求数据对象
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
      
      // 构建 mockData 对象
      
      // 发送请求保存数据
      await saveRequestData({
        url,
        requestData: requestDataObj,
        mockData: responseData.body
      });
      
      // 调用 onApiDataChange 更新 API 列表
      if (onApiDataChange) {
        onApiDataChange();
      }
      
      message.success(t('导入Mock数据成功'));
    } catch (error) {
      console.error('导入Mock数据失败', error);
      message.error(t('导入Mock数据失败') + ': ' + error.message);
    }
  };

  if (!responseData) {
    return null;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        <Button
          type="primary"
          icon={<ImportOutlined />}
          onClick={handleImportToMock}
        >
          {t('导入Mock数据')}
        </Button>
      </div>
      <Tabs defaultActiveKey="response">
        <Tabs.TabPane tab={t('响应数据')} key="response">
          <div>
            {responseData.error ? (
              <pre style={{ margin: 0 }}>{responseData.message}</pre>
            ) : (
              <JsonEditor
                value={typeof responseData.body === 'object' ? responseData.body : responseData.body}
                mode="view"
                jsonEditorRef={jsonEditorRef}
              />
            )}
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
  );
};

export default ApiResponse; 