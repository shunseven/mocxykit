import { Modal, Tabs } from 'antd';
import { t } from '../../common/fun';
import PublicAccessSettings from './PublicAccessSettings';
import McpSettings from './McpSettings';

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
        defaultActiveKey="publicAccess"
        items={[
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
