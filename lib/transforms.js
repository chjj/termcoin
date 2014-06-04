/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

/**
 * Exports
 */

var transforms = exports;

/**
 * Load
 */

var termcoin = require('../')
  , coined = require('coined')
  , bcoin = coined.bcoin;

/**
 * Transforms
 */

transforms.block = {};
transforms.tx = {};
transforms.txs = {};
transforms.addr = {};

/**
 * Transforms - bcoin to bitcoind
 */

transforms.block.bcoinToBitcoin = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (block._type === 'bitcoin') {
    return block;
  }

  if (block.previousblockhash) {
    coined.utils.hideProperty(block, '_type', 'bitcoin');
    return block;
  }

  var blockn = {};
  var pblock = coin.parseBlock(block);

  blockn.hash = pblock.rhash;
  blockn.confirmations = pblock.confirmations || transforms._getConfirmations(pblock._hash);
  blockn.size = pblock.size;
  blockn.version = pblock.version;
  blockn.merkleroot = coined.utils.revHex(pblock.merkleRoot);
  blockn.tx = (pblock.txs || pblock.tx).map(function(tx) {
    return tx.hash
      ? coined.utils.revHex(tx.hash('hex'))
      : coined.utils.revHex(tx);
  });
  blockn.time = pblock.ts;
  blockn.nonce = pblock.nonce;
  blockn.bits = pblock.bits;
  // TODO: use block.bits and pdiff to calculate difficulty here
  blockn.difficulty = -1;
  blockn.chainwork = '';
  blockn.previousblockhash = coined.utils.revHex(pblock.prevBlock);

  coined.utils.hideProperty(blockn, '_transformed', true);
  coined.utils.hideProperty(blockn, '_noRefresh', true);

  coined.utils.hideProperty(blockn, 'o', block);
  coined.utils.hideProperty(blockn, 'd', pblock);

  coined.utils.hideProperty(blockn, '_type', 'bitcoin');

  return blockn;
};

transforms.tx.bcoinToBitcoin = function(tx) {
  var coin = termcoin.bitcoin.coin;

  if (tx._type === 'bitcoin') {
    return tx;
  }

  if (tx.walletconflicts) {
    coined.utils.hideProperty(tx, '_type', 'bitcoin');
    return tx;
  }

  var ptx = coin.parseTX(tx);
  var txn = {};

  txn.amount = 0;
  txn.confirmations = ptx.confirmations || -1;
  txn.blockhash = ptx.rblock;
  txn.blockindex = 0;
  txn.blocktime = ptx.ts;
  txn.txid = ptx.rhash;
  txn.walletconflicts = [];
  txn.time = ptx.ts;
  txn.timereceived = ptx.ts;

  txn.details = (function() {
    var details = [];

    ptx.sender = ptx.inputs.addresses[0];
    ptx.recipient = ptx.outputs.addresses[0];

    var saccount = coin.accountByAddress(ptx.sender);
    var raccount = coin.accountByAddress(ptx.recipient);

    txn.confirmations = transforms._getConfirmations(ptx.block);

    // if (saccount && raccount) {
    //   details.push({
    //     account: saccount.label || '',
    //     address: ptx.recipient,
    //     category: 'move',
    //     amount: ptx.bestimated
    //   });
    //   txn.address = ptx.sender;
    //   txn.amount = ptx.bestimated;
    //   txn.category = 'move';
    //   txn.account = saccount.label || ptx.sender;
    //   txn.otheraccount = raccount.label || ptx.recipient;
    //   return details;
    // }

    if (saccount) {
      details.push({
        account: saccount.label || '',
        //address: ptx.recipient,
        address: ptx.sender,
        category: 'send',
        amount: '-' + ptx.bestimated
      });
      //txn.address = ptx.sender;
      txn.address = ptx.recipient;
      txn.amount = ptx.bestimated;
      txn.category = 'send';
      return details;
    }

    if (raccount) {
      details.push({
        account: raccount.label || '',
        address: ptx.sender,
        category: 'receive',
        amount: ptx.bestimated
      });
      txn.address = ptx.recipient;
      txn.amount = ptx.bestimated;
      txn.category = 'receive';
      return details;
    }

    return details;
  })();

  txn.hex = ptx._raw ? coined.utils.toHex(ptx._raw) : '';

  if (!txn.address) return;

  coined.utils.hideProperty(txn, '_transformed', true);
  coined.utils.hideProperty(txn, '_noRefresh', true);

  coined.utils.hideProperty(txn, 'o', tx);
  coined.utils.hideProperty(txn, 'd', ptx);

  coined.utils.hideProperty(txn, '_type', 'bitcoin');

  return txn;
};

