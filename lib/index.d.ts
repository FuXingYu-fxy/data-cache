import type { Config } from "./types";
export declare const emitter: import("mitt").Emitter<Record<import("mitt").EventType, unknown>>;
/** 过期时间 */
export declare const DEFAULT_EXPIRE_TIME: number;
/** 每个请求最大缓存数量 */
export declare const DEFAULT_MAX_CACHE_COUNT = 50;
export declare function init(config?: Config): <T, U extends any[]>(fn: (...args: U) => Promise<T | null>, id?: string) => (...args: Parameters<typeof fn>) => ReturnType<typeof fn>;
export declare function dumpCache(): void;
