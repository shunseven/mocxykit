import React, { useState, useRef } from 'react';
import { Button } from 'antd';
import { changeEnvVariable } from '../../api/api';
import EnvSelect from '../envSelect/envSelect';
import EnvForm from '../envForm/envForm';
import { t } from '../../common/fun';

const EnvConfig = ({ value, onChange, disabled }) => {
  const [envModalVisible, setEnvModalVisible] = useState(false);
  const envSelectRef = useRef();

  const handleEnvChange = async (envId) => {
    try {
      await changeEnvVariable(envId);
      onChange?.(); // 调用父组件的回调函数
    } catch (err) {
      console.error('切换环境变量失败:', err);
    }
  };

  return (
    <div style={{ display: 'inline-block', marginLeft: 20 }}>
      <EnvSelect 
        ref={envSelectRef}
        value={value} 
        onChange={handleEnvChange}
        style={{ width: 200 }}
        disabled={disabled}
      />
      <Button 
        type="primary" 
        onClick={() => setEnvModalVisible(true)} 
        style={{ marginLeft: 10 }}
      >
        {t('新增环境变量')}
      </Button>

      <EnvForm
        visible={envModalVisible}
        onCancel={() => setEnvModalVisible(false)}
        onSuccess={() => {
          setEnvModalVisible(false);
          envSelectRef.current?.fetchEnvVariables(); // 调用子组件的刷新方法
          onChange?.(); // 刷新环境变量列表
        }}
      />
    </div>
  );
};

export default EnvConfig;
