import React, { useEffect, useState } from 'react';
import { Badge, Button } from 'antd';
import { getCacheRequestHistoryLength } from '../../api/api';
import RequestHistoryListModal from './requestHistoryListModal';
export default function CacheRequestHistoryData() {
  const [requsetCacheHistoryLength, setRequestCacheHistoryLength] = useState(0);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    getCacheRequestHistoryLength().then(({length}) => {
      setRequestCacheHistoryLength(length)
    })
    const timer = setInterval(() => {
      getCacheRequestHistoryLength().then(({length}) => {
        setRequestCacheHistoryLength(length)
      })
    }, 8000)
    return () => {
      clearInterval(timer)
    }
  }, []);
  return <div>
    <Badge count={requsetCacheHistoryLength}>
       <Button variant='dashed' onClick={() =>setVisible(true)} color='danger' >转换最近请求为MOCK数据</Button>
    </Badge>
    <RequestHistoryListModal onCancel={() => setVisible(false)} visible={visible} />
  </div>
}