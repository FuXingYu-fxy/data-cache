const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const pkg = require('./package.json');
const terser = require('@rollup/plugin-terser')

/** @type {import('rollup').RollupOptions} */
const config = {
  input: 'src/index.ts',
  output: [
    {
      dir: 'lib',
      format: 'cjs',
      entryFileNames: '[name].cjs',
      sourcemap: false, // 是否输出sourcemap
    },
    {
      dir: 'lib',
      format: 'esm',
      entryFileNames: '[name].js',
      sourcemap: false, // 是否输出sourcemap
    },
    {
      dir: 'lib',
      format: 'umd',
      entryFileNames: '[name].umd.js',
      name: pkg.name, // umd模块名称，相当于一个命名空间，会自动挂载到window下面
      sourcemap: false,
      plugins: [terser()],
    },
  ],
  plugins: [resolve(), commonjs(), typescript()],
  // external: Object.keys(pkg.dependencies)
}

module.exports = config;
