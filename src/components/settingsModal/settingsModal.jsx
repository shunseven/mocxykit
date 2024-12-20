import { Modal, Button, Input, Typography, Space, message } from 'antd';
import { SyncOutlined, SwapOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { enablePublicAccess } from '../../api/api';
import { t } from '../../common/fun';

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
      message.error(t('请输入 Ngrok Authtoken'));
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
        message.success(t('已开启公网访问'));
      }
    } catch (error) {
      message.error(t('开启公网访问失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowInputs(true);
  };

  const handleToggleView = () => {
    setShowInputs(!showInputs);
  };

  const handleRefreshUrl = async () => {
    try {
      setLoading(true);
      const response = await enablePublicAccess({ authtoken });
      if (response.success) {
        localStorage.setItem(URL_STORAGE_KEY, response.url);
        localStorage.setItem(URL_TIMESTAMP_KEY, Date.now().toString());
        setPublicUrl(response.url);
        message.success(t('已更新公网访问地址'));
      }
    } catch (error) {
      message.error(t('更新公网访问地址失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t("设置")}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={680} // 增加模态框宽度
    >
      <div style={{ marginBottom: 16 }}>
        {showInputs ? (
          <Space style={{ width: '100%' }}>
            <Input
              placeholder={t("请输入 Ngrok Authtoken")}
              value={authtoken}
              onChange={e => setAuthtoken(e.target.value)}
              style={{ width: 300 }}
            />
            <Button 
              type="primary" 
              onClick={handleEnablePublicAccess}
              loading={loading}
            >
              {t("开启公网访问")}
            </Button>
            <Link href="https://dashboard.ngrok.com/signup" target="_blank">
              {t("获取Ngrok authtoken")}
            </Link>
            {publicUrl && (
              <Button 
                type="text" 
                icon={<SwapOutlined />}
                onClick={handleToggleView}
              />
            )}
          </Space>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text strong>{t("公网访问地址：")}</Text>
              <Text copyable>{publicUrl}</Text>
            </div>
            <Space>
              <Button 
                type="text" 
                icon={<SyncOutlined />}
                onClick={handleRefreshUrl}
                loading={loading}
              />
              <Button 
                type="text" 
                icon={<SwapOutlined />}
                onClick={handleToggleView}
              />
            </Space>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SettingsModal;
