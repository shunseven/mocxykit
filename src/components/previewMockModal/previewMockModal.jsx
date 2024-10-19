import { Modal } from "antd";
import MockEditor from "../mockEditor/mockEditor";
import { useEffect, useState } from "react";
import { fetctApiItemDataAndMockData } from "../../api/api";
import './previewMockModal.css'
import { t } from "../../common/fun";

export default function PreviewMockModal(props) {
  const { onCancel, visible, targetKey } = props;
  const [mockData, setMockData] = useState('');
 
  useEffect(() => {
    if (targetKey && visible) {
      fetctApiItemDataAndMockData({
        key: targetKey
      }).then(data => {
        if (data.mockData) {
          setMockData(data.mockData)
        }
      })
    }
  }, [targetKey, visible])

  return <Modal
    className="preview-modal"
    centered={true}
    onCancel={() => {
      onCancel()
    }}
    title={t('查看MOCK数据')}
    okText=""
    cancelText={t('取消')}
    footer={null}
    open={visible}>
    
    {
      mockData && <MockEditor mode="view" value={mockData} onChange={setMockData} />
    }
  </Modal>
}