transforms.txs.bcoinToBitcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(ptx) {
    var txn = {};
    coined.utils.hideProperty(txn, 'd', ptx);
    var tx = transforms.tx.bcoinToBitcoin(ptx);
    txn.account = tx.details[0].account;
    txn.address = tx.details[0].address;
    txn.category = tx.details[0].category;
    txn.amount = tx.details[0].amount;
    txn.confirmations = tx.confirmations;
    txn.blockhash = tx.blockhash;
    txn.blockindex = tx.blockindex;
    txn.blocktime = tx.blocktime;
    txn.txid = tx.txid;
    txn.walletconflicts = tx.walletconflicts;
    txn.time = tx.ts;
    txn.timereceived = tx.ts;
    coined.utils.hideProperty(txn, '_type', 'bitcoin');
    return txn;
  });

  coined.utils.hideProperty(txns, '_transformed', true);
  coined.utils.hideProperty(txns, '_noRefresh', true);

  coined.utils.hideProperty(txns, 'o', txs);

  coined.utils.hideProperty(txns, '_type', 'bitcoin');

  return txns;
};

transforms.addr.bcoinToBitcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (addr._type === 'bitcoin') {
    return addr;
  }

  if (addr.txs && addr.txs.length && addr.txs[0].walletconflicts) {
    coined.utils.hideProperty(addr, '_type', 'bitcoin');
    return addr;
  }

  var addrn = {};

  // ...

  coined.utils.hideProperty(addrn, '_transformed', true);
  coined.utils.hideProperty(addrn, '_noRefresh', true);

  coined.utils.hideProperty(addrn, 'o', addr);

  coined.utils.hideProperty(addrn, '_type', 'bitcoin');

  return addrn;
};

transforms._getConfirmations = function(block) {
  var coin = termcoin.bitcoin.coin;
  if (block) {
    var i = coin.pool.chain.index.hashes.indexOf(block);
    if (i !== -1) {
      var height = coin.pool.chain.index.heights[i];
      var last = coin.pool.chain.index.heights[coin.pool.chain.index.heights.length - 1];
      return Math.max(1, last - height + 1) || 1;
    }
  }
  return 0;
};

/**
 * Transforms - bitcoind to bcoin (TODO)
 */

transforms.block.bitcoinToBcoin = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (block._type === 'bcoin') {
    return block;
  }

  if (block.merkleRoot) {
    coined.utils.hideProperty(block, '_type', 'bcoin');
    return block;
  }

  var blockn = {};

  // ...

  coined.utils.hideProperty(blockn, '_transformed', true);
  coined.utils.hideProperty(blockn, '_noRefresh', true);

  coined.utils.hideProperty(blockn, 'o', block);

  coined.utils.hideProperty(blockn, '_type', 'bcoin');

  return blockn;
};

transforms.tx.bitcoinToBcoin = function(tx) {
  var coin = termcoin.bitcoin.coin;

  if (tx._type === 'bcoin') {
    return tx;
  }

  if (tx.ts != null) {
    coined.utils.hideProperty(tx, '_type', 'bcoin');
    return tx;
  }

  var txn = {};

  // ...

  coined.utils.hideProperty(txn, '_transformed', true);
  coined.utils.hideProperty(txn, '_noRefresh', true);

  coined.utils.hideProperty(txn, 'o', tx);

  coined.utils.hideProperty(txn, '_type', 'bcoin');

  return txn;
};

transforms.txs.bitcoinToBcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    return transforms.tx.bitcoinToBcoin(tx);
  });

  coined.utils.hideProperty(txns, '_transformed', true);
  coined.utils.hideProperty(txns, '_noRefresh', true);

  coined.utils.hideProperty(txns, 'o', txs);

  coined.utils.hideProperty(txns, '_type', 'bcoin');

  return txns;
};

transforms.addr.bitcoinToBcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (addr._type === 'bcoin') {
    return addr;
  }

  if (addr.txs && addr.txs.length && addr.txs[0].ts != null) {
    coined.utils.hideProperty(addr, '_type', 'bcoin');
    return addr;
  }

  var addrn = {};

  // ...

  coined.utils.hideProperty(addrn, '_transformed', true);
  coined.utils.hideProperty(addrn, '_noRefresh', true);

  coined.utils.hideProperty(addrn, 'o', addr);

  coined.utils.hideProperty(addrn, '_type', 'bcoin');

  return addrn;
};

