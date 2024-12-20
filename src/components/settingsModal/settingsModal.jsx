import { Modal, Button, Input, Typography, Space, message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { enablePublicAccess } from '../../api/api';

const { Text, Link } = Typography;
const STORAGE_KEY = 'ngrok_authtoken';
const URL_STORAGE_KEY = 'ngrok_public_url';
const URL_TIMESTAMP_KEY = 'ngrok_url_timestamp';
const URL_EXPIRATION_TIME = 2 * 60 * 60 * 1000; // 2小时，单位毫秒

const SettingsModal = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [authtoken, setAuthtoken] = useState('');
  const [showInputs, setShowInputs] = useState(true);

  // 从本地存储加载数据
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY);
    const savedUrl = localStorage.getItem(URL_STORAGE_KEY);
    const savedTimestamp = localStorage.getItem(URL_TIMESTAMP_KEY);
    
    if (savedToken) {
      setAuthtoken(savedToken);
    }
    
    if (savedUrl && savedTimestamp) {
      const now = Date.now();
      const isExpired = now - parseInt(savedTimestamp) > URL_EXPIRATION_TIME;
      
      if (!isExpired) {
        setPublicUrl(savedUrl);
        setShowInputs(false);
      } else {
        // URL已过期，清除相关存储
        localStorage.removeItem(URL_STORAGE_KEY);
        localStorage.removeItem(URL_TIMESTAMP_KEY);
        setShowInputs(true);
      }
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
        // 保存 token、url 和时间戳到本地
        localStorage.setItem(STORAGE_KEY, authtoken);
        localStorage.setItem(URL_STORAGE_KEY, response.url);
        localStorage.setItem(URL_TIMESTAMP_KEY, Date.now().toString());
        setPublicUrl(response.url);
        setShowInputs(false);
        message.success('已开启公网访问');
      }
    } catch (error) {
      message.error('开启公网访问失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowInputs(true);
    localStorage.removeItem(URL_STORAGE_KEY); // 清除保存的 URL
    localStorage.removeItem(URL_TIMESTAMP_KEY);
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
              开启公网访问
            </Button>
          </Space>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text strong>公网访问地址：</Text>
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
