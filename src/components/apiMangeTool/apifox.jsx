import React, { useState } from 'react';
import { Button } from 'antd';
import ApiFoxIcon from '../../assets/api-foxi-con.svg'; 
import ApiFoxModal from './apifoxModal';

export default function ApiFox({ onApiDataChange }) {
  const [isModalVisible, setIsModalVisible] = useState(false);

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