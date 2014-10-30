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
var util = require('util');

var logger = fs.createWriteStream(process.env.HOME + '/termcoin.log');

function log() {
  if (typeof arguments[0] !== 'string') {
    var out = util.inspect(arguments[0], null, 20, true);
    return logger.write(out + '\n');
  }
  var out = util.format.apply(util, arguments);
  return logger.write(out + '\n');
}

function error() {
  // XXX No use strict
  if (arguments[0] && arguments[0].message) {
    arguments[0] = arguments[0].message;
  }
  if (typeof arguments[0] !== 'string') {
    var out = util.inspect(arguments[0], null, 20, true);
    return logger.write('ERROR: ' + out + '\n');
  }
  var out = util.format.apply(util, arguments);
  return logger.write('ERROR: ' + out + '\n');
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
  }, function(err, result) {
    log('getStats:');
    if (err) return error(err.message), callback(err);
    log(result);
    return callback(null, result);
  });
};

bitcoind.getAddresses = function(accounts, callback) {
  if (!callback) {
    callback = accounts;
    accounts = null;
  }
  setImmediate(function() {
    log('getAddresses:');
    try {
      var recipients = bitcoindjs.wallet.getRecipients({});
      log(recipients);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
    var out = [];
    recipients.forEach(function(recipient) {
      out.push({
        name: recipient.label,
        address: recipient.address
      });
    });
    log(out);
    return callback(null, out);
  });
};

bitcoind.getAccounts = function(options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  setImmediate(function() {
    log('getAccounts:');
    try {
      var out = bitcoindjs.wallet.getAccounts(options);
      log(out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
    var keys = Object.keys(out);
    var results = {};
    keys.forEach(function(key) {
      var account = out[key];
      account.addresses.forEach(function(address) {
        results[address.address] = {
          name: key,
          address: address.address,
          balance: account.balance
        };
      });
    });
    log(results);
    return callback(null, results);
  });
};

bitcoind.getProgress = function(callback) {
  setImmediate(function() {
    log('getProgress:');
    bitcoindjs.getProgress(function(err, progress) {
      if (err) return error(err.message), callback(err);
      log(progress);
      return callback(null, progress);
    });
  });
};

bitcoind.getInfo = function(callback) {
  setImmediate(function() {
    log('getInfo:');
    try {
      var out = bitcoindjs.getInfo();
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
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
    log('getTransactions:');
    try {
      var out = bitcoindjs.wallet.getTransactions(options);
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
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
    log('getTotalBalance:');
    try {
      var out = bitcoindjs.wallet.getBalance(options);
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
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
    log('signMessage:');
    try {
      var out = bitcoindjs.wallet.signMessage(options);
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
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
    log('verifyMessage:');
    try {
      var out = bitcoindjs.wallet.verifyMessage(options);
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.createAddress = function(name, callback) {
  setImmediate(function() {
    log('createAddress');
    try {
      var out = bitcoindjs.wallet.createAddress({
        name: name
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.listReceivedByAddress = function(address, callback) {
  setImmediate(function() {
    log('listReceivedByaddress:');
    try {
      var out = bitcoindjs.wallet.getReceivedByAddress({
        address: address
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.backupWallet = function(path, callback) {
  setImmediate(function() {
    log('backupWallet:');
    try {
      var out = bitcoindjs.wallet.backup({
        path: path
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.encryptWallet = function(passphrase, callback) {
  setImmediate(function() {
    log('encryptWallet:');
    try {
      var out = bitcoindjs.wallet.encrypt({
        passphrase: passphrase
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.decryptWallet = function(passphrase, timeout, callback) {
  setImmediate(function() {
    log('decryptWallet:');
    try {
      var out = bitcoindjs.wallet.decrypt({
        passphrase: passphrase
        // NOTE: bitcoind.js has no timeout
        // timeout: timeout
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.changePassphrase = function(opassphrase, npassphrase, callback) {
  setImmediate(function() {
    log('changePassphrase:');
    try {
      var out = bitcoindjs.wallet.passphraseChange({
        oldPass: opassphrase,
        newPass: npassphrase
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.forgetKey = function(callback) {
  setImmediate(function() {
    log('forgetKey:');
    try {
      var out = bitcoindjs.wallet.lock();
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.isEncrypted = function(callback) {
  setImmediate(function() {
    log('isEncrypted:');
    try {
      var out = bitcoindjs.wallet.isEncrypted();
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.send = function(address, amount, callback) {
  setImmediate(function() {
    log('send:');
    try {
      var out = bitcoindjs.wallet.sendTo({
        address: address,
        amount: amount
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.sendFrom = function(from, address, amount, callback) {
  setImmediate(function() {
    log('sendFrom:');
    try {
      var out = bitcoindjs.wallet.sendFrom({
        from: from,
        address: address,
        amount: amount
        // minDepth: minDepth
        // comment: comment
        // to: to
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.move = function(from, to, amount, callback) {
  setImmediate(function() {
    log('move:');
    try {
      var out = bitcoindjs.wallet.sendFrom({
        from: from,
        to: to,
        amount: amount
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.changeLabel = function(address, label, callback) {
  setImmediate(function() {
    log('changeLabel:');
    try {
      var out = bitcoindjs.wallet.changeLabel({
        address: address,
        label: label
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.deleteAccount = function(address, callback) {
  setImmediate(function() {
    log('deleteAccount');
    try {
      var out = bitcoindjs.wallet.deleteAccount({
        address: address
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.setAccount = function(address, label, callback) {
  setImmediate(function() {
    log('setAccount:');
    try {
      var out = bitcoindjs.wallet.setAccount({
        address: address,
        label: label
      });
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.getBlock = function(id, callback) {
  return bitcoindjs.getBlock(id, function(err, block) {
    log('getBlock:');
    if (err) return error(err.message), callback(err);
    log(block);
    return callback(null, block);
  });
};

bitcoind.getTransaction = function(id, callback) {
  return bitcoindjs.getTx(id, function(err, tx) {
    log('getTransaction:');
    if (err) return error(err.message), callback(err);
    log(tx);
    return callback(null, tx);
  });
};

bitcoind.setTxFee = function(options, callback) {
  setImmediate(function() {
    log('setTxFee:');
    try {
      var out = bitcoindjs.wallet.setTxFee(options);
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
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
    log('importPrivKey:');
    if (err) return error(err.message), callback(err);
    log(imported);
    return callback(null, imported);
  });
};

bitcoind.dumpPrivKey = function(address, callback) {
  setImmediate(function() {
    log('dumpPrivKey:');
    if (bitcoindjs.wallet.isLocked()) {
      return callback(new Error('Wallet is encrypted.'));
    }
    try {
      var out = bitcoindjs.wallet.dumpKey({
        address: address
      }).privkey;
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.importWallet = function(file, callback) {
  setImmediate(function() {
    log('importWallet:');
    try {
      bitcoindjs.wallet.importWallet({
        path: file
      }, function(err, result) {
        if (err) return error(err.message), callback(err);
        log(result);
        return callback(null, result);
      });
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.dumpWallet = function(file, callback) {
  setImmediate(function() {
    log('dumpWallet:');
    try {
      return bitcoindjs.wallet.dumpWallet({
        path: file
      }, function(err, result) {
        if (err) return error(err.message), callback(err);
        log(result);
        return callback(null, result);
      });
    } catch (e) {
      error(e.message);
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
    log('keyPoolRefill:');
    try {
      var out = bitcoindjs.wallet.keyPoolRefill(options);
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
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
    log('getGenerate:');
    try {
      var out = bitcoindjs.getGenerate(options);
      console.log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
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
    log('setGenerate:');
    try {
      var out = bitcoindjs.setGenerate(options);
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
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
    log('getMininginfo:');
    try {
      var out = bitcoindjs.getMiningInfo(options);
      log(out);
      return callback(null, out);
    } catch (e) {
      error(e.message);
      return callback(e);
    }
  });
};

bitcoind.stopServer = function(callback) {
  return bitcoindjs.stop(function(err, status) {
    log('stopServer:');
    if (err) return error(err.message), callback(err);
    log([status, true]);
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
