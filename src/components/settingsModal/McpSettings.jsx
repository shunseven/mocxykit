import React, { useState, useEffect } from 'react';
import { Card, Checkbox, Space, Typography, Divider, Row, Col, message, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { t } from '../../common/fun';
import { fetchMcpConfig, updateMcpConfig } from '../../api/api';

const { Title, Text } = Typography;

const McpSettings = () => {
  const [mcpConfig, setMcpConfig] = useState({
    editors: []
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
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Title level={5} style={{ margin: 0 }}>{t("编辑器支持")}</Title>
          <Text type="secondary">{t("勾选编辑器即可启用 MCP 服务")}</Text>
        </div>

        <div style={{ paddingLeft: 8 }}>
          <Checkbox 
            checked={mcpConfig.editors.includes('vscode')}
            onChange={(e) => handleEditorChange('vscode', e.target.checked)}
            disabled={loading}
          >
            VSCode
          </Checkbox>
        </div>
        
        <div style={{ paddingLeft: 8 }}>
          <Checkbox 
            checked={mcpConfig.editors.includes('cursor')}
            onChange={(e) => handleEditorChange('cursor', e.target.checked)}
            disabled={loading}
          >
            Cursor
          </Checkbox>
        </div>
        
        <div style={{ paddingLeft: 8 }}>
          <Checkbox 
            checked={mcpConfig.editors.includes('windsurf')}
            onChange={(e) => handleEditorChange('windsurf', e.target.checked)}
            disabled={true} // 暂不支持windsurf
          >
            Windsurf <Text type="secondary">{t("暂不支持")}</Text>
          </Checkbox>
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div>
          <Title level={5} style={{ margin: 0 }}>{t("服务地址")}</Title>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
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
        </div>
      </Space>
    </Card>
  );
};

export default McpSettings; 