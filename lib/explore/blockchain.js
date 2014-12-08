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
  , transforms = termcoin.transforms
  , opt = config.opt
  , platform = config.platform
  , config = config.config;

/**
 * API Calls
 */

blockchain.parser = new bcoin.protocol.parser();

blockchain.getBlock = function(id, callback) {
  var self = this;
  if (termcoin.config.libbitcoind) {
    return termcoin.bitcoin.getBlock(id, function(err, block) {
      if (err) return callback(err);
      block = transforms.block.libbitcoindToInfo(block);
      return callback(null, block);
    });
  }
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
  if (termcoin.config.libbitcoind) {
    return termcoin.bitcoin.getBlockHeight(height, function(err, block) {
      if (err) return callback(err);
      block = transforms.block.libbitcoindToInfo(block);
      return callback(null, block);
    });
  }
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
  var slow = false;
  if (typeof id === 'object' && id) {
    var options = id;
    callback = blockhash;
    id = options.txid || options.tx || options.id || options.hash;
    block = options.blockhash || options.block;
    slow = options.slow;
  }
  if (termcoin.config.libbitcoind) {
    return termcoin.bitcoin.getTransaction(id, block, function(err, tx) {
      if (err) return callback(err);
      if (tx.blockhash) {
        return termcoin.bitcoin.getBlock(tx.blockhash, function(err, block) {
          if (err) return callback(err);
          tx = transforms.tx.libbitcoindToInfo(tx, block);
          block = transforms.block.libbitcoindToInfo(block);
          return callback(null, tx, block);
        });
      }
      //if (slow && !block) {
      if (!block) {
        return termcoin.bitcoin.getBlockByTx(id, function(err, block) {
          tx = transforms.tx.libbitcoindToInfo(tx, block);
          if (block) {
            block = transforms.block.libbitcoindToInfo(block);
          }
          return callback(null, tx, block);
        });
      }
      tx = transforms.tx.libbitcoindToInfo(tx, block);
      block = transforms.block.libbitcoindToInfo(block);
      return callback(null, tx, block);
    });
  }
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getTransaction(id, block, callback);
  }
  return this.request(['rawtx', id + '?scripts=true'], function(err, tx) {
    if (err) return callback(err);
    return callback(null, tx, block);
  });
};

blockchain.getAddressTransactions = function(address, callback) {
  var self = this;
  if (termcoin.config.libbitcoind) {
    return termcoin.bitcoin.getAddrTransactions(address, function(err, addr) {
      if (err) return callback(err);
      addr = transforms.addr.libbitcoindToInfo(addr);
      return callback(null, addr);
    });
  }
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
  if (termcoin.config.libbitcoind) {
    return termcoin.bitcoin.getLastBlock(function(err, block) {
      if (err) return callback(err);
      block = transforms.block.libbitcoindToInfo(block);
      return callback(null, block);
    });
  }
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

blockchain.getRawBlock = function(id, callback) {
  var self = this;
  if (termcoin.config.libbitcoind) {
    return termcoin.bitcoin.getRawBlock(callback);
  }
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getBlock(id, callback);
  }
  return this.request(['rawblock', id + '?format=hex'], function(err, block) {
    if (err) return callback(err);
    var data = bcoin.utils.toArray(block, 'hex');
    // while (data.length < 86) data.push(0);
    // block = blockchain.parser.parseMerkleBlock(data);
    // block = bcoin.block(block, 'merkleblock');
    while (data.length < 81) data.push(0);
    block = blockchain.parser.parseBlock(data);
    block = bcoin.block(block, 'block');
    block = transforms.block.bcoinToInfo(block);
    block._hash = block.hash;
    return callback(null, block);
  });
};

blockchain.getRawTransaction = function(id, block, callback) {
  var self = this;
  if (termcoin.config.libbitcoind) {
    return termcoin.bitcoin.getRawTransaction(id, block, callback);
  }
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getTransaction(id, block, callback);
  }
  return this.request(['rawtx', id + '?format=hex'], false, function(err, tx) {
    if (err) return callback(err);
    var data = bcoin.utils.toArray(tx, 'hex');
    tx = blockchain.parser.parseTX(data);
    tx = bcoin.tx(tx);
    tx = transforms.tx.bcoinToInfo(tx);
    return callback(null, tx, block);
  });
};

