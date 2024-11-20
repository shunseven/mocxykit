import { Divider } from 'antd'
import List from './components/apiList/apiList'
import EnvConfig from './components/envConfig/envConfig'
import { useEffect, useState } from 'react';
import { fetchCreateProxy, fetchDeleteProxy, requestApiData, fetchChangeProxy, fetchChangeTargetType, fetchBatchChangeTargetType } from './api/api';
import GProxy from './components/proxy/proxy';
import { t } from './common/fun';

function App() {
  const [proxyList, setProxyList] = useState([])
  const [selectProxy, setSelectProxy] = useState([])
  const [apiList, setApiList] = useState([])
  const [selectEnvId, setSelectEnvId] = useState(null)
  const [hasEnvPlugin, setHasEnvPlugin] = useState(false)
  const [currentEnvId, setCurrentEnvId] = useState(null)  // 添加当前实际使用的环境变量ID状态

  function fetchProxyData() {
    requestApiData().then(apiData => {
      if (apiData.selectProxy !== undefined) setSelectProxy(apiData.selectProxy)
      if (apiData.proxy) setProxyList(apiData.proxy)
      if(apiData.apiList) setApiList(apiData.apiList)
      if(apiData.selectEnvId) setSelectEnvId(apiData.selectEnvId)
      if (apiData.currentEnvId !== undefined) setCurrentEnvId(apiData.currentEnvId)  // 设置当前实际使用的环境变量
      if(apiData.hasEnvPlugin !== undefined) setHasEnvPlugin(apiData.hasEnvPlugin)
    });
  }

  useEffect(() => {
    fetchProxyData();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <GProxy
          label={`${t('全局代理')}:`}
          deleteComfirm={true}
          proxyList={proxyList}
          selectProxy={selectProxy}
          hasEnvPlugin={hasEnvPlugin}
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
        {hasEnvPlugin && <EnvConfig 
          value={currentEnvId || selectEnvId} // 优先显示当前实际使用的环境变量ID
          onChange={fetchProxyData} 
        />}
      </div>
      <Divider />
      <List 
        data={apiList}
        proxyList={proxyList}
        globalProxy={selectProxy}
        onTargetChange={async ({target, key}) => {
          await fetchChangeTargetType({target, key})
          fetchProxyData();
        }}
        onBatchChangeTargetType={async (target) => {
          await fetchBatchChangeTargetType({target})
          fetchProxyData();
        }}
        onApiDataChange={fetchProxyData}
      />
    </div>
  );
}
export default App;