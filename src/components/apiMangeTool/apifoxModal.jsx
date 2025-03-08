import React, { useState, useEffect } from 'react';
import { Modal, Steps, Input, Button, message, Tree, Spin, Typography, Checkbox, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Step } = Steps;
const { Text, Link } = Typography;

const ApiFoxModal = ({ visible, onClose, onApiDataSync }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [teamsData, setTeamsData] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [apiTreeData, setApiTreeData] = useState([]);
  const [checkedFolders, setCheckedFolders] = useState([]);

  // 初始化时检查本地存储中是否有 token
  useEffect(() => {
    if (visible) {
      const savedToken = localStorage.getItem('apiFoxToken');
      if (savedToken) {
        setToken(savedToken);
        setCurrentStep(1);
        fetchTeamsAndProjects(savedToken);
      }
    }
  }, [visible]);

  // 获取团队和项目数据
  const fetchTeamsAndProjects = async (tokenValue) => {
    setLoading(true);
    try {
      const response = await fetch('/express-proxy-mock/apifox-user-teams-and-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenValue }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTeamsData(result.data.teams || []);
        setProjectsData(result.data.projects || []);
        setLoading(false);
      } else {
        message.error('获取团队和项目数据失败');
        setLoading(false);
      }
    } catch (error) {
      console.error('获取团队和项目数据出错:', error);
      message.error('获取团队和项目数据出错');
      setLoading(false);
    }
  };

  // 获取 API 树形结构
  const fetchApiTreeList = async (projectId) => {
    setLoading(true);
    try {
      const response = await fetch('/express-proxy-mock/apifox-tree-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: token,
          projectId: projectId 
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setApiTreeData(result.data || []);
        setLoading(false);
      } else {
        message.error('获取 API 列表失败');
        setLoading(false);
      }
    } catch (error) {
      console.error('获取 API 列表出错:', error);
      message.error('获取 API 列表出错');
      setLoading(false);
    }
  };

  // 同步 API 数据
  const syncApiData = async () => {
    if (checkedFolders.length === 0) {
      message.warning('请至少选择一个 API 分组');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/express-proxy-mock/apifox-sync-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: token,
          projectId: selectedProject,
          folders: checkedFolders
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success('API 同步成功');
        if (onApiDataSync) {
          onApiDataSync(result.data);
        }
        handleClose();
      } else {
        message.error('API 同步失败');
      }
    } catch (error) {
      console.error('API 同步出错:', error);
      message.error('API 同步出错');
    } finally {
      setLoading(false);
    }
  };

  // 处理 Token 保存
  const handleTokenSave = () => {
    if (!token.trim()) {
      message.warning('请输入 ApiFox Access Token');
      return;
    }

    localStorage.setItem('apiFoxToken', token);
    fetchTeamsAndProjects(token);
    setCurrentStep(1);
  };

  // 处理项目选择
  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
    localStorage.setItem('apiFoxProjectId', projectId);
    fetchApiTreeList(projectId);
    setCurrentStep(2);
  };

  // 处理文件夹选择
  const onCheck = (checkedKeys) => {
    setCheckedFolders(checkedKeys);
  };

  // 处理关闭弹窗
  const handleClose = () => {
    setCurrentStep(0);
    setApiTreeData([]);
    setCheckedFolders([]);
    if (!localStorage.getItem('apiFoxToken')) {
      setToken('');
    }
    onClose();
  };

  // 处理返回上一步
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ marginTop: 24 }}>
            <Input
              placeholder="请输入 ApiFox Access Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16 }}>
              <Text>
                获取 Token 请访问：
                <Link href="https://apifox-openapi.apifox.cn/doc-4296599" target="_blank">
                  ApiFox OpenAPI 文档
                </Link>
              </Text>
            </div>
            <Button type="primary" onClick={handleTokenSave}>
              下一步
            </Button>
          </div>
        );
      case 1:
        return (
          <div style={{ marginTop: 24 }}>
            <Spin spinning={loading}>
              {teamsData.length > 0 ? (
                <div>
                  {teamsData.map(team => (
                    <div key={team.id} style={{ marginBottom: 16 }}>
                      <h3>{team.name}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {projectsData
                          .filter(project => project.teamId === team.id)
                          .map(project => (
                            <Button 
                              key={project.id}
                              onClick={() => handleProjectSelect(project.id)}
                              style={{ marginBottom: 8 }}
                            >
                              {project.name}
                            </Button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                  未获取到团队和项目数据
                </div>
              )}
            </Spin>
            <div style={{ marginTop: 16 }}>
              <Button onClick={handlePrevStep}>上一步</Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div style={{ marginTop: 24 }}>
            <Spin spinning={loading}>
              {apiTreeData.length > 0 ? (
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  <Tree
                    checkable
                    onCheck={onCheck}
                    treeData={apiTreeData.map(folder => ({
                      title: folder.name,
                      key: folder.key,
                      children: folder.children.map(api => ({
                        title: `${api.name} [${api.api?.method?.toUpperCase() || ''}] ${api.api?.path || ''}`,
                        key: api.key,
                        disabled: true, // 禁用 API 项，只能选择文件夹
                      })),
                    }))}
                  />
                </div>
              ) : (
                <div>
                  <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                  未获取到 API 数据
                </div>
              )}
            </Spin>
            <div style={{ marginTop: 16 }}>
              <Space>
                <Button onClick={handlePrevStep}>上一步</Button>
                <Button type="primary" onClick={syncApiData} disabled={checkedFolders.length === 0}>
                  同步
                </Button>
              </Space>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title="同步 ApiFox 数据"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={700}
    >
      <Steps current={currentStep}>
        <Step title="输入 Token" />
        <Step title="选择项目" />
        <Step title="选择 API" />
      </Steps>
      {renderStepContent()}
    </Modal>
  );
};

export default ApiFoxModal;
