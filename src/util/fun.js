function firstUpperCase(str) {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

function parseUrlToName (url) {
  return url.split('/').map(item => firstUpperCase(item)).join('')
}

function  getRequestData(req) {
    let query = req.query
    let body = ''
    if (req.method.toLowerCase() === 'post' || req.method.toLowerCase() === 'put') {
        return new Promise(resolve => {
            req.on('data', function (data) {
                body += data
            } )
            req.on('end', function () {
                try {
                    body = body ? JSON.parse(body.toString()) : {}
                } catch (e) {
                    body = {}
                }
                resolve({
                    body,
                    query
                })
                body = null
            })
        })
    }
    return Promise.resolve({
        query,
        body: {}
    })
}


module.exports = {
    parseUrlToName,
    getRequestData
}
