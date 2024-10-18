import { Modal, Space } from "antd";
import JSONEditor from "../mockEditor/jsonEditor";
import React, { useRef } from "react";


export default function HistoryDataPreviewModal({ visible, onCancel, value }) {
  const jsonEditorRef = useRef(null)
  return <div>
    <Space size={10}>
      <div>
      请求时间: {value.time}
      </div>
      <div>
      请求地址: {value.url}
      </div>
    </Space>
    <Modal
    width={1200}
    centered={true}
    onCancel={onCancel}
    title="查看数据"
    footer={null}
    open={visible}>
      <div>
        <JSONEditor jsonEditorRef={jsonEditorRef} value={value.data} />
      </div>
  </Modal>
  </div>
}