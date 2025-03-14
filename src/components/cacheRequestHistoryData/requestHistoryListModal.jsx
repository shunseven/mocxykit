import { Button, Modal, Table, Input } from "antd";
import React, { useEffect, useState } from "react";
import { batchImportRequestCacheToMock, clearCacheRequestHistory, getCacheRequestHistory } from "../../api/api";
import HistoryDataPreviewModal from "./historyDataPreviewModal";
import ApiSend from "../apiSend/apiSend";
import { t } from "../../common/fun";
const { Search } = Input;

export default function RequestHistoryListModal({ visible, onCancel, onApiDataChange }) {
  const [requsetCacheHistory, setRequestCacheHistory] = useState([]);
  const [keys, setKeys] = useState([])
  const [checkValueVisible, setCheckValueVisible] = useState(false)
  const [checkValue, setCheckValue] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [apiSendVisible, setApiSendVisible] = useState(false)
  const [currentHistoryItem, setCurrentHistoryItem] = useState(null)
  
  const getRequestCache = () => {
    getCacheRequestHistory().then((data) => {
      setRequestCacheHistory(data)
    })
  }
  useEffect(() => {
    let timer;
    if (visible) {
      getRequestCache()
      timer = setInterval(() => {
        getRequestCache()
      }, 1000)
    } else {
      setSearchValue('')
    }
    return () => {
      clearInterval(timer)
    }
  }, [visible]);
  
  // 打开发送请求弹窗
  const handleOpenApiSend = (record) => {
    setCurrentHistoryItem(record);
    setApiSendVisible(true);
  };
  
  return <>
    <Modal
      width={1200}
      centered={true}
      onCancel={onCancel}
      title={t('历史请求数据')}
      footer={null}
      open={visible}>
        <div>
          <div style={{
            margin: '20px 0',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <Search placeholder={t('请输入URL')}
              onSearch={(value) => {
                if (value) {
                  setSearchValue(requsetCacheHistory.filter(item => item.url.includes(value)))
                } else {
                  setSearchValue('')
                }
              }}
              style={{
                width: 200,
              }} 
            />
            <div>
            <Button type="primary" onClick={async () => {
                await batchImportRequestCacheToMock({keys});
                onCancel();
                onApiDataChange(keys);
              }} >{t('批量导入MOCK数据')}</Button>
              <Button 
                 color="danger" 
                 variant="link"
                 onClick={async() => {
                   await clearCacheRequestHistory()
                   getRequestCache()
                   onApiDataChange()
                 }}
              >{t('清空当前数据')}</Button>
            </div>
           
          </div>
          <Table
            rowSelection={{
              type: 'checkbox',
              onChange: (selectedRowKeys) => {
                setKeys(selectedRowKeys)
              }
            }}
            scroll={{
              y: 800
            }} pagination={false} dataSource={ searchValue || requsetCacheHistory}>
            <Table.Column title="URL" dataIndex="url" key="url" />
            <Table.Column title={t('请求时间')} dataIndex="time" key="time" />
            <Table.Column
          title={t('操作')}
          key="action"
          fixed="right"
          width={220}
          render={(_, record) => (
            <div>
              <a
                onClick={() => {
                  setCheckValueVisible(true)
                  setCheckValue(record)
                }}
                style={{
                  marginRight: '10px'
                }}>{t('查看数据')}</a>
              <a
                onClick={() => handleOpenApiSend(record)}
                style={{
                  marginRight: '10px'
                }}>{t('发送请求')}</a>
               <a
                  onClick={async () => {
                    event.stopPropagation();
                    await batchImportRequestCacheToMock({keys: [record.key]});
                    getCacheRequestHistory();
                    onApiDataChange([record.key]);
                  }}
                  style={{
                    color: '#389e0d'
                  }}
                >{t('导入数据')}</a>

            </div>
          )}
        />
          </Table>  
        </div>
        {
          checkValue && visible && <HistoryDataPreviewModal value={checkValue} onCancel={() => {
            setCheckValueVisible(false)
            setCheckValue(null)
          }} visible={checkValueVisible} />
        }
    </Modal>
    
    {/* 发送请求弹窗 */}
    {currentHistoryItem && (
      <ApiSend
        visible={apiSendVisible}
        onClose={() => setApiSendVisible(false)}
        apiData={{
          url: currentHistoryItem.url,
          requestData: {
            method: currentHistoryItem.method,
            headers: currentHistoryItem.reqHeaders,
            params: currentHistoryItem.params,
            cookie: currentHistoryItem.cookie,
            body: currentHistoryItem.reqBody
          }
        }}
        fromHistory={true}
      />
    )}
  </>
}