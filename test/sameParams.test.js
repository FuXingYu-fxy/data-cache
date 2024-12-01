import { createCachedRequest } from '../dist/bundle.js';
import {expect, test, jest} from '@jest/globals';


test('相同请求的基础数据入参, 缓存数据应该一致', async () => {
  const fn = (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(id);
      }, 1000);
    })
  }
  const cachedFn = createCachedRequest(fn);
  const [r1, r2] = await Promise.all([cachedFn(1), cachedFn(1)]);
  expect(r1).toBe(r2);
});


test('相同请求的引用数据入参, 缓存数据应该一致', async () => {
  const fn = (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(id);
      }, 1000);
    })
  }
  const cachedFn = createCachedRequest(fn);
  const obj = { id: 1, name: 'test', foo: '', bar: [] };
  const [r1, r2] = await Promise.all([cachedFn(obj), cachedFn(obj)]);
  expect(r1).toBe(r2);
});


test('相同入参的并发请求, 应该只会调用一次', async() => {
  const arg = '-_-';
  const fn = jest.fn((id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(id);
      }, 1000);
    })
  }).mockName('sameRequest')
  const cachedFn = createCachedRequest(fn);
  await Promise.all([cachedFn(arg), cachedFn(arg)]);
  expect(fn).toBeCalledTimes(1);
})


test('相同入参的排队请求, 应该只会调用一次', async() => {
  const arg = '^_^'
  const fn = jest.fn((id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(id);
      }, 1000);
    })
  }).mockName('sameRequest')
  const cachedFn = createCachedRequest(fn);
  await cachedFn(arg)
  await cachedFn(arg)
  expect(fn).toBeCalledTimes(1);
})