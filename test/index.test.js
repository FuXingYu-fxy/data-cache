import { createCachedRequest } from '../dist/bundle.js';
import {describe, expect, test} from '@jest/globals';


test('相同请求的基础数据入参, 缓存数据应该一致', async () => {
  const fn = (id) => {
    return id;
  }
  const cachedFn = createCachedRequest(fn);
  const [r1, r2] = await Promise.all([cachedFn(1), cachedFn(1)]);
  expect(r1).toBe(r2);
});


test('相同请求的引用数据入参, 缓存数据应该一致', async () => {
  const fn = (id) => {
    return JSON.stringify(id);
  }
  const cachedFn = createCachedRequest(fn);
  const obj = { id: 1, name: 'test', foo: '', bar: [] };
  const [r1, r2] = await Promise.all([cachedFn(obj), cachedFn(obj)]);
  expect(r1).toBe(r2);
});