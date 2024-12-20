import { Modal, Button, Input, Typography, Space, message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { enablePublicAccess } from '../../api/api';

const { Text, Link } = Typography;
const STORAGE_KEY = 'ngrok_authtoken';
const URL_STORAGE_KEY = 'ngrok_public_url';

const SettingsModal = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [authtoken, setAuthtoken] = useState('');
  const [showInputs, setShowInputs] = useState(true);

  // 从本地存储加载数据
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY);
    const savedUrl = localStorage.getItem(URL_STORAGE_KEY);
    
    if (savedToken) {
      setAuthtoken(savedToken);
    }
    
    if (savedUrl) {
      setPublicUrl(savedUrl);
      setShowInputs(false);
    }
  }, []);

  const handleEnablePublicAccess = async () => {
    if (!authtoken) {
      message.error('请输入 Ngrok Authtoken');
      return;
    }

    try {
      setLoading(true);
      const response = await enablePublicAccess({ authtoken });
      if (response.success) {
        // 保存 token 和 url 到本地
        localStorage.setItem(STORAGE_KEY, authtoken);
        localStorage.setItem(URL_STORAGE_KEY, response.url);
        setPublicUrl(response.url);
        setShowInputs(false);
        message.success('已开启外网访问');
      }
    } catch (error) {
      message.error('开启外网访问失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowInputs(true);
    localStorage.removeItem(URL_STORAGE_KEY); // 清除保存的 URL
  };

  return (
    <Modal
      title="设置"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600} // 增加模态框宽度
    >
      <div style={{ marginBottom: 16 }}>
        {showInputs ? (
          <Space style={{ width: '100%' }}>
            <Input
              placeholder="请输入 Ngrok Authtoken"
              value={authtoken}
              onChange={e => setAuthtoken(e.target.value)}
              style={{ width: 320 }}
            />
            <Link href="https://dashboard.ngrok.com/signup" target="_blank">
              注册Ngrok账号
            </Link>
            <Button 
              type="primary" 
              onClick={handleEnablePublicAccess}
              loading={loading}
            >
              开启外网访问
            </Button>
          </Space>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text strong>外网访问地址：</Text>
              <Text copyable>{publicUrl}</Text>
            </div>
            <Button 
              type="text" 
              icon={<SyncOutlined />}
              onClick={handleReset}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SettingsModal;
