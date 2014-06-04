/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

var termcoin = exports;

/**
 * Blessed
 */

termcoin.blessed = require('blessed');

/**
 * Utils
 */

termcoin.utils = require('./utils');

/**
 * Config
 */

termcoin.config = require('./config');

/**
 * Mock Data
 */

termcoin.mock = require('./mock');

/**
 * Transforms
 */

termcoin.transforms = require('./transforms');

/**
 * Blockchain.info
 */

termcoin.blockchain = require('./explore/blockchain');

/**
 * Backend
 */

termcoin.backend = require('./backend');
termcoin.bitcoin = termcoin.backend[termcoin.config.backend];

if (!termcoin.bitcoin) {
  console.error('Please choose a valid backend.');
  return process.exit(1);
}

/**
 * User Interface
 */

termcoin.ui = require('./ui');

Object.keys(termcoin.ui).forEach(function(key) {
  termcoin[key] = termcoin.ui[key];
});