blockchain._formatAddr = function(addr, cols) {
  var text = '';

  if (termcoin.config.localBlockchain) {
    addr = transforms.addr.bcoinToInfo(addr);
  }

  var total_received = coined.utils.ntoBTC(addr.total_received);
  var total_sent = coined.utils.ntoBTC(addr.total_sent);
  var final_balance = coined.utils.ntoBTC(addr.final_balance);

  text += '{blue-fg}Address{/blue-fg}'
    + '{|}' + '{bold}' + addr.address + '{/bold}\n';
  text += '{|}' + '(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)\n';
  text += '{blue-fg}Hash160{/blue-fg}'
    + '{|}' + '{green-fg}' + addr.hash160 + '{/green-fg}\n';
  text += '{blue-fg}Total Transactions:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + addr.n_tx + '{/yellow-fg}\n';
  text += '{blue-fg}Total Received:{/blue-fg}'
    + '{|}' + '{green-fg}+' + total_received + '{/green-fg}\n';
  text += '{blue-fg}Total Sent:{/blue-fg}'
    + '{|}' + '{red-fg}-' + total_sent + '{/red-fg}\n';
  text += '{blue-fg}Final Balance:{/blue-fg}'
    + '{|}' + '{yellow-fg}{bold}' + final_balance + '{/bold}{/yellow-fg}\n';

  text += '\n';

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
      return total + +prev.value;
    }, 0);
    stotal = coined.utils.ntoBTC(stotal);

    var rtotal = tx.out.reduce(function(total, output) {
      if (output.addr !== addr.address) return total;
      return total + +output.value;
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
      text += '{blue-fg}Transaction{/blue-fg}'
        + '{|}' + '{green-fg}' + tx.hash + '{/green-fg}\n';
    }

    var ts = new Date(tx.time * 1000).toISOString();
    if (sent) {
      text += '{blue-fg}{bold}Sent{/bold}{/blue-fg} (' + ts + ')'
        + '{|}' + '{bold}{red-fg}-' + stotal + '{/red-fg}{/bold}\n';
      text += '{white-fg}' + addr.address + '{/white-fg}\n';
      tx.out.forEach(function(output) {
        var address = '{cyan-fg}' + output.addr + '{/cyan-fg}';
        if (output.addr === addr.address) {
          address = address.replace(/cyan/g, 'white');
        }
        text += '{|}' + '{red-fg}{bold}'
          + coined.utils.ntoBTC(output.value) + ' -> {/bold}{/red-fg}'
          + address
          + '\n';
      });
    } else if (received) {
      text += '{blue-fg}{bold}Received{/bold}{/blue-fg} (' + ts + ')'
        + '{|}' + '{bold}{green-fg}+' + rtotal + '{/green-fg}{/bold}\n';
      text += '{|}' + '{white-fg}' + addr.address + '{/white-fg}\n';
      tx.inputs.forEach(function(input) {
        var prev = input.prev_out;
        if (!prev) {
          prev = {
            addr: 'Coinbase',
            value: 0
          };
        }
        var address = '{cyan-fg}' + prev.addr + '{/cyan-fg}';
        if (prev.addr === addr.address) {
          address = address.replace(/cyan/g, 'white');
        }
        text += address
         + '{green-fg}{bold} ' + coined.utils.ntoBTC(prev.value)
         + ' ->{/bold}{/green-fg}\n';
      });
    }

    text += '\n';
  });

  return text;
};

