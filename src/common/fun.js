function firstUpperCase(str) {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

export function parseUrlToKey (url) {
  return url.split('/').map(item => firstUpperCase(item)).join('')
}