/**
 * Transforms - bcoin to blockchain.info
 */

transforms.block.bcoinToInfo = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (block._type === 'info') {
    return block;
  }

  if (block.relayed_by) {
    coined.utils.hideProperty(block, '_type', 'info');
    return block;
  }

  var pblock = coin.parseBlock(block);
  var blockn = {};

  blockn.fee = -1;
  blockn.hash = pblock.rhash;
  blockn.prev_block = pblock.prevBlock;
  blockn.next_block = '';
  blockn.mrkl_root = pblock.merkleRoot;
  blockn.n_tx = pblock.totalTX;
  //blockn.est_tx_volume = 0;
  blockn.fee = 0;
  blockn.height = (function() {
    var i = coin.pool.chain.index.hashes.indexOf(pblock._hash);
    return coin.pool.chain.index.heights[i];
  })();
  blockn.time = pblock.ts;
  blockn.received_time = pblock.ts + 2 * 60 * 60;
  blockn.relayed_by = '0.0.0.0';
  //blockn.difficulty = 0;
  blockn.bits = pblock.bits;
  blockn.size = pblock.size || bcoin.protocol.framer.block(block, block.subtype).length;
  blockn.ver = pblock.version;
  blockn.nonce = pblock.nonce;

  blockn.txs = pblock.txs.map(function(tx) {
    return transforms.tx.bcoinToInfo(tx, block);
  });

  coined.utils.hideProperty(blockn, '_transformed', true);
  coined.utils.hideProperty(blockn, '_noRefresh', true);

  coined.utils.hideProperty(blockn, 'o', block);
  coined.utils.hideProperty(blockn, 'd', pblock);

  coined.utils.hideProperty(blockn, '_type', 'info');

  return blockn;
};

transforms.tx.bcoinToInfo = function(tx, block) {
  var coin = termcoin.bitcoin.coin;

  if (tx._type === 'info') {
    return tx;
  }

  if (tx.relayed_by) {
    coined.utils.hideProperty(tx, '_type', 'info');
    return tx;
  }

  var ptx = coin.parseTX(tx);
  var txn = {};

  var blockHash = ptx.block || (block ? block.hash('hex') : '');

  function getInputValue(input) {
    if (!input.out.tx) return 0;
    var tx = input.out.tx;
    return (tx.outputs[input.out.index] || {value:0}).value.toString(10);
  }

  txn.inputs = ptx.inputs.map(function(input) {
    if (+input.out.hash === 0) return {};
    return {
      prev_out: {
        addr: input.out.address,
        value: getInputValue(input)
      },
      script: coined.utils.toHex(input.script)
    };
  });

  txn.out = ptx.outputs.map(function(output) {
    return {
      addr: output.address,
      value: output.value.toString(10),
      script: coined.utils.toHex(output.script)
    };
  });

  txn.ver = ptx.version;
  txn.size = ptx.size || (ptx._raw || []).length;
  txn.hash = ptx.rhash;
  txn.block = ptx.rblock || (block && block.rhash) || '';
  txn.double_spend = false;

  txn.block_height = (function() {
    var i = coin.pool.chain.index.hashes.indexOf(blockHash);
    return coin.pool.chain.index.heights[i];
  })();

  txn.time = ptx.ts;

  txn.relayed_by = '0.0.0.0';

  txn.vin_sz = ptx.inputs.length;
  txn.vout_sz = ptx.outputs.length;

  txn.confirmations = transforms._getConfirmations(blockHash) || -1;

  coined.utils.hideProperty(txn, '_transformed', true);
  coined.utils.hideProperty(txn, '_noRefresh', true);

  coined.utils.hideProperty(txn, 'o', tx);
  coined.utils.hideProperty(txn, 'd', ptx);

  coined.utils.hideProperty(txn, '_type', 'info');

  return txn;
};

transforms.txs.bcoinToInfo = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    return transforms.tx.bcoinToInfo(tx);
  });

  coined.utils.hideProperty(txns, '_transformed', true);
  coined.utils.hideProperty(txns, '_noRefresh', true);

  coined.utils.hideProperty(txns, 'o', txs);

  coined.utils.hideProperty(txns, '_type', 'info');

  return txns;
};

