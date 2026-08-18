// In-memory SWR (Stale-While-Revalidate) data cache manager
const cacheStore = new Map();
const DEFAULT_TTL_MS = 45 * 1000; // 45 seconds default TTL

export async function fetchWithCache(key, fetcherFn, options = {}) {
  const { ttl = DEFAULT_TTL_MS, forceRefresh = false } = options;
  const now = Date.now();
  const cached = cacheStore.get(key);

  if (!forceRefresh && cached) {
    const isFresh = now - cached.timestamp < ttl;
    if (isFresh) {
      return cached.data;
    }

    // Stale-While-Revalidate: Return cached data immediately & update in background
    fetcherFn()
      .then((freshData) => {
        if (freshData !== undefined && freshData !== null) {
          cacheStore.set(key, { data: freshData, timestamp: Date.now() });
        }
      })
      .catch((err) => {
        console.warn(`[SWR Cache] Background revalidation failed for "${key}":`, err?.message || err);
      });

    return cached.data;
  }

  // Fetch synchronously if missing or forceRefresh requested
  const freshData = await fetcherFn();
  if (freshData !== undefined && freshData !== null) {
    cacheStore.set(key, { data: freshData, timestamp: Date.now() });
  }
  return freshData;
}

export function invalidateCache(keyPrefix = '') {
  if (!keyPrefix) {
    cacheStore.clear();
    return;
  }

  for (const key of cacheStore.keys()) {
    if (key.startsWith(keyPrefix)) {
      cacheStore.delete(key);
    }
  }
}

export function getCacheStats() {
  return {
    size: cacheStore.size,
    keys: Array.from(cacheStore.keys()),
  };
}
