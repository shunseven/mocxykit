import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Switch, InputNumber, Space, Button, message } from 'antd';
import { t } from '../../common/fun';
import { fetchBaseConfig, updateBaseConfig } from '../../api/api';

const { Option } = Select;

const BaseCodeSettings = ({ onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetchBaseConfig();
      if (res && res.data) {
        form.setFieldsValue(res.data);
      }
    } catch (error) {
      console.error(t('获取基本配置失败:'), error);
      message.error(t('获取基本配置失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await updateBaseConfig(values);
      if (res && res.success) {
        message.success(t('基本配置保存成功'));
        if (onClose) {
          onClose();
        }
      } else {
        message.error(t('基本配置保存失败'));
      }
    } catch (error) {
      console.error(t('保存基本配置失败:'), error);
      message.error(t('基本配置保存失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card bordered={false} size="small">
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 15 }}
        initialValues={{
          apiRule: '/api',
          configPath: '',
          https: false,
          cacheRequestHistoryMaxLen: 30,
          lang: 'zh',
          buttonPosition: 'bottom'
        }}
        size="small"
      >
        <Form.Item
          name="apiRule"
          label={t("API规则")}
          tooltip={t("设置API请求的匹配规则，可以是字符串或字符串数组")}
          rules={[{ required: true, message: t('请输入API规则') }]}
        >
          <Input placeholder={t("例如: /api")} />
        </Form.Item>

        <Form.Item
          name="configPath"
          label={t("配制页面的地址")}
          tooltip={t("打开配制页面的地址，默认为http://localhost:xxxx/config")}
        >
          <Input placeholder={t("例如: ./config")} />
        </Form.Item>

        <Form.Item
          name="cacheRequestHistoryMaxLen"
          label={t("缓存请求历史最大个数")}
          tooltip={t("缓存请求历史的最大个数")}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="lang"
          label={t("语言")}
          tooltip={t("设置界面语言")}
        >
          <Select>
            <Option value="zh">{t("中文")}</Option>
            <Option value="en">{t("英文")}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="buttonPosition"
          label={t("按钮位置")}
          tooltip={t("设置按钮的位置")}
        >
          <Select>
            <Option value="top">{t("顶部")}</Option>
            <Option value="middle">{t("中间")}</Option>
            <Option value="bottom">{t("底部")}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="https"
          label={t("启用HTTPS")}
          valuePropName="checked"
          tooltip={t("是否启用HTTPS")}
        >
          <Switch />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
          <Space>
            <Button type="primary" onClick={handleSave} loading={loading}>
              {t("保存配置")}
            </Button>
            <Button onClick={fetchConfig} loading={loading}>
              {t("重置")}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BaseCodeSettings; 