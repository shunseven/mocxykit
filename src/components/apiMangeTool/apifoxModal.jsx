import React, { useState, useEffect } from 'react';
import { Modal, Steps, Input, Button, message, Tree, Spin, Typography, Checkbox, Space, Radio, Tooltip } from 'antd';
import { ExclamationCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { fetchApiFoxTeamsAndProjects, fetchApiFoxTreeList, syncApiFoxApi } from '../../api/api';
import { t } from '../../common/fun';

const { Step } = Steps;
const { Text, Link } = Typography;

const ApiFoxModal = ({ visible, onClose, onApiDataSync, config = {}, onConfigUpdate }) => {
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

  // 初始化时从配置中加载数据
  useEffect(() => {
    if (visible) {
      // 加载API规则
      loadApiRules();
      
      // 从配置中加载数据
      if (config) {
        // 加载保存的设置
        if (config.autoCompleteUrl !== undefined) {
          setAutoCompleteUrl(config.autoCompleteUrl);
        }
        
        if (config.autoSync !== undefined) {
          setAutoSync(config.autoSync);
        }
        
        if (config.selectedApiRule) {
          setSelectedApiRule(config.selectedApiRule);
        }
        
        if (config.token) {
          setToken(config.token);
          
          if (config.projectId) {
            // 如果已有项目ID，直接跳到第三步
            const projectId = Number(config.projectId);
            setSelectedProject(projectId);
            setCurrentStep(2);
            fetchApiTreeList(projectId, config.token);
            
            // 恢复勾选状态
            if (config.checkedFolders && Array.isArray(config.checkedFolders)) {
              setCheckedFolders(config.checkedFolders);
            }
          } else {
            // 只有token，跳到第二步
            setCurrentStep(1);
            fetchTeamsAndProjects(config.token);
          }
        }
      }
    }
  }, [visible, config]);

  // 加载API规则
  const loadApiRules = () => {
    if (window.__config__ && window.__config__.apiRule) {
      const rules = window.__config__.apiRule.split(',');
      setApiRuleOptions(rules);
      
      // 如果只有一个规则，直接选中
      if (rules.length === 1 && !selectedApiRule) {
        setSelectedApiRule(rules[0]);
        updateConfig({ selectedApiRule: rules[0] });
      } else if (rules.length > 1 && !selectedApiRule && !config.selectedApiRule) {
        // 如果有多个规则但没有选中，默认选中第一个
        setSelectedApiRule(rules[0]);
        updateConfig({ selectedApiRule: rules[0] });
      }
    }
  };

  // 更新配置
  const updateConfig = async (newConfig) => {
    if (onConfigUpdate) {
      return await onConfigUpdate(newConfig);
    }
    return false;
  };

  // 获取团队和项目数据
  const fetchTeamsAndProjects = async (tokenValue) => {
    if (!tokenValue) return;
    
    setLoading(true);
    try {
      const result = await fetchApiFoxTeamsAndProjects({ token: tokenValue });
      if (result.success) {
        const { teams, projects } = result.data;
        setTeamsData(teams || []);
        setProjectsData(projects || []);
      } else {
        message.error(t('获取团队和项目数据失败'));
      }
    } catch (error) {
      console.error(t('获取团队和项目数据出错:'), error);
      message.error(t('获取团队和项目数据出错'));
    } finally {
      setLoading(false);
    }
  };

  // 获取API树形列表
  const fetchApiTreeList = async (projectId, tokenValue = token) => {
    if (!projectId || !tokenValue) return;
    
    setLoading(true);
    try {
      const result = await fetchApiFoxTreeList({ token: tokenValue, projectId });
      if (result.success) {
        setApiTreeData(result.data || []);
      } else {
        message.error(t('获取 API 列表失败'));
      }
    } catch (error) {
      console.error(t('获取 API 列表出错:'), error);
      message.error(t('获取 API 列表出错'));
    } finally {
      setLoading(false);
    }
  };

  // 同步 API 数据
  const syncApiData = async () => {
    if (checkedFolders.length === 0) {
      message.warning(t('请至少选择一个 API 分组'));
      return;
    }

    // 保存配置
    await updateConfig({
      token,
      projectId: selectedProject,
      checkedFolders,
      autoCompleteUrl,
      autoSync,
      selectedApiRule
    });

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
        message.success(t('API 同步成功'));
        if (onApiDataSync) {
          onApiDataSync(result.data);
        }
        handleClose();
      } else {
        message.error(t('API 同步失败'));
      }
    } catch (error) {
      console.error(t('API 同步出错:'), error);
      message.error(t('API 同步出错'));
    } finally {
      setLoading(false);
    }
  };

  // 处理 Token 保存
  const handleTokenSave = () => {
    if (!token) {
      message.warning(t('请输入 Token'));
      return;
    }
    
    // 保存 token 到配置
    updateConfig({ token });
    
    // 获取团队和项目数据
    fetchTeamsAndProjects(token);
    
    // 进入下一步
    setCurrentStep(1);
  };

  // 处理项目选择
  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
    
    // 保存项目ID到配置
    updateConfig({ projectId });
    
    // 获取API树形列表
    fetchApiTreeList(projectId);
    
    // 进入下一步
    setCurrentStep(2);
  };

  // 处理树形结构勾选
  const onCheck = (checkedKeys) => {
    setCheckedFolders(checkedKeys);
    
    // 不再立即保存配置，只在本地更新状态
    // 只有点击同步按钮时才会保存配置并触发同步操作
  };

  // 处理关闭
  const handleClose = () => {
    onClose();
  };

  // 处理上一步
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
    updateConfig({ autoCompleteUrl: e.target.checked });
  };

  // 处理自动同步开关变化
  const handleAutoSyncChange = (e) => {
    setAutoSync(e.target.checked);
    updateConfig({ autoSync: e.target.checked });
  };

  // 处理API规则选择变化
  const handleApiRuleChange = (e) => {
    setSelectedApiRule(e.target.value);
    updateConfig({ selectedApiRule: e.target.value });
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ marginTop: 24 }}>
            <Input
              placeholder={t("请输入 ApiFox Access Token")}
              value={token}
              onChange={(e) => setToken(e.target.value.replaceAll("\"", ""))}
              style={{ marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16 }}>
              <Text>
                {t('获取 Token')}：
                <Link href="https://app.apifox.com/user/login" target="_blank">
                  {t('点击登录 ApiFox')},
                </Link>
                {t('登录完成后，复制 cookie 中的 Authorization 字段值')}
              </Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="warning">{t('注：不要使用 ApiFox 官方设置后台生成的 API 访问令牌。')}</Text>
            </div>
            <Button type="primary" onClick={handleTokenSave}>
              {t('下一步')}
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
                  {t('未获取到团队和项目数据')}
                </div>
              )}
            </Spin>
            <div style={{ marginTop: 16 }}>
              <Button onClick={handlePrevStep}>{t('上一步')}</Button>
            </div>
          </div>
        );
      case 2:
        // 查找当前项目名称
        const currentProject = projectsData.find(p => p.id === selectedProject);
        const projectName = currentProject ? currentProject.name : `${t('项目 ID')}: ${selectedProject}`;
        
        return (
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>{t('当前项目')}: {projectName}</Text>
              <Button size="small" onClick={handleSwitchProject}>{t('切换项目')}</Button>
            </div>
            
            {/* 新增设置选项 */}
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Checkbox 
                  checked={autoCompleteUrl} 
                  onChange={handleAutoCompleteUrlChange}
                  style={{ marginRight: 16 }}
                >
                  {t('自动补全URL')}
                  <Tooltip title={t('开启后，将在同步数据时自动为API路径添加前缀')}>
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
                  {t('自动同步')}
                  <Tooltip title={t('开启后，将自动每次打开页面时同步ApiFox数据')}>
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
                  {t('未获取到 API 数据')}
                </div>
              )}
            </Spin>
            <div style={{ marginTop: 16 }}>
              <Space>
                <Button onClick={handlePrevStep}>{t('上一步')}</Button>
                <Button type="primary" onClick={syncApiData} disabled={checkedFolders.length === 0}>
                  {t('同步')}
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
      title={t("同步 ApiFox 数据")}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={700}
    >
      <Steps current={currentStep}>
        <Step title={t("输入 Token")} />
        <Step title={t("选择项目")} />
        <Step title={t("选择 API")} />
      </Steps>
      {renderStepContent()}
    </Modal>
  );
};

export default ApiFoxModal;
