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
 * Dependencies
 */

var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Modules
 */

var blessed = require('blessed')
  , coined = require('coined')
  , bcoin = coined.bcoin
  , bn = coined.bn;

var setImmediate = typeof global.setImmediate !== 'function'
  ? process.nextTick.bind(proccess)
  : global.setImmediate;

/**
 * Load
 */

var termcoin = require('../')
  , utils = termcoin.utils
  , config = termcoin.config
  , mock = termcoin.mock
  , transforms = termcoin.transforms
  , opt = config.opt
  , platform = config.platform
  , config = config.config;

/*
 * Constants
 */

bitcoin.name = 'bcoin';
bitcoin.restart = false;

/**
 * API Calls
 */

bitcoin.getStats = function(callback) {
  var self = this;
  return utils.parallel({
    balance: this.getTotalBalance.bind(this),
    accounts: this.getAccounts.bind(this),
    transactions: this.getTransactions.bind(this),
    addresses: this.getAddresses.bind(this),
    info: this.getInfo.bind(this),
    encrypted: this.isEncrypted.bind(this)
  }, callback);
};

bitcoin.getAddresses = function(accounts, callback) {
  var self = this;
  var coin = this.coin;

  if (!callback) {
    callback = accounts;
    accounts = null;
  }

  return callback(null, Object.keys(coin.recipients).reduce(function(out, address) {
    var label = coin.recipients[address];
    out.push({
      name: label,
      address: address
    });
    return out;
  }, []));
};

bitcoin.getAccounts = function(callback) {
  var self = this;
  var coin = this.coin;
  return callback(null, coin.accounts.reduce(function(results, account) {
    var addr = account.getAddress();
    results[addr] = {
      name: account.label || '',
      address: addr,
      balance: coined.utils.toBTC(account.balance())
    };
    return results;
  }, {}));
};

bitcoin.getProgress = function(callback) {
  var self = this;
  var coin = this.coin;
  var pool = coin.pool;
  var index = pool.chain.index;

  var gen = bcoin.protocol.constants.genesis;
  var genesis = {
    __proto__: bcoin.protocol.constants.genesis,
    blockindex: 0,
    time: gen.ts,
    timereceived: gen.ts,
    blocktime: gen.ts,
    merkleroot: gen.merkleRoot,
    previousblock: coined.utils.toHex(gen.prevBlock)
  };

  var current = {
    hash: index.hashes[index.hashes.length - 1],
    blockindex: index.heights[index.heights.length - 1],
    time: index.ts[index.ts.length - 1],
    timereceived: index.ts[index.ts.length - 1],
    blocktime: index.ts[index.ts.length - 1]
  };

  var beginning = genesis.time;
  var end = Date.now() / 1000 | 0;
  var left = end - current.time;
  var perc = ((current.time - beginning) / (end - beginning)) * 100 | 0;

  return callback(null, {
    blocks: current.blockindex,
    connections: this._countPeers(),
    genesisBlock: genesis,
    currentBlock: current,
    hoursBehind: left / 60 / 60 | 0,
    daysBehind: left / 60 / 60 / 24 | 0,
    percent: coin.pool.chain.fillPercent() * 100 | 0
  });
};

bitcoin.getInfo = function(callback) {
  var self = this;
  var coin = this.coin;
  var pool = coin.pool;
  var info = {};
  info.version = 90100;
  info.protocolversion = 70002;
  info.balance = coin.balance();
  var heights = pool.chain.index.heights;
  // info.blocks = pool.chain.index.hashes.length;
  info.blocks = heights[heights.length - 1];
  info.timeoffset = 0;
  info.connections = this._countPeers(),
  info.proxy = '';
  info.difficulty = 0;
  info.testnet = false;
  info.keypoololdest = 0;
  info.keypoolsize = 0;
  info.paytxfee = coined.utils.toBTC(new bn(coin.fee));
  info.errors = '';
  return callback(null, info);
};

bitcoin._countPeers = function() {
  var pool = this.coin.pool;
  return pool.peers.block.length + pool.peers.pending.length;
};

