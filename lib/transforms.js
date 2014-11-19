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

  if (transforms.block.type(block) === 'bitcoin') {
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

  coined.utils.hideProperty(blockn, 'o', block);
  coined.utils.hideProperty(blockn, 'd', pblock);

  return blockn;
};

transforms.tx.bcoinToBitcoin = function(tx) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.tx.type(tx) === 'bitcoin') {
    return tx;
  }

  var ptx = coin.parseTX(tx);
  var txn = {};
  //var now = Date.now() / 1000 | 0;
  var now = 0;

  txn.amount = 0;
  txn.confirmations = ptx.confirmations || -1;
  txn.blockhash = ptx.rblock;
  txn.blockindex = 0;
  txn.blocktime = ptx.ts || now;
  txn.txid = ptx.rhash;
  txn.walletconflicts = [];
  txn.time = ptx.ts || now;
  txn.timereceived = ptx.ts || now;

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

  coined.utils.hideProperty(txn, 'o', tx);
  coined.utils.hideProperty(txn, 'd', ptx);

  return txn;
};

transforms.txs.bcoinToBitcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(ptx) {
    var txn = {};
    //var now = Date.now() / 1000 | 0;
    var now = 0;
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
    txn.time = tx.ts || now;
    txn.timereceived = tx.ts || now;
    return txn;
  });

  coined.utils.hideProperty(txns, 'o', txs);

  return txns;
};

transforms.addr.bcoinToBitcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.addr.type(addr) === 'bitcoin') {
    return addr;
  }

  var addrn = {};

  // ...

  coined.utils.hideProperty(addrn, 'o', addr);

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

  if (transforms.block.type(block) === 'bcoin') {
    return block;
  }

  var blockn = {};

  // ...

  coined.utils.hideProperty(blockn, 'o', block);

  return blockn;
};

transforms.tx.bitcoinToBcoin = function(tx) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.tx.type(tx) === 'bcoin') {
    return tx;
  }

  var txn = {};

  // ...

  coined.utils.hideProperty(txn, 'o', tx);

  return txn;
};

transforms.txs.bitcoinToBcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    return transforms.tx.bitcoinToBcoin(tx);
  });

  coined.utils.hideProperty(txns, 'o', txs);

  return txns;
};

transforms.addr.bitcoinToBcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.addr.type(addr) === 'bcoin') {
    return addr;
  }

  var addrn = {};

  // ...

  coined.utils.hideProperty(addrn, 'o', addr);

  return addrn;
};

/**
 * Transforms - bcoin to blockchain.info
 */

transforms.block.bcoinToInfo = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.block.type(block) === 'info') {
    return block;
  }

  var pblock = coin.parseBlock(block);
  var blockn = {};

  blockn.hash = pblock.rhash;
  blockn.prev_block = pblock.prevBlock;
  blockn.next_block = '';
  blockn.mrkl_root = pblock.merkleRoot;
  blockn.n_tx = pblock.totalTX;
  blockn.fee = -1;
  blockn.main_chain = true;
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

  blockn.tx = (pblock.txs || []).map(function(tx) {
    return transforms.tx.bcoinToInfo(tx, block);
  });

  coined.utils.hideProperty(blockn, 'o', block);
  coined.utils.hideProperty(blockn, 'd', pblock);

  return blockn;
};

transforms.tx.bcoinToInfo = function(tx, block) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.tx.type(tx) === 'info') {
    return tx;
  }

  var ptx = coin.parseTX(tx);
  var txn = {};
  //var now = Date.now() / 1000 | 0;
  var now = 0;

  var blockHash = ptx.block || (block ? block.hash('hex') : '');

  function getInputValue(input) {
    if (!input.out.tx) return 0;
    var tx = input.out.tx;
    var output = tx.outputs[input.out.index];
    if (!output) return 0;
    return output.value.toString(10);
  }

  txn.inputs = ptx.inputs.map(function(input, i) {
    if (+input.out.hash === 0) return {};
    return {
      prev_out: {
        n: input.out.index,
        value: getInputValue(input),
        addr: input.out.address,
        tx_index: -1,
        type: 0
      },
      script: coined.utils.toHex(input.script[0])
        + '\n' + coined.utils.toHex(input.script[1])
    };
  });

  txn.out = ptx.outputs.map(function(output, i) {
    return {
      n: i,
      value: output.value.toString(10),
      addr: output.address,
      tx_index: -1,
      spent: false,
      type: 0,
      script: output.script.map(function(op) {
        if (typeof op === 'string') {
          return 'OP_' + op.toUpperCase();
        }
        return coined.utils.toHex(op);
      }).join(' ')
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

  txn.time = ptx.ts || now;

  txn.relayed_by = '0.0.0.0';

  txn.vin_sz = ptx.inputs.length;
  txn.vout_sz = ptx.outputs.length;

  txn.confirmations = transforms._getConfirmations(blockHash) || -1;

  coined.utils.hideProperty(txn, 'o', tx);
  coined.utils.hideProperty(txn, 'd', ptx);

  return txn;
};

transforms.txs.bcoinToInfo = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    return transforms.tx.bcoinToInfo(tx);
  });

  coined.utils.hideProperty(txns, 'o', txs);

  return txns;
};

