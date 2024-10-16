import { Divider } from 'antd'
import List from './components/list'
import { useEffect, useState } from 'react';
import { fetchCreateProxy, fetchDeleteProxy, requestApiData, fetchChangeProxy, fetchChangeTargetType } from './api/api';
import GProxy from './components/proxy/proxy';

function App(props) {
  const [proxyList, setProxyList] = useState([])
  const [selectProxy, setSelectProxy] = useState([])
  const [apiList, setApiList] = useState([])

  function fetchProxyData() {
    requestApiData().then(apiData => {
      if (apiData.selectProxy) setSelectProxy(apiData.selectProxy)
      if (apiData.proxy) setProxyList(apiData.proxy)
      if(apiData.apiList) setApiList(apiData.apiList)
    });
  }

  useEffect(() => {
    fetchProxyData();
  }, []);
  return (
    <div>
      <GProxy
        label="全局代理:"
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
      <Divider />
      <List 
        data={apiList}
        globalProxy={selectProxy}
        onTargetChange={async ({target, key}) => {
          await fetchChangeTargetType({target, key})
          fetchProxyData();
        }}
      />
    </div>
  );
}
export default App;