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

var fs = require('fs')
  , util = require('util');

/**
 * Load
 */

var termcoin = require('../')
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
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getBlock(id, callback);
  }
  return this.request(['rawblock', id], function(err, block) {
    if (err) return callback(err);
    return self.getBlockHeight(block.height + 1, function(err, next) {
      if (next) block.next_block = next.hash;
      block._hash = block.hash;
      return callback(null, block);
    });
  });
};

blockchain.getBlockHeight = function(height, callback) {
  var self = this;
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getBlockHeight(height, callback);
  }
  return this.request(['block-height', height + '?format=json'], function(err, result) {
    if (err) return callback(err);
    var blocks = result.blocks;
    var block = blocks[blocks.length-1];
    block._hash = block.hash;
    return callback(null, block);
  });
};

blockchain.getTransaction = function(id, block, callback) {
  var self = this;
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getTransaction(id, block, callback);
  }
  return this.request(['rawtx', id], function(err, tx) {
    if (err) return callback(err);
    return callback(null, tx, block);
  });
};

blockchain.getAddressTransactions = function(address, callback) {
  var self = this;
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getAddressTransaction(address, callback);
  }
  return this.request(['rawaddr', address], function(err, addr) {
    if (err) return callback(err);
    return callback(null, addr);
  });
};

blockchain._lastBlock = function(callback) {
  var self = this;
  return this.request(['latestblock'], function(err, block) {
    if (err) return callback(err);
    return callback(null, block);
  });
};

blockchain.getLastBlock = function(callback) {
  var self = this;
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getLastBlock(callback);
  }
  return this._lastBlock(function(err, block) {
    if (err) return callback(err);
    return self.getBlock(block.hash, function(err, block) {
      if (err) return callback(err);
      self.lastBlock = block;
      return callback(null, block);
    });
  });
};

blockchain._formatAddr = function(addr, cols) {
  var text = '';

  if (termcoin.config.localBlockchain) {
    addr = blockchain._transformAddr(addr);
  }

  var total_received = coined.utils.ntoBTC(addr.total_received);
  var total_sent = coined.utils.ntoBTC(addr.total_sent);
  var final_balance = coined.utils.ntoBTC(addr.final_balance);

  text += sep('Address', '{/}{bold}' + addr.address + '{/bold}', cols);
  text += sep('', '{/}(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)', cols);
  text += sep('Hash160', addr.hash160, cols);
  text += sep('Total Transactions:', addr.n_tx, cols);
  text += sep('Total Received:', '{/}{green-fg}+' + total_received + '{/green-fg}', cols);
  text += sep('Total Sent:', '{/}{red-fg}-' + total_sent + '{/red-fg}', cols);
  text += sep('Final Balance:', final_balance, cols);

  text += sep('', '', cols);

  addr.txs.forEach(function(tx) {
    var sent = !!tx.inputs.filter(function(input) {
      var prev = input.prev_out;
      if (!prev) return;
      return prev.addr === addr.address;
    })[0];

    var received = !!tx.out.filter(function(output) {
      return output.addr === addr.address;
    })[0];

    var stotal = tx.inputs.reduce(function(total, input) {
      var prev = input.prev_out;
      if (!prev) return total;
      if (prev.addr !== addr.address) return total;
      return total + prev.value;
    }, 0);
    stotal = coined.utils.ntoBTC(stotal);

    var rtotal = tx.out.reduce(function(total, output) {
      if (output.addr !== addr.address) return total;
      return total + output.value;
    }, 0);
    rtotal = coined.utils.ntoBTC(rtotal);

    if (sent && received) {
      if (rtotal < stotal) {
        sent = true;
        received = false;
      } else {
        sent = false;
        received = true;
      }
    }

    if (sent || received) {
      text += sep('Transaction', tx.hash, cols);
    }

    var ts = new Date(tx.time * 1000).toISOString();
    if (sent) {
      text += sep('{/}{blue-fg}{bold}Sent{/bold}{/blue-fg} (' + ts + ')',
        '{bold}{red-fg}-' + stotal + '{/red-fg}{/bold}', cols);
      text += sep('{/}{cyan-fg}' + addr.address + '{/cyan-fg}', '', cols);
      tx.out.forEach(function(output) {
        text += sep('', '{/}{cyan-fg}{red-fg}{bold}'
          + coined.utils.ntoBTC(output.value) + ' -> {/bold}{/red-fg}'
          + output.addr + '{/cyan-fg}', cols);
      });
    } else if (received) {
      text += sep('{/}{blue-fg}{bold}Received{/bold}{/blue-fg} (' + ts + ')',
        '{bold}{green-fg}+' + rtotal + '{/green-fg}{/bold}', cols);
      text += sep('', '{/}{cyan-fg}' + addr.address + '{/cyan-fg}', cols);
      tx.out.forEach(function(output) {
        text += sep('{/}{cyan-fg}' + output.addr + '{cyan-fg}'
         + '{green-fg}{bold} <- ' + coined.utils.ntoBTC(output.value)
         + '{/bold}{/green-fg}', '', cols);
      });
    }

    text += sep('', '', cols);
  });

  return text;
};

