import { Modal } from "antd";
import MockEditor from "./mockEditor";
import { useEffect, useState } from "react";
import { fetctApiItemDataAndMockData } from "../../api/api";
import './editModal'

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
    className="edit-modal"
    centered={true}
    onCancel={() => {
      onCancel()
    }}
    title="查看MOCK数据"
    okText=""
    cancelText="取消"
    open={visible}>
    {
      mockData && <MockEditor mode="view" value={mockData} onChange={setMockData} />
    }
  </Modal>
}