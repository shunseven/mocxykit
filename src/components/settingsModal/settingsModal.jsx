import { Modal, Tabs } from 'antd';
import { t } from '../../common/fun';
import PublicAccessSettings from './PublicAccessSettings';
import McpSettings from './McpSettings';
import BaseCodeSettings from './BaseCodeSettings';

const SettingsModal = ({ visible, onClose }) => {
  const config = window.__config__ || {};
  const nodeVersionMatch = config.nodeVersion?.match(/^v(\d+)\./);
  const nodeVersionMajor = nodeVersionMatch ? parseInt(nodeVersionMatch[1], 10) : 0;
  const maxNodeVersion = 18;
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
            label: t('公网访问'),
            children: <PublicAccessSettings />
          },
          {
            key: 'mcp',
            label: t('MCP 设置'),
            children: nodeVersionMajor >= maxNodeVersion ? <McpSettings /> : <div>{t(`MCP 服务需要 Node.js ${maxNodeVersion} 或更高版本`)}</div>
          }
        ]}
      />
    </Modal>
  );
};

export default SettingsModal;
