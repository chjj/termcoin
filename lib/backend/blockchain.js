/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

/**
 * Exports
 */

var blockchain = exports;

/**
 * Modules
 */

var fs = require('fs');

/**
 * Load
 */

var termcoin = require('../')
  , bitcoind = require('./bitcoind')
  , coined = require('coined')
  , bcoin = coined.bcoin
  , bn = coined.bn
  , utils = termcoin.utils
  , config = termcoin.config
  , mock = termcoin.mock
  , opt = config.opt
  , platform = config.platform
  , config = config.config;

/**
 * API Calls
 */

blockchain.getBlock = function(id, callback) {
  var self = this;
  return this.request(['rawblock', id], function(err, block) {
    if (err) return callback(err);

    if (blockchain.explorer === 'https://blockexplorer.com') {
      return self.request(['block', block.hash], false, function(err, body) {
        if (err) return callback(err);
        var height = /<meta name="keywords"[^<>]+? block, ([0-9]+),/.exec(body);
        if (!height) return callback(new Error('No height.'));
        block.height = +height[1];
        return callback(null, blockchain._block(block));
      });
    }

    return callback(null, blockchain._block(block));
  });
};

blockchain.getBlockHeight = function(height, callback) {
  var self = this;

  if (blockchain.explorer === 'https://blockexplorer.com') {
    return this.request(['q', 'getblockhash', height], false, function(err, hash) {
      if (err) return callback(err);
      return self.getBlock(hash.trim(), function(err, block) {
        if (err) return callback(err);
        return callback(null, block);
      });
    });
  }

  return this.request(['block-height', height + '?format=json'], function(err, result) {
    if (err) return callback(err);
    var blocks = result.blocks;
    return callback(null, blockchain._block(blocks[blocks.length-1]));
  });
};

blockchain.getTransaction = function(id, block, callback) {
  var self = this;
  return this.request(['rawtx', id], function(err, tx) {
    if (err) return callback(err);
    return callback(null, self._tx(tx, block));
  });
};

blockchain.getAddressTransactions = function(address, callback) {
  var self = this;
  return this.request(['rawaddr', address], function(err, txs) {
    if (err) return callback(err);
    return callback(null, txs.map(self._tx));
  });
};

blockchain._lastBlock = function(callback) {
  var self = this;

  if (blockchain.explorer === 'https://blockexplorer.com') {
    return this.request(['q', 'latesthash'], false, function(err, hash) {
      if (err) return callback(err);
      return callback(null, { hash: hash.toLowerCase() });
    });
  }

  return this.request(['latestblock'], function(err, block) {
    if (err) return callback(err);
    return callback(null, block);
  });
};

blockchain.getLastBlock = function(callback) {
  var self = this;
  return this._lastBlock(function(err, block) {
    if (err) return callback(err);
    return self.getBlock(block.hash, function(err, block) {
      if (err) return callback(err);
      return callback(null, block);
    });
  });
};

blockchain._block = function(data) {
  if (data.merkleRoot) return data;

  var block = {};

  block._hash = coined.utils.revHex(data.hash.toLowerCase());
  block.version = data.ver;
  block.subtype = 'block';
  block.prevBlock = coined.utils.revHex(data.prev_block);
  block.merkleRoot = coined.utils.revHex(data.mrkl_root);
  block.ts = data.time;
  block.bits = data.bits;
  block.nonce = data.nonce;
  block.totalTX = data.n_tx;

  block.txs = data.tx.reduce(function(txs, data) {
    var tx = {};

    tx.version = block.ver;
    tx.block = block._hash;
    tx._hash = coined.utils.revHex(data.hash);

    tx.inputs = [];
    tx.outputs = [];

    data.inputs.forEach(function(input) {
      tx.inputs.push({
        out: {
          // hash: input.prev_out.hash || input.prev_out.tx_index,
          index: input.prev_out.n,
          _addr: input.prev_out.addr,
          _value: new bn(input.prev_out.value)
        },
        script: []
        // script: [
        //   signature,
        //   pubKey
        // ]
      });
    });

    data.out.forEach(function(out) {
      tx.outputs.push({
        value: new bn(out.value),
        script: [
          'dup',
          'hash160',
          bcoin.wallet.addr2hash(out.addr),
          'eqverify',
          'checksig'
        ]
      });
    });

    txs.push(tx);

    return txs;
  }, []);

  block = bcoin.block(block, block.subtype);

  // block.merkleRoot = data.height;
  // block.merkleTree = [];
  // block.tx = [];
  // block.txs[0].inputs = [];
  // block.hashes = [];

  block.size = data.size;
  block.fee = data.fee;
  block.index = data.block_index;

  block.height = data.height;
  block.prev_block = data.prev_block;

  return block;
};

