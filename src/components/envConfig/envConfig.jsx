import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, message } from 'antd';
import { PlusCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { changeEnvVariable, refreshEnvVariable } from '../../api/api';
import EnvSelect from '../envSelect/envSelect';
import EnvForm from '../envForm/envForm';
import { t, clearLocalCache } from '../../common/fun';


let preEnvId = null; // 上一个环境变量ID
const EnvConfig = ({ value, onChange, disabled }) => {
  const [envModalVisible, setEnvModalVisible] = useState(false);
  const selectRef = useRef();

  const handleEnvChange = async (envId) => {
    try {
      await changeEnvVariable(envId);
      onChange?.(); // 调用父组件的回调函数
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

  useEffect(() => {
    if (preEnvId !== null) {
      Modal.confirm({
        title: t('提示'),
        content: t('是否清除本页所有缓存数据'),
        onOk: () => {
          console.log('请除本地所有缓存数据');
          clearLocalCache();
        }
      });
    }
    preEnvId = value; // 记录上一个环境变量ID
  }, [value]);

  return (
    <div style={{ display: 'inline-block', marginLeft: 20 }}>
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
