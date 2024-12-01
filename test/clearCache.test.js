import { createCachedRequest, emitter } from '../dist/bundle.js';
import {expect, test, jest} from '@jest/globals';
function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  })
}

test('触发清理缓存事件后, 相同的入参应该会重新触发调用', async () => {
  const fnClearCache = jest.fn((id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(id);
      });
    })
  })
  const cachedFn = createCachedRequest(fnClearCache);
  const arg = 'cache1';
  await cachedFn(arg)
  await sleep(500);
  await cachedFn(arg)
  // 相同入参被缓存, 只调用一次
  expect(fnClearCache).toHaveBeenCalledTimes(1);
  // 清理缓存
  emitter.emit(fnClearCache.name);
  // 缓存不存在, 重新调用, 调用次数+1
  await cachedFn(arg)
  expect(fnClearCache).toHaveBeenCalledTimes(2);
  // 仍然有缓存, 不再调用
  await cachedFn(arg)
  await cachedFn(arg)
  expect(fnClearCache).toHaveBeenCalledTimes(2);
});