transforms.addr.bcoinToInfo = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.addr.type(addr) === 'info') {
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

  coined.utils.hideProperty(addrn, 'd', { __proto__: addr, txs: ptxs });
  coined.utils.hideProperty(addrn, 'o', addr);

  return addrn;
};

/**
 * Transforms - blockchain.info to bcoin (TODO)
 */

transforms.block.infoToBcoin = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.block.type(block) === 'bcoin') {
    return block;
  }

  var blockn = {};

  // ...

  coined.utils.hideProperty(blockn, 'o', block);

  return blockn;
};

transforms.tx.infoToBcoin = function(tx, block) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.tx.type(tx) === 'bcoin') {
    return tx;
  }

  var txn = {};

  // ...

  coined.utils.hideProperty(txn, 'o', tx);

  return txn;
};

transforms.txs.infoToBcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    return transforms.tx.infoToBcoin(tx);
  });

  coined.utils.hideProperty(txns, 'o', txs);

  return txns;
};

transforms.addr.infoToBcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.addr.type(addr) === 'bcoin') {
    return addr;
  }

  var addrn = {};

  // ...

  coined.utils.hideProperty(addrn, 'o', addr);

  return addrn;
};

/**
 * Transforms - bcoin to blockexplorer.com (TODO)
 */

transforms.block.bcoinToExplorer = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.block.type(block) === 'explorer') {
    return block;
  }

  var blockn = {};

  // ...

  coined.utils.hideProperty(blockn, 'o', block);

  return blockn;
};

transforms.tx.bcoinToExplorer = function(tx, block) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.tx.type(tx) === 'explorer') {
    return tx;
  }

  var txn = {};

  // ...

  coined.utils.hideProperty(txn, 'o', tx);

  return txn;
};

transforms.txs.bcoinToExplorer = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    return transforms.tx.infoToBcoin(tx);
  });

  coined.utils.hideProperty(txns, 'o', txs);

  return txns;
};

transforms.addr.bcoinToExplorer = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.addr.type(addr) === 'explorer') {
    return addr;
  }

  var addrn = {};

  // ...

  coined.utils.hideProperty(addrn, 'o', addr);

  return addrn;
};

/**
 * Transforms - blockexplorer.com to bcoin (TODO)
 */

transforms.block.explorerToBcoin = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.block.type(block) === 'bcoin') {
    return block;
  }

  var blockn = {};

  // ...

  coined.utils.hideProperty(blockn, 'o', block);

  return blockn;
};

transforms.tx.explorerToBcoin = function(tx, block) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.tx.type(tx) === 'bcoin') {
    return tx;
  }

  var txn = {};

  // ...

  coined.utils.hideProperty(txn, 'o', tx);

  return txn;
};

transforms.txs.explorerToBcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    return transforms.tx.infoToBcoin(tx);
  });

  coined.utils.hideProperty(txns, 'o', txs);

  return txns;
};

transforms.addr.explorerToBcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.addr.type(addr) === 'bcoin') {
    return addr;
  }

  var addrn = {};

  // ...

  coined.utils.hideProperty(addrn, 'o', addr);

  return addrn;
};

/**
 * Transforms - libbitcoind to blockchain.info
 */

