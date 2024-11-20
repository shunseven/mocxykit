import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Table, Button } from 'antd';
import { saveEnvVariables } from '../../api/api';
import { t } from '../../common/fun';

const EnvForm = ({ visible, onCancel, onSuccess, initialValues }) => {
  const [form] = Form.useForm();
  const [envList, setEnvList] = useState([{ key: '', value: '' }]);

  // 当 initialValues 变化时更新 envList
  useEffect(() => {
    if (initialValues?.variables) {
      setEnvList(initialValues.variables);
      // 重置表单值
      form.setFieldsValue({
        name: initialValues.name
      });
    } else {
      setEnvList([{ key: '', value: '' }]);
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleTableRowChange = (index, key, value) => {
    const newEnvList = [...envList];
    newEnvList[index][key] = value;
    setEnvList(newEnvList);
  };

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
        id: initialValues?.id || Date.now(),
        name: values.name,
        variables: envList.filter(item => item.key || item.value) // 过滤掉空行
      });
      onSuccess?.();
      onCancel();
      form.resetFields();
      setEnvList([{ key: '', value: '' }]);
    } catch (err) {
      console.error('保存环境变量失败:', err);
    }
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

  return (
    <Modal
      title={initialValues ? t('编辑环境变量') : t('新增环境变量')}
      open={visible}
      onOk={handleSave}
      onCancel={onCancel}
    >
      <Form 
        form={form} 
        initialValues={initialValues || {}}
      >
        <Form.Item 
          name="name" 
          label={t('名称')} 
          rules={[{ required: true, message: t('请输入环境变量名称') }]}
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
  );
};

export default EnvForm;
