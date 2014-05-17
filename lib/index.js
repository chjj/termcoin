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
 * Backend
 */

termcoin.backend = require('./backend');
termcoin.bitcoin = termcoin.backends[termcoin.config.backend];

/**
 * User Interface
 */

termcoin.ui = require('./ui');

Object.keys(termcoin.ui).forEach(function(key) {
  termcoin[key] = termcoin.ui[key];
});