transforms.block.libbitcoindToInfo = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.block.type(block) === 'info') {
    return block;
  }

  var blockn = {};

  blockn.hash = block.hash;
  blockn.prev_block = block.previousblockhash;
  blockn.next_block = block.nextblockhash;
  blockn.mrkl_root = block.merkleroot;
  blockn.n_tx = block.tx.length;
  blockn.fee = block.fee || -1;
  blockn.main_chain = true;
  blockn.est_tx_volume = block.tx.reduce(function(total, tx) {
    return total + tx.vout.reduce(function(total, vout) {
      return total + vout.value;
    }, 0);
  }, 0);
  blockn.fee = block.fee || -1;
  blockn.height = block.height;
  blockn.time = block.time;
  blockn.received_time = block.timereceived;
  blockn.relayed_by = '0.0.0.0';
  blockn.difficulty = block.difficulty;
  blockn.bits = block.bits;
  blockn.size = block.size;
  blockn.ver = block.version;
  blockn.nonce = block.nonce;

  blockn.tx = block.tx.map(function(tx) {
    return transforms.tx.libbitcoindToInfo(tx, block);
  });

  coined.utils.hideProperty(blockn, 'o', block);
  coined.utils.hideProperty(blockn, 'd', block);

  return blockn;
};

transforms.tx.libbitcoindToInfo = function(tx, block) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.tx.type(tx) === 'info') {
    return tx;
  }

  var txn = {};

  var blockHash = tx.blockhash;

  function getInputValue(input) {
    return input.prev.value;
  }

  txn.inputs = tx.vin.map(function(input, i) {
    var addr;
    if (input.coinbase) {
      //addr = 'coinbase:' + input.coinbase.substring(0, 4);
      addr = 'Coinbase';
    } else {
      addr = input.prev.address;
    }
    return {
      prev_out: {
        //txid: input.txid,
        n: input.vout || 0,
        value: input.prev.value,
        addr: addr,
        tx_index: -1,
        // type: 0
        type: input.type
      },
      script: input.scriptSig.hex
    };
  });

  txn.out = tx.vout.map(function(output, i) {
    var scriptPubKey = output.scriptPubKey || {};
    var addresses = scriptPubKey.addresses || [];
    var address = addresses[0] || 'None';
    return {
      n: i,
      value: output.value,
      //addr: output.scriptPubKey.addresses[0],
      addr: address,
      tx_index: output.index || -1,
      spent: output.spent || false,
      //type: 0,
      type: output.type || 0,
      //script: output.scriptPubKey.asm
      script: scriptPubKey.asm || ''
    };
  });

  txn.ver = tx.version;
  txn.size = tx.size;
  txn.hash = tx.txid;
  txn.block = tx.blockhash;
  txn.double_spend = false;

  txn.block_height = block ? block.height : -1;

  txn.time = tx.time || tx.timereceived;

  txn.relayed_by = '0.0.0.0';

  txn.vin_sz = tx.vin.length;
  txn.vout_sz = tx.vout.length;

  txn.confirmations = block ? block.confirmations
    : (tx.confirmations != null ? tx.confirmations : -1);

  coined.utils.hideProperty(txn, 'o', tx);
  coined.utils.hideProperty(txn, 'd', tx);

  return txn;
};

transforms.txs.libbitcoindToInfo = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    return transforms.tx.libbitcoindToInfo(tx);
  });

  coined.utils.hideProperty(txns, 'o', txs);

  return txns;
};

transforms.addr.libbitcoindToInfo = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.addr.type(addr) === 'info') {
    return addr;
  }

  var addrn = {};

  addrn.address = addr.address;
  addrn.hash160 = bcoin.wallet.addr2hash(addr.address);
  addrn.n_tx = addr.tx.length;

  addrn.total_sent = addr.tx.reduce(function(total, tx) {
    return total + tx.vin.reduce(function(total, vin) {
      return total + vin.prev.value;
    }, 0);
  }, 0);

  addrn.total_received = addr.tx.reduce(function(total, tx) {
    return total + tx.vout.reduce(function(total, vout) {
      return total + vout.value;
    }, 0);
  }, 0);

  addrn.final_balance = addrn.total_received - addrn.total_sent;

  addrn.total_received = coined.utils.fromBTC(addr.total_received);
  addrn.total_sent = coined.utils.fromBTC(addr.total_sent);
  addrn.final_balance = coined.utils.fromBTC(addr.final_balance);

  addrn.txs = addr.tx.map(function(tx) {
    return transforms.tx.libbitcoindToInfo(tx);
  });

  coined.utils.hideProperty(addrn, 'd', { __proto__: addr, txs: addr.tx });
  coined.utils.hideProperty(addrn, 'o', addr);

  return addrn;
};

