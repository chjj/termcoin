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
  setImmediate(function() {
    try {
      var out = bitcoindjs.wallet.listAccounts({});
    } catch (e) {
      return callback(e);
    }
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
  });
};

bitcoind.getAccounts = function(options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  setImmediate(function() {
    try {
      var out = bitcoindjs.wallet.listAccounts(options);
    } catch (e) {
      return callback(e);
    }
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
  });
};

bitcoind.getProgress = function(callback) {
  setImmediate(function() {
    try {
      return bitcoindjs.getProgress(callback);
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.getInfo = function(callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.getInfo());
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.getTransactions = function(options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.listTransactions(options));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.getTotalBalance = function(options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.getBalance(options));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.signMessage = function(address, message, callback) {
  var options = {
    address: address,
    message: message
  };
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.signMessage(options));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.verifyMessage = function(address, sig, message, callback) {
  var options = {
    address: address,
    signature: sig,
    message: message
  };
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.verifyMessage(options));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.createAddress = function(name, callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.createAddress({
        name: name
      }));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.listReceivedByAddress = function(address, callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.listReceivedByAddress({
        address: address
      }));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.backupWallet = function(path, callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.backup({
        path: path
      }));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.encryptWallet = function(passphrase, callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.encrypt({
        passphrase: passphrase
      }));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.decryptWallet = function(passphrase, timeout, callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.decrypt({
        passphrase: passphrase
        // NOTE: bitcoind.js has no timeout
        // timeout: timeout
      }));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.changePassphrase = function(opassphrase, npassphrase, callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.passphraseChange({
        oldPass: opassphrase,
        newPass: npassphrase
      }));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.forgetKey = function(callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.lock());
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.isEncrypted = function(callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.isEncrypted());
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.send = function(address, amount, callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.sendTo({
        address: address,
        amount: amount
      }));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.sendFrom = function(from, address, amount, callback) {
  setImmediate(function() {
  try {
      return callback(null, bitcoindjs.wallet.sendFrom({
        from: from,
        address: address,
        amount: amount
        // minDepth: minDepth
        // comment: comment
        // to: to
      }));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.move = function(from, to, amount, callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.sendFrom({
        from: from,
        to: to,
        amount: amount
      }));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.changeLabel = function(address, label, callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.changeLabel({
        address: address,
        label: label
      }));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.deleteAccount = function(address, callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.deleteAccount({
        address: address
      }));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.setAccount = function(address, label, callback) {
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.setAccount({
        address: address,
        label: label
      }));
    } catch (e) {
      return callback(e);
    }
  });
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
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.setTxFee(options));
    } catch (e) {
      return callback(e);
    }
  });
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
  setImmediate(function() {
    if (bitcoindjs.wallet.isLocked()) {
      return callback(new Error('Wallet is encrypted.'));
    }
    try {
      return callback(null, bitcoindjs.wallet.dumpKey({
        address: address
      }).privkey);
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.importWallet = function(file, callback) {
  setImmediate(function() {
    try {
      return bitcoindjs.wallet.importWallet({
        path: file
      }, callback);
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.dumpWallet = function(file, callback) {
  setImmediate(function() {
    try {
      return bitcoindjs.wallet.dumpWallet({
        path: file
      }, callback);
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.keyPoolRefill = function(options, callback) {
  if (!options) {
    callback = options;
    options = {};
  }
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.wallet.keyPoolRefill(options));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.getGenerate = function(options, callback) {
  if (!options) {
    callback = options;
    options = {};
  }
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.getGenerate(options));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.setGenerate = function(options, callback) {
  if (!options) {
    callback = options;
    options = {};
  }
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.setGenerate(options));
    } catch (e) {
      return callback(e);
    }
  });
};

bitcoind.getMiningInfo = function(options, callback) {
  if (!options) {
    callback = options;
    options = {};
  }
  setImmediate(function() {
    try {
      return callback(null, bitcoindjs.getMiningInfo(options));
    } catch (e) {
      return callback(e);
    }
  });
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
    directory: termcoin.config.platform.datadir,
    testnet: termcoin.config.useTestnet || false,
    rpc: termcoin.config.useRPC || false,
    silent: true
  });
  bitcoindjs.on('open', function() {
    return callback(null, bitcoind);
  });
  bitcoindjs.on('error', function(err) {
    throw err;
  });
};
