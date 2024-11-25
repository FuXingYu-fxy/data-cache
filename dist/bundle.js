import mitt from 'mitt';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const emitter = mitt();
/** 过期时间 */
const EXPIRE_TIME = 1000 * 60 * 3; // 3分钟
/** 最大缓存数量 */
const MAX_CACHE_COUNT = 50;
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
const cacheRecord = {};
const lru = [];
/** 并发锁 */
const lock = {};
const splitFlat = '_';
function getLruKey(fnId, requestKey) {
    return `${fnId}${splitFlat}${requestKey}`;
}
function lruKeyToRaw(lruKey) {
    const flagIndex = lruKey.indexOf(splitFlat);
    if (flagIndex === -1) {
        throw new Error(`lruKey is invalid: ${lruKey}`);
    }
    return {
        id: lruKey.slice(0, flagIndex),
        requestKey: lruKey.slice(flagIndex + 1)
    };
}
function updateLruCache(lruKey) {
    const targetIndex = lru.indexOf(lruKey);
    // 新增
    if (targetIndex !== -1) {
        if (lru.length + 1 > MAX_CACHE_COUNT) {
            const removedKey = lru.shift();
            const { id, requestKey } = lruKeyToRaw(removedKey);
            // 淘汰一直未被使用的
            delete cacheRecord[id][requestKey];
        }
    }
    else {
        // 命中缓存, 移动到最后
        lru.splice(targetIndex, 1);
    }
    lru.push(lruKey);
}
function createCachedRequest(fn, id) {
    if (!id) {
        id = fn.name;
    }
    function clearCache() {
        cacheRecord[id] = Object.create(null);
    }
    // 字典或其它接口更新数据源时, 清空缓存
    emitter.off(id, clearCache);
    emitter.on(id, clearCache);
    return function cachedRequest(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestKey = JSON.stringify(args);
            const now = Date.now();
            const cacheEntry = cacheRecord[id] || (cacheRecord[id] = Object.create(null));
            const cacheItem = cacheEntry[requestKey];
            // 如果缓存存在并且未过期, 直接返回
            if (cacheItem && cacheItem.meta.expire > now) {
                return cacheItem.data;
            }
            const lryKey = getLruKey(id, requestKey);
            const curLock = lock[lryKey];
            // 控制并发, 如果有锁, 等待锁释放
            if (curLock) {
                return new Promise((resolve, reject) => {
                    curLock.push([resolve, reject]);
                });
            }
            try {
                // 否则重新请求
                lock[lryKey] = [];
                const data = yield fn(...args);
                // 添加或者更新缓存
                cacheEntry[requestKey] = cacheItem !== null && cacheItem !== void 0 ? cacheItem : { data, meta: { expire: 0 } };
                cacheEntry[requestKey].meta.expire = now + EXPIRE_TIME;
                // 处理缓存数量
                updateLruCache(lryKey);
                // 释放锁
                lock[lryKey].forEach(([resolve]) => resolve(data));
                return data;
            }
            catch (err) {
                console.log(`[cachedRequest] error: ${err.message}`);
                // 释放锁
                lock[lryKey].forEach(([, reject]) => reject(err));
                return null;
            }
            finally {
                delete lock[lryKey];
            }
        });
    };
}
function dumpCache() {
    console.log('lru', lru);
    console.log('cacheRecord', cacheRecord);
}

export { EXPIRE_TIME, MAX_CACHE_COUNT, createCachedRequest, dumpCache, emitter };