bitcoin.getTransactions = function(callback) {
  var self = this;
  var coin = this.coin;
  var hashes = {};

  var txs = coin.accounts.reduce(function(out, account) {
    var txs = account.tx.all().reduce(function(out, tx) {
      tx = transforms.tx.bcoinToBitcoin(tx);
      if (!tx) return out;
      if (hashes[tx.txid]) return out;
      hashes[tx.txid] = true;
      out.push(tx);
      return out;
    }, []);
    return out.concat(txs);
  }, []);

  Object.keys(coin.pending).forEach(function(key) {
    var tx = coin.pending[key];
    tx = transforms.tx.bcoinToBitcoin(tx);
    if (!tx) return;
    if (hashes[tx.txid]) return;
    hashes[tx.txid] = true;
    txs.push(tx);
  });

  txs = utils.tsort(txs, true);

  return callback(null, txs);
};

bitcoin.getTotalBalance = function(callback) {
  var self = this;
  var coin = this.coin;
  var balance = coin.ubalance();
  return callback(null, {
    balance: coined.utils.toBTC(balance.confirmed),
    unconfirmed: coined.utils.toBTC(balance.unconfirmed)
  });
};

bitcoin.signMessage = function(address, message, callback) {
  var self = this;
  var coin = this.coin;
  var account = coin.accountByAddress(address);

  if (!account) {
    return callback(new Error('Not found.'));
  }

  var sig;
  try {
    sig = coin.sign(message, account);
  } catch (e) {
    return callback(e);
  }

  return callback(null, sig);
};

bitcoin.verifyMessage = function(address, sig, message, callback) {
  var self = this;
  var coin = this.coin;
  var account = coin.accountByAddress(address);

  if (!account) {
    return callback(new Error('Not found.'));
  }

  var verified;
  try {
    verified = coin.verify(message, sig, account)
  } catch (e) {
    verified = false;
  }

  return callback(null, verified);
};

bitcoin.createAddress = function(name, callback) {
  var self = this;
  var coin = this.coin;
  var account = coin.createAccount({
    label: name
  });
  return callback(null, account.getAddress());
};

bitcoin.listReceivedByAddress = function(address, callback) {
  var self = this;
  var coin = this.coin;
  return this.getTransactions(function(err, txs) {
    if (err) return callback(err);
    return callback(null, coin.accounts.reduce(function(out, account) {
      var address = account.getAddress();
      var confirmations = 0;
      var txids = txs.filter(function(tx) {
        //return ptx.recipient === address;
        return (tx.category === 'receive' && tx.address === address)
            || (tx.category === 'move' && tx.details[0].address === address);
      }).map(function(tx) {
        //return ptx.rhash;
        confirmations = Math.max(tx.confirmations, confirmations);
        return tx.txid;
      });
      out.push({
        address: address,
        account: account.label,
        amount: coined.utils.toBTC(account.balance()),
        confirmations: confirmations,
        txids: txids
      });
      return out;
    }, []));
  });
};

bitcoin.backupWallet = function(path, callback) {
  var self = this;
  var coin = this.coin;
  try {
    coin.saveWallet(path);
  } catch (e) {
    return callback(e);
  }
  return callback(null, true);
};

bitcoin.encryptWallet = function(passphrase, callback) {
  var self = this;
  var coin = this.coin;
  try {
    coin.encryptWallet(passphrase);
  } catch (e) {
    return callback(e);
  }
  try {
    coin.decryptWallet(passphrase);
  } catch (e) {
    return callback(e);
  }
  return callback(null, true);
};

bitcoin.decryptWallet = function(passphrase, timeout, callback) {
  var self = this;
  var coin = this.coin;
  try {
    coin.decryptWallet(passphrase, timeout);
  } catch (e) {
    return callback(e);
  }
  return callback(null, true);
};

bitcoin.unencryptWallet = function(passphrase, callback) {
  var self = this;
  var coin = this.coin;
  try {
    coin.unencryptWallet(passphrase);
  } catch (e) {
    return callback(e);
  }
  return callback(null, true);
};

