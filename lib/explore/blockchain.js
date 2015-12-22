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
    return termcoin.bitcoin.getTransactionWithBlock(id, block, function(err, tx, block) {
      if (err) return callback(err);
      tx = transforms.tx.libbitcoindToInfo(tx, block);
      if (block) {
        block = transforms.block.libbitcoindToInfo(block);
      }
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

  if (!termcoin.config.localBlockchain) {
    addr = transforms.addr.infoToBcoin(addr);
  }

  var total_received = bcoin.utils.toBTC(addr.received);
  var total_sent = bcoin.utils.toBTC(addr.sent);
  var final_balance = bcoin.utils.toBTC(addr.balance);

  text += '{blue-fg}Address{/blue-fg}'
    + '{|}' + '{bold}' + addr.address + '{/bold}\n';
  text += '{|}' + '(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)\n';
  text += '{blue-fg}Hash160{/blue-fg}'
    + '{|}' + '{green-fg}' + addr.hash + '{/green-fg}\n';
  text += '{blue-fg}Total Transactions:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + addr.txs.length + '{/yellow-fg}\n';
  text += '{blue-fg}Total Received:{/blue-fg}'
    + '{|}' + '{green-fg}+' + total_received + '{/green-fg}\n';
  text += '{blue-fg}Total Sent:{/blue-fg}'
    + '{|}' + '{red-fg}-' + total_sent + '{/red-fg}\n';
  text += '{blue-fg}Final Balance:{/blue-fg}'
    + '{|}' + '{yellow-fg}{bold}' + final_balance + '{/bold}{/yellow-fg}\n';

  text += '\n';

  addr.txs.forEach(function(tx) {
    var sent = !!tx.inputs.filter(function(input) {
      var prev = input.out;
      if (+prev.hash === 0) return;
      var data = bcoin.tx.getInputData(input);
      return data.addr === addr.address;
    })[0];

    var received = !!tx.outputs.filter(function(output) {
      return bcoin.tx.getOutputData(output).addr === addr.address;
    })[0];

    var stotal = tx.inputs.reduce(function(total, input) {
      var prev = input.out;
      if (+prev.hash === 0) return total;
      var data = bcoin.tx.getInputData(input);
      if (data.addr !== addr.address) return total;
      return total + prev.value.toNumber();
    }, 0);
    stotal = bcoin.utils.toBTC(stotal);

    var rtotal = tx.outputs.reduce(function(total, output) {
      var data = bcoin.tx.getOutputData(output);
      if (data.addr !== addr.address) return total;
      return total + output.value.toNumber();
    }, 0);
    rtotal = bcoin.utils.toBTC(rtotal);

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
        + '{|}' + '{green-fg}' + tx.rhash + '{/green-fg}\n';
    }

    var ts = new Date(tx.ts * 1000).toISOString();
    if (sent) {
      text += '{blue-fg}{bold}Sent{/bold}{/blue-fg} (' + ts + ')'
        + '{|}' + '{bold}{red-fg}-' + stotal + '{/red-fg}{/bold}\n';
      text += '{white-fg}' + addr.address + '{/white-fg}\n';
      tx.outputs.forEach(function(output) {
        var data = bcoin.tx.getOutputData(output);
        var address = '{cyan-fg}' + data.addr + '{/cyan-fg}';
        if (data.addr === addr.address) {
          address = address.replace(/cyan/g, 'white');
        }
        text += '{|}' + '{red-fg}{bold}'
          + bcoin.utils.toBTC(output.value) + ' -> {/bold}{/red-fg}'
          + address
          + '\n';
      });
    } else if (received) {
      text += '{blue-fg}{bold}Received{/bold}{/blue-fg} (' + ts + ')'
        + '{|}' + '{bold}{green-fg}+' + rtotal + '{/green-fg}{/bold}\n';
      text += '{|}' + '{white-fg}' + addr.address + '{/white-fg}\n';
      tx.inputs.forEach(function(input) {
        var prev = input.out;
        var data;
        if (+prev.hash === 0) {
          data = {
            addr: 'Coinbase'
          };
          prev = {
            value: new bn(0)
          };
        } else {
          data = bcoin.tx.getInputData(input);
        }
        var address = '{cyan-fg}' + prev.addr + '{/cyan-fg}';
        if (prev.addr === addr.address) {
          address = address.replace(/cyan/g, 'white');
        }
        text += address
         + '{green-fg}{bold} ' + bcoin.utils.toBTC(prev.value)
         + ' ->{/bold}{/green-fg}\n';
      });
    }

    text += '\n';
  });

  return text;
};