transforms.addr.bcoinToInfo = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (addr._type === 'info') {
    return addr;
  }

  if (addr.hash160 && addr.final_balance != null) {
    coined.utils.hideProperty(addr, '_type', 'info');
    return addr;
  }

  var addrn = {};

  addrn.address = addr.address;
  addrn.hash160 = bcoin.wallet.addr2hash(addr.address);
  addrn.n_tx = addr.txs.length;

  var ptxs = addr.txs.map(function(tx) {
    return coin.parseTX(tx);
  });

  addrn.total_received = ptxs.reduce(function(total, ptx) {
    if (!~ptx.outputs.addresses.indexOf(addr.address)) {
      return total;
    }
    return total + ptx.outputs.bbalance;
  }, 0);

  addrn.total_sent = ptxs.reduce(function(total, ptx) {
    if (!~ptx.outputs.addresses.indexOf(addr.address)) {
      return total;
    }
    return total + (ptx.inputs.bbalance || 0);
  }, 0);

  addrn.final_balance = total_received - total_sent;

  addrn.total_received = coined.utils.fromBTC(addr.total_received);
  addrn.total_sent = coined.utils.fromBTC(addr.total_sent);
  addrn.final_balance = coined.utils.fromBTC(addr.final_balance);

  addrn.txs = addr.txs.map(function(tx) {
    return transforms.tx.bcoinToInfo(tx);
  });

  coined.utils.hideProperty(addrn, '_transformed', true);
  coined.utils.hideProperty(addrn, '_noRefresh', true);

  coined.utils.hideProperty(addrn, 'd', { __proto__: addr, txs: ptxs });
  coined.utils.hideProperty(addrn, 'o', addr);

  coined.utils.hideProperty(addrn, '_type', 'info');

  return addrn;
};

/**
 * Transforms - blockchain.info to bcoin (TODO)
 */

transforms.block.infoToBcoin = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (block._type === 'bcoin') {
    return block;
  }

  if (block.merkleRoot) {
    coined.utils.hideProperty(block, '_type', 'bcoin');
    return block;
  }

  var blockn = {};

  // ...

  coined.utils.hideProperty(blockn, '_transformed', true);
  coined.utils.hideProperty(blockn, '_noRefresh', true);

  coined.utils.hideProperty(blockn, 'o', block);
  coined.utils.hideProperty(blockn, '_type', 'bcoin');

  return blockn;
};

transforms.tx.infoToBcoin = function(tx, block) {
  var coin = termcoin.bitcoin.coin;

  if (tx._type === 'bcoin') {
    return tx;
  }

  if (tx.ts != null) {
    coined.utils.hideProperty(tx, '_type', 'bcoin');
    return tx;
  }

  var txn = {};

  // ...

  coined.utils.hideProperty(txn, '_transformed', true);
  coined.utils.hideProperty(txn, '_noRefresh', true);

  coined.utils.hideProperty(txn, 'o', tx);
  coined.utils.hideProperty(txn, '_type', 'bcoin');

  return txn;
};

transforms.txs.infoToBcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    return transforms.tx.infoToBcoin(tx);
  });

  coined.utils.hideProperty(txns, '_transformed', true);
  coined.utils.hideProperty(txns, '_noRefresh', true);

  coined.utils.hideProperty(txns, 'o', txs);

  coined.utils.hideProperty(txns, '_type', 'bcoin');

  return txns;
};

transforms.addr.infoToBcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (addr._type === 'bcoin') {
    return addr;
  }

  if (addr.txs && addr.txs.length && addr.txs[0].ts != null) {
    coined.utils.hideProperty(addr, '_type', 'bcoin');
    return addr;
  }

  var addrn = {};

  // ...

  coined.utils.hideProperty(addrn, '_transformed', true);
  coined.utils.hideProperty(addrn, '_noRefresh', true);

  coined.utils.hideProperty(addrn, 'o', addr);

  coined.utils.hideProperty(addrn, '_type', 'bcoin');

  return addrn;
};

/**
 * Transforms - bcoin to blockexplorer.com (TODO)
 */

transforms.block.bcoinToExplorer = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (block._type === 'explorer') {
    return block;
  }

  if (Array.isArray(block.tx) && block.tx.length
      && Array.isArray(block.tx[0].in)
      && Array.isArray(block.tx[0].out)) {
    coined.utils.hideProperty(block, '_type', 'explorer');
    return block;
  }

  var blockn = {};

  // ...

  coined.utils.hideProperty(blockn, '_transformed', true);
  coined.utils.hideProperty(blockn, '_noRefresh', true);

  coined.utils.hideProperty(blockn, 'o', block);

  coined.utils.hideProperty(blockn, '_type', 'explorer');

  return blockn;
};

