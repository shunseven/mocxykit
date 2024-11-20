import React, { useState, useEffect } from 'react';
import { Select, Button, Modal, Form, Input, Table } from 'antd';
import { saveEnvVariables, getEnvVariables, changeEnvVariable } from '../../api/api';

const EnvConfig = ({ value, onChange }) => {
  const [envModalVisible, setEnvModalVisible] = useState(false);
  const [envList, setEnvList] = useState([{ key: '', value: '' }]);
  const [envVariables, setEnvVariables] = useState([]);
  const [form] = Form.useForm();

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

  const handleTableRowChange = (index, key, value) => {
    const newEnvList = [...envList];
    newEnvList[index][key] = value;
    setEnvList(newEnvList);
  };

  const envColumns = [
    {
      title: 'Key',
      dataIndex: 'key',
      render: (text, record, index) => (
        <Input 
          value={text} 
          onChange={e => handleTableRowChange(index, 'key', e.target.value)} 
        />
      )
    },
    {
      title: 'Value',
      dataIndex: 'value',
      render: (text, record, index) => (
        <Input 
          value={text} 
          onChange={e => handleTableRowChange(index, 'value', e.target.value)} 
        />
      )
    },
    {
      title: '操作',
      render: (_, record, index) => (
        <>
          <Button type="link" onClick={() => handleAddEnvRow()}>+</Button>
          {index > 0 && <Button type="link" onClick={() => handleDeleteEnvRow(index)}>-</Button>}
        </>
      )
    }
  ];

  const handleAddEnvRow = () => {
    setEnvList([...envList, { key: '', value: '' }]);
  };

  const handleDeleteEnvRow = (index) => {
    const newEnvList = envList.filter((_, i) => i !== index);
    setEnvList(newEnvList);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await saveEnvVariables({
        id: Date.now(), // 添加时间戳作为唯一ID
        name: values.name,
        variables: envList
      });
      setEnvModalVisible(false);
      setEnvList([{ key: '', value: '' }]);
      form.resetFields();
      fetchEnvVariables(); // 保存后刷新数据
    } catch (err) {
      console.error('保存环境变量失败:', err);
    }
  };

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
      <Select 
        style={{ width: 200 }} 
        placeholder="选择环境变量"
        value={value || ''} // 使用空字符串代替 undefined
        onChange={handleEnvChange}
        allowClear    // 允许清除选择
      >
        <Select.Option value=''>无</Select.Option>
        {Array.isArray(envVariables) && envVariables.map(env => (
          <Select.Option key={env.id} value={env.id}>{env.name}</Select.Option>
        ))}
      </Select>
      <Button 
        type="primary" 
        onClick={() => setEnvModalVisible(true)} 
        style={{ marginLeft: 10 }}
      >
        新增环境变量
      </Button>

      <Modal
        title="新增环境变量"
        visible={envModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setEnvModalVisible(false);
          setEnvList([{ key: '', value: '' }]);
          form.resetFields();
        }}
      >
        <Form form={form}>
          <Form.Item 
            name="name" 
            label="名称" 
            rules={[{ required: true, message: '请输入环境变量名称' }]}
          >
            <Input />
          </Form.Item>
          <Table
            columns={envColumns}
            dataSource={envList}
            pagination={false}
            rowKey={(record, index) => index}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default EnvConfig;