blockchain._formatTX = function(tx, block, cols) {
  var text = '';

  if (termcoin.config.localBlockchain) {
    tx = transforms.tx.bcoinToInfo(tx, block);
  }

  tx.coinbase = !tx.inputs[0].prev_out;

  tx.input_total = tx.inputs.reduce(function(total, input) {
    var prev = input.prev_out;
    if (!prev) return total;
    return total + +prev.value;
  }, 0);
  tx.input_total = coined.utils.ntoBTC(tx.input_total);

  tx.output_total = tx.out.reduce(function(total, output) {
    return total + +output.value;
  }, 0);
  tx.output_total = coined.utils.ntoBTC(tx.output_total);

  var outputs = tx.out.slice(0, tx.out.length > 1 ? -1 : 1);
  tx.est_total = outputs.reduce(function(total, output) {
    return total + +output.value;
  }, 0);
  tx.est_total = coined.utils.ntoBTC(tx.est_total);

  tx.confirmations = tx.confirmations || 0;
  if (tx.confirmations === 0 || tx.confirmations === -1) {
    if (tx.block_height >= 0) {
      if (blockchain.lastBlock) {
        tx.confirmations = blockchain.lastBlock.height - tx.block_height + 1;
      } else {
        tx.confirmations = 1;
      }
    }
  }

  if (termcoin.bitcoin.coin && !termcoin.config.libbitcoind) {
    if (!block || !block.hash || !+block.hash) {
      var index = termcoin.bitcoin.coin.pool.chain.index;
      var i = index.heights.indexOf(tx.block_height);
      if (index.hashes[i]) {
        block = {
          hash: coined.utils.revHex(index.hashes[i]),
          height: tx.block_height
        };
        if (tx.confirmations === 0 || tx.confirmations === -1) {
          tx.confirmations = index.heights[index.heights.length-1] - block.height + 1;
        }
      }
    }
    if (termcoin.bitcoin.coin.blockHeight && tx.block_height >= 0) {
      if (tx.confirmations === 0 || tx.confirmations === -1) {
        tx.confirmations = termcoin.bitcoin.coin.blockHeight - tx.block_height + 1;
      }
    }
  }

  text += '{blue-fg}Transaction:{/blue-fg}'
    + '{|}' + '{bold}' + tx.hash + '{/bold}\n';
  text += '{|}'
    + '(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)\n';
  text += '{blue-fg}Block:{/blue-fg}'
    + '{|}' + '{green-fg}' + (block ? block.hash : Array(64 + 1).join('0'))
    + '{/green-fg}\n';
  text += '{blue-fg}Version:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + tx.ver + '{/yellow-fg}\n';
  text += '{blue-fg}Size:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + tx.size + '{/yellow-fg}\n';
  text += '\n';

  if (tx.double_spend) {
    text += '{blue-fg}Note:{/blue-fg}'
      + '{|}' + '{bold}Double Spend!{/bold}\n';
  }

  text += '{blue-fg}Block Height:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + (tx.block_height || -1) + '{/yellow-fg}\n';
  text += '{blue-fg}Confirmations:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + tx.confirmations + '{/yellow-fg}\n';
  text += '{blue-fg}Timestamp:{/blue-fg}'
    + '{|}' + '{green-fg}' + new Date(tx.time * 1000).toISOString()
    + '{/green-fg}\n';
  text += '{blue-fg}Estimated Transacted:{/blue-fg}' + '{|}' + ''
    + '{yellow-fg}{bold}' + tx.est_total + '{/bold}{/yellow-fg}\n';
  text += '{blue-fg}Relayed By:{/blue-fg}'
    + '{|}' + '{green-fg}' + tx.relayed_by + '{/green-fg}\n';

  text += '\n';

  text += 'Senders:'
    + '{|}' + '{green-fg}(total: ' + tx.vin_sz + '){/green-fg}\n';
  if (tx.coinbase) {
    text += '{cyan-fg}Coinbase{/cyan-fg} {green-fg}->{/green-fg}' + '{|}' + ''
      + '{green-fg}{bold}+' + tx.output_total + '{/bold}{/green-fg}\n';
  } else {
    text += '{|}' + '{red-fg}{bold}-' + tx.input_total + '{/bold}{/red-fg}\n';
    tx.inputs.forEach(function(input) {
      var script = input.script || '';
      var prev = input.prev_out;
      if (!prev) {
        prev = {
          addr: 'Coinbase',
          value: 0,
          type: 0,
          n: 0
        };
      }
      var addr = prev.addr;
      var value = coined.utils.ntoBTC(prev.value);
      var pscript = prev.script;
      var type = prev.type;
      var index = prev.n;
      text += '{cyan-fg}' + addr + '{/cyan-fg}'
        + ' {red-fg}{bold}-' + value + '{/bold}{/red-fg}\n';
    });
  }

  text += '\n';

  text += 'Recipients:'
    + '{|}' + '{green-fg}(total: ' + tx.vout_sz + '){/green-fg}\n';
  text += '{|}'
    + '{green-fg}{bold}+' + tx.output_total + '{/bold}{/green-fg}\n';
  tx.out.forEach(function(output) {
    var spent = output.spent;
    var script = output.script;
    var index = output.n;
    var addr = output.addr;
    var value = coined.utils.ntoBTC(output.value);
    text += '{cyan-fg}' + addr + '{/cyan-fg}'
      + ' {green-fg}{bold}+' + value + '{/bold}{/green-fg}\n';
  });

  text += '\n';
  text += 'Input Scripts:\n';
  tx.inputs.forEach(function(input) {
    var script = input.script || '';
    var prev = input.prev_out;
    if (!prev) {
      prev = {
        addr: 'Coinbase',
        value: 0,
        type: 0,
        n: 0
      };
    }
    var type = prev.type;
    var index = prev.n;
    text += '' + '{|}' + '' + script + '\n';
  });

  text += '\n';
  text += 'Output Scripts:\n';
  tx.out.forEach(function(output) {
    var script = output.script;
    var index = output.n;
    text += '' + '{|}' + '' + script + '\n';
  });

  return text;
};

