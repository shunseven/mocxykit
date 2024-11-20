import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Select, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { getEnvVariables, deleteEnvVariable } from '../../api/api';
import EnvForm from '../envForm/envForm';
import { t } from '../../common/fun';

const EnvSelect = forwardRef(({ value, onChange, style, disabled }, ref) => {
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

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    fetchEnvVariables
  }));

  const handleEdit = (e, envId) => {
    e.stopPropagation();
    const env = envVariables.find(env => env.id === envId);
    setCurrentEnv(env);
    setEditVisible(true);
  };

  const handleDelete = async (e, envId) => {
    e.stopPropagation();
    try {
      await deleteEnvVariable(envId);
      await fetchEnvVariables();
      if (value === envId) {
        onChange?.(undefined);
      }
    } catch (err) {
      console.error('删除环境变量失败:', err);
    }
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
              <Space>
                <EditOutlined 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEdit(e, env.id);
                  }}
                  style={{ visibility: disabled && env.id !== value ? 'hidden' : 'visible' }}
                />
                <Popconfirm
                  title={t("确认删除")}
                  description={t("是否确认删除该环境变量?")}
                  onConfirm={(e) => {
                    e?.preventDefault();
                    e?.stopPropagation();
                    handleDelete(e, env.id);
                  }}
                  okText={t("确认")}
                  cancelText={t("取消")}
                >
                  <DeleteOutlined
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    style={{ 
                      visibility: disabled && env.id !== value ? 'hidden' : 'visible',
                      color: '#ff4d4f'
                    }}
                  />
                </Popconfirm>
              </Space>
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
});

export default EnvSelect;
