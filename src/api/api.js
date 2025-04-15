async function request(url, config = {}) {
  const options = {
    ...config,
    headers: {
      'Content-Type': 'application/json'
    },
    method: config.method || 'GET',
    query: config.query
  }

  if (config.query) {
    const query = Object.keys(config.query).map(key => `${key}=${config.query[key]}`).join('&')
    url = `${url}?${query}`
  }

  if (config.data) {
    options.body = JSON.stringify(config.data)
  }

  const res = await fetch(url, options)
  return res.json()
}

export async function requestApiData () {
  const res = await request('/express-proxy-mock/get-api-list')
  return res
}

export const fetchDeleteApiData = ({ key }) => {
  return fetch(`/express-proxy-mock/delete-api-data?key=${key}`).then(res => res.json())
}

export async function fetchDeleteProxy (data) {
  const res = await request('/express-proxy-mock/delete-proxy', {
    query: data
  })
  return res
}

// 替换原有的 fetchCreateProxy
export async function fetchSaveProxy (data) {
  const res = await request('/express-proxy-mock/save-proxy', {
    query: data
  })
  return res
}

export async function fetchChangeProxy (data) {
  const res = await request('/express-proxy-mock/change-proxy', {
    query: data
  })
  return res
}

export async function saveCustomProxyData (data) {
  const res = await request('/express-proxy-mock/save-customproxy-mock', {
    data,
    method: 'POST'
  })
  return res
}

export async function batchImportRequestCacheToMock (data) {
  const res = await request('/express-proxy-mock/batch-import-request-cache-to-mock', {
    data,
    method: 'POST'
  })
  return res
}

export async function saveEnvVariables(data) {
  const res = await request('/express-proxy-mock/save-env-variables', {
    data,
    method: 'POST'
  })
  return res
}

export async function fetchChangeTargetType (data) {
  const res = await request('/express-proxy-mock/change-target', {
    query: data
  })
  return res
}

export const fetchBatchChangeTargetType = (data) => {
  console.log('data', data)
  return request(`/express-proxy-mock/batch-change-target`, {
    data,
    method: 'POST'
  })
}

export async function fetctApiItemDataAndMockData (data) {
  const res = await request('/express-proxy-mock/get-api-item-and-mock', {
    query: data
  })
  return res
}

export async function getCacheRequestHistoryLength () {
  const res = await request('/express-proxy-mock/get-request-cache-length')
  return res
}

export async function getCacheRequestHistory () {
  const res = await request('/express-proxy-mock/get-request-cache')
  return res
}

export async function clearCacheRequestHistory () {
  const res = await request('/express-proxy-mock/clear-request-cache')
  return res
}

export async function getEnvVariables() {
  const res = await request('/express-proxy-mock/get-env-variables')
  return res
}

export async function changeEnvVariable(envId) {
  const res = await request('/express-proxy-mock/change-env-variable', {
    query: { envId }
  })
  return res
}

export async function deleteEnvVariable(envId) {
  const res = await request('/express-proxy-mock/delete-env-variable', {
    query: { envId }
  })
  return res
}

export async function refreshEnvVariable() {
  const res = await request('/express-proxy-mock/refresh-env-variable')
  return res
}

export async function enablePublicAccess(data) {
  const res = await request('/express-proxy-mock/enable-public-access', {
    method: 'POST',
    data
  })
  return res
}

// 获取MCP配置
export async function fetchMcpConfig() {
  const res = await request('/express-proxy-mock/get-mcp-config')
  return res
}

// 更新MCP配置
export async function updateMcpConfig(data) {
  const res = await request('/express-proxy-mock/update-mcp-config', {
    method: 'POST',
    data
  })
  return res
}

export async function fetchBaseConfig() {
  const res = await request('/express-proxy-mock/get-base-config')
  return res
}

export async function updateBaseConfig(data) {
  const res = await request('/express-proxy-mock/set-base-config', {
    method: 'POST',
    data
  })
  return res
}

// ApiFox相关API
export async function fetchApiFoxTeamsAndProjects(data) {
  const res = await request('/express-proxy-mock/apifox-user-teams-and-projects', {
    method: 'POST',
    data
  })
  return res
}

export async function fetchApiFoxTreeList(data) {
  const res = await request('/express-proxy-mock/apifox-tree-list', {
    method: 'POST',
    data
  })
  return res
}

export async function syncApiFoxApi(data) {
  const res = await request('/express-proxy-mock/apifox-sync-api', {
    method: 'POST',
    data
  })
  return res
}

// 获取 ApiFox 配置
export async function getApiFoxConfig() {
  const res = await request('/express-proxy-mock/get-apifox-config')
  return res
}

// 保存 ApiFox 配置
export async function saveApiFoxConfig(data) {
  const res = await request('/express-proxy-mock/save-apifox-config', {
    method: 'POST',
    data
  })
  return res
}

export async function saveRequestData(data) {
  const res = await request('/express-proxy-mock/save-request-data', {
    method: 'POST',
    data
  })
  return res
}

