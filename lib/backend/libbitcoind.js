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

var debug = {};

if (process.env.NODE_ENV === 'debug') {
  debug.logger = fs.createWriteStream(process.env.HOME + '/termcoin.log');
}

debug.log = function() {
  if (process.env.NODE_ENV !== 'debug') return;
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[0] !== 'string') {
    if (typeof args[0] === 'function') args[0] = args[0] + '';
    var out = util.inspect(args[0], null, 20, true);
    return debug.logger.write(out + '\n');
  }
  var out = util.format.apply(util, args);
  return debug.logger.write(out + '\n');
};

debug.error = function() {
  if (process.env.NODE_ENV !== 'debug') return;
  var args = Array.prototype.slice.call(arguments);
  if (args[0] && args[0].message) {
    args[0] = args[0].message;
  }
  if (typeof args[0] !== 'string') {
    if (typeof args[0] === 'function') args[0] = args[0] + '';
    var out = util.inspect(args[0], null, 20, true);
    return debug.logger.write('ERROR: ' + out + '\n');
  }
  var out = util.format.apply(util, args);
  return debug.logger.write('ERROR: ' + out + '\n');
};

var D = function(arg) {
  debug.log(arg);
  return arg;
};

if (process.env.RIMRAF) {
  var rimraf = require('rimraf');

  if (fs.existsSync(process.env.HOME + '/.termcoin-bitcoind')) {
    rimraf.sync(process.env.HOME + '/.termcoin-bitcoind');
  }
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

debug.statsLength = 3;

bitcoind.getStats = function(callback) {
  return utils.parallel(D({
    balance: bitcoind.getTotalBalance,
    accounts: bitcoind.getAccounts,
    transactions: bitcoind.getTransactions,
    addresses: bitcoind.getAddresses,
    info: bitcoind.getInfo,
    encrypted: bitcoind.isEncrypted
  }), function(err, result) {
    debug.log('getStats:');
    if (err) {
      debug.error(err);
      return callback(err);
    }
    if (--debug.statsLength > 0) {
      debug.log(result);
    }
    return callback(null, result);
  });
};

bitcoind.getAddresses = function(accounts, callback) {
  if (!callback) {
    callback = accounts;
    accounts = null;
  }
  setImmediate(function() {
    debug.log('getAddresses:');
    try {
      var recipients = bitcoindjs.wallet.getRecipients(D({}));
      debug.log(recipients);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
    var addr = [];
    recipients.forEach(function(recipient) {
      addr.push({
        name: recipient.label,
        address: recipient.address
      });
    });
    debug.log(addr);
    return callback(null, addr);
  });
};

bitcoind.getAccounts = function(options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  setImmediate(function() {
    debug.log('getAccounts:');
    try {
      var acc = bitcoindjs.wallet.getAccounts(D(options));
      debug.log(acc);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
    var keys = Object.keys(acc);
    var results = {};
    keys.forEach(function(key) {
      var account = acc[key];
      account.addresses.forEach(function(address) {
        results[address.address] = {
          name: key,
          address: address.address,
          balance: account.balance / 100000000
        };
      });
    });
    debug.log(results);
    return callback(null, results);
  });
};

bitcoind.getProgress = function(callback) {
  setImmediate(function() {
    debug.log('getProgress:');
    bitcoindjs.getProgress(D(function(err, progress) {
      if (err) {
        debug.error(err);
        return callback(err);
      }
      debug.log(progress);
      return callback(null, progress);
    }));
  });
};

bitcoind.getInfo = function(callback) {
  setImmediate(function() {
    debug.log('getInfo:');
    try {
      D();
      var info = bitcoindjs.getInfo();
      debug.log(info);
      return callback(null, info);
    } catch (e) {
      debug.error(e);
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
    debug.log('getTransactions:');
    try {
      var txs = bitcoindjs.wallet.getTransactions(D(options));
      debug.log(txs);
      return callback(null, txs);
    } catch (e) {
      debug.error(e);
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
    debug.log('getTotalBalance:');
    try {
      var bal = bitcoindjs.wallet.getBalance(D(options));
      debug.log(bal);
      return callback(null, {
        balance: bal / 100000000,
        unconfirmed: 0
      });
    } catch (e) {
      debug.error(e);
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
    debug.log('signMessage:');
    try {
      var signed = bitcoindjs.wallet.signMessage(D(options));
      debug.log(signed);
      return callback(null, signed);
    } catch (e) {
      debug.error(e);
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
    debug.log('verifyMessage:');
    try {
      var verified = bitcoindjs.wallet.verifyMessage(D(options));
      debug.log(verified);
      return callback(null, verified);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.createAddress = function(name, callback) {
  setImmediate(function() {
    debug.log('createAddress');
    try {
      var addr = bitcoindjs.wallet.createAddress(D({
        name: name
      }));
      debug.log(addr);
      return callback(null, addr);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.listReceivedByAddress = function(address, callback) {
  setImmediate(function() {
    debug.log('listReceivedByaddress:');
    try {
      var recv = bitcoindjs.wallet.getReceivedByAddress(D({
        address: address
      }));
      debug.log(recv);
      return callback(null, recv);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.backupWallet = function(path, callback) {
  setImmediate(function() {
    debug.log('backupWallet:');
    try {
      var backup = bitcoindjs.wallet.backup(D({
        path: path
      }));
      debug.log(backup);
      return callback(null, backup);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.encryptWallet = function(passphrase, callback) {
  setImmediate(function() {
    debug.log('encryptWallet:');
    try {
      var encrypted = bitcoindjs.wallet.encrypt(D({
        passphrase: passphrase
      }));
      debug.log(encrypted);
      return callback(null, encrypted);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.decryptWallet = function(passphrase, timeout, callback) {
  setImmediate(function() {
    debug.log('decryptWallet:');
    try {
      var decrypted = bitcoindjs.wallet.decrypt(D({
        passphrase: passphrase
        // NOTE: bitcoind.js has no timeout
        // timeout: timeout
      }));
      debug.log(decrypted);
      return callback(null, decrypted);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.changePassphrase = function(opassphrase, npassphrase, callback) {
  setImmediate(function() {
    debug.log('changePassphrase:');
    try {
      var changed = bitcoindjs.wallet.passphraseChange(D({
        oldPass: opassphrase,
        newPass: npassphrase
      }));
      debug.log(changed);
      return callback(null, changed);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.forgetKey = function(callback) {
  setImmediate(function() {
    debug.log('forgetKey:');
    try {
      D();
      var locked = bitcoindjs.wallet.lock();
      debug.log(locked);
      return callback(null, locked);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.isEncrypted = function(callback) {
  setImmediate(function() {
    debug.log('isEncrypted:');
    try {
      D();
      var encrypted = bitcoindjs.wallet.isEncrypted();
      debug.log(encrypted);
      return callback(null, encrypted);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.send = function(address, amount, callback) {
  setImmediate(function() {
    debug.log('send:');
    try {
      var sent = bitcoindjs.wallet.sendTo(D({
        address: address,
        amount: amount
      }));
      debug.log(sent);
      return callback(null, sent);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.sendFrom = function(from, address, amount, callback) {
  setImmediate(function() {
    debug.log('sendFrom:');
    try {
      var sent = bitcoindjs.wallet.sendFrom(D({
        from: from,
        address: address,
        amount: amount
        // minDepth: minDepth
        // comment: comment
        // to: to
      }));
      debug.log(sent);
      return callback(null, sent);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.move = function(from, to, amount, callback) {
  setImmediate(function() {
    debug.log('move:');
    try {
      var sent = bitcoindjs.wallet.sendFrom(D({
        from: from,
        to: to,
        amount: amount
      }));
      debug.log(sent);
      return callback(null, sent);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.changeLabel = function(address, label, callback) {
  setImmediate(function() {
    debug.log('changeLabel:');
    try {
      var changed = bitcoindjs.wallet.changeLabel(D({
        address: address,
        label: label
      }));
      debug.log(changed);
      return callback(null, changed);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.deleteAccount = function(address, callback) {
  setImmediate(function() {
    debug.log('deleteAccount');
    try {
      var deleted = bitcoindjs.wallet.deleteAccount(D({
        address: address
      }));
      debug.log(deleted);
      return callback(null, deleted);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.setAccount = function(address, label, callback) {
  setImmediate(function() {
    debug.log('setAccount:');
    try {
      var set = bitcoindjs.wallet.setAccount(D({
        address: address,
        label: label
      }));
      debug.log(set);
      return callback(null, set);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.getBlock = function(id, callback) {
  return bitcoindjs.getBlock(D(id), D(function(err, block) {
    debug.log('getBlock:');
    if (err) {
      debug.error(err);
      return callback(err);
    }
    debug.log(block);
    return callback(null, block);
  }));
};

bitcoind.getTransaction = function(id, callback) {
  return bitcoindjs.getTx(D(id), D(function(err, tx) {
    debug.log('getTransaction:');
    if (err) {
      debug.error(err);
      return callback(err);
    }
    debug.log(tx);
    return callback(null, tx);
  }));
};

bitcoind.setTxFee = function(options, callback) {
  setImmediate(function() {
    debug.log('setTxFee:');
    try {
      var fee = bitcoindjs.wallet.setTxFee(D(options));
      debug.log(fee);
      return callback(null, fee);
    } catch (e) {
      debug.error(e);
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
  return bitcoindjs.wallet.importKey(D(options), D(function(err, imported) {
    debug.log('importPrivKey:');
    if (err) {
      debug.error(err);
      return callback(err);
    }
    debug.log(imported);
    return callback(null, imported);
  }));
};

bitcoind.dumpPrivKey = function(address, callback) {
  setImmediate(function() {
    debug.log('dumpPrivKey:');
    if (bitcoindjs.wallet.isLocked()) {
      return callback(new debug.error('Wallet is encrypted.'));
    }
    try {
      var dump = bitcoindjs.wallet.dumpKey(D({
        address: address
      })).privkey;
      debug.log(dump);
      return callback(null, dump);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.importWallet = function(file, callback) {
  setImmediate(function() {
    debug.log('importWallet:');
    try {
      bitcoindjs.wallet.import(D({
        path: file
      }), D(function(err, result) {
        if (err) {
          debug.error(err);
          return callback(err);
        }
        debug.log(result);
        return callback(null, result);
      }));
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.dumpWallet = function(file, callback) {
  setImmediate(function() {
    debug.log('dumpWallet:');
    try {
      return bitcoindjs.wallet.dump(D({
        path: file
      }), D(function(err, result) {
        if (err) {
          debug.error(err);
          return callback(err);
        }
        debug.log(result);
        return callback(null, result);
      }));
    } catch (e) {
      debug.error(e);
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
    debug.log('keyPoolRefill:');
    try {
      var refilled = bitcoindjs.wallet.keyPoolRefill(D(options));
      debug.log(refilled);
      return callback(null, refilled);
    } catch (e) {
      debug.error(e);
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
    debug.log('getGenerate:');
    try {
      var generate = bitcoindjs.getGenerate(D(options));
      debug.log(generate);
      return callback(null, generate);
    } catch (e) {
      debug.error(e);
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
    debug.log('setGenerate:');
    try {
      var generate = bitcoindjs.setGenerate(D(options));
      debug.log(generate);
      return callback(null, generate);
    } catch (e) {
      debug.error(e);
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
    debug.log('getMininginfo:');
    try {
      var info = bitcoindjs.getMiningInfo(D(options));
      debug.log(info);
      return callback(null, info);
    } catch (e) {
      debug.error(e);
      return callback(e);
    }
  });
};

bitcoind.stopServer = function(callback) {
  return bitcoindjs.stop(D(function(err, status) {
    debug.log('stopServer:');
    if (err) {
      debug.error(err);
      return callback(err);
    }
    debug.log([status, true]);
    return callback(null, true);
  }));
};

/**
 * Start Server
 */

bitcoind.startServer = function(callback) {
  debug.log('startServer:');
  bitcoindjs = require('bitcoind.js')(D({
    directory: termcoin.config.platform.datadir,
    testnet: termcoin.config.useTestnet || false,
    rpc: termcoin.config.useRPC || false,
    silent: true
  }));
  bitcoindjs.on('open', function() {
    return callback(null, bitcoind);
  });
  bitcoindjs.on('error', function(err) {
    throw err;
  });
};
