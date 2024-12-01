import { createCachedRequest } from '../dist/bundle.js';
import {expect, test, jest} from '@jest/globals';
test('不同请求的基础数据入参, 缓存数据应该不一致', async () => {
  const fn = (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(id);
      }, 1000);
    })
  }
  const cachedFn = createCachedRequest(fn);
  const [r1, r2] = await Promise.all([cachedFn(1), cachedFn(2)]);
  expect(r1).not.toBe(r2);
});

test('不同请求的引用数据入参, 缓存数据应该不一致', async () => {
  const fn = (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(id);
      }, 1000);
    })
  }
  const cachedFn = createCachedRequest(fn);
  const obj1 = { id: 1, name: 'test', foo: '', bar: [] };
  const obj2 = { id: 2, name: 'test', foo: '', bar: [] };
  const [r1, r2] = await Promise.all([cachedFn(obj1), cachedFn(obj2)]);
  expect(r1).not.toBe(r2);
});

test('不同入参的请求, 应该会调用两次', async() => {
  const fn = jest.fn((id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(id);
      }, 1000);
    })
  }).mockName('difRequest')
  const cachedFn = createCachedRequest(fn);
  await Promise.all([cachedFn(1), cachedFn(2)]);
  expect(fn).toBeCalledTimes(2);
});