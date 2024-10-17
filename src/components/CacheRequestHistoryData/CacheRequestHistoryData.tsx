import React, { useEffect, useState } from 'react';
import { Badge, Button } from 'antd';
import { getCacheRequestHistoryLength } from '../../api/api';
export default function CacheRequestHistoryData() {
  const [requsetCacheHistory, setRequestCacheHistory] = useState([]);
  const [requsetCacheHistoryLength, setRequestCacheHistoryLength] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      getCacheRequestHistoryLength().then(({length}) => {
        setRequestCacheHistoryLength(length)
      })
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  }, []);
  return <div>
    <Badge count={requsetCacheHistoryLength}>
       <Button variant='dashed' color='danger' >转换最近请求为MOCK数据</Button>
    </Badge>
  </div>
}