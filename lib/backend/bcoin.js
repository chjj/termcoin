/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

/**
 * Exports
 */

var bitcoin = exports;

/**
 * Modules
 */

var bcoin;
try {
  bcoin = require('bcoin');
} catch (e) {
  ;
}

/**
 * Load
 */

var termcoin = require('../')
  , utils = termcoin.utils
  , config = termcoin.config
  , mock = termcoin.mock
  , opt = config.opt
  , platform = config.platform
  , config = config.config;

/**
 * API Calls
 */

bitcoin.getStats = function(callback) {
  return callback(null, {});
};

bitcoin.getAddresses = function(accounts, callback) {
  return callback(null, {});
};

bitcoin.getAccounts = function(callback) {
  return callback(null, {});
};

bitcoin.getProgress = function(callback) {
  return callback(null, {});
};

bitcoin.getInfo = function(callback) {
  return callback(null, {});
};

bitcoin.getTransactions = function(callback) {
  return callback(null, {});
};

bitcoin.getTotalBalance = function(callback) {
  return callback(null, {});
};

bitcoin.signMessage = function(address, message, callback) {
  return callback(null, {});
};

bitcoin.verifyMessage = function(address, sig, message, callback) {
  return callback(null, {});
};

bitcoin.createAddress = function(name, callback) {
  return callback(null, {});
};

bitcoin.listReceivedByAddress = function(address, callback) {
  return callback(null, {});
};

bitcoin.backupWallet = function(path, callback) {
  return callback(null, {});
};

bitcoin.encryptWallet = function(passphrase, callback) {
  return callback(null, {});
};

bitcoin.decryptWallet = function(passphrase, timeout, callback) {
  return callback(null, {});
};

bitcoin.changePassphrase = function(opassphrase, npassphrase, callback) {
  return callback(null, {});
};

bitcoin.forgetKey = function(callback) {
  return callback(null, {});
};

bitcoin.isEncrypted = function(callback) {
  return callback(null, {});
};

bitcoin.send = function(address, amount, callback) {
  return callback(null, {});
};

bitcoin.sendFrom = function(from, address, amount, callback) {
  return callback(null, {});
};

bitcoin.move = function(from, to, amount, callback) {
  return callback(null, {});
};

bitcoin.setAccount = function(address, label, callback) {
  return callback(null, {});
};

bitcoin.getTransaction = function(id, callback) {
  return callback(null, {});
};

bitcoin.setTxFee = function(value, callback) {
  return callback(null, {});
};

bitcoin.importPrivKey = function(key, label, rescan, callback) {
  return callback(null, {});
};

bitcoin.dumpPrivKey = function(address, callback) {
  return callback(null, {});
};

bitcoin.keyPoolRefill = function(callback) {
  return callback(null, {});
};

bitcoin.getGenerate = function(callback) {
  return callback(null, {});
};

bitcoin.setGenerate = function(flag, threads, callback) {
  return callback(null, {});
};

bitcoin.getMiningInfo = function(callback) {
  return callback(null, {});
};

bitcoin.stopServer = function(callback) {
  return callback(null, {});
};

/**
 * Start Server
 */

bitcoin.startServer = function(callback) {
  return callback(null, {});
};

bitcoin.startClient = function() {
  return {};
};

/**
 * Start Client
 */

bitcoin.startClient();
