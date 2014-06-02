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
    return self.getBlockHeight(block.height + 1, function(err, next) {
      if (next) block.next_block = next.hash;
      block._hash = block.hash;
      return callback(null, block);
    });
  });
};

blockchain.getBlockHeight = function(height, callback) {
  var self = this;
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
  return this.request(['rawtx', id], function(err, tx) {
    if (err) return callback(err);
    return callback(null, tx, block);
  });
};

blockchain.getAddressTransactions = function(address, callback) {
  var self = this;
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

  text += sep('Address', '{/}{bold}' + addr.address + '{/bold}', cols);
  text += sep('', '(press {yellow-fg}`t`{/yellow-fg} to select from transactions)', cols);
  text += sep('Hash160', addr.hash160, cols);
  text += sep('Total Transactions:', addr.n_tx, cols);
  text += sep('Total Received:', coined.utils.ntoBTC(addr.total_received), cols);
  text += sep('Total Sent:', coined.utils.ntoBTC(addr.total_sent), cols);
  text += sep('Final Balance:', coined.utils.ntoBTC(addr.final_balance), cols);

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

    if (sent) {
      text += sep('{bold}Sent{/bold}',
        '{bold}{red-fg}-' + stotal + '{/red-fg}{/bold}', cols);
      text += sep('{/}' + addr.address, '', cols);
      tx.out.forEach(function(output) {
        text += sep('', output.addr, cols);
      });
    } else if (received) {
      text += sep('{bold}Received{/bold}',
        '{bold}{green-fg}+' + rtotal + '{/green-fg}{/bold}', cols);
      text += sep('', addr.address, cols);
      tx.out.forEach(function(output) {
        text += sep('{/}' + output.addr, '', cols);
      });
    }

    text += sep('', '', cols);
  });

  return text;
};

blockchain._formatTX = function(tx, block, cols) {
  var text = '';

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
  text += sep('', '(press {yellow-fg}`a`{/yellow-fg} to select from addresses)', cols);
  text += sep('Block:', block.hash, cols);
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

  text += sep('{/}Senders:', tx.vin_sz, cols);
  if (tx.coinbase) {
    text += sep('Coinbase ->', tx.output_total, cols);
  } else {
    tx.inputs.forEach(function(input) {
      var script = input.script;
      var prev = input.prev_out;
      var addr = prev.addr;
      var value = coined.utils.ntoBTC(prev.value);
      var pscript = prev.script;
      var type = prev.type;
      var index = prev.n;
      text += sep(addr + ' {yellow-fg}(' + value + '){/yellow-fg}', '', cols);
    });
  }

  text += sep('', '', cols);

  text += sep('{/}Recipients:', tx.vout_sz, cols);
  tx.out.forEach(function(output) {
    var spent = output.spent;
    var script = output.script;
    var index = output.n;
    var addr = output.addr;
    var value = coined.utils.ntoBTC(output.value);
    text += sep(addr + ' {yellow-fg}(' + value + '){/yellow-fg}', '', cols);
  });

  return text;
};

blockchain._formatBlock = function(block, cols) {
  var text = '';

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
  text += sep('', '(press {yellow-fg}`t`{/yellow-fg} to select from transactions)', cols);

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

  block.tx.forEach(function(tx) {
    var iaddr = tx.inputs[0].prev_out
      ? tx.inputs[0].prev_out.addr
      : 'coinbase';

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

    text += sep(iaddr + '... {yellow-fg}(' + ival + '){/yellow-fg} ->',
      oaddr + '... {yellow-fg}(' + oval + '){/yellow-fg}',
      cols);
  });

  return text;
};

function sep(left, right, cols) {
  var llen = (left + '').replace(/{[^}]+}/g, '').length
    , rlen = (right + '').replace(/{[^}]+}/g, '').length
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