bitcoin.changePassphrase = function(opassphrase, npassphrase, callback) {
  var self = this;
  var coin = this.coin;
  try {
    coin.decryptWallet(opassphrase);
  } catch (e) {
    return callback(e);
  }
  try {
    coin.encryptWallet(npassphrase);
  } catch (e) {
    return callback(e);
  }
  try {
    coin.decryptWallet(npassphrase);
  } catch (e) {
    return callback(e);
  }
  return callback(null, true);
};

bitcoin.forgetKey = function(callback) {
  var self = this;
  var coin = this.coin;
  coin.lockWallet();
  return callback(null, true);
};

bitcoin.isEncrypted = function(callback) {
  var self = this;
  var coin = this.coin;
  return callback(null, coin.encrypted);
};

bitcoin.send = function(address, amount, callback) {
  var self = this;
  var coin = this.coin;
  var amount = coined.utils.fromBTC(amount);
  return coin.sendTo(address, amount, function(err, status, hash) {
    if (err) return callback(err);
    if (!status) return callback(new Error('TX not acknowledged.'));
    return callback(null, hash);
  });
};

bitcoin.sendFrom = function(from, address, amount, callback) {
  var self = this;
  var coin = this.coin;
  var account = coin.accountByLabel(from)[0];
  var amount = coined.utils.fromBTC(amount);
  return coin.sendFrom(account, address, amount, function(err, status, hash) {
    if (err) return callback(err);
    if (!status) return callback(new Error('TX not acknowledged.'));
    return callback(null, hash);
  });
};

bitcoin.move = function(from, to, amount, callback) {
  var self = this;
  var coin = this.coin;
  var account1 = coin.accountByLabel(from)[0];
  var account2 = coin.accountByLabel(to)[0];
  if (!account1 || !account2) {
    return callback(new Error('Accounts not found.'));
  }
  var address = account2.getAddress();
  var amount = coined.utils.fromBTC(amount);
  return coin.sendFrom(account1, address, amount, function(err, status, hash) {
    if (err) return callback(err);
    if (!status) return callback(new Error('TX not acknowledged.'));
    return callback(null, hash);
  });
};

bitcoin.deleteAccount = function(address, callback) {
  var self = this;
  var coin = this.coin;

  if (coin.accountByAddress(address)) {
    coin.deleteAccount(address);
  } else {
    coin.deleteRecipient(address);
  }

  return callback(null, false);
};

bitcoin.changeLabel = function(address, label, callback) {
  var self = this;
  var coin = this.coin;

  if (coin.accountByAddress(address)) {
    coin.accountByAddress(address).label = label;
  } else {
    coin.createRecipient(address, label);
  }

  coin.saveWallet();

  return callback(null, false);
};

bitcoin.setAccount = function(address, label, callback) {
  var self = this;
  var coin = this.coin;

  if (!callback) {
    callback = label;
    label = null;
  }

  if (!address && label == null) {
    return callback(new Error('No address or label.'));
  }

  if (address) {
    if (label != null && !coin.accountByAddress(address)) {
      coin.createRecipient(address, label);
      return callback(null, false);
    }
  } else {
    if (label != null && !coin.accountByLabel(label).length) {
      var account = coin.createAccount({
        label: label
      });
      return callback(null, account.getAddress());
    }
  }

  return callback(null, false);
};

bitcoin.getTransaction = function(id, callback) {
  var self = this;
  var coin = this.coin;

  id = coined.utils.revHex(id);

  var tx = coin.accounts.map(function(account) {
    return account.tx._all[id];
  }).filter(Boolean)[0];

  if (!tx) {
    tx = coin.pending[id];
  }

  if (!tx) {
    if (!termcoin.config.localBlockchain) {
      return callback(new Error('Not found.'));
    }
    return coin.getTransaction(id, function(err, tx) {
      if (err) return callback(err);
      tx = transforms.tx.bcoinToBitcoin(tx);
      return callback(null, tx);
    });
  }

  tx = transforms.tx.bcoinToBitcoin(tx);
  return callback(null, tx);
};

