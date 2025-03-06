import { Modal, Tabs } from 'antd';
import { t } from '../../common/fun';
import PublicAccessSettings from './PublicAccessSettings';
import McpSettings from './McpSettings';
import BaseCodeSettings from './BaseCodeSettings';

const SettingsModal = ({ visible, onClose }) => {
  return (
    <Modal
      title={t("设置")}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={680} // 增加模态框宽度
    >
      <Tabs
        defaultActiveKey="baseCode"
        items={[
          {
            key: 'baseCode',
            label: t('基本配置'),
            children: <BaseCodeSettings onClose={onClose} />
          },
          {
            key: 'publicAccess',
            label: t('公共访问'),
            children: <PublicAccessSettings />
          },
          {
            key: 'mcp',
            label: t('MCP 设置'),
            children: <McpSettings />
          }
        ]}
      />
    </Modal>
  );
};

export default SettingsModal;