/**
 * Transforms - libbitcoind to bitcoind
 */

transforms.block.libbitcoindToBitcoin = function(block) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.block.type(block) === 'bitcoin') {
    return block;
  }

  var blockn = {};

  blockn.hash = block.blockhash;
  blockn.confirmations = block.confirmations;
  blockn.size = block.size;
  blockn.version = block.version;
  blockn.merkleroot = block.merkleroot;
  blockn.tx = block.tx.map(function(tx) {
    return tx.txid;
  });
  blockn.time = block.time;
  blockn.nonce = block.nonce;
  blockn.bits = block.bits;
  blockn.difficulty = block.difficulty;
  blockn.chainwork = block.chainwork;
  blockn.previousblockhash = block.previousblockhash;

  coined.utils.hideProperty(blockn, 'o', block);
  coined.utils.hideProperty(blockn, 'd', block);

  return blockn;
};

transforms.tx.libbitcoindToBitcoin = function(tx, block) {
  var coin = termcoin.bitcoin.coin;
  var bitcoindjs = require('bitcoind.js').global;

  if (transforms.tx.type(tx) === 'bitcoin') {
    return tx;
  }

  var txn = {};
  var now = 0;

  txn.amount = tx.vout.reduce(function(total, vout) {
    return total + vout.reduce(function(total, vout) {
      return total + vout.value;
    }, 0);
  }, 0);
  txn.confirmations = (block ? block.confirmations : 0) || tx.confirmations || -1;
  txn.blockhash = (block ? block.blockhash : 0) || tx.blockhash;
  txn.blockindex = block.height;
  txn.blocktime = (block ? block.time : 0) || tx.blocktime;
  txn.txid = tx.txid;
  txn.walletconflicts = tx.walletconflicts;
  txn.time = tx.time;
  txn.timereceived = tx.timereceived;

  txn.details = (function() {
    var details = [];

    tx.sender = tx.vin[0].prev.address;
    tx.recipient = tx.vout[0].scriptPubKey.addresses[0];

    txn.confirmations = (block ? block.confirmations : 0) || tx.confirmations || -1;

    var accounts = bitcoindjs.wallet.getAccounts();
    var addresses = Object.keys(accounts).forEach(function(out, name) {
      var account = accounts[name];
      account.addresses.forEach(function(addr) {
        out[addr.address] = account;
      });
      return out;
    }, {});

    var saddr;
    var isSender = tx.vin.filter(function(vin) {
      return !!addresses[vin.prev.address] && (saddr = vin.prev.address);
    });

    var raddr;
    var isRecipient = tx.vout.some(function(vout) {
      return vout.addresss.some(function(addr) {
        return !!addresses[addr] && (raddr = addr);
      });
    });

    if (isSender) {
      var account = addresses[saddr];
      details.push({
        account: account.name || '',
        //address: tx.recipient,
        address: tx.sender,
        category: 'send',
        amount: '-' + tx.amount
      });
      //txn.address = tx.sender;
      txn.address = tx.recipient;
      txn.amount = tx.amount;
      txn.category = 'send';
      return details;
    }

    if (isRecipient) {
      var account = addresses[raddr];
      details.push({
        account: account.name || '',
        address: tx.sender,
        category: 'receive',
        amount: tx.amount
      });
      txn.address = tx.recipient;
      txn.amount = tx.amount;
      txn.category = 'receive';
      return details;
    }

    return details;
  })();

  txn.hex = tx.hex;

  txn.address = txn.sender;
  if (!txn.address) return;

  coined.utils.hideProperty(txn, 'o', tx);
  coined.utils.hideProperty(txn, 'd', tx);

  return txn;
};

transforms.txs.libbitcoindToBitcoin = function(txs) {
  var coin = termcoin.bitcoin.coin;

  var txns = txs.map(function(tx) {
    var txn = {};
    var now = 0;
    coined.utils.hideProperty(txn, 'd', tx);
    var tx = transforms.tx.libbitcoindToBitcoin(tx);
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
    txn.time = tx.time || now;
    txn.timereceived = tx.timereceived || now;
    return txn;
  });

  coined.utils.hideProperty(txns, 'o', txs);

  return txns;
};

