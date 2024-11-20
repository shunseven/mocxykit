import React, { useState } from 'react';
import { Select, Space } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { getEnvVariables } from '../../api/api';
import EnvForm from '../envForm/envForm';

const EnvSelect = ({ value, onChange, style, disabled }) => {
  const [envVariables, setEnvVariables] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [currentEnv, setCurrentEnv] = useState(null);

  const fetchEnvVariables = async () => {
    try {
      const data = await getEnvVariables();
      setEnvVariables(data);
    } catch (err) {
      console.error('获取环境变量失败:', err);
    }
  };

  useEffect(() => {
    fetchEnvVariables();
  }, []);

  const handleEdit = (e, envId) => {
    e.stopPropagation();
    const env = envVariables.find(env => env.id === envId);
    setCurrentEnv(env);
    setEditVisible(true);
  };

  const dropdownRender = (menu) => {
    return disabled ? null : menu;
  };

  return (
    <>
      <Select 
        style={style} 
        placeholder="选择环境变量"
        value={value} 
        onChange={onChange}
        allowClear
        open={disabled ? false : undefined}
        dropdownRender={dropdownRender}
      >
        <Select.Option value={undefined}>无</Select.Option>
        {Array.isArray(envVariables) && envVariables.map(env => (
          <Select.Option key={env.id} value={env.id}>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <span>{env.name}</span>
              <EditOutlined 
                onClick={(e) => handleEdit(e, env.id)}
                style={{ visibility: disabled && env.id !== value ? 'hidden' : 'visible' }}
              />
            </Space>
          </Select.Option>
        ))}
      </Select>

      <EnvForm
        visible={editVisible}
        initialValues={currentEnv}
        onCancel={() => {
          setEditVisible(false);
          setCurrentEnv(null);
        }}
        onSuccess={() => {
          fetchEnvVariables();
        }}
      />
    </>
  );
};

export default EnvSelect;