blockchain._formatTX = function(tx, block, cols) {
  var text = '';

  // XXX MOVE TO BLOCKCHAIN FUNCTIONS
  if (!termcoin.config.localBlockchain) {
    tx = transforms.tx.infoToBcoin(tx, block);
  }

  tx.coinbase = bcoin.tx.getInputData(tx.inputs[0]).addr === 'Coinbase';

  tx.input_total = tx.inputs.reduce(function(total, input) {
    var prev = bcoin.tx.getInputData(input);
    return total + prev.value.toNumber();
  }, 0);
  tx.input_total = bcoin.utils.toBTC(tx.input_total);

  tx.output_total = tx.outputs.reduce(function(total, output) {
    return total + output.value.toNumber();
  }, 0);
  tx.output_total = bcoin.utils.toBTC(tx.output_total);

  var outputs = tx.outputs.slice(0, tx.outputs.length > 1 ? -1 : 1);
  tx.est_total = outputs.reduce(function(total, output) {
    return total + output.value.toNumber();
  }, 0);
  tx.est_total = bcoin.utils.toBTC(tx.est_total);

/*
  tx.confirmations = tx.confirmations || 0;
  if (tx.confirmations === 0 || tx.confirmations === -1) {
    if (tx.height >= 0) {
      if (blockchain.lastBlock) {
        tx.confirmations = blockchain.lastBlock.height - tx.height + 1;
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
          height: tx.height
        };
        if (tx.confirmations === 0 || tx.confirmations === -1) {
          tx.confirmations = index.heights[index.heights.length - 1] - block.height + 1;
        }
      }
    }
    if (termcoin.bitcoin.coin.blockHeight && tx.height >= 0) {
      if (tx.confirmations === 0 || tx.confirmations === -1) {
        tx.confirmations = termcoin.bitcoin.coin.blockHeight - tx.height + 1;
      }
    }
  }
*/

  text += '{blue-fg}Transaction:{/blue-fg}'
    + '{|}' + '{bold}' + tx.rhash + '{/bold}\n';
  text += '{|}'
    + '(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)\n';
  if (typeof tx.mine === 'boolean') {
    text += '{blue-fg}Is Mine:{/blue-fg}'
      + '{|}' + '{yellow-fg}' + (tx.mine ? 'Yes' : 'No') + '{/yellow-fg}\n';
  }
  text += '{blue-fg}Block:{/blue-fg}'
    + '{|}' + '{green-fg}' + (block ? block.rhash : (tx.rblock || Array(64 + 1).join('0')))
    + '{/green-fg}\n';
  text += '{blue-fg}Version:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + tx.version + '{/yellow-fg}\n';
  text += '{blue-fg}Size:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + tx._size + '{/yellow-fg}\n';
  text += '\n';

  if (tx.doubleSpend) {
    text += '{blue-fg}Note:{/blue-fg}'
      + '{|}' + '{bold}Double Spend!{/bold}\n';
  }

  text += '{blue-fg}Block Height:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + (tx.height || -1) + '{/yellow-fg}\n';
  text += '{blue-fg}Confirmations:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + tx.confirmations + '{/yellow-fg}\n';
  text += '{blue-fg}Timestamp:{/blue-fg}'
    + '{|}' + '{green-fg}' + new Date(tx.ts * 1000).toISOString()
    + '{/green-fg}\n';
  text += '{blue-fg}Estimated Transacted:{/blue-fg}' + '{|}' + ''
    + '{yellow-fg}{bold}' + tx.est_total + '{/bold}{/yellow-fg}\n';
  text += '{blue-fg}Relayed By:{/blue-fg}'
    + '{|}' + '{green-fg}' + (tx.relayedBy) + '{/green-fg}\n';

  text += '\n';

  text += 'Senders:'
    + '{|}' + '{green-fg}(total: ' + tx.inputs.length + '){/green-fg}\n';
  if (tx.coinbase) {
    text += '{cyan-fg}Coinbase{/cyan-fg} {green-fg}->{/green-fg}' + '{|}' + ''
      + '{green-fg}{bold}+' + tx.output_total + '{/bold}{/green-fg}\n';
  } else {
    text += '{|}' + '{red-fg}{bold}-' + tx.input_total + '{/bold}{/red-fg}\n';
    tx.inputs.forEach(function(input) {
      var script = input.script || '';
      var data = bcoin.tx.getInputData(input);
      var value = bcoin.utils.toBTC(data.value);
      text += '{cyan-fg}' + data.addr + '{/cyan-fg}'
        + ' {red-fg}{bold}-' + value + '{/bold}{/red-fg}\n';
    });
  }

  text += '\n';

  text += 'Recipients:'
    + '{|}' + '{green-fg}(total: ' + tx.outputs.length + '){/green-fg}\n';
  text += '{|}'
    + '{green-fg}{bold}+' + tx.output_total + '{/bold}{/green-fg}\n';
  tx.outputs.forEach(function(output) {
    var script = output.script;
    var data = bcoin.tx.getOutputData(output);
    var addr = data.addr;
    var value = bcoin.utils.toBTC(output.value);
    text += '{cyan-fg}' + addr + '{/cyan-fg}'
      + ' {green-fg}{bold}+' + value + '{/bold}{/green-fg}\n';
  });

  text += '\n';
  text += 'Input Scripts:\n';
  tx.inputs.forEach(function(input, i) {
    var prev = input.out;
    var script, data;

    if (+prev.hash === 0) {
      script = input.script || '';
      prev = {
        addr: 'Coinbase',
        value: new bn(0),
        index: 0
      };
      data = {
        addr: 'Coinbase'
      };
    } else {
      data = bcoin.tx.getInputData(input);
      script = blockchain._formatScript(input.script || '').replace(/ /g, '\n');
    }

    var type = prev.type;
    var index = prev.index;

    text += script;

    script = bcoin.script.decode(bcoin.utils.toArray(input.script, 'hex'));
    if (bcoin.script.isScripthashInput(script)) {
      text += '\n{bold}{grey-fg}redeem({{/grey-fg}{/bold}'
        + blockchain._formatScript(script[script.length - 1])
        + '{bold}{grey-fg}}){/grey-fg}{/bold}';
    }

    text += '\n';
    if (i !== tx.inputs.length - 1)
      text += '---\n';
  });

  text += '\n';
  text += 'Output Scripts:\n';
  tx.outputs.forEach(function(output, i) {
    var script = blockchain._formatScript(output.script);
    var index = output.index;
    text += script + '\n';
    if (i !== tx.outputs.length - 1)
      text += '---\n';
  });

  return text;
};