blockchain._formatBlock = function(block, cols) {
  var text = '';

  if (termcoin.config.localBlockchain) {
    block = transforms.block.bcoinToInfo(block);
  }

  block.fee = coined.utils.ntoBTC(block.fee);

  if (block.tx.length) {
    block.reward = block.tx[0].out.reduce(function(total, output) {
      return total + +output.value;
    }, 0);
    block.reward = coined.utils.ntoBTC(block.reward);
  } else {
    block.reward = '0';
  }

  block.output_total = block.tx.reduce(function(total, tx) {
    return total + tx.out.reduce(function(total, output) {
      return total + +output.value;
    }, 0);
  }, 0);
  block.output_total = coined.utils.ntoBTC(block.output_total);

  block.est_total = block.tx.reduce(function(total, tx) {
    var outputs = tx.out.slice(0, tx.out.length > 1 ? -1 : 1);
    return total + outputs.reduce(function(total, output) {
      return total + +output.value;
    }, 0);
  }, 0);
  block.est_total = coined.utils.ntoBTC(block.est_total);

  var suffix = '';
  if (this.lastBlock && block.hash == this.lastBlock.hash) {
    suffix = ' {green-fg}(last block){/green-fg}';
  }

  text += '{blue-fg}Block{/blue-fg}'
    + '{|}' + '{/}{bold}#' + block.height + suffix + '{/bold}\n';
  text += '{|}'
    + '(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)\n';

  text += '{blue-fg}Hashes{/blue-fg}\n';
  text += '{blue-fg}Hash:{/blue-fg}'
    + '{|}' + '{green-fg}' + block.hash + '{/green-fg}\n';
  text += '{blue-fg}Previous Block:{/blue-fg}'
    + '{|}' + '{green-fg}' + block.prev_block + '{/green-fg}\n';
  if (block.next_block) {
    text += '{blue-fg}Next Block:{/blue-fg}'
      + '{|}' + '{green-fg}' + block.next_block + '{/green-fg}\n';
  }
  text += '{blue-fg}Merkle Root:{/blue-fg}'
    + '{|}' + '{green-fg}' + block.mrkl_root + '{/green-fg}\n';

  text += '\n';

  text += '{blue-fg}Summary:{/blue-fg}\n';
  text += '{blue-fg}Transactions:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + block.n_tx + '{/yellow-fg}\n';
  text += '{blue-fg}Output Total:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + block.output_total + '{/yellow-fg}\n';
  //text += '{blue-fg}Est. TX Volume:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + block.est_tx_volume + '{/yellow-fg}\n';
  text += '{blue-fg}TX Fees:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.fee + '{/yellow-fg}\n';
  text += '{blue-fg}Height:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.height + '{/yellow-fg}\n';
  text += '{blue-fg}Timestamp:{/blue-fg}' + '{|}' + '{green-fg}' + (new Date(block.time * 1000).toISOString()) + '{/yellow-fg}\n';
  if (block.received_time) {
    text += '{blue-fg}Received Time:{/blue-fg}' + '{|}' + '{green-fg}' + (new Date(block.received_time * 1000).toISOString()) + '{/yellow-fg}\n';
  }
  text += '{blue-fg}Relayed By:{/blue-fg}' + '{|}' + '{green-fg}' + block.relayed_by + '{/green-fg}\n';
  //text += '{blue-fg}Difficulty:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.difficulty + '{/yellow-fg}\n';
  text += '{blue-fg}Bits:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.bits + '{/yellow-fg}\n';
  text += '{blue-fg}Size:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.size + '{/yellow-fg}\n';
  text += '{blue-fg}Version:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.ver + '{/yellow-fg}\n';
  text += '{blue-fg}Nonce:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.nonce + '{/yellow-fg}\n';
  text += '{blue-fg}Reward:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.reward + '{/yellow-fg}\n';

  text += '\n';

  text += '{bold}Transactions{/bold}\n';

  block.tx.forEach(function(tx) {
    var iaddr = tx.inputs[0].prev_out
      ? tx.inputs[0].prev_out.addr
      : 'Coinbase';

    var oaddr = tx.out[0].addr;

    var ival = tx.inputs.reduce(function(total, input) {
      if (!input.prev_out) return total;
      return total + +input.prev_out.value;
    }, 0);
    ival = coined.utils.ntoBTC(ival);

    var oval = tx.out.reduce(function(total, output) {
      return total + +output.value;
    }, 0);
    oval = coined.utils.ntoBTC(oval);

    text += '{cyan-fg}' + iaddr + '{/cyan-fg}...'
      + ' {red-fg}{bold}-' + ival + '{/bold}{/red-fg} ->'
      + '{|}'
      + '{cyan-fg}' + oaddr + '{/cyan-fg}...'
      + ' {green-fg}{bold}+' + oval + '{/bold}{/green-fg}\n';
  });

  return text;
};

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
