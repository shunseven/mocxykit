import React from 'react';
import { Select } from 'antd';
import { useEffect, useState } from 'react';
import { getEnvVariables } from '../../api/api';

const EnvSelect = ({ value, onChange, style }) => {
  const [envVariables, setEnvVariables] = useState([]);

  useEffect(() => {
    fetchEnvVariables();
  }, []);

  const fetchEnvVariables = async () => {
    try {
      const data = await getEnvVariables();
      setEnvVariables(data);
    } catch (err) {
      console.error('获取环境变量失败:', err);
    }
  };

  return (
    <Select 
      style={style} 
      placeholder="选择环境变量"
      value={value} 
      onChange={onChange}
      allowClear
    >
      <Select.Option value={undefined}>无</Select.Option>
      {Array.isArray(envVariables) && envVariables.map(env => (
        <Select.Option key={env.id} value={env.id}>{env.name}</Select.Option>
      ))}
    </Select>
  );
};

export default EnvSelect;
