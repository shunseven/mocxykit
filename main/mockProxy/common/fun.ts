function firstUpperCase(str: string): string {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

export function parseUrlToKey (url: string): string {
  return url.split('/').map(item => firstUpperCase(item)).join('')
}