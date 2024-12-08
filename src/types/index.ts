export type Config = {
  /** 缓存有效期（毫秒） */
  expireTime: number;
  /** 每个请求最大缓存数量 */
  maxCacheCount: number;
}

// {
//   'getUserList': {
//     'page=1&size=10': {
//       data: [],
//       meta: {
//         expire: 173628736
//       }
//     }
//   }
// }
export interface CacheItem<T = unknown> {
  data: T;
  meta: {
    expire: number;
  }
}