bitcoin.getBlock = function(id, callback) {
  var self = this;
  var coin = this.coin;

  if (!termcoin.config.localBlockchain) {
    // id = coined.utils.revHex(id);
    // return coin.findBlock(id, function(err, block) {
    //   if (err) return callback(err);
    //   block = transforms.block.bcoinToBitcoin(block);
    //   return callback(null, block);
    // });
    return termcoin.blockchain.getBlock(id, function(err, block) {
      if (err) return callback(err);
      // block = transforms.block.infoToBitcoin(block);
      return callback(null, block);
    });
  }

  id = coined.utils.revHex(id);
  return coin.getBlock(id, function(err, block) {
    if (err) return callback(err);
    block = transforms.block.bcoinToBitcoin(block);
    return callback(null, block);
  });
};

bitcoin.setTxFee = function(value, callback) {
  var self = this;
  var coin = this.coin;
  coin.setFee(coined.utils.fromBTC(value));
  return callback(null, true);
};

bitcoin.importPrivKey = function(key, label, rescan, callback) {
  var self = this;
  var coin = this.coin;
  var account = coin.createAccount({
    label: label,
    priv: coined.fromKeyBase58(key, coin.compressed)
  });
  return callback(null, true);
};

bitcoin.dumpPrivKey = function(address, callback) {
  var self = this;
  var coin = this.coin;
  if (this.encrypted) {
    return callback(new Error('Encrypted.'));
  }
  var account = coin.accountByAddress(address);
  if (!account) return callback(new Error('Not found.'));
  var priv = coined.toKeyBase58(account.getPrivateKey(), coin.compressed);
  return callback(null, priv);
};

bitcoin.importWallet = function(file, callback) {
  var self = this;
  var coin = this.coin;
  return coin.importWallet(file, function(err) {
    if (err) return callback(err);
    return callback(null, true);
  });
};

bitcoin.dumpWallet = function(file, callback) {
  var self = this;
  var coin = this.coin;
  return coin.dumpWallet(file, function(err) {
    if (err) return callback(err);
    return callback(null, true);
  });
};

bitcoin.keyPoolRefill = function(callback) {
  var self = this;
  var coin = this.coin;
  return callback(null, true);
};

bitcoin.getGenerate = function(callback) {
  var self = this;
  var coin = this.coin;
  return callback(null, false);
};

bitcoin.setGenerate = function(flag, threads, callback) {
  var self = this;
  var coin = this.coin;
  if (!callback) {
    callback = threads;
    threads = null;
  }
  return callback(new Error('Mining not supported yet.'));
};

bitcoin.getMiningInfo = function(callback) {
  var self = this;
  var coin = this.coin;
  var info = {};
  return this.getInfo(function(err, _info) {
    if (err) return callback(err);
    info.blocks = _info.blocks;
    info.curentblocksize = 0;
    info.currentblocktx = 0;
    info.difficulty = _info.difficulty;
    info.errors = _info.errors;
    info.genproclimit = -1;
    info.networkhashps = 0;
    info.pooledtx = 0;
    info.testnet = false;
    info.generate = false;
    info.hashespersec = 0;
    return callback(null, info);
  });
};

bitcoin.stopServer = function(callback) {
  var self = this;
  var coin = this.coin;
  coin.close();
  return callback(null, {});
};

/**
 * Logs
 */

bitcoin.log = process.env.HOME + '/.termcoin/debug.log';

bitcoin._log = function() {
  var text = util.format.apply(util, arguments);
  if (!blessed.Screen.global) {
    if (text.indexOf('\x1b[31mERROR:') === 0) {
      process.stderr.write(text + '\n');
    } else {
      process.stdout.write(text + '\n');
    }
  }
  this._stream = this._stream || fs.createWriteStream(this.log, { flags: 'w' });
  this._stream.write(text.replace(/\x1b\[[^m]*m/g, '') + '\n');
};

bitcoin._error = function() {
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[0] === 'string') {
    args[0] = '\x1b[31mERROR:\x1b[m ' + args[0];
  }
  return this._log.apply(this, args);
};

/**
 * Start Server
 */

