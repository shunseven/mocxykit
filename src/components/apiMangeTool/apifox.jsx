import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import ApiFoxIcon from '../../assets/api-foxi-con.svg'; 
import ApiFoxModal from './apifoxModal';
import { syncApiFoxApi } from '../../api/api';

export default function ApiFox({ onApiDataChange }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  // 组件初始化时检查是否需要自动同步
  useEffect(() => {
    const autoSync = localStorage.getItem('apiFoxAutoSync');
    
    // 如果设置了自动同步，则自动调用同步接口
    if (autoSync === 'true') {
      const token = localStorage.getItem('apiFoxToken');
      const projectId = localStorage.getItem('apiFoxProjectId');
      const checkedFolders = localStorage.getItem(`apiFoxCheckedFolders_${projectId}`);
      const autoCompleteUrl = localStorage.getItem('apiFoxAutoCompleteUrl');
      const selectedApiRule = localStorage.getItem('apiFoxSelectedApiRule');
      
      // 检查是否有必要的数据可以进行同步
      if (token && projectId && checkedFolders) {
        autoSyncData({
          token,
          projectId,
          folders: JSON.parse(checkedFolders),
          autoCompleteUrl: autoCompleteUrl === 'true',
          selectedApiRule
        });
      }
    }
  }, []);

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
        message.success('ApiFox 数据自动同步成功');
        if (onApiDataChange) {
          onApiDataChange(result.data);
        }
      } else {
        message.error('ApiFox 数据自动同步失败');
      }
    } catch (error) {
      console.error('ApiFox 数据自动同步出错:', error);
      message.error('ApiFox 数据自动同步出错');
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
    >
      <img src={ApiFoxIcon} style={{ marginRight: '-5px', width: '16px', height: '16px' }
      } />
      同步ApiFox数据
    </Button>
    <ApiFoxModal 
      visible={isModalVisible} 
      onClose={handleModalClose} 
      onApiDataSync={handleApiDataSync}
    />
  </div>
}