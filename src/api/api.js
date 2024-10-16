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
  await request('/express-proxy-mock/save-customproxy-mock', {
    data,
    method: 'POST'
  })
}

export async function fetchChangeTargetType (data) {
  await request('/express-proxy-mock/change-target', {
    query: data
  })
}

export async function fetchBatchChangeTargetType (data) {
  await request('/express-proxy-mock/batch-change-target', {
    query: data
  })
}