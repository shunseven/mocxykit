function firstUpperCase(str) {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

function parseUrlToName (url) {
  return url.split('/').map(item => firstUpperCase(item)).join('')
}

module.exports = {
  parseUrlToName
}
