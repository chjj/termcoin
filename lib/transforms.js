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
  var blk = {};
  var pblock = coin.parseBlock(block);
  blk.hash = pblock.rhash;
  blk.confirmations = pblock.confirmations || transforms._getConfirmations(pblock._hash);
  blk.size = pblock.size;
  blk.version = pblock.version;
  blk.merkleroot = coined.utils.revHex(pblock.merkleRoot);
  blk.tx = (pblock.txs || pblock.tx).map(function(tx) {
    return tx.hash
      ? coined.utils.revHex(tx.hash('hex'))
      : coined.utils.revHex(tx);
  });
  blk.time = pblock.ts;
  blk.nonce = pblock.nonce;
  blk.bits = pblock.bits;
  // TODO: use block.bits and pdiff to calculate difficulty here
  blk.difficulty = -1;
  blk.chainwork = '';
  blk.previousblockhash = coined.utils.revHex(pblock.prevBlock);
  coined.utils.hideProperty(blk, 'd', pblock);
  return blk;
};

transforms.tx.bcoinToBitcoin = function(tx) {
  var coin = termcoin.bitcoin.coin;

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

  coined.utils.hideProperty(txn, 'd', ptx);

  return txn;
};

transforms.txs.bcoinToBitcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;
  var ptxs = txs.map(function(ptx) {
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
    return tx;
  });
  coined.utils.hideProperty(ptxs, 'd', txs);
};

transforms.addr.bcoinToBitcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;
  return addr;
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
  return block;
};

transforms.tx.bitcoinToBcoin = function(tx) {
  var coin = termcoin.bitcoin.coin;
  return tx;
};

transforms.txs.bitcoinToBcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;
  return txs.map(function(tx) {
    return transforms.tx.bitcoinToBcoin(tx);
  });
};

transforms.addr.bitcoinToBcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;
  return addr;
};

/**
 * Transforms - bcoin to blockchain.info
 */

transforms.block.bcoinToInfo = function(block) {
  var coin = termcoin.bitcoin.coin;

  var pblock = coin.parseBlock(block);

  pblock.fee = -1;
  pblock.hash = pblock.rhash;
  pblock.prev_block = pblock.prevBlock;
  pblock.next_block = '';
  pblock.mrkl_root = pblock.merkleRoot;
  pblock.n_tx = pblock.totalTX;
  //pblock.est_tx_volume = 0;
  pblock.fee = 0;
  pblock.height = (function() {
    var i = coin.pool.chain.index.hashes.indexOf(pblock._hash);
    return coin.pool.chain.index.heights[i];
  })();
  pblock.time = pblock.ts;
  pblock.received_time = pblock.ts + 2 * 60 * 60;
  pblock.relayed_by = '0.0.0.0';
  //pblock.difficulty = 0;
  pblock.bits = pblock.bits;
  pblock.size = pblock.size || bcoin.protocol.framer.block(block, block.subtype).length;
  pblock.ver = pblock.version;
  pblock.nonce = pblock.nonce;

  pblock.txs = pblock.txs.map(function(tx) {
    return transforms.tx.bcoinToInfo(tx, block);
  });

  pblock._transformed = true;
  pblock._noRefresh = true;

  return pblock;
};

transforms.tx.bcoinToInfo = function(tx, block) {
  var coin = termcoin.bitcoin.coin;

  var ptx = coin.parseTX(tx);

  function getInputValue(input) {
    if (!input.out.tx) return 0;
    var tx = input.out.tx;
    return (tx.outputs[input.out.index] || {value:0}).value.toString(10);
  }

  ptx.inputs = ptx.inputs.map(function(input) {
    if (+input.out.hash === 0) return {};
    return {
      prev_out: {
        addr: input.out.address,
        value: getInputValue(input)
      },
      script: coined.utils.toHex(input.script)
    };
  });

  ptx.out = ptx.outputs.map(function(output) {
    return {
      addr: output.address,
      value: output.value.toString(10),
      script: coined.utils.toHex(output.script)
    };
  });

  ptx.ver = ptx.version;
  ptx.size = ptx.size || (ptx._raw || []).length;
  ptx.hash = ptx.rhash;
  ptx.block = ptx.rblock || (block && block.rhash) || '';
  ptx.double_spend = false;

  ptx.block_height = (function() {
    var i = coin.pool.chain.index.hashes.indexOf(ptx.block || (block ? block.hash('hex') : ''));
    return coin.pool.chain.index.heights[i];
  })();

  ptx.time = ptx.ts;

  ptx.relayed_by = '0.0.0.0';

  ptx.vin_sz = ptx.inputs.length;
  ptx.vout_sz = ptx.outputs.length;

  ptx._transformed = true;
  ptx._noRefresh = true;

  return ptx;
};

