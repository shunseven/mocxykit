interface CacheRequestHistoryData {
  url: string;
  key: string;
  data: Record<string, any>;
  time: string;
}

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
