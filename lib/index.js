/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

var EventEmitter = require('events').EventEmitter;
// Object.keys(EventEmitter.prototype).forEach(function(method) {
//   exports[method] = EvenetEmitter.prototype[method];
// });
exports.__proto__ = EventEmitter.prototype;
EventEmitter.call(exports);

var termcoin = exports;

/**
 * Blessed
 */

termcoin.blessed = require('blessed');

/**
 * Utils
 */

termcoin.utils = require('./utils');
termcoin.emit('utils', termcoin.utils);

/**
 * Config
 */

termcoin.config = require('./config');
termcoin.emit('config', termcoin.config);

/**
 * Mock Data
 */

termcoin.mock = require('./mock');
termcoin.emit('mock', termcoin.mock);

/**
 * Transforms
 */

termcoin.transforms = require('./transforms');
termcoin.emit('transforms', termcoin.transforms);

/**
 * Blockchain.info
 */

termcoin.blockchain = require('./explore/blockchain');
termcoin.emit('blockchain', termcoin.blockchain);

/**
 * Backend
 */

termcoin.backend = require('./backend');
termcoin.emit('backend', termcoin.config.backend, termcoin.backend[termcoin.config.backend]);
termcoin.bitcoin = termcoin.backend[termcoin.config.backend];
termcoin.bitcoin.coin = Object.create(require('coined').prototype);

if (!termcoin.bitcoin) {
  console.error('Please choose a valid backend.');
  return process.exit(1);
}

/**
 * User Interface
 */

termcoin.ui = require('./ui');
termcoin.emit('ui', termcoin.ui);

Object.keys(termcoin.ui).forEach(function(key) {
  termcoin[key] = termcoin.ui[key];
});
