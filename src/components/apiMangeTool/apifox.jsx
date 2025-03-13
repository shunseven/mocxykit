import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import ApiFoxIcon from '../../assets/api-foxi-con.svg'; 
import ApiFoxModal from './apifoxModal';
import { syncApiFoxApi, getApiFoxConfig, saveApiFoxConfig } from '../../api/api';
import { t } from '../../common/fun';

export default function ApiFox({ onApiDataChange }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [apiFoxConfig, setApiFoxConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 组件初始化时获取 ApiFox 配置
  useEffect(() => {
    fetchApiFoxConfig();
  }, []);

  // 获取 ApiFox 配置
  const fetchApiFoxConfig = async () => {
    setIsLoading(true);
    try {
      const result = await getApiFoxConfig();
      if (result.success) {
        setApiFoxConfig(result.data || {});
        
        // 如果设置了自动同步，则自动调用同步接口
        if (result.data && result.data.autoSync === true) {
          const { token, projectId, checkedFolders, autoCompleteUrl, selectedApiRule } = result.data;
          
          // 检查是否有必要的数据可以进行同步
          if (token && projectId && checkedFolders && checkedFolders.length > 0) {
            autoSyncData({
              token,
              projectId,
              folders: checkedFolders,
              autoCompleteUrl: autoCompleteUrl === true,
              selectedApiRule
            });
          }
        }
      } else {
        console.error(t('获取 ApiFox 配置失败'));
      }
    } catch (error) {
      console.error(t('获取 ApiFox 配置出错:'), error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存 ApiFox 配置
  const saveConfig = async (config) => {
    setIsLoading(true);
    try {
      const result = await saveApiFoxConfig(config);
      if (result.success) {
        setApiFoxConfig(config);
        return true;
      } else {
        message.error(t('保存 ApiFox 配置失败'));
        return false;
      }
    } catch (error) {
      console.error(t('保存 ApiFox 配置出错:'), error);
      message.error(t('保存 ApiFox 配置出错'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 自动同步数据
  const autoSyncData = async ({ token, projectId, folders, autoCompleteUrl, selectedApiRule }) => {
    if (isAutoSyncing || folders.length === 0) return;
    
    setIsAutoSyncing(true);
    try {
      const result = await syncApiFoxApi({ 
        token,
        projectId,
        folders,
        autoCompleteUrl,
        autoSync: true,
        selectedApiRule
      });
      
      if (result.success) {
        message.success(t('ApiFox 数据自动同步成功'));
        if (onApiDataChange) {
          onApiDataChange(result.data);
        }
      } else {
        message.error(t('ApiFox 数据自动同步失败'));
      }
    } catch (error) {
      console.error(t('ApiFox 数据自动同步出错:'), error);
      message.error(t('ApiFox 数据自动同步出错'));
    } finally {
      setIsAutoSyncing(false);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handleApiDataSync = (data) => {
    if (onApiDataChange) {
      onApiDataChange(data);
    }
  };

  // 处理配置更新
  const handleConfigUpdate = async (newConfig) => {
    const success = await saveConfig({
      ...apiFoxConfig,
      ...newConfig
    });
    
    if (success) {
      // 更新成功后重新获取配置
      fetchApiFoxConfig();
    }
    
    return success;
  };

  return <div>
    <Button
      style={
        {
          color: 'rgb(240 104 32)', // 橙色文字
          borderColor: 'rgb(240 104 32)', // 橙色边框
          borderStyle: 'none' // 虚线边框
        }
      }
      onClick={showModal}
      loading={isLoading}
    >
      <img src={ApiFoxIcon} style={{ marginRight: '-5px', width: '16px', height: '16px' }
      } />
      {t('同步ApiFox数据')}
    </Button>
    <ApiFoxModal 
      visible={isModalVisible} 
      onClose={handleModalClose} 
      onApiDataSync={handleApiDataSync}
      config={apiFoxConfig}
      onConfigUpdate={handleConfigUpdate}
    />
  </div>
}