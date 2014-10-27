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
  return utils.parallel({
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
    if (err) return callback(err);
    return callback(null, addresses);
  });
};

bitcoind.getAccounts = function(callback) {
  return bitcoindjs.getAccounts(function(err, accounts) {
    if (err) return callback(err);
    return callback(null, accounts);
  });
};

bitcoind.getProgress = function(callback) {
  return bitcoindjs.getProgress(function(err, progress) {
    if (err) return callback(err);
    return callback(null, progress);
  });
};

bitcoind.getInfo = function(callback) {
  return bitcoindjs.getInfi(function(err, info) {
    if (err) return callback(err);
    return callback(null, info);
  });
};

bitcoind.getTransactions = function(callback) {
  return bitcoindjs.getTransactions(function(err, txs) {
    if (err) return callback(err);
    return callback(null, txs);
  });
};

bitcoind.getTotalBalance = function(callback) {
  return bitcoindjs.getTotalBalance(function(err, balance) {
    if (err) return callback(err);
    return callback(null, balance);
  });
};

bitcoind.signMessage = function(address, message, callback) {
  return bitcoindjs.signMessage(function(err, message) {
    if (err) return callback(err);
    return callback(null, message);
  });
};

bitcoind.verifyMessage = function(address, sig, message, callback) {
  return bitcoindjs.verifyMessage(function(err, verified) {
    if (err) return callback(err);
    return callback(null, verified);
  });
};

bitcoind.createAddress = function(name, callback) {
  return bitcoindjs.createAddress(function(err, address) {
    if (err) return callback(err);
    return callback(null, address);
  });
};

// XXX IMPLEMENT IN BITCOIND.JS
bitcoind.listReceivedByAddress = function(address, callback) {
  return bitcoindjs.listReceivedByAddress(function(err, received) {
    if (err) return callback(err);
    return callback(null, received);
  });
};

bitcoind.backupWallet = function(path, callback) {
  return bitcoindjs.backupWallet(function(err, file) {
    if (err) return callback(err);
    return callback(null, file);
  });
};

bitcoind.encryptWallet = function(passphrase, callback) {
  return bitcoindjs.encryptWallet(function(err, encrypted) {
    if (err) return callback(err);
    return callback(null, encrypted);
  });
};

bitcoind.decryptWallet = function(passphrase, timeout, callback) {
  return bitcoindjs.decryptWallet(function(err, decrypted) {
    if (err) return callback(err);
    return callback(null, decrypted);
  });
};

bitcoind.changePassphrase = function(opassphrase, npassphrase, callback) {
  return bitcoindjs.changePassphrase(function(err, passphrase) {
    if (err) return callback(err);
    return callback(null, passphrase);
  });
};

bitcoind.forgetKey = function(callback) {
  return bitcoindjs.forgetKey(function(err, locked) {
    if (err) return callback(err);
    return callback(null, locked);
  });
};

bitcoind.isEncrypted = function(callback) {
  return bitcoindjs.isEncrypted(function(err, encrypted) {
    if (err) return callback(err);
    return callback(null, encrypted);
  });
};

bitcoind.send = function(address, amount, callback) {
  return bitcoindjs.sendTo(function(err, sent) {
    if (err) return callback(err);
    return callback(null, sent);
  });
};

bitcoind.sendFrom = function(from, address, amount, callback) {
  return bitcoindjs.sendFrom(function(err, sent) {
    if (err) return callback(err);
    return callback(null, sent);
  });
};

bitcoind.move = function(from, to, amount, callback) {
  return bitcoindjs.move(function(err, moved) {
    if (err) return callback(err);
    return callback(null, moved);
  });
};

// XXX IMPLEMENT IN BITCOIND.JS
// bitcoin.deleteAccount = function(address, callback) {
 //  return bitcoindjs.deleteAccount(function(err, account) {
//     if (err) return callback(err);
//     return callback(null, account);
//   });
// };

// XXX IMPLEMENT IN BITCOIND.JS
// bitcoin.changeLabel = function(address, label, callback) {
//   return bitcoindjs.changeLabel(function(err, label) {
//     if (err) return callback(err);
//     return callback(null, label);
//   });
// };

bitcoind.setAccount = function(address, label, callback) {
  return bitcoindjs.setAccount(function(err, account) {
    if (err) return callback(err);
    return callback(null, account);
  });
};

bitcoind.getBlock = function(id, callback) {
  return bitcoindjs.getBlock(function(err, block) {
    if (err) return callback(err);
    return callback(null, block);
  });
};

bitcoind.getTransaction = function(id, callback) {
  return bitcoindjs.getTransactions(function(err, tx) {
    if (err) return callback(err);
    return callback(null, tx);
  });
};

bitcoind.setTxFee = function(value, callback) {
  return bitcoindjs.setTxFee(function(err, fee) {
    if (err) return callback(err);
    return callback(null, fee);
  });
};

bitcoind.importPrivKey = function(key, label, rescan, callback) {
  return bitcoindjs.importPrivKey(function(err, imported) {
    if (err) return callback(err);
    return callback(null, imported);
  });
};

bitcoind.dumpPrivKey = function(address, callback) {
  return bitcoindjs.dumpPrivKey(function(err, privkey) {
    if (err) return callback(err);
    return callback(null, privkey);
  });
};

bitcoind.importWallet = function(file, callback) {
  return bitcoindjs.importWallet(function(err, imported) {
    if (err) return callback(err);
    return callback(null, imported);
  });
};

bitcoind.dumpWallet = function(file, callback) {
  return bitcoindjs.dumpWallet(function(err, file) {
    if (err) return callback(err);
    return callback(null, file);
  });
};

bitcoind.keyPoolRefill = function(callback) {
  return bitcoindjs.keyPoolRefill(function(err, refilled) {
    if (err) return callback(err);
    return callback(null, refilled);
  });
};

bitcoind.getGenerate = function(callback) {
  return bitcoindjs.getGenerate(function(err, generation) {
    if (err) return callback(err);
    return callback(null, generation);
  });
};

bitcoind.setGenerate = function(flag, threads, callback) {
  return bitcoindjs.setGenerate(function(err, generating) {
    if (err) return callback(err);
    return callback(null, generating);
  });
};

bitcoind.getMiningInfo = function(callback) {
  return bitcoindjs.getMiningInfo(function(err, info) {
    if (err) return callback(err);
    return callback(null, info);
  });
};

bitcoind.stopServer = function(callback) {
  return bitcoindjs.stop(function(err, stopped) {
    if (err) return callback(err);
    return callback(null, stopped);
  });
};

/**
 * Start Server
 */

bitcoind.startServer = function(callback) {
  bitcoindjs = require('bitcoind.js')({
    directory: '~/.termcoin-bitcoind',
    testnet: false,
    rpc: false
  });
  bitcoindjs.on('open', function() {
    return callback(null, bitcoind);
  });
  bitcoindjs.on('error', function(err) {
    throw err;
  });
};
