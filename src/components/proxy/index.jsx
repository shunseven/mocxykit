import { useEffect, useState } from 'react';
import { fetchCreateProxy, fetchDeleteProxy, requestApiData, fetchChangeProxy } from '../../api/api';
import GProxy from './proxy';

function Index() {
  const [proxyList, setProxyList] = useState([])
  const [selectProxy, setSelectProxy] = useState([])

  function fetchProxyData() {
    requestApiData().then(apiData => {
      if (apiData.selectProxy) setSelectProxy(apiData.selectProxy)
      if (apiData.proxy) setProxyList(apiData.proxy)
    });
  }

  useEffect(() => {
    fetchProxyData();
  }, []);

  return (
    <GProxy
        deleteComfirm={true}
        proxyList={proxyList} 
        selectProxy={selectProxy}
        onProxyChange={async (data) => {
          await fetchChangeProxy(data)
          fetchProxyData();
        }}
        onProxyDelete={async (data) => {
          await fetchDeleteProxy(data)
          fetchProxyData();
        }}
        onProxyCreate={async (data) => {
          await fetchCreateProxy(data)
          fetchProxyData();
        }}
      />
  );
}

export default Index;