transforms.tx.bcoinToExplorer = function(tx, block) {
  var coin = termcoin.bitcoin.coin;

  if (tx._type === 'explorer') {
    return tx;
  }

  if (Array.isArray(tx.in) && Array.isArray(tx.out)) {
    coined.utils.hideProperty(tx, '_type', 'explorer');
    return tx;
  }

  var txn = {};

  // ...

  coined.utils.hideProperty(txn, '_transformed', true);
  coined.utils.hideProperty(txn, '_noRefresh', true);

  coined.utils.hideProperty(txn, 'o', tx);

  coined.utils.hideProperty(txn, '_type', 'explorer');

  return txn;
};

transforms.txs.bcoinToExplorer = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    return transforms.tx.infoToBcoin(tx);
  });

  coined.utils.hideProperty(txns, '_transformed', true);
  coined.utils.hideProperty(txns, '_noRefresh', true);

  coined.utils.hideProperty(txns, 'o', txs);

  coined.utils.hideProperty(txns, '_type', 'explorer');

  return txns;
};

transforms.addr.bcoinToExplorer = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (addr._type === 'explorer') {
    return addr;
  }

  if (addr.txs && addr.txs.length
      && Array.isArray(addr.txs[0].in)
      && Array.isArray(addr.txs[0].out)) {
    coined.utils.hideProperty(addr, '_type', 'explorer');
    return addr;
  }

  var addrn = {};

  // ...

  coined.utils.hideProperty(addrn, '_transformed', true);
  coined.utils.hideProperty(addrn, '_noRefresh', true);

  coined.utils.hideProperty(addrn, 'o', addr);

  coined.utils.hideProperty(addrn, '_type', 'explorer');

  return addrn;
};

/**
 * Transforms - blockexplorer.com to bcoin (TODO)
 */

transforms.block.explorerToBcoin = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (block._type === 'bcoin') {
    return block;
  }

  if (block.merkleRoot) {
    coined.utils.hideProperty(block, '_type', 'bcoin');
    return block;
  }

  var blockn = {};

  // ...

  coined.utils.hideProperty(blockn, '_transformed', true);
  coined.utils.hideProperty(blockn, '_noRefresh', true);

  coined.utils.hideProperty(blockn, 'o', block);

  coined.utils.hideProperty(blockn, '_type', 'bcoin');

  return blockn;
};

transforms.tx.explorerToBcoin = function(tx, block) {
  var coin = termcoin.bitcoin.coin;

  if (tx._type === 'bcoin') {
    return tx;
  }

  if (tx.ts != null) {
    coined.utils.hideProperty(tx, '_type', 'bcoin');
    return tx;
  }

  var txn = {};

  // ...

  coined.utils.hideProperty(txn, '_transformed', true);
  coined.utils.hideProperty(txn, '_noRefresh', true);

  coined.utils.hideProperty(txn, 'o', tx);

  coined.utils.hideProperty(txn, '_type', 'bcoin');

  return txn;
};

transforms.txs.explorerToBcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    return transforms.tx.infoToBcoin(tx);
  });

  coined.utils.hideProperty(txns, '_transformed', true);
  coined.utils.hideProperty(txns, '_noRefresh', true);

  coined.utils.hideProperty(txns, 'o', txs);

  coined.utils.hideProperty(txns, '_type', 'bitcoin');

  return txns;
};

transforms.addr.explorerToBcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (addr._type === 'bcoin') {
    return addr;
  }

  if (addr.txs && addr.txs.length && addr.txs[0].ts != null) {
    coined.utils.hideProperty(addr, '_type', 'bcoin');
    return addr;
  }

  var addrn = {};

  // ...

  coined.utils.hideProperty(addrn, '_transformed', true);
  coined.utils.hideProperty(addrn, '_noRefresh', true);

  coined.utils.hideProperty(addrn, 'o', addr);

  coined.utils.hideProperty(addrn, '_type', 'bcoin');

  return addrn;
};

/**
 * Helpers
 */

// e.g.
// transforms.format('block', 'bcoin', 'bitcoin', block);
// transforms.format('tx', 'bitcoin', 'bcoin', tx, block);
transforms.format = function(type, from, to, a, b) {
  var method = from + 'To' + to[0].toUpperCase() + to.substring(1);
  return transforms[type][method](a, b);
};
