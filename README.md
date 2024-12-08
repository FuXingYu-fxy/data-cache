# requestCacheManager

`requestCacheManager` 是一个用于缓存相同入参的函数调用结果的库，支持设置缓存时间和最大缓存数量。

## 安装

使用 npm 安装：

```sh
npm install requestCacheManager
```
使用 yarn 安装：
```sh
yarn add requestCacheManager
```
## 使用方法
首先需要初始化配置：
```ts
import { init } from 'requestCacheManager';

const config = {
  expireTime: 1000 * 60 * 5, // 缓存过期时间，默认为 3 分钟
  maxCacheCount: 100 // 每个请求的最大缓存数量，默认为 50
};

const createCachedRequest = init(config);

```
创建缓存请求
使用 createCachedRequest 创建一个缓存请求函数：
```ts
const fetchData = async (id: number) => {
  // 模拟异步请求
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id, data: `Data for ${id}` });
    }, 1000);
  });
};

const cachedFetchData = createCachedRequest(fetchData, fetchData.name);

// 调用缓存请求函数
cachedFetchData(1).then((data) => {
  console.log(data); // 输出缓存的数据
});
```
## 清除缓存
当数据源更新时，可以通过事件清除缓存：
```ts
import { emitter } from 'requestCacheManager';

// 触发事件清除缓存, createCachedRequest的第二个参数
emitter.emit('fetchData');
```

## 配置项
- expireTime：缓存过期时间，单位为毫秒，默认为 1000 * 60 * 3（3 分钟）。
- maxCacheCount：每个请求的最大缓存数量，默认为 50。
## 完整示例
```ts
import { init, emitter } from 'requestCacheManager';

const config = {
  expireTime: 1000 * 60 * 5, // 缓存过期时间，默认为 3 分钟
  maxCacheCount: 100 // 每个请求的最大缓存数量，默认为 50
};

const createCachedRequest = init(config);

const fetchData = async (id: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id, data: `Data for ${id}` });
    }, 1000);
  });
};

const cachedFetchData = createCachedRequest(fetchData, fetchData.name);

cachedFetchData(1).then((data) => {
  console.log(data); // 输出缓存的数据
});

// 触发事件清除缓存
emitter.emit(fetchData.name);
```