bitcoin.startServer = function(callback) {
  var self = this;

  var coin = coined({
    db: {
      type: 'tiny',
      path: process.env.HOME + '/.termcoin/db',
      clear: termcoin.config.debug
    },
    wallet: process.env.HOME + '/.termcoin/wallet.json',
    // change: 'random',
    startHeight: 0,
    relay: !termcoin.config.noRelay,
    noPreload: termcoin.config.noPreload || termcoin.config.localBlockchain,
    neverFull: termcoin.config.neverFull || termcoin.config.localBlockchain
  });

  coin.on('log', function() {
    self._log.apply(self, arguments);
  });

  coin.on('balance', function() {
    self._log('Wallet balance updated: %s.', coined.utils.toBTC(coin.balance()));
  });

  coin.on('account', function(addr) {
    self._log('Your new account address is %s.', addr);
  });

  coin.once('full', function() {
    self._log('Block chain full.');
  });

  coin.once('load', function() {
    self._log('Loaded.');
  });

  coin.on('error', function(err) {
    self._error(err.message);
  });

  if (termcoin.config.dumpWallet) {
    return coin.dumpWallet(process.env.HOME + '/wallet.dump', function(err) {
      if (err) {
        self._error(err.message);
        return process.exit(1);
      }
      self._log('Wallet dumped successfully.');
      return process.exit(0);
    });
  }

  if (termcoin.config.importWallet) {
    return coin.importWallet(termcin.config.importWallet, function(err) {
      if (err) {
        self._error(err.message);
        return process.exit(1);
      }
      self._log('Wallet imported successfully.');
      return process.exit(0);
    });
  }

  coin.emit('log', 'Welcome to termcoin!');
  coin.emit('log', 'Loading DB: %s', coin.options.db.path);

  if (termcoin.config.verbose) {
    coin.pool.on('block', function(block, peer) {
      var index = self.pool.chain.index;
      var hash = coined.utils.revHex(block.hash('hex'));
      var last = coined.utils.revHex(index.hashes[index.hashes.length-1]);
      self._log('Received %s %s (%d) from %s.',
        block.subtype, hash, index.hashes.length, _ip(peer));
      self._log('Last block: %s', last);
    });

    coin.pool.on('tx', function(tx, peer) {
      var hash = coined.utils.revHex(tx.hash('hex'));
      self._log('Received tx %s from %s', hash, _ip(peer));
    });
  }

  coin.counts = {
    blocks: 0,
    txs: 0,
    unconfirmed: 0,
    interval: 500
  };

  coin.pool.on('block', function(block, peer) {
    if (!block.verify()) {
      self._log('Unverifiable block: %s', coined.utils.revHex(block.hash('hex')));
      return;
    }
    if (++coin.counts.blocks % coin.counts.interval === 0) {
      self._log('Found %d more blocks. Total: %d.',
        coin.counts.interval, coin.counts.blocks);
    }
  });

  coin.pool.on('tx', function(tx, peer) {
    if (!tx.block || !tx.verify()) {
      if (++coin.counts.unconfirmed % coin.counts.interval === 0) {
        self._log('Unconfirmed transaction: %s (%s)',
          coined.utils.revHex(tx.hash('hex')), tx.block);
      }
    }
    if (++coin.counts.txs % coin.counts.interval === 0) {
      self._log('Found %d more transactions. Total: %d.',
        coin.counts.interval, coin.counts.txs);
    }
  });

  coin.pool.on('blocks', function(blocks, peer) {
    self._log('Received %d block hashes (inv) from %s.', blocks.length, _ip(peer));
  });

  coin.pool.on('txs', function(txs, peer) {
    self._log('Received %d tx hashes (inv) from %s.', txs.length, _ip(peer));
  });

  coin.pool.on('chain-progress', function(progress) {
    progress = progress * 100 | 0;
    if (progress % 2 === 0 && progress !== self._lastProgress) {
      self._log('Chain Progress: %s', progress);
      self._lastProgress = progress;
    }
  });

  function _ip(peer) {
    return peer && peer.socket && peer.socket.remoteAddress
      ? peer.socket.remoteAddress
      : '0.0.0.0';
  }

  process.on('exit', function() {
    coin.saveWallet();
  });

  this.coin = coin;

  if (termcoin.config.localBlockchain) {
    coin.downloadBlockchain();
  }

  return callback();
};
