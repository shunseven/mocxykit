import React, { useEffect, useState } from 'react';
import { Button, Modal } from 'antd';
import { changeEnvVariable } from '../../api/api';
import EnvSelect from '../envSelect/envSelect';
import EnvForm from '../envForm/envForm';
import { t } from '../../common/fun';


let preEnvId = null; // 上一个环境变量ID
const EnvConfig = ({ value, onChange, disabled }) => {
  const [envModalVisible, setEnvModalVisible] = useState(false);

  const handleEnvChange = async (envId) => {
    try {
      await changeEnvVariable(envId);
      onChange?.(); // 调用父组件的回调函数
    } catch (err) {
      console.error('切换环境变量失败:', err);
    }
  };

  useEffect(() => {
    if (preEnvId !== null) {
      Modal.confirm({
        title: '提示',
        content: '是否清除本页所有缓存数据？',
        onOk: () => {
          console.log('请除本也所有缓存数据');
          localStorage.clear();
          sessionStorage.clear();
          document.cookie.split(";").forEach((cookie) => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
          });
        }
      });
    }
    preEnvId = value; // 记录上一个环境变量ID
  }, [value]);

  return (
    <div style={{ display: 'inline-block', marginLeft: 20 }}>
      <EnvSelect 
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
          onChange?.(); // 刷新环境变量列表
        }}
      />
    </div>
  );
};

export default EnvConfig;
