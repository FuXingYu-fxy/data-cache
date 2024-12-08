export type Config = {
    /** 缓存有效期（毫秒） */
    expireTime: number;
    /** 每个请求最大缓存数量 */
    maxCacheCount: number;
};
export interface CacheItem<T = unknown> {
    data: T;
    meta: {
        expire: number;
    };
}
