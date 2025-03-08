import axios from 'axios';

// 通用请求方法
const apiFoxRequest = async <T>(url: string, token: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<T> => {
  try {
    const response = await axios({
      method,
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: method === 'POST' ? data : undefined,
      params: method === 'GET' ? data : undefined,
    });
    
    return response.data as T;
  } catch (error) {
    console.error('ApiFox API 请求失败:', error);
    throw error;
  }
};

// 团队和项目数据返回类型定义
export interface ApiFoxTeam {
  id: number;
  name: string;
  [key: string]: any;
}

export interface ApiFoxProject {
  id: number;
  name: string;
  teamId: number;
  [key: string]: any;
}

export interface ApiFoxTeamsResponse {
  success: boolean;
  data: ApiFoxTeam[];
}

export interface ApiFoxProjectsResponse {
  success: boolean;
  data: ApiFoxProject[];
}

export interface ApiFoxTeamsAndProjectsResponse {
  success: boolean;
  data: {
    teams: ApiFoxTeam[];
    projects: ApiFoxProject[];
  };
}

// 获取用户团队列表
export const getUserTeams = async (token: string, locale: string = 'zh-CN') => {
  return apiFoxRequest<ApiFoxTeamsResponse>(`https://api.apifox.com/api/v1/user-teams?locale=${locale}`, token);
};

// 获取用户项目列表
export const getUserProjects = async (token: string, locale: string = 'zh-CN') => {
  return apiFoxRequest<ApiFoxProjectsResponse>(`https://api.apifox.com/api/v1/user-projects?locale=${locale}`, token);
};

// API树形结构返回类型定义
export interface ApiFoxApiTreeItem {
  key: string;
  type: string;
  name: string;
  children: ApiFoxApiTreeItem[];
  api?: {
    id: number;
    name: string;
    type: string;
    method: string;
    path: string;
    folderId: number;
    tags: string[];
    status: number;
    responsibleId: number;
    customApiFields: Record<string, any>;
    visibility: string;
    editorId: number;
  };
  folder?: {
    id: number;
    name: string;
    docId: number;
    parentId: number;
    projectBranchId: number;
    shareSettings: Record<string, any>;
    visibility: string;
    editorId: number;
    type: string;
  };
  case?: {
    id: number;
    name: string;
    visibility: string;
    editorId: number;
    apiId: number;
    type: string;
  };
}

export interface ApiFoxApiTreeResponse {
  success: boolean;
  data: ApiFoxApiTreeItem[];
}

// 数据模型Schema返回类型定义
export interface ApiFoxDataSchema {
  id: number;
  name: string;
  displayName: string;
  jsonSchema: Record<string, any>;
  folderId: number;
  description: string;
  projectId: number;
  ordering: number;
  creatorId: number;
  editorId: number;
  createdAt: string;
  updatedAt: string;
  visibility: string;
}

export interface ApiFoxDataSchemaResponse {
  success: boolean;
  data: ApiFoxDataSchema[];
}

// API详情返回类型定义
export interface ApiFoxApiDetailResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    type: string;
    method: string;
    path: string;
    requestBody?: {
      type: string;
      parameters: any[];
      jsonSchema: Record<string, any>;
    };
    responses: Array<{
      id: number;
      name: string;
      code: number;
      contentType: string;
      jsonSchema: Record<string, any>;
      defaultEnable: boolean;
      ordering: number;
      description: string;
      mediaType: string;
      headers: any[];
    }>;
    responseExamples: Array<{
      id: number;
      name: string;
      responseId: number;
      data: string;
      ordering: number;
    }>;
    [key: string]: any;
  };
}

// 获取项目数据模型Schema
export const getProjectDataSchemas = async (token: string, projectId: number, locale: string = 'zh-CN') => {
  return apiFoxRequest<ApiFoxDataSchemaResponse>(`https://api.apifox.com/api/v1/projects/${projectId}/data-schemas?locale=${locale}`, token);
};

// 获取API详情
export const getApiDetail = async (token: string, projectId: number, apiId: number, locale: string = 'zh-CN') => {
  return apiFoxRequest<ApiFoxApiDetailResponse>(`https://api.apifox.com/api/v1/projects/${projectId}/http-apis/${apiId}?locale=${locale}`, token);
};

// 获取项目 API 树形列表
export const getApiTreeList = async (token: string, projectId: number, locale: string = 'zh-CN') => {
  return apiFoxRequest<ApiFoxApiTreeResponse>(`https://api.apifox.com/api/v1/projects/${projectId}/api-tree-list?locale=${locale}`, token);
};

// 获取团队和项目数据（组合接口）
export const getUserTeamsAndProjects = async (token: string, locale: string = 'zh-CN') => {
  try {
    const teamsResponse = await getUserTeams(token, locale);
    const projectsResponse = await getUserProjects(token, locale);
    
    return {
      success: true,
      data: {
        teams: teamsResponse.data,
        projects: projectsResponse.data
      }
    } as ApiFoxTeamsAndProjectsResponse;
  } catch (error) {
    console.error('获取团队和项目数据出错:', error);
    return {
      success: false,
      data: {
        teams: [],
        projects: []
      }
    } as ApiFoxTeamsAndProjectsResponse;
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