blockchain._formatTX = function(tx, block, cols) {
  var text = '';

  if (termcoin.config.localBlockchain) {
    tx = blockchain._transformTX(tx, block);
  }

  tx.coinbase = !tx.inputs[0].prev_out;

  tx.input_total = tx.inputs.reduce(function(total, input) {
    var prev = input.prev_out;
    if (!prev) return total;
    return total + prev.value;
  }, 0);
  tx.input_total = coined.utils.ntoBTC(tx.input_total);

  tx.output_total = tx.out.reduce(function(total, output) {
    return total + output.value;
  }, 0);
  tx.output_total = coined.utils.ntoBTC(tx.output_total);

  text += sep('Transaction:', '{/}{bold}' + tx.hash + '{/bold}', cols);
  text += sep('', '{/}(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)', cols);
  text += sep('Block:', block ? block.hash : Array(64 + 1).join('0'), cols);
  text += sep('Version:', tx.ver, cols);
  text += sep('Size:', tx.size, cols);
  text += sep('', '', cols);

  if (tx.double_spend) {
    text += sep('Note:', 'Double Spend!', cols);
  }
  text += sep('Block Height:', tx.block_height, cols);
  text += sep('Timestamp:', new Date(tx.time * 1000).toISOString(), cols);
  text += sep('Relayed By:', tx.relayed_by, cols);

  text += sep('', '', cols);

  text += sep('{/}Senders:', '(total: ' + tx.vin_sz + ')', cols);
  if (tx.coinbase) {
    text += sep('{/}{cyan-fg}Coinbase{/cyan-fg} {green-fg}->{/green-fg}',
      '{/}{green-fg}{bold}+' + tx.output_total + '{/bold}{/green-fg}',
      cols);
  } else {
    tx.inputs.forEach(function(input) {
      var script = input.script;
      var prev = input.prev_out;
      var addr = prev.addr;
      var value = coined.utils.ntoBTC(prev.value);
      var pscript = prev.script;
      var type = prev.type;
      var index = prev.n;
      text += sep('{/}{cyan-fg}' + addr + '{/cyan-fg}'
        + ' {red-fg}{bold}-' + value + '{/bold}{/red-fg}',
        '', cols);
    });
  }

  text += sep('', '', cols);

  text += sep('{/}Recipients:', '(total: ' + tx.vout_sz + ')', cols);
  tx.out.forEach(function(output) {
    var spent = output.spent;
    var script = output.script;
    var index = output.n;
    var addr = output.addr;
    var value = coined.utils.ntoBTC(output.value);
    text += sep('{/}{cyan-fg}' + addr + '{/cyan-fg}'
      + ' {green-fg}{bold}+' + value + '{/bold}{/green-fg}',
      '', cols);
  });

  return text;
};