transforms.addr.libbitcoindToBitcoin = function(addr) {
  var coin = termcoin.bitcoin.coin;

  if (transforms.addr.type(addr) === 'bitcoin') {
    return addr;
  }

  var addrn = {};

  // ...

  coined.utils.hideProperty(addrn, 'o', addr);

  return addrn;
};

/**
 * Transforms - everything to everything
 */

// bitcoind

transforms.block.toBitcoin = function(block) {
  var type = transforms.block.type(block);
  var method = type + 'ToBitcoin';
  return transforms.block[method](block);
};
transforms.tx.toBitcoin = function(tx, block) {
  var type = transforms.tx.type(tx);
  var method = type + 'ToBitcoin';
  return transforms.tx[method](tx, block);
};
transforms.txs.toBitcoin = function(txs) {
  var type = transforms.txs.type(txs);
  var method = type + 'ToBitcoin';
  return transforms.txs[method](txs);
};
transforms.addr.toBitcoin = function(addr) {
  var type = transforms.addr.type(addr);
  var method = type + 'ToBitcoin';
  return transforms.addr[method](addr);
};

// bcoin

transforms.block.toBcoin = function(block) {
  var type = transforms.block.type(block);
  var method = type + 'ToBcoin';
  return transforms.block[method](block);
};
transforms.tx.toBcoin = function(tx, block) {
  var type = transforms.tx.type(tx);
  var method = type + 'ToBcoin';
  return transforms.tx[method](tx, block);
};
transforms.txs.toBcoin = function(txs) {
  var type = transforms.txs.type(txs);
  var method = type + 'ToBcoin';
  return transforms.txs[method](txs);
};
transforms.addr.toBcoin = function(addr) {
  var type = transforms.addr.type(addr);
  var method = type + 'ToBcoin';
  return transforms.addr[method](addr);
};

// blockchain.info

transforms.block.toInfo = function(block) {
  var type = transforms.block.type(block);
  var method = type + 'ToInfo';
  return transforms.block[method](block);
};
transforms.tx.toInfo = function(tx, block) {
  var type = transforms.tx.type(tx);
  var method = type + 'ToInfo';
  return transforms.tx[method](tx, block);
};
transforms.txs.toInfo = function(txs) {
  var type = transforms.txs.type(txs);
  var method = type + 'ToInfo';
  return transforms.txs[method](txs);
};
transforms.addr.toInfo = function(addr) {
  var type = transforms.addr.type(addr);
  var method = type + 'ToInfo';
  return transforms.addr[method](addr);
};

// blockexplorer.com

transforms.block.toExplorer = function(block) {
  var type = transforms.block.type(block);
  var method = type + 'ToExplorer';
  return transforms.block[method](block);
};

transforms.tx.toExplorer = function(tx, block) {
  var type = transforms.tx.type(tx);
  var method = type + 'ToExplorer';
  return transforms.tx[method](tx, block);
};

transforms.txs.toExplorer = function(txs) {
  var type = transforms.txs.type(txs);
  var method = type + 'ToExplorer';
  return transforms.txs[method](txs);
};

transforms.addr.toExplorer = function(addr) {
  var type = transforms.addr.type(addr);
  var method = type + 'ToExplorer';
  return transforms.addr[method](addr);
};

/**
 * Types
 */

transforms.block.type = function(block) {
  if (block._blockFlag) {
  //if (termcoin.bitcoin.block.isBlock(tx)) {
    return 'libbitcoind';
  }
  if (block.relayed_by) {
    return 'info';
  }
  if (block.previousblockhash) {
    return 'bitcoin';
  }
  if (block.merkleRoot) {
    return 'bcoin';
  }
  if (Array.isArray(block.tx)
      && block.tx.length
      && Array.isArray(block.tx[0].in)
      && Array.isArray(block.tx[0].out)) {
    return 'explorer';
  }
  return 'unknown';
};

transforms.tx.type = function(tx) {
  if (tx._txFlag) {
  //if (termcoin.bitcoin.tx.isTransaction(tx)) {
    return 'libbitcoind';
  }
  if (tx.relayed_by) {
    return 'info';
  }
  if (tx.walletconflicts) {
    return 'bitcoin';
  }
  if (tx.ts != null) {
    return 'bcoin';
  }
  if (Array.isArray(tx.in) && Array.isArray(tx.out)) {
    return 'explorer';
  }
  return 'unknown';
};

