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
  if (!callback) {
    callback = accounts;
    accounts = null;
  }
  var out = bitcoindjs.wallet.listAccounts({});
  var keys = Object.keys(out);
  return callback(null, keys.filter(function(key) {
    var account = out[key];
    if (!accounts || ~accounts.indexOf(key)) {
      return true;
    }
    return false;
  }).map(function(key) {
    var account = out[key];
    return {
      name: key,
      address: account.addresses[0]
    };
  }));
};

bitcoind.getAccounts = function(options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  var out = bitcoindjs.wallet.listAccounts(options);
  var keys = Object.keys(out);
  var results = {};
  keys.forEach(function(key) {
    var account = out[key];
    account.addresses.forEach(function(address) {
      results[address] = {
        name: key,
        address: address,
        balance: account.balance
      };
    });
  });
  return callback(null, results);
};

bitcoind.getProgress = function(callback) {
  return bitcoindjs.getProgress(callback);
};

bitcoind.getInfo = function(callback) {
  return callback(null, bitcoindjs.getInfo());
};

bitcoind.getTransactions = function(options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  return callback(null, bitcoindjs.wallet.listTransactions(options));
};

bitcoind.getTotalBalance = function(options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  return callback(null, bitcoindjs.wallet.getBalance(options);
};

bitcoind.signMessage = function(address, message, callback) {
  var options = {
    address: address,
    message: message
  };
  return callback(null, bitcoindjs.wallet.signMessage(options));
};

bitcoind.verifyMessage = function(address, sig, message, callback) {
  var options = {
    address: address,
    signature: sig,
    message: message
  };
  return callback(null, bitcoindjs.wallet.verifyMessage(options));
};

bitcoind.createAddress = function(name, callback) {
  return callback(null, bitcoindjs.wallet.createAddress({
    name: name
  }));
};

bitcoind.listReceivedByAddress = function(address, callback) {
  return callback(null, bitcoindjs.wallet.listReceivedByAddress({
    address: address
  });
};

bitcoind.backupWallet = function(path, callback) {
  return callback(null, bitcoindjs.wallet.backup({
    path: path
  }));
};

bitcoind.encryptWallet = function(passphrase, callback) {
  return callback(null, bitcoindjs.wallet.encrypt({
    passphrase: passphrase
  }));
};

bitcoind.decryptWallet = function(passphrase, timeout, callback) {
  return callback(null, bitcoindjs.wallet.decrypt({
    passphrase: passphrase
    // NOTE: bitcoind.js has no timeout
    // timeout: timeout
  }));
};

bitcoind.changePassphrase = function(opassphrase, npassphrase, callback) {
  return callback(null, bitcoindjs.wallet.passphraseChange({
    oldPass: opassphrase,
    newPass: npassphrase
  }));
};

bitcoind.forgetKey = function(callback) {
  return callback(null, bitcoindjs.wallet.lock());
};

bitcoind.isEncrypted = function(callback) {
  return callback(null, bitcoindjs.wallet.isEncrypted());
};

bitcoind.send = function(address, amount, callback) {
  return callback(null, bitcoindjs.wallet.sendTo({
    address: address,
    amount: amount
  }));
};

bitcoind.sendFrom = function(from, address, amount, callback) {
  return callback(null, bitcoindjs.wallet.sendFrom({
    from: from,
    address: address,
    amount: amount
    // minDepth: minDepth
    // comment: comment
    // to: to
  }));
};

bitcoind.move = function(from, to, amount, callback) {
  return callback(null, bitcoindjs.wallet.sendFrom({
    from: from,
    to: to,
    amount: amount
  }));
};

bitcoin.changeLabel = function(address, label, callback) {
  return callback(null, bitcoindjs.wallet.changeLabel({
    address: address,
    label: label
  }));
};

bitcoin.deleteAccount = function(address, callback) {
  return callback(null, bitcoindjs.wallet.deleteAccount({
    address: address
  }));
};

bitcoind.setAccount = function(address, label, callback) {
  return callback(null, bitcoindjs.wallet.setAccount({
    address: address,
    label: label
  }));
};

bitcoind.getBlock = function(id, callback) {
  return bitcoindjs.getBlock(id, function(err, block) {
    if (err) return callback(err);
    return callback(null, block);
  });
};

bitcoind.getTransaction = function(id, callback) {
  return bitcoindjs.getTx(id, function(err, tx) {
    if (err) return callback(err);
    return callback(null, tx);
  });
};

bitcoind.setTxFee = function(options, callback) {
  return callback(null, bitcoindjs.wallet.setTxFee(options));
};

bitcoind.importPrivKey = function(key, label, rescan, callback) {
  var options = {
    key: key,
    label: label,
    rescan: rescan
  };
  return bitcoindjs.wallet.importKey(options, function(err, imported) {
    if (err) return callback(err);
    return callback(null, imported);
  });
};

bitcoind.dumpPrivKey = function(address, callback) {
  if (bitcoindjs.wallet.isEncrypted()) {
    return callback(new Error('Wallet is encrypted.'));
  }
  return callback(null, bitcoindjs.wallet.dumpKey({
    address: address
  }).privkey);
};

bitcoind.importWallet = function(file, callback) {
  return bitcoindjs.wallet.importWallet({
    path: file
  }, callback);
};

bitcoind.dumpWallet = function(file, callback) {
  return bitcoindjs.wallet.dumpWallet({
    path: file
  }, callback);
};

bitcoind.keyPoolRefill = function(options, callback) {
  if (!options) {
    callback = options;
    options = {};
  }
  return callback(null, bitcoindjs.wallet.keyPoolRefill(options));
};

bitcoind.getGenerate = function(options, callback) {
  if (!options) {
    callback = options;
    options = {};
  }
  return callback(null, bitcoindjs.getGenerate(options));
};

bitcoind.setGenerate = function(options, callback) {
  if (!options) {
    callback = options;
    options = {};
  }
  return callback(null, bitcoindjs.setGenerate(options));
};

bitcoind.getMiningInfo = function(options, callback) {
  if (!options) {
    callback = options;
    options = {};
  }
  return callback(null, bitcoindjs.getMiningInfo(options));
};

bitcoind.stopServer = function(callback) {
  return bitcoindjs.stop(function(err, status) {
    if (err) return callback(err);
    return callback(null, true);
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