blockchain._formatBlock = function(block, cols) {
  var text = '';

  if (termcoin.config.localBlockchain) {
    block = blockchain._transformBlock(block);
  }

  block.fee = coined.utils.ntoBTC(block.fee);

  block.reward = block.tx[0].out.reduce(function(total, output) {
    return total + output.value;
  }, 0);
  block.reward = coined.utils.ntoBTC(block.reward);

  block.output_total = block.tx.reduce(function(total, tx) {
    return tx.out.reduce(function(total, output) {
      return total + output.value;
    }, 0);
  }, 0);
  block.output_total = coined.utils.ntoBTC(block.output_total);

  var suffix = '';
  if (block.hash == this.lastBlock.hash) {
    suffix = ' {green-fg}(last block){/green-fg}';
  }

  text += sep('Block', '{/}{bold}#' + block.height + suffix + '{/bold}', cols);
  text += sep('', '{/}(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)', cols);

  text += sep('Hashes', '', cols);
  text += sep('Hash:', block.hash, cols);
  text += sep('Previous Block:', block.prev_block, cols);
  text += sep('Next Block:', block.next_block, cols);
  text += sep('Merkle Root:', block.mrkl_root, cols);

  text += sep('', '', cols);

  text += sep('Summary:', '', cols);
  text += sep('Transactions:', block.n_tx, cols);
  text += sep('Output Total:', block.output_total, cols);
  //text += sep('Est. TX Volume:', block.est_tx_volume, cols);
  text += sep('TX Fees:', block.fee, cols);
  text += sep('Height:', block.height, cols);
  text += sep('Timestamp:', new Date(block.time * 1000).toISOString(), cols);
  if (block.received_time) {
    text += sep('Received Time:', new Date(block.received_time * 1000).toISOString(), cols);
  }
  text += sep('Relayed By:', block.relayed_by, cols);
  //text += sep('Difficulty:', block.difficulty, cols);
  text += sep('Bits:', block.bits, cols);
  text += sep('Size:', block.size, cols);
  text += sep('Version:', block.ver, cols);
  text += sep('Nonce:', block.nonce, cols);
  text += sep('Reward:', block.reward, cols);

  text += sep('', '', cols);

  text += sep('{/}{bold}Transactions{/bold}', '', cols);

  block.tx.forEach(function(tx) {
    var iaddr = tx.inputs[0].prev_out
      ? tx.inputs[0].prev_out.addr
      : 'Coinbase';

    var oaddr = tx.out[0].addr;

    var ival = tx.inputs.reduce(function(total, input) {
      if (!input.prev_out) return total;
      return total + input.prev_out.value;
    }, 0);
    ival = coined.utils.ntoBTC(ival);

    var oval = tx.out.reduce(function(total, output) {
      return total + output.value;
    }, 0);
    oval = coined.utils.ntoBTC(oval);

    text += sep(
      '{/}{cyan-fg}' + iaddr + '{/cyan-fg}...'
        + ' {red-fg}{bold}-' + ival + '{/bold}{/red-fg} ->',
      '{/}{cyan-fg}' + oaddr + '{/cyan-fg}...'
        + ' {green-fg}{bold}+' + oval + '{/bold}{/green-fg}',
      cols
    );
  });

  return text;
};

blockchain._transformAddr = function(addr, cols) {
  var self = this;
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
    return self._transformTX(tx);
  });

  return addr;
};

blockchain._transformTX = function(tx, block, cols) {
  var self = this;
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

  return ptx;
};

blockchain._transformBlock = function(block, cols) {
  var self = this;
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
    return self._transformTX(tx, block);
  });

  return pblock;
};

function sep(left, right, cols) {
  var left = left == null ? '' : left + ''
    , right = right == null ? '' : right + ''
    , llen = left.replace(/{[^}]+}/g, '').length
    , rlen = right.replace(/{[^}]+}/g, '').length
    , width = llen + rlen
    , remain = cols - width
    , sp = utils.pad(remain - 2);

  if (left.indexOf('{/}') === 0) {
    left = left.substring(3);
  } else {
    left = '{blue-fg}' + left + '{/blue-fg}';
  }

  if (right.indexOf('{/}') === 0) {
    right = right.substring(3);
  } else {
    if (/^[\-+.0-9]+$/.test(right)) {
      right = '{yellow-fg}' + right + '{/yellow-fg}';
    } else {
      right = '{green-fg}' + right + '{/green-fg}';
    }
  }

  return left + sp + right + '\n';
}

/**
 * API
 */

blockchain.explorer = 'https://blockchain.info';

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
