import React, { useState, useEffect } from 'react';
import { Card, Switch, Checkbox, InputNumber, Space, Typography, Divider, Row, Col } from 'antd';
import { t } from '../../common/fun';
import { fetchMcpConfig, updateMcpConfig } from '../../api/api';

const { Title, Text } = Typography;

const McpSettings = () => {
  const [mcpConfig, setMcpConfig] = useState({
    open: false,
    editors: ['cursor'],
    port: 3200
  });
  const [loading, setLoading] = useState(false);

  // 从URL获取端口号
  useEffect(() => {
    const url = new URL(window.location.href);
    const port = url.port ? parseInt(url.port) : 3200;
    setMcpConfig(prev => ({ ...prev, port }));
  }, []);

  // 获取MCP配置
  useEffect(() => {
    const getMcpConfig = async () => {
      setLoading(true);
      try {
        const res = await fetchMcpConfig();
        if (res && res.data) {
          setMcpConfig(res.data);
        }
      } catch (error) {
        console.error('获取MCP配置失败:', error);
      } finally {
        setLoading(false);
      }
    };

    getMcpConfig();
  }, []);

  // 处理开关变化
  const handleSwitchChange = async (checked) => {
    const newConfig = { ...mcpConfig, open: checked };
    setMcpConfig(newConfig);
    await updateMcpConfigToServer(newConfig);
  };

  // 处理编辑器选择变化
  const handleEditorChange = async (editor, checked) => {
    let newEditors = [...mcpConfig.editors];
    
    if (checked && !newEditors.includes(editor)) {
      newEditors.push(editor);
    } else if (!checked && newEditors.includes(editor)) {
      newEditors = newEditors.filter(e => e !== editor);
    }
    
    const newConfig = { ...mcpConfig, editors: newEditors };
    setMcpConfig(newConfig);
    await updateMcpConfigToServer(newConfig);
  };

  // 处理端口变化
  const handlePortChange = async (value) => {
    if (value && value > 0) {
      const newConfig = { ...mcpConfig, port: value };
      setMcpConfig(newConfig);
      await updateMcpConfigToServer(newConfig);
    }
  };

  // 更新配置到服务器
  const updateMcpConfigToServer = async (config) => {
    setLoading(true);
    try {
      await updateMcpConfig(config);
    } catch (error) {
      console.error('更新MCP配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={t("MCP 设置")} bordered={false} size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={5} style={{ margin: 0 }}>{t("启用 MCP 服务")}</Title>
          </Col>
          <Col>
            <Switch 
              checked={mcpConfig.open} 
              onChange={handleSwitchChange}
              loading={loading}
            />
          </Col>
        </Row>
        
        {mcpConfig.open && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            
            <Row align="middle" justify="space-between">
              <Col span={24}>
                <Title level={5} style={{ marginTop: 0 }}>{t("编辑器支持")}</Title>
                <Space direction="vertical" size="small">
                  <Checkbox 
                    checked={mcpConfig.editors.includes('cursor')}
                    onChange={(e) => handleEditorChange('cursor', e.target.checked)}
                    disabled={loading}
                  >
                    Cursor
                  </Checkbox>
                  <Checkbox 
                    checked={mcpConfig.editors.includes('windsurf')}
                    onChange={(e) => handleEditorChange('windsurf', e.target.checked)}
                    disabled={true} // 暂不支持windsurf
                  >
                    Windsurf <Text type="secondary">{t("(暂不支持)")}</Text>
                  </Checkbox>
                </Space>
              </Col>
            </Row>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <Row align="middle">
              <Col span={24}>
                <Title level={5} style={{ marginTop: 0 }}>{t("服务端口")}</Title>
                <Space align="center">
                  <InputNumber 
                    min={1000} 
                    max={65535} 
                    value={mcpConfig.port} 
                    onChange={handlePortChange}
                    disabled={loading}
                    style={{ width: '100px' }}
                  />
                  <Text type="secondary">
                    {t("当前服务地址: ")}http://localhost:{mcpConfig.port}/sse
                  </Text>
                </Space>
              </Col>
            </Row>
          </>
        )}
      </Space>
    </Card>
  );
};

export default McpSettings; 