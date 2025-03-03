import { Modal, Space } from "antd";
import JSONEditor from "../mockEditor/jsonEditor";
import React, { useRef } from "react";
import { t } from "../../common/fun";


export default function HistoryDataPreviewModal({ visible, onCancel, value }) {
  const jsonEditorRef = useRef(null)
  return <div>
    <Modal
    width={1200}
    centered={true}
    onCancel={onCancel}
    title={t('查看数据')}
    footer={null}
    open={visible}>
      <div >
        <Space style={{
        margin: '0px 0 10px 0',
      }} size={50}>
          <div>
          {t('请求地址')}: {value.url}
          </div>
          <div>
          {t('请求时间')}: {value.time}
          </div>
        </Space>
        <JSONEditor jsonEditorRef={jsonEditorRef} value={value.data} />
      </div>
  </Modal>
  </div>
}