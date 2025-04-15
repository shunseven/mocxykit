import { Divider, Button } from 'antd'
import { SettingOutlined } from '@ant-design/icons';
import List from './components/apiList/apiList'
import EnvConfig from './components/envConfig/envConfig'
import { useEffect, useState } from 'react';
import { fetchDeleteProxy, requestApiData, fetchChangeProxy, fetchChangeTargetType, fetchBatchChangeTargetType, fetchSaveProxy, getEnvVariables } from './api/api';
import GProxy from './components/proxy/proxy';
import { t } from './common/fun';
import SettingsModal from './components/settingsModal/settingsModal';

function App() {
  const [proxyList, setProxyList] = useState([])
  const [selectProxy, setSelectProxy] = useState([])
  const [apiList, setApiList] = useState([])
  const [selectEnvId, setSelectEnvId] = useState(null)
  const [hasEnvPlugin, setHasEnvPlugin] = useState(false)
  const [currentEnvId, setCurrentEnvId] = useState(null)  // 添加当前实际使用的环境变量ID状态
  const [settingsVisible, setSettingsVisible] = useState(false);

  // 添加一个计算当前选择的代理是否有绑定环境的逻辑
  const isEnvSelectDisabled = proxyList.some(proxy => 
    proxy.proxy === selectProxy && proxy.bindEnvId
  );

  async function fetchProxyData() {
    try {
      const [apiData, envVariables] = await Promise.all([
        requestApiData(),
        getEnvVariables()
      ]);

      // 为代理列表添加环境变量名称
      const proxyListWithEnvName = apiData.proxy.map(proxy => {
        if (proxy.bindEnvId) {
          const env = envVariables.find(env => env.id === proxy.bindEnvId);
          return {
            ...proxy,
            envName: env?.name
          };
        }
        return proxy;
      });

      if (apiData.selectProxy !== undefined) setSelectProxy(apiData.selectProxy);
      if (apiData.proxy) setProxyList(proxyListWithEnvName);
      if(apiData.apiList) setApiList(apiData.apiList);
      setSelectEnvId(apiData.selectEnvId || '');
      setCurrentEnvId(apiData.currentEnvId || '');
      if(apiData.hasEnvPlugin !== undefined) setHasEnvPlugin(apiData.hasEnvPlugin);
    } catch (err) {
      console.error('获取数据失败:', err);
    }
  }

  useEffect(() => {
    fetchProxyData();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '98vw', paddingRight: '20px' }}>
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
          onSaveProxy={async (data) => {
            await fetchSaveProxy(data)
            fetchProxyData();
          }}
        />
        <div className='setting' style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasEnvPlugin && <EnvConfig 
            value={currentEnvId || selectEnvId } // 优先显示当前实际使用的环境变量ID
            onChange={fetchProxyData} 
            disabled={isEnvSelectDisabled}
            proxyList={proxyList}
            onProxyChange={async (data) => {
              await fetchChangeProxy(data);
              fetchProxyData();
            }}
          />}
          <Button 
            type="text" 
            icon={<SettingOutlined />}
            onClick={() => setSettingsVisible(true)}
          />
        </div>
        
      </div>
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
      <Divider />
      <List 
        data={apiList}
        proxyList={proxyList}
        globalProxy={selectProxy}
        onTargetChange={async ({target, key}) => {
          await fetchChangeTargetType({target, key})
          fetchProxyData();
        }}
        onBatchChangeTargetType={async (target, { pinnedItems , selectedKeys }) => {
          await fetchBatchChangeTargetType({target, pinnedItems, selectedKeys: selectedKeys || null})
          fetchProxyData();
        }}
        onApiDataChange={fetchProxyData}
      />
    </div>
  );
}
export default App;