transforms.txs.bcoinToInfo = function(txs) {
  var coin = termcoin.bitcoin.coin;
  return txs.map(function(tx) {
    return transforms.tx.bcoinToInfo(tx);
  });
};

transforms.addr.bcoinToInfo = function(addr) {
  var coin = termcoin.bitcoin.coin;

  addr.hash160 = bcoin.wallet.addr2hash(addr.address);
  addr.n_tx = addr.txs.length;

  addr.ptxs = txs.map(function(tx) {
    return coin.parseTX(tx);
  });

  addr.total_received = addr.ptxs.reduce(function(total, ptx) {
    if (!~ptx.outputs.addresses.indexOf(addr.address)) {
      return total;
    }
    return total + ptx.outputs.bbalance;
  }, 0);

  addr.total_sent = addr.ptxs.reduce(function(total, ptx) {
    if (!~ptx.outputs.addresses.indexOf(addr.address)) {
      return total;
    }
    return total + (ptx.inputs.bbalance || 0);
  }, 0);

  addr.final_balance = total_received - total_sent;

  addr.total_received = coined.utils.fromBTC(addr.total_received);
  addr.total_sent = coined.utils.fromBTC(addr.total_sent);
  addr.final_balance = coined.utils.fromBTC(addr.final_balance);

  addr.txs = addr.txs.map(function(tx) {
    return transforms.tx.bcoinToInfo(tx);
  });

  addr._transformed = true;
  addr._noRefresh = true;

  return addr;
};

/**
 * Transforms - blockchain.info to bcoin (TODO)
 */

transforms.block.infoToBcoin = function(block) {
  var coin = termcoin.bitcoin.coin;
  return block;
};

transforms.tx.infoToBcoin = function(tx, block) {
  var coin = termcoin.bitcoin.coin;
  return tx;
};

transforms.txs.infoToBcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;
  return txs.map(function(tx) {
    return transforms.tx.infoToBcoin(tx);
  });
};

transforms.addr.infoToBcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;
  return addr;
};

/**
 * Transforms - bcoin to blockexplorer.com (TODO)
 */

transforms.block.bcoinToExplorer = function(block) {
  var coin = termcoin.bitcoin.coin;
  return block;
};

transforms.tx.bcoinToExplorer = function(tx, block) {
  var coin = termcoin.bitcoin.coin;
  return tx;
};

transforms.txs.bcoinToExplorer = function(txs) {
  var coin = termcoin.bitcoin.coin;
  return txs.map(function(tx) {
    return transforms.tx.infoToBcoin(tx);
  });
};

transforms.addr.bcoinToExplorer = function(addr) {
  var coin = termcoin.bitcoin.coin;
  return addr;
};

/**
 * Transforms - blockexplorer.com to bcoin (TODO)
 */

transforms.block.explorerToBcoin = function(block) {
  var coin = termcoin.bitcoin.coin;
  return block;
};

transforms.tx.explorerToBcoin = function(tx, block) {
  var coin = termcoin.bitcoin.coin;
  return tx;
};

transforms.txs.explorerToBcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;
  return txs.map(function(tx) {
    return transforms.tx.infoToBcoin(tx);
  });
};

transforms.addr.explorerToBcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;
  return addr;
};
