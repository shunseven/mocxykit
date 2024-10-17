let cacheRequestHistory: CacheRequestHistoryData[] = [];

export function setCacheRequestHistory(data: CacheRequestHistoryData, max = 20) {
  cacheRequestHistory = cacheRequestHistory.filter(item => item.key !== data.key);
  cacheRequestHistory.unshift(data);
  if (cacheRequestHistory.length > max) {
    cacheRequestHistory.pop();
  }
}

export function getCacheRequestHistory(): CacheRequestHistoryData[] {
  return cacheRequestHistory;
}
