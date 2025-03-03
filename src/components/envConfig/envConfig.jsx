import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, message } from 'antd';
import { PlusCircleOutlined, SyncOutlined, CopyOutlined } from '@ant-design/icons';
import { changeEnvVariable, refreshEnvVariable } from '../../api/api';
import EnvSelect from '../envSelect/envSelect';
import EnvForm from '../envForm/envForm';
import { t, clearLocalCache } from '../../common/fun';

const MCP_SERVER_URL = `http://127.0.0.1:${window.location.port || ''}/sse`; // MCP server 地址根据当前端口动态生成

let preEnvId = null; // 上一个环境变量ID
const EnvConfig = ({ value, onChange, disabled, proxyList, onProxyChange }) => {
  const [envModalVisible, setEnvModalVisible] = useState(false);
  const selectRef = useRef();

  const handleEnvChange = async (envId) => {
    try {
      await changeEnvVariable(envId);
      
      // 检查是否有代理绑定了这个环境变量
      if (envId) {
        const boundProxies = proxyList.filter(proxy => proxy.bindEnvId === envId);
        // 如果只有一个代理绑定了这个环境变量，则自动切换到该代理
        if (boundProxies.length === 1) {
          await onProxyChange?.({ proxy: boundProxies[0].proxy });
        }
      }
      
      onChange?.(); // 调用父组件的回调函数
      clearLocalCache();
    } catch (err) {
      console.error('切换环境变量失败:', err);
    }
  };

  const handleRefresh = async () => {
    clearLocalCache();
    try {
      await refreshEnvVariable();
      selectRef.current?.fetchEnvVariables();
      onChange?.();
      message.success(t('刷新成功'));
    } catch (err) {
      console.error('刷新环境变量失败:', err);
      message.error(t('刷新失败'));
    }
  };

  const handleCopyMCPUrl = () => {
    navigator.clipboard.writeText(MCP_SERVER_URL).then(() => {
      message.success(t('复制成功'));
    }).catch(() => {
      message.error(t('复制失败'));
    });
  };

  return (
    <div style={{ display: 'inline-flex', marginLeft: 20 }}>
      <div tyle={{ display: 'inline-flex' }} >
        
        <Button
          type="text"
          icon={<CopyOutlined />}
          onClick={handleCopyMCPUrl}
          style={{ marginRight: 8, marginLeft: 4, color: '#1890ff' }}
          title={t('复制 MCP Server URL')}
        >
          COPY MCP SERVER
        </Button>
      </div>
     
      <span style={{ marginRight: 8 }}>{t('环境变量')}:</span>
      <EnvSelect 
        value={value} 
        onChange={handleEnvChange}
        style={{ width: 200 }}
        disabled={disabled}
        ref={selectRef}
      />
      <Button 
        type="primary" 
        icon={<PlusCircleOutlined />}
        onClick={() => setEnvModalVisible(true)} 
        style={{ marginLeft: 10 }}
      />
      <Button 
        icon={<SyncOutlined />}
        onClick={handleRefresh} 
        style={{ marginLeft: 10 }}
      />

      <EnvForm
        visible={envModalVisible}
        onCancel={() => setEnvModalVisible(false)}
        onSuccess={() => {
          setEnvModalVisible(false);
          selectRef.current?.fetchEnvVariables(); // 刷新环境变量列表
          onChange?.();
        }}
      />
    </div>
  );
};

export default EnvConfig;
