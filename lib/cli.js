/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

/**
 * Exports
 */

var cli = exports;

/**
 * Modules
 */

var fs = require('fs')
  , cp = require('child_process');

/**
 * Dependencies
 */

var blessed = require('blessed');

/**
 * Load
 */

var termcoin = require('./')
  , utils = termcoin.utils
  , config = termcoin.config
  , mock = termcoin.mock
  , transforms = termcoin.transforms
  , bitcoin = termcoin.bitcoin
  , opt = config.opt
  , platform = config.platform
  , blockchain = require('./explore/blockchain');

var coined = require('coined')
  , bcoin = coined.bcoin
  , bn = coined.bn;

var setImmediate = typeof global.setImmediate !== 'function'
  ? process.nextTick.bind(proccess)
  : global.setImmediate;

/**
 * Variables
 */

cli.decryptTime = 0;
cli.lock = false;
cli.sep = ' │ ';

/**
 * Start
 */

cli.start = function(stats, callback) {
  return callback();
};

/**
 * Main
 */

cli.main = function(callback) {
  return bitcoin.startServer(function(err) {
    if (err) return callback(err);
    return bitcoin.getStats(function(err, stats) {
      if (err) return callback(err);
      return cli.start(stats, function(err) {
        if (err) return callback(err);
        return callback();
      });
    });
  });
};
