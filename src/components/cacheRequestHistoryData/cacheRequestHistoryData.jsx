import React, { useEffect, useState } from 'react';
import { Badge, Button } from 'antd';
import { getCacheRequestHistoryLength } from '../../api/api';
import RequestHistoryListModal from './requestHistoryListModal';
import { t } from '../../common/fun';
export default function CacheRequestHistoryData({onApiDataChange}) {
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
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  }, []);

  const handleApiDataChange = (importedKeys) => {
    onApiDataChange(importedKeys);
  };

  return <div>
    <Badge count={requsetCacheHistoryLength}>
       <Button variant='dashed' onClick={() =>setVisible(true)} color='danger' >{t('最近请求数据')}</Button>
    </Badge>
    <RequestHistoryListModal onApiDataChange={handleApiDataChange} onCancel={() => setVisible(false)} visible={visible} />
  </div>
}