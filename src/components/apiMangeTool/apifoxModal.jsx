import React, { useState, useEffect } from 'react';
import { Modal, Steps, Input, Button, message, Tree, Spin, Typography, Checkbox, Space, Radio, Tooltip } from 'antd';
import { ExclamationCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { fetchApiFoxTeamsAndProjects, fetchApiFoxTreeList, syncApiFoxApi } from '../../api/api';

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
  
  // 新增状态
  const [autoCompleteUrl, setAutoCompleteUrl] = useState(true); // 自动补全URL开关，默认开启
  const [autoSync, setAutoSync] = useState(true); // 自动同步开关，默认开启
  const [apiRuleOptions, setApiRuleOptions] = useState([]); // API规则选项
  const [selectedApiRule, setSelectedApiRule] = useState(''); // 选中的API规则

  // 初始化时检查本地存储中是否有 token 和 projectId，以及新增的设置项
  useEffect(() => {
    if (visible) {
      const savedToken = localStorage.getItem('apiFoxToken');
      const savedProjectId = localStorage.getItem('apiFoxProjectId');
      
      // 加载保存的设置
      const savedAutoCompleteUrl = localStorage.getItem('apiFoxAutoCompleteUrl');
      const savedAutoSync = localStorage.getItem('apiFoxAutoSync');
      const savedSelectedApiRule = localStorage.getItem('apiFoxSelectedApiRule');
      
      if (savedAutoCompleteUrl !== null) {
        setAutoCompleteUrl(savedAutoCompleteUrl === 'true');
      }
      
      if (savedAutoSync !== null) {
        setAutoSync(savedAutoSync === 'true');
      }
      
      if (savedSelectedApiRule) {
        setSelectedApiRule(savedSelectedApiRule);
      }
      
      // 加载API规则
      loadApiRules();
      
      if (savedToken) {
        setToken(savedToken);
        
        if (savedProjectId) {
          // 如果已有项目ID，直接跳到第三步
          const projectId = Number(savedProjectId);
          setSelectedProject(projectId);
          setCurrentStep(2);
          fetchApiTreeList(projectId, savedToken);
          
          // 恢复勾选状态
          const savedCheckedFolders = localStorage.getItem(`apiFoxCheckedFolders_${projectId}`);
          if (savedCheckedFolders) {
            try {
              const parsedCheckedFolders = JSON.parse(savedCheckedFolders);
              setCheckedFolders(parsedCheckedFolders);
            } catch (error) {
              console.error('解析保存的勾选项出错:', error);
            }
          }
        } else {
          // 只有token，跳到第二步
          setCurrentStep(1);
          fetchTeamsAndProjects(savedToken);
        }
      }
    }
  }, [visible]);

  // 加载API规则
  const loadApiRules = () => {
    if (window.__config__ && window.__config__.apiRule) {
      const rules = window.__config__.apiRule.split(',');
      setApiRuleOptions(rules);
      
      // 如果只有一个规则，直接选中
      if (rules.length === 1) {
        setSelectedApiRule(rules[0]);
        localStorage.setItem('apiFoxSelectedApiRule', rules[0]);
      } else if (rules.length > 1 && !localStorage.getItem('apiFoxSelectedApiRule')) {
        // 如果有多个规则但没有选中，默认选中第一个
        setSelectedApiRule(rules[0]);
        localStorage.setItem('apiFoxSelectedApiRule', rules[0]);
      }
    }
  };

  // 获取团队和项目数据
  const fetchTeamsAndProjects = async (tokenValue) => {
    setLoading(true);
    try {
      const result = await fetchApiFoxTeamsAndProjects({ token: tokenValue });
      
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
  const fetchApiTreeList = async (projectId, tokenValue = token) => {
    setLoading(true);
    try {
      const result = await fetchApiFoxTreeList({ 
        token: tokenValue,
        projectId: projectId 
      });
      
      if (result.success) {
        setApiTreeData(result.data || []);
        
        // 获取API树后，尝试恢复勾选状态
        const savedCheckedFolders = localStorage.getItem(`apiFoxCheckedFolders_${projectId}`);
        if (savedCheckedFolders) {
          try {
            const parsedCheckedFolders = JSON.parse(savedCheckedFolders);
            setCheckedFolders(parsedCheckedFolders);
          } catch (error) {
            console.error('解析保存的勾选项出错:', error);
          }
        }
        
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

    // 保存勾选的文件夹到本地存储
    localStorage.setItem(`apiFoxCheckedFolders_${selectedProject}`, JSON.stringify(checkedFolders));
    
    // 保存设置
    localStorage.setItem('apiFoxAutoCompleteUrl', autoCompleteUrl.toString());
    localStorage.setItem('apiFoxAutoSync', autoSync.toString());
    if (selectedApiRule) {
      localStorage.setItem('apiFoxSelectedApiRule', selectedApiRule);
    }

    setLoading(true);
    try {
      const result = await syncApiFoxApi({ 
        token: token,
        projectId: selectedProject,
        folders: checkedFolders,
        autoCompleteUrl: autoCompleteUrl,
        autoSync: autoSync,
        selectedApiRule: selectedApiRule
      });
      
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
    
    // 清空当前勾选状态
    setCheckedFolders([]);
    
    // 获取该项目的 API 树形结构
    fetchApiTreeList(projectId);
    
    setCurrentStep(2);
  };

  // 处理文件夹选择
  const onCheck = (checkedKeys) => {
    setCheckedFolders(checkedKeys);
  };

  // 处理关闭弹窗
  const handleClose = () => {
    // 不重置勾选状态，只重置步骤和API树数据
    setCurrentStep(0);
    setApiTreeData([]);
    if (!localStorage.getItem('apiFoxToken')) {
      setToken('');
    }
    onClose();
  };

  // 处理返回上一步
  const handlePrevStep = () => {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    
    // 如果从第三步返回到第二步，重新请求团队和项目数据
    if (currentStep === 2 && prevStep === 1) {
      fetchTeamsAndProjects(token);
    }
  };

  // 处理切换项目
  const handleSwitchProject = () => {
    // 直接跳到第一步
    setCurrentStep(1);
    fetchTeamsAndProjects(token);
  };

  // 处理自动补全URL开关变化
  const handleAutoCompleteUrlChange = (e) => {
    setAutoCompleteUrl(e.target.checked);
    localStorage.setItem('apiFoxAutoCompleteUrl', e.target.checked.toString());
  };

  // 处理自动同步开关变化
  const handleAutoSyncChange = (e) => {
    setAutoSync(e.target.checked);
    localStorage.setItem('apiFoxAutoSync', e.target.checked.toString());
  };

  // 处理API规则选择变化
  const handleApiRuleChange = (e) => {
    setSelectedApiRule(e.target.value);
    localStorage.setItem('apiFoxSelectedApiRule', e.target.value);
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
              onChange={(e) => setToken(e.target.value.replaceAll("\"", ""))}
              style={{ marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16 }}>
              <Text>
                获取 Token：
                <Link href="https://app.apifox.com/user/login" target="_blank">
                  点击登录 ApiFox
                </Link>
                ，登录完成后，复制 localStorage 的common.accessToken字段值
              </Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="warning">注：不用使用官方设置后台生成的API 访问令牌。</Text>
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
        // 查找当前项目名称
        const currentProject = projectsData.find(p => p.id === selectedProject);
        const projectName = currentProject ? currentProject.name : `项目 ID: ${selectedProject}`;
        
        return (
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>当前项目: {projectName}</Text>
              <Button size="small" onClick={handleSwitchProject}>切换项目</Button>
            </div>
            
            {/* 新增设置选项 */}
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Checkbox 
                  checked={autoCompleteUrl} 
                  onChange={handleAutoCompleteUrlChange}
                  style={{ marginRight: 16 }}
                >
                  自动补全URL
                  <Tooltip title="开启后，将在同步数据时自动为API路径添加前缀">
                    <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </Checkbox>
                
                {autoCompleteUrl && apiRuleOptions.length > 1 && (
                  <Radio.Group 
                    value={selectedApiRule} 
                    onChange={handleApiRuleChange}
                    options={apiRuleOptions.map(rule => ({ label: rule, value: rule }))}
                  />
                )}
              </div>
              
              <div>
                <Checkbox 
                  checked={autoSync} 
                  onChange={handleAutoSyncChange}
                >
                  自动同步
                  <Tooltip title="开启后，将自动每次打开页面时同步ApiFox数据">
                    <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </Checkbox>
              </div>
            </div>
            
            <Spin spinning={loading}>
              {apiTreeData.length > 0 ? (
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  <Tree
                    checkable
                    onCheck={onCheck}
                    checkedKeys={checkedFolders}
                    defaultCheckedKeys={checkedFolders}
                    treeData={apiTreeData.map(folder => ({
                      title: folder.name,
                      key: folder.key,
                      children: folder.children.map(api => ({
                        style: {
                          backgroundColor: '#fafafa',
                          width: '100%',
                        },
                        title: `${api.name} [${api.api?.method?.toUpperCase() || ''}] ${api.api?.path || ''}`,
                        key: api.key,
                        checkable: false, // API 项不显示选择框
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
