/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

/**
 * Exports
 */

var bitcoind = exports;

/**
 * Modules
 */

var fs = require('fs');

/**
 * Load
 */

var termcoin = require('../')
  , utils = termcoin.utils
  , config = termcoin.config
  , mock = termcoin.mock
  , opt = config.opt
  , platform = config.platform
  , config = config.config
  , bitcoindjs;

/*
 * Constants
 */

bitcoind.name = 'libbitcoind';
bitcoind.restart = true;

/**
 * API Calls
 */

bitcoind.getStats = function(callback) {
  utils.parallel({
    balance: bitcoind.getTotalBalance,
    accounts: bitcoind.getAccounts,
    transactions: bitcoind.getTransactions,
    addresses: bitcoind.getAddresses,
    info: bitcoind.getInfo,
    encrypted: bitcoind.isEncrypted
  }, callback);
};

bitcoind.getAddresses = function(accounts, callback) {
  return bitcoindjs.getAddresses(function(err, addresses) {
    ;
  });
};

bitcoind.getAccounts = function(callback) {
  return bitcoindjs.getAccounts(function(err, accounts) {
    ;
  });
};

bitcoind.getProgress = function(callback) {
  return bitcoindjs.getProgress(function(err, progress) {
    ;
  });
};

bitcoind.getInfo = function(callback) {
  return bitcoindjs.getInfi(function(err, info) {
    ;
  });
};

bitcoind.getTransactions = function(callback) {
  return bitcoindjs.getTransactions(function(err, txs) {
    ;
  });
};

bitcoind.getTotalBalance = function(callback) {
  return bitcoindjs.getTotalBalance(function(err, balance) {
    ;
  });
};

bitcoind.signMessage = function(address, message, callback) {
  return bitcoindjs.signMessage(function(err, message) {
    ;
  });
};

bitcoind.verifyMessage = function(address, sig, message, callback) {
  return bitcoindjs.verifyMessage(function(err, verified) {
    ;
  });
};

bitcoind.createAddress = function(name, callback) {
  return bitcoindjs.createAddress(function(err, address) {
    ;
  });
};

bitcoind.listReceivedByAddress = function(address, callback) {
  return bitcoindjs.listReceivedByAddress(function(err, received) {
    ;
  });
};

bitcoind.backupWallet = function(path, callback) {
  return bitcoindjs.backupWallet(function(err, file) {
    ;
  });
};

bitcoind.encryptWallet = function(passphrase, callback) {
  return bitcoindjs.encryptWallet(function(err, success) {
    ;
  });
};

bitcoind.decryptWallet = function(passphrase, timeout, callback) {
  return bitcoindjs.decryptWallet(function(err, success) {
    ;
  });
};

bitcoind.changePassphrase = function(opassphrase, npassphrase, callback) {
  return bitcoindjs.changePassphrase(function(err, success) {
    ;
  });
};

bitcoind.forgetKey = function(callback) {
  return bitcoindjs.forgetKey(function(err, success) {
    ;
  });
};

bitcoind.isEncrypted = function(callback) {
  return bitcoindjs.isEncrypted(function(err, encrypted) {
    ;
  });
};

bitcoind.send = function(address, amount, callback) {
  return bitcoindjs.sendTo(function(err, sent) {
    ;
  });
};

bitcoind.sendFrom = function(from, address, amount, callback) {
  return bitcoindjs.sendFrom(function(err, sent) {
    ;
  });
};

bitcoind.move = function(from, to, amount, callback) {
  return bitcoindjs.move(function(err, moved) {
    ;
  });
};

// XXX IMPLEMENT IN BITCOIND.JS
// bitcoin.deleteAccount = function(address, callback) {
//   return bitcoindjs.deleteAccount(function(err, account) {
//     ;
//   });
// };

// XXX IMPLEMENT IN BITCOIND.JS
// bitcoin.changeLabel = function(address, label, callback) {
//   return bitcoindjs.changeLabel(function(err, label) {
//     ;
//   });
// };

bitcoind.setAccount = function(address, label, callback) {
  return bitcoindjs.setAccount(function(err, account) {
    ;
  });
};

bitcoind.getBlock = function(id, callback) {
  return bitcoindjs.getBlock(function(err, block) {
    ;
  });
};

bitcoind.getTransaction = function(id, callback) {
  return bitcoindjs.getTransactions(function(err, tx) {
    ;
  });
};

bitcoind.setTxFee = function(value, callback) {
  return bitcoindjs.setTxFee(function(err, fee) {
    ;
  });
};

bitcoind.importPrivKey = function(key, label, rescan, callback) {
  return bitcoindjs.importPrivKey(function(err, imported) {
    ;
  });
};

bitcoind.dumpPrivKey = function(address, callback) {
  return bitcoindjs.dumpPrivKey(function(err, privkey) {
    ;
  });
};

bitcoind.importWallet = function(file, callback) {
  return bitcoindjs.importWallet(function(err, imported) {
    ;
  });
};

bitcoind.dumpWallet = function(file, callback) {
  return bitcoindjs.dumpWallet(function(err, file) {
    ;
  });
};

bitcoind.keyPoolRefill = function(callback) {
  return bitcoindjs.keyPoolRefill(function(err, refilled) {
    ;
  });
};

bitcoind.getGenerate = function(callback) {
  return bitcoindjs.getGenerate(function(err, generation) {
    ;
  });
};

bitcoind.setGenerate = function(flag, threads, callback) {
  return bitcoindjs.setGenerate(function(err, generating) {
    ;
  });
};

bitcoind.getMiningInfo = function(callback) {
  return bitcoindjs.getMiningInfo(function(err, miningInfo) {
    ;
  });
};

bitcoind.stopServer = function(callback) {
  return bitcoindjs.stop(function(err, stopped) {
    ;
  });
};

/**
 * Start Server
 */

bitcoind.startServer = function(callback) {
  return bitcoindjs.start(function(err, server) {
    ;
  });
};

bitcoind.startClient = function() {
  bitcoindjs = require('bitcoind.js')({
    directory: '~/.termcoin-bitcoind',
    testnet: false,
    rpc: false
  });
  return bitcoind;
};

/**
 * Start Client
 */

bitcoind.client = bitcoind.startClient();
