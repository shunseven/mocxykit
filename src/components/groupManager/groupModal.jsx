import { useState, useEffect } from 'react';
import { Modal, Input, Button, Select, Form, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getAllGroupFolders, setApiGroupFolder } from '../../api/api';
import { t } from '../../common/fun';

const GroupModal = ({ visible, onCancel, selectedKeys, onSuccess }) => {
  const [form] = Form.useForm();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isNewGroup, setIsNewGroup] = useState(false);

  // 获取所有分组
  useEffect(() => {
    if (visible) {
      loadGroups();
    }
  }, [visible]);

  // 加载分组数据
  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await getAllGroupFolders();
      if (response) {
        setGroups(response);
      }
    } catch (error) {
      console.error('获取分组数据失败:', error);
      message.error(t('获取分组数据失败'));
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      let forderId = values.forderId;
      let forderName = values.forderName;
      
      // 如果是新建分组
      if (isNewGroup) {
        // 使用新分组名称作为ID和名称
        forderId = `group-${Date.now()}`;
        forderName = values.newGroupName;
      }
      
      // 发送请求
      const response = await setApiGroupFolder({
        keys: selectedKeys, // 选中的API keys
        forderId,
        forderName
      });
      
      if (response && response.msg === 'success') {
        message.success(t('设置分组成功'));
        onSuccess && onSuccess();
        onCancel();
      } else {
        message.error(t('设置分组失败'));
      }
    } catch (error) {
      console.error('设置分组失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 选择项改变
  const handleSelectChange = (value) => {
    setIsNewGroup(value === 'new');
    form.setFieldsValue({
      forderId: value
    });
  };

  return (
    <Modal
      title={t('API分组管理')}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('取消')}
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
          disabled={selectedKeys.length === 0}
        >
          {t('确定')}
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="forderId"
          label={t('选择分组')}
          rules={[{ required: true, message: t('请选择一个分组或创建新分组') }]}
        >
          <Select
            placeholder={t('请选择分组')}
            onChange={handleSelectChange}
            loading={loading}
          >
            <Select.Option value="ungrouped">{t('未分组')}</Select.Option>
            {groups.map(group => (
              <Select.Option key={group.id} value={group.id}>
                {group.name}
              </Select.Option>
            ))}
            <Select.Option value="new">
              <PlusOutlined /> {t('创建新分组')}
            </Select.Option>
          </Select>
        </Form.Item>

        {isNewGroup && (
          <Form.Item
            name="newGroupName"
            label={t('新分组名称')}
            rules={[{ required: true, message: t('请输入新分组名称') }]}
          >
            <Input placeholder={t('请输入新分组名称')} />
          </Form.Item>
        )}
        
        <div style={{ marginBottom: 16 }}>
          {selectedKeys.length > 0 ? (
            <span>{t('将选中的')} {selectedKeys.length} {t('项移动到此分组')}</span>
          ) : (
            <span style={{ color: '#ff4d4f' }}>{t('请先选择要分组的API')}</span>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default GroupModal;
