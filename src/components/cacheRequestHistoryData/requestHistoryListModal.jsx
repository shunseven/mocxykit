import { Button, Modal, Table, Input } from "antd";
import React, { useEffect, useState } from "react";
import { getCacheRequestHistory } from "../../api/api";
const { Search } = Input;

export default function RequestHistoryListModal({ visible, onCancel }) {
  const [requsetCacheHistory, setRequestCacheHistory] = useState([]);
  useEffect(() => {
    let timer;
    if (visible) {
      getCacheRequestHistory().then((data) => {
        setRequestCacheHistory(data)
      })
      timer = setInterval(() => {
        getCacheRequestHistory().then((data) => {
          setRequestCacheHistory(data)
        })
      }, 1000)
    } 
    return () => {
      clearInterval(timer)
    }
  }, [visible]);
  return <Modal
    width={1200}
    centered={true}
    onCancel={onCancel}
    title="历史请求数据"
    footer={null}
    open={visible}>
      <div>
        <div style={{
          margin: '20px 0',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Search placeholder="input search text"
            onSearch={(value) => {
              setRequestCacheHistory(requsetCacheHistory.filter(item => item.url.includes(value)))
            }}
            style={{
              width: 200,
            }} 
          />
          <div>
            <Button type="primary">批量导入MOCK数据</Button>
            <Button color="danger" variant="link">清空当前数据</Button>
          </div>
         
        </div>
        <Table
          rowSelection={{
            type: 'checkbox',
            onChange: (selectedRowKeys, selectedRows) => {
              console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
            }
          }}
          scroll={{
            y: 800
          }} pagination={false} dataSource={requsetCacheHistory}>
          <Table.Column title="URL" dataIndex="url" key="url" />
          <Table.Column title="请求时间" dataIndex="time" key="time" />
          <Table.Column
        title="操作"
        key="action"
        fixed="right"
        width={160}
        render={(_, record) => (
          <div>
            <a
              onClick={() => {
              }}
              style={{
                marginRight: '10px'
              }}>查看数据</a>
             <a
                onClick={() => {
                  event.stopPropagation()
                }}
                style={{
                  color: '#389e0d'
                }}
              >导入数据</a>

          </div>
        )}
      />
        </Table>  
      </div>
    
  </Modal>
}