import React, { useState, useEffect } from 'react';
import { Card, Switch, Checkbox, Space, Typography, Divider, Row, Col, message, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { t } from '../../common/fun';
import { fetchMcpConfig, updateMcpConfig } from '../../api/api';

const { Title, Text } = Typography;

const McpSettings = () => {
  const [mcpConfig, setMcpConfig] = useState({
    open: false,
    editors: ['cursor']
  });
  const [port, setPort] = useState(3200);
  const [loading, setLoading] = useState(false);

  // 从URL获取端口号
  useEffect(() => {
    const url = new URL(window.location.href);
    const urlPort = url.port ? parseInt(url.port) : 3200;
    setPort(urlPort);
  }, []);

  // 获取MCP配置
  useEffect(() => {
    const getMcpConfig = async () => {
      setLoading(true);
      try {
        const res = await fetchMcpConfig();
        if (res && res.data) {
          // 设置配置，包括编辑器选择状态
          setMcpConfig(res.data);
          console.log('获取到的MCP配置:', res.data);
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

  // 更新配置到服务器
  const updateMcpConfigToServer = async (config) => {
    setLoading(true);
    try {
      // 发送请求时包含端口信息
      const res = await updateMcpConfig({
        ...config,
        port: port
      });
      
      // 如果服务器返回了更新后的配置，使用它
      if (res && res.data) {
        setMcpConfig(res.data);
        console.log('更新后的MCP配置:', res.data);
      }
    } catch (error) {
      console.error('更新MCP配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 复制SSE URL到剪贴板
  const copySSEUrl = () => {
    const sseUrl = `http://localhost:${port}/sse`;
    navigator.clipboard.writeText(sseUrl)
      .then(() => {
        message.success(t('服务地址已复制到剪贴板'));
      })
      .catch(err => {
        console.error('复制失败:', err);
        message.error(t('复制失败'));
      });
  };

  // 获取SSE URL
  const getSSEUrl = () => `http://localhost:${port}/sse`;

  return (
    <Card bordered={false} size="small">
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
                    Windsurf <Text type="secondary">{t("暂不支持")}</Text>
                  </Checkbox>
                </Space>
              </Col>
            </Row>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <Row align="middle">
              <Col span={24}>
                <Title level={5} style={{ marginTop: 0 }}>{t("服务地址")}</Title>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text code style={{ fontSize: '14px' }}>
                    {getSSEUrl()}
                  </Text>
                  <Tooltip title={t("复制服务地址")}>
                    <CopyOutlined 
                      onClick={copySSEUrl} 
                      style={{ 
                        marginLeft: 8, 
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#1890ff'
                      }} 
                    />
                  </Tooltip>
                </div>
              </Col>
            </Row>
          </>
        )}
      </Space>
    </Card>
  );
};

export default McpSettings; 