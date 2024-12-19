import { Modal, Button, message } from 'antd';
import { useState } from 'react';
import { enablePublicAccess } from '../../api/api';

const SettingsModal = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  const handleEnablePublicAccess = async () => {
    try {
      setLoading(true);
      const response = await enablePublicAccess();
      if (response.success) {
        setPublicUrl(response.url);
        message.success('已开启外网访问');
      }
    } catch (error) {
      message.error('开启外网访问失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="设置"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          onClick={handleEnablePublicAccess}
          loading={loading}
        >
          开启外网访问
        </Button>
        {publicUrl && (
          <div style={{ marginTop: 8 }}>
            外网访问地址：{publicUrl}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SettingsModal;
