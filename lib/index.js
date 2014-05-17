/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

var termcoin = exports;

termcoin.config = require('./config');
termcoin.backend = require('./backend')[termcoin.config.backend || 'bitcoind'];
termcoin.mock = require('./mock');
