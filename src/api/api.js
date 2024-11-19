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

export async function fetchDeleteApiData (data) {
  const res = await request('/express-proxy-mock/delete-api-data', {
    query: data
  })
  return res
}

export async function fetchDeleteProxy (data) {
  const res = await request('/express-proxy-mock/delete-proxy', {
    query: data
  })
  return res
}

export async function fetchCreateProxy (data) {
  const res = await request('/express-proxy-mock/create-proxy', {
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

export async function fetchBatchChangeTargetType (data) {
  const res = await request('/express-proxy-mock/batch-change-target', {
    query: data
  })
  return res
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

