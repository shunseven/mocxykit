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
      // 清空之前的数据，避免显示旧数据
      setMockData('');
      fetctApiItemDataAndMockData({
        key: targetKey
      }).then(data => {
        if (data.mockData) {
          setMockData(data.mockData)
        }
      })
    }
  }, [targetKey, visible])

  // 当modal关闭时清空数据
  useEffect(() => {
    if (!visible) {
      setMockData('');
    }
  }, [visible])

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