blockchain._formatScript = function(script) {
  if (typeof script === 'string')
    script = bcoin.utils.toArray(script, 'hex');
  script = bcoin.script.decode(script);
  return bcoin.script.format(script).join(' | ');
};

blockchain._formatBlock = function(block, cols) {
  var text = '';

  if (!termcoin.config.localBlockchain) {
    block = transforms.block.infoToBcoin(block);
  }

  block.fee = coined.utils.toBTC(block.fee);

  if (block.tx.length) {
    block.reward = block.txs[0].outputs.reduce(function(total, output) {
      return total + output.value.toNumber();
    }, 0);
    block.reward = bcoin.utils.toBTC(block.reward);
  } else {
    block.reward = '0.00';
  }

  block.output_total = block.txs.reduce(function(total, tx) {
    return total + tx.outputs.reduce(function(total, output) {
      return total + output.value.toNumber();
    }, 0);
  }, 0);
  block.output_total = bcoin.utils.toBTC(block.output_total);

  block.est_total = block.txs.reduce(function(total, tx) {
    var outputs = tx.outputs.slice(0, tx.outputs.length > 1 ? -1 : 1);
    return total + outputs.reduce(function(total, output) {
      return total + output.value.toNumber();
    }, 0);
  }, 0);
  block.est_total = bcoin.utils.toBTC(block.est_total);

  var suffix = '';
  if (this.lastBlock && block.rhash == this.lastBlock.hash) {
    suffix = ' {green-fg}(last block){/green-fg}';
  }

  text += '{blue-fg}Block{/blue-fg}'
    + '{|}' + '{/}{bold}#' + block.height + suffix + '{/bold}\n';
  text += '{|}'
    + '(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)\n';

  text += '{blue-fg}Hashes{/blue-fg}\n';
  text += '{blue-fg}Hash:{/blue-fg}'
    + '{|}' + '{green-fg}' + block.rhash + '{/green-fg}\n';
  text += '{blue-fg}Previous Block:{/blue-fg}'
    + '{|}' + '{green-fg}' + block.prevBlock + '{/green-fg}\n';
  if (block.nextBlock) {
    text += '{blue-fg}Next Block:{/blue-fg}'
      + '{|}' + '{green-fg}' + block.nextBlock + '{/green-fg}\n';
  }
  text += '{blue-fg}Merkle Root:{/blue-fg}'
    + '{|}' + '{green-fg}' + block.merkleRoot + '{/green-fg}\n';

  text += '\n';

  text += '{blue-fg}Summary:{/blue-fg}\n';
  text += '{blue-fg}Transactions:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + block.txs.length + '{/yellow-fg}\n';
  text += '{blue-fg}Output Total:{/blue-fg}'
    + '{|}' + '{yellow-fg}' + block.output_total + '{/yellow-fg}\n';
  // text += '{blue-fg}Est. TX Volume:{/blue-fg}'
  // + '{|}' + '{yellow-fg}' + block.est_tx_volume + '{/yellow-fg}\n';
  text += '{blue-fg}TX Fees:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.fee + '{/yellow-fg}\n';
  text += '{blue-fg}Height:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.height + '{/yellow-fg}\n';
  text += '{blue-fg}Timestamp:{/blue-fg}' + '{|}' + '{green-fg}' + (new Date(block.ts * 1000).toISOString()) + '{/yellow-fg}\n';
  if (block.receivedTime) {
    text += '{blue-fg}Received Time:{/blue-fg}' + '{|}' + '{green-fg}' + (new Date(block.receivedTime * 1000).toISOString()) + '{/yellow-fg}\n';
  }
  text += '{blue-fg}Relayed By:{/blue-fg}' + '{|}' + '{green-fg}'
    + (block.relayedBy) + '{/green-fg}\n';
  if (block.difficulty) {
    text += '{blue-fg}Difficulty:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.difficulty + '{/yellow-fg}\n';
  }
  text += '{blue-fg}Bits:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.bits + '{/yellow-fg}\n';
  text += '{blue-fg}Size:{/blue-fg}' + '{|}' + '{yellow-fg}' + block._size + '{/yellow-fg}\n';
  text += '{blue-fg}Version:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.version + '{/yellow-fg}\n';
  text += '{blue-fg}Nonce:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.nonce + '{/yellow-fg}\n';
  text += '{blue-fg}Reward:{/blue-fg}' + '{|}' + '{yellow-fg}' + block.reward + '{/yellow-fg}\n';

  text += '\n';

  text += '{bold}Transactions{/bold}\n';

  block.txs.forEach(function(tx) {
    var iaddr = bcoin.tx.getInputData(tx.inputs[0]).addr;
    var oaddr = bcoin.tx.getOutputData(tx.outputs[0]).addr;

    var ival = tx.inputs.reduce(function(total, input) {
      var data = bcoin.tx.getInputData(input);
      return total + data.value.toNumber();
    }, 0);
    ival = bcoin.utils.toBTC(ival);

    var oval = tx.outputs.reduce(function(total, output) {
      return total + output.value.toNumber();
    }, 0);
    oval = bcoin.utils.toBTC(oval);

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