blockchain._block = function(data) {
  if (data.merkleRoot) return data;

  var block = {};

  block._hash = coined.utils.revHex(data.hash.toLowerCase());
  block.version = data.ver;
  block.subtype = 'block';
  block.prevBlock = coined.utils.revHex(data.prev_block);
  block.merkleRoot = coined.utils.revHex(data.mrkl_root);
  block.ts = data.time;
  block.bits = data.bits;
  block.nonce = data.nonce;
  block.totalTX = data.n_tx;

  block.txs = data.tx.reduce(function(txs, data) {
    var tx = {};

    //tx.version = block.ver;
    tx.version = tx.ver;
    tx.block = block._hash;
    tx._hash = coined.utils.revHex(data.hash);
    tx.lock = data.lock;
    tx.size = data.size;

    tx.inputs = [];
    tx.outputs = [];

    data.in.forEach(function(input) {
      var script = (input.scriptSig || '').split(' ');
      tx.inputs.push({
        out: {
          tx: null,
          hash: coined.utils.revHex(input.prev_out.hash),
          index: input.prev_out.n,
          _coinbase: input.prev_out.coinbase,
        },
        script: input.prev_out.coinbase ? null : [
          coined.utils.toArray(script[0], 'hex'), // signature
          coined.utils.toArray(script[1], 'hex') // pubkey
        ],
        seq: input.prev_out.sequence
      });
    });

    data.out.forEach(function(out) {
      var code = (out.scriptPubKey || '').split(' ');
      var script = code;

      if (code[0] === 'OP_DUP'
        && code[1] === 'OP_HASH160'
        && /^[0-9a-f]+$/i.test(code[2])
        && code[3] === 'OP_EQUALVERIFY'
        && code[4] === 'OP_CHECKSIG') {
        script = [
          'dup',
          'hash160',
          coined.utils.toArray(code[2], 'hex'),
          'eqverify',
          'checksig'
        ];
      } else if (/^[0-9a-f]+$/i.test(code[0]) && code[1] === 'OP_CHECKSIG') {
        script = [
          coined.utils.toArray(code[0], 'hex'),
          'checksig'
        ];
      }

      tx.outputs.push({
        value: coined.utils.fromBTC(out.value),
        script: script
      });
    });

    txs.push(tx);

    return txs;
  }, []);

  block = bcoin.block(block, block.subtype);

  data.tx.forEach(function(tx, i) {
    block.hashes[i] = coined.utils.revHex(tx.hash);
    block.tx[i] = coined.utils.revHex(tx.hash);
    block.txs[i]._hash = coined.utils.revHex(tx.hash);
  });

  // block.merkleRoot = data.height;
  // block.merkleTree = [];
  // block.tx = [];
  // block.txs[0].inputs = [];
  // block.hashes = [];

  block.size = data.size;

  block.height = data.height;
  block.prev_block = data.prev_block;

  return block;
};

blockchain._tx = function(data, block) {
  var tx = {};

  tx.version = data.ver;
  tx.block = block._hash;
  tx._hash = coined.utils.revHex(data.hash);
  tx.lock = data.lock;
  tx.size = data.size;

  tx.inputs = [];
  tx.outputs = [];

  data.in.forEach(function(input) {
    var script = (input.scriptSig || '').split(' ');
    tx.inputs.push({
      out: {
        tx: null,
        hash: coined.utils.revHex(input.prev_out.hash),
        index: input.prev_out.n,
        _coinbase: input.prev_out.coinbase
      },
      script: input.prev_out.coinbase ? null : [
        coined.utils.toArray(script[0], 'hex'), // signature
        coined.utils.toArray(script[1], 'hex') // pubkey
      ],
      seq: input.prev_out.sequence
    });
  });

  data.out.forEach(function(out) {
    var code = (out.scriptPubKey || '').split(' ');
    var script = code;

    if (code[0] === 'OP_DUP'
      && code[1] === 'OP_HASH160'
      && /^[0-9a-f]+$/i.test(code[2])
      && code[3] === 'OP_EQUALVERIFY'
      && code[4] === 'OP_CHECKSIG') {
      script = [
        'dup',
        'hash160',
        coined.utils.toArray(code[2], 'hex'),
        'eqverify',
        'checksig'
      ];
    } else if (/^[0-9a-f]+$/i.test(code[0]) && code[1] === 'OP_CHECKSIG') {
      script = [
        coined.utils.toArray(code[0], 'hex'),
        'checksig'
      ];
    }

    tx.outputs.push({
      value: coined.utils.fromBTC(out.value),
      script: script
    });
  });

  tx = bcoin.tx(tx);
  tx._hash = coined.utils.revHex(data.hash);

  return tx;
};

/**
 * API
 */

blockchain.explorer = 'https://blockexplorer.com';

// blockchain.explorer = 'https://blockchain.info';

blockchain.request = function(path, options, callback) {
  var self = this;

  if (!callback) {
    callback = options;
    options = {};
  }

  if (options === false) {
    options = { json: false };
  }

  if (options.json == null) {
    options.json = true;
  }

  return utils.request({
    method: 'GET',
    uri: this.explorer + '/' + path.join('/'),
    strictSSL: false,
    json: options.json,
    jar: null
  }, function(err, res, data) {
    if (err) return callback(err);

    if (res.statusCode >= 400) {
      return callback(new Error(
        self.explorer + '/' + path.join('/')
        + '\n\n'
        + 'Status Code: ' + res.statusCode));
    }

    if (options.json && typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        e.stack += '\n\n' + data;
        return callback(e);
      }
    }

    return callback(null, data);
  });
};
