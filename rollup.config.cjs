const typescript = require('@rollup/plugin-typescript');
const pkg = require('./package.json');

/** @type {import('rollup').RollupOptions} */
const config = {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'esm'
  },
  plugins: [typescript()],
  external: Object.keys(pkg.dependencies)
}

module.exports = config;
