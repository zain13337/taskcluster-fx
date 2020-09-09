const minify = require('yarn-minify');
const { gitLsFiles } = require('../../utils');

// Ignore packages while we slowly whittle away the requirements
const IGNORE = {
  'clients/client/yarn.lock': pkg => false,
  'clients/client-web/yarn.lock': pkg => false,
  'yarn.lock': pkg => [
    'acorn',
    'async',
    'base64-js',
    'bluebird',
    'body-parser',
    'convert-source-map',
    'graphql-tag',
    'har-validator',
    'is-buffer',
    'is-regex',
    'lodash',
    'mime',
    'mime-db',
    'mock-fs',
    'nodemailer',
    'object-inspect',
    'qs',
    'request',
    'resolve',
    'signal-exit',
    'subscriptions-transport-ws',
    'tslib',
    '@types/node',
    'uuid',
    'zen-observable',
  ].includes(pkg),
  'ui/yarn.lock': pkg => [
    'acorn',
    'ajv',
    'array-includes',
    'async',
    'bluebird',
    'ccount',
    'chokidar',
    'chownr',
    'commander',
    'compressible',
    'compression',
    'convert-source-map',
    'csstype',
    'electron-to-chromium',
    'es-abstract',
    'eslint-loader',
    'eslint-module-utils',
    'eslint-plugin-import',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'es-to-primitive',
    'estraverse',
    'eventemitter3',
    'express',
    'faye-websocket',
    'glob',
    'graceful-fs',
    'history',
    'hoist-non-react-statics',
    'http-proxy',
    'is-callable',
    'is-regex',
    'iterall',
    'json5',
    'jsx-ast-utils',
    'js-yaml',
    'loader-utils',
    'loglevel',
    '@material-ui/utils',
    'mime-db',
    'mkdirp',
    'object.entries',
    'object.fromentries',
    'object-inspect',
    'object.values',
    'on-headers',
    'opn',
    'optionator',
    'parse-entities',
    'p-limit',
    'portfinder',
    'postcss',
    'postcss-value-parser',
    'react-is',
    'readable-stream',
    'regenerate',
    'regenerator-runtime',
    'regexp.prototype.flags',
    'regexpu-core',
    'regjsgen',
    'resolve',
    'rimraf',
    'schema-utils',
    'selfsigned',
    'source-map-support',
    'string.prototype.trimleft',
    'string.prototype.trimright',
    'terser',
    'tslib',
    '@types/node',
    '@types/react',
    'unist-util-visit',
    'url-parse',
    'ws',
  ].includes(pkg),
  'workers/docker-worker/yarn.lock': pkg => [
    'ajv',
    'brace-expansion',
    'chownr',
    'debug',
    'end-of-stream',
    'glob',
    'inherits',
    'ipaddr.js',
    'js-yaml',
    'mime-types',
    'minimatch',
    'readable-stream',
    'safe-buffer',
    'which',
  ].includes(pkg),
};

exports.tasks = [{
  title: 'Minify yarn.locks',
  provides: ['target-yarn-minify'],
  run: async (requirements, utils) => {
    let yarnlocks = (await gitLsFiles())
      .filter(file => file === 'yarn.lock' || file.endsWith('/yarn.lock'));

    for (let filename of yarnlocks) {
      minify(filename, { ignore: IGNORE[filename] });
    }
  },
}];
