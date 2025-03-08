import axios from 'axios';

// 通用请求方法
const apiFoxRequest = async (url: string, token: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
  try {
    const response = await axios({
      method,
      url,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      data: method === 'POST' ? data : undefined,
      params: method === 'GET' ? data : undefined,
    });
    
    return response.data;
  } catch (error) {
    console.error('ApiFox API 请求失败:', error);
    throw error;
  }
};

// 获取用户团队列表
export const getUserTeams = async (token: string, locale: string = 'zh-CN') => {
  return apiFoxRequest(`https://api.apifox.com/api/v1/user-teams?locale=${locale}`, token);
};

// 获取用户项目列表
export const getUserProjects = async (token: string, locale: string = 'zh-CN') => {
  return apiFoxRequest(`https://api.apifox.com/api/v1/user-projects?locale=${locale}`, token);
};

// 获取项目 API 树形列表
export const getApiTreeList = async (token: string, projectId: number, locale: string = 'zh-CN') => {
  return apiFoxRequest(`https://api.apifox.com/api/v1/projects/${projectId}/api-tree-list?locale=${locale}`, token);
};

// 获取 API 详情
export const getApiDetail = async (token: string, projectId: number, apiId: number, locale: string = 'zh-CN') => {
  return apiFoxRequest(`https://api.apifox.com/api/v1/projects/${projectId}/apis/${apiId}?locale=${locale}`, token);
};

// 获取团队和项目数据（组合接口）
export const getUserTeamsAndProjects = async (token: string, locale: string = 'zh-CN') => {
  try {
    const [teamsResponse, projectsResponse] = await Promise.all([
      getUserTeams(token, locale),
      getUserProjects(token, locale)
    ]);
    
    return {
      success: true,
      data: {
        teams: teamsResponse.data,
        projects: projectsResponse.data
      }
    };
  } catch (error) {
    console.error('获取团队和项目数据失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

export default {
  apiFoxRequest,
  getUserTeams,
  getUserProjects,
  getApiTreeList,
  getApiDetail,
  getUserTeamsAndProjects
};