transforms.txs.type = function(txs) {
  return Array.isArray(txs) && txs.length
    ? transforms.tx.type(txs[0])
    : 'unknown';
};

transforms.addr.type = function(addr) {
  if (addr._addrFlag) {
  //if (termcoin.bitcoin.addr.isAddress(addr)) {
    return 'libbitcoind';
  }
  if (addr.hash160 && addr.final_balance != null) {
    return 'info';
  }
  if (addr.txs && addr.txs.length && addr.txs[0].walletconflicts) {
    return 'bitcoin';
  }
  if (addr.txs && addr.txs.length && addr.txs[0].ts != null) {
    return 'bcoin';
  }
  if (addr.txs && addr.txs.length
      && Array.isArray(addr.txs[0].in)
      && Array.isArray(addr.txs[0].out)) {
    return 'explorer';
  }
  return 'unknown';
};

transforms.type = function(data) {
  if (Array.isArray(data)) {
    if (!data.length) return 'unknown';
    return transforms.type(data[0]);
  }
  if (data._blockFlag || data._txFlag || data._addrFlag) {
  //if (termcoin.bitcoin.block.isBlock(data)
  //    || termcoin.bitcoin.tx.isTransaction(data)
  //    || termcoin.bitcoin.addr.isAddress(data)) {
    return 'libbitcoind';
  }
  if (data.merkleRoot
      || data.ts != null
      || (data.txs && data.txs.length && data.txs[0].ts != null)) {
    return 'bcoin';
  }
  if (data.relayed_by
      || data.relayed_by
      || (data.hash160 && data.final_balance != null)) {
    return 'info';
  }
  if (data.mrkl_tree
      || (data.in && data.out)
      || (data.txs && data.txs.length && data.txs[0].in)) {
    return 'explorer';
  }
  if (data.previousblockhash
      || data.walletconflicts
      || data.address) {
    return 'bitcoin';
  }
  return 'unknown';
};

transforms.rtype = function(data, type) {
  if (Array.isArray(data)) {
    if (!data.length) return 'unknown';
    return transforms.rtype(data[0]);
  }
  var type = type || transforms.type(data);
  if (type === 'libbitcoind') {
    if (data._blockFlag) return 'block';
    if (data._txFlag) return 'tx';
    if (data._addrFlag) return 'addr';
    //if (termcoin.bitcoin.block.isBlock(data)) return 'block';
    //if (termcoin.bitcoin.tx.isTransaction(data)) return 'tx';
    //if (termcoin.bitcoin.addr.isAddress(data)) return 'addr';
    return 'unknown';
  }
  if (type === 'bcoin') {
    if (data.merkleRoot) return 'block';
    if (data.outputs) return 'tx';
    if (data.txs) return 'addr';
    return 'unknown';
  }
  if (type === 'info') {
    if (data.main_chain != null) return 'block';
    if (data.double_spend != null) return 'tx';
    if (data.hash160 && data.final_balance != null) return 'addr';
    return 'unknown';
  }
  if (type === 'explorer') {
    if (data.mrkl_tree) return 'block';
    if (data.in && data.out) return 'tx';
    if (data.txs) return 'addr';
    return 'unknown';
  }
  if (type === 'bitcoin') {
    if (data.previousblockhash) return 'block';
    if (data.walletconflicts) return 'tx';
    if (data.address) return 'addr';
    return 'unknown';
  }
  if (type === 'bitcoin') {
    if (data.previousblockhash) return 'block';
    if (data.txid) return 'tx';
    if (data.address && data.tx) return 'addr';
    return 'unknown';
  }
  return 'unknown';
};

transforms.types = function(data) {
  var type = transforms.type(data);
  var rtype = transforms.rtype(data, type);
  return [type, rtype];
};

/**
 * Helpers
 */

// e.g.
// block = transforms.format('block', 'bcoin', 'bitcoin', block);
// tx = transforms.format('tx', 'bitcoin', 'bcoin', tx, block);
transforms.format = function(type, from, to, a, b) {
  var method = from + 'To' + to[0].toUpperCase() + to.substring(1);
  return transforms[type][method](a, b);
};

// block = transforms.to('bitcoin', block);
// tx = transforms.to('bcoin', tx, block);
transforms.to = function(to, a, b) {
  var types = transforms.types(to);
  var method = types[0] + 'To' + to[0].toUpperCase() + to.substring(1);
  return transforms[types[1]][method](a, b);
};
