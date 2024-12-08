import mitt from "mitt";
import type { Config, CacheItem } from "./types";


export const emitter = mitt();

/** 过期时间 */
export const DEFAULT_EXPIRE_TIME = 1000 * 60 * 3; // 3分钟

/** 每个请求最大缓存数量 */
export const DEFAULT_MAX_CACHE_COUNT = 50;

const cacheRecord: Record<string, Record<string, CacheItem>> = {};

const lru: string[] = [];

/** 并发锁 */
const lock: Record<string, [(value: unknown) => void, (reason?: any) => void][]> = {};

const splitFlat = '_'

function getLruKey (fnId: string, requestKey: string) {
  return `${fnId}${splitFlat}${requestKey}`
}

function lruKeyToRaw (lruKey: string) {
  const flagIndex = lruKey.indexOf(splitFlat)
  if (flagIndex === -1) {
    throw new Error(`lruKey is invalid: ${lruKey}`)
  }
  return {
    id: lruKey.slice(0, flagIndex),
    requestKey: lruKey.slice(flagIndex + 1)
  }
}


export function init(config: Config = {} as Config) {
  config.expireTime = config.expireTime ?? DEFAULT_EXPIRE_TIME
  config.maxCacheCount = config.maxCacheCount ?? DEFAULT_MAX_CACHE_COUNT

  function updateLruCache(lruKey: string) {
    const targetIndex = lru.indexOf(lruKey)
    // 新增
    if (targetIndex === -1) {
      if (lru.length + 1 > config.maxCacheCount) {
        const removedKey = lru.shift()!
        const { id, requestKey } = lruKeyToRaw(removedKey)
        // 淘汰一直未被使用的
        delete cacheRecord[id][requestKey]
      }
    } else {
      // 命中缓存, 移动到最后
      lru.splice(targetIndex, 1)
    }
    lru.push(lruKey)
  }

  return function createCachedRequest<T, U extends any[]>(fn: (...args: U) => Promise<T | null>, id?: string) {
    if (!id) {
      id = fn.name
    }

    function clearCache() {
      cacheRecord[id!] = Object.create(null)
    }

    // 字典或其它接口更新数据源时, 清空缓存
    emitter.off(id, clearCache)
    emitter.on(id, clearCache)

    return async function cachedRequest(...args: Parameters<typeof fn>): ReturnType<typeof fn> {
      const requestKey = JSON.stringify(args)
      const now = Date.now()
      const cacheEntry = cacheRecord[id] || (cacheRecord[id] = Object.create(null))
      const cacheItem = cacheEntry[requestKey] as CacheItem<T> | undefined

      // 如果缓存存在并且未过期, 直接返回
      if (cacheItem && cacheItem.meta.expire > now) {
        return cacheItem.data
      }

      const lryKey = getLruKey(id, requestKey)
      const curLock = lock[lryKey]

      // 控制并发, 如果有锁, 等待锁释放
      if (curLock) {
        return new Promise((resolve, reject) => {
          curLock.push([resolve as any, reject])
        })
      }

      try {
        // 否则重新请求
        lock[lryKey] = []
        const data = await fn(...args)
        
        // 添加或者更新缓存
        cacheEntry[requestKey] = cacheItem ?? { data, meta: { expire: 0 } }
        cacheEntry[requestKey].meta.expire = now + config.expireTime
        // 处理缓存数量
        updateLruCache(lryKey)

        // 释放锁
        lock[lryKey].forEach(([resolve]) => resolve(data))

        return data
      } catch (err: any) {
        console.log(`[cachedRequest] error: ${err.message}`)
        // 释放锁
        lock[lryKey].forEach(([, reject]) => reject(err))
        return null
      } finally {
        delete lock[lryKey]
      }
    }
  } 
}


export function dumpCache() {
  console.log('lru', lru)
  console.log('cacheRecord', cacheRecord)
}