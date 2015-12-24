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
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getBlock(id, callback);
  }
  return this.request(['rawblock', id], function(err, block) {
    if (err) return callback(err);
    return self.getBlockHeight(block.height + 1, function(err, next) {
      if (next) block.next_block = next.hash;
      block = transforms.block.infoToBcoin(block);
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
    var block = blocks[blocks.length - 1];
    block = transforms.block.infoToBcoin(block);
    return callback(null, block);
  });
};

blockchain.getTransaction = function(id, block, callback) {
  var self = this;
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getTransaction(id, block, callback);
  }
  return this.request(['rawtx', id + '?scripts=true'], function(err, tx) {
    if (err) return callback(err);
    tx = transforms.tx.infoToBcoin(tx);
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
    addr = transforms.addr.infoToBcoin(addr);
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
      block = transforms.block.infoToBcoin(block);
      self.lastBlock = block;
      return callback(null, block);
    });
  });
};

blockchain.getRawBlock = function(id, callback) {
  var self = this;
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getBlock(id, callback);
  }
  return this.request(['rawblock', id + '?format=hex'], function(err, block) {
    if (err) return callback(err);
    var data = bcoin.utils.toArray(block, 'hex');
    while (data.length < 81) data.push(0);
    block = blockchain.parser.parseBlock(data);
    block = bcoin.block(block, 'block');
    block._hash = block.hash;
    return callback(null, block);
  });
};

blockchain.getRawTransaction = function(id, block, callback) {
  var self = this;
  if (termcoin.config.localBlockchain) {
    return termcoin.bitcoin.coin.getTransaction(id, block, callback);
  }
  return this.request(['rawtx', id + '?format=hex'], false, function(err, tx) {
    if (err) return callback(err);
    var data = bcoin.utils.toArray(tx, 'hex');
    tx = blockchain.parser.parseTX(data);
    tx = bcoin.tx(tx);
    return callback(null, tx, block);
  });
};

blockchain._formatAddr = function(addr, cols) {
  var text = '';

  var total_received = bcoin.utils.toBTC(addr.received);
  var total_sent = bcoin.utils.toBTC(addr.sent);
  var final_balance = bcoin.utils.toBTC(addr.balance);

  text += '{blue-fg}Address{/blue-fg}'
    + '{|}'
    + '{bold}' + addr.address + '{/bold}\n';
  text += '{|}' + '(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)\n';
  text += '{blue-fg}Hash160{/blue-fg}'
    + '{|}'
    + '{green-fg}' + addr.hash + '{/green-fg}\n';
  text += '{blue-fg}Total Transactions:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + addr.txs.length + '{/yellow-fg}\n';
  text += '{blue-fg}Total Received:{/blue-fg}'
    + '{|}'
    + '{green-fg}+' + total_received + '{/green-fg}\n';
  text += '{blue-fg}Total Sent:{/blue-fg}'
    + '{|}'
    + '{red-fg}-' + total_sent + '{/red-fg}\n';
  text += '{blue-fg}Final Balance:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}{bold}' + final_balance + '{/bold}{/yellow-fg}\n';

  text += '\n';

  addr.txs.forEach(function(tx) {
    var sent = !!tx.inputs.filter(function(input) {
      return input.addr === addr.address;
    })[0];

    var received = !!tx.outputs.filter(function(output) {
      return output.addr === addr.address;
    })[0];

    var stotal = tx.inputs.reduce(function(total, input) {
      if (input.addr !== addr.address) return total;
      return total + input.value.toNumber();
    }, 0);
    stotal = bcoin.utils.toBTC(stotal);

    var rtotal = tx.outputs.reduce(function(total, output) {
      if (output.addr !== addr.address) return total;
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
        var address = '{cyan-fg}' + output.addr + '{/cyan-fg}';
        if (output.addr === addr.address) {
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
        var address = '{cyan-fg}' + input.addr + '{/cyan-fg}';
        if (input.addr === addr.address) {
          address = address.replace(/cyan/g, 'white');
        }
        text += address
         + '{green-fg}{bold} ' + bcoin.utils.toBTC(input.value)
         + ' ->{/bold}{/green-fg}\n';
      });
    }

    text += '\n';
  });

  return text;
};

blockchain._formatTX = function(tx, block, cols) {
  var text = '';

  tx.input_total = tx.inputs.reduce(function(total, input) {
    return total + input.value.toNumber();
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

  text += '{blue-fg}Transaction:{/blue-fg}'
    + '{|}'
    + '{bold}' + tx.rhash + '{/bold}\n';
  text += '{|}'
    + '(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)\n';
  if (tx.mine != null) {
    text += '{blue-fg}Is Mine:{/blue-fg}'
      + '{|}'
      + '{yellow-fg}' + (tx.mine ? 'Yes' : 'No') + '{/yellow-fg}\n';
  }
  text += '{blue-fg}Block:{/blue-fg}'
    + '{|}'
    + '{green-fg}' + (block ? block.rhash : (tx.rblock || Array(64 + 1).join('0')))
    + '{/green-fg}\n';
  text += '{blue-fg}Version:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + tx.version + '{/yellow-fg}\n';
  text += '{blue-fg}Size:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + tx._size + '{/yellow-fg}\n';
  text += '\n';

  if (tx.doubleSpend) {
    text += '{blue-fg}Note:{/blue-fg}'
      + '{|}'
      + '{bold}Double Spend!{/bold}\n';
  }

  text += '{blue-fg}Block Height:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + (tx.height || -1) + '{/yellow-fg}\n';
  text += '{blue-fg}Confirmations:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + tx.confirmations + '{/yellow-fg}\n';
  text += '{blue-fg}Timestamp:{/blue-fg}'
    + '{|}'
    + '{green-fg}' + new Date(tx.ts * 1000).toISOString() + '{/green-fg}\n';
  text += '{blue-fg}Estimated Transacted:{/blue-fg}' + '{|}' + ''
    + '{yellow-fg}{bold}' + tx.est_total + '{/bold}{/yellow-fg}\n';
  text += '{blue-fg}Relayed By:{/blue-fg}'
    + '{|}'
    + '{green-fg}' + (tx.relayedBy) + '{/green-fg}\n';

  text += '\n';

  text += 'Senders:'
    + '{|}'
    + '{green-fg}(total: ' + tx.inputs.length + '){/green-fg}\n';
  if (tx.inputs[0].type === 'coinbase') {
    text += '{cyan-fg}' + tx.inputs[0].addr
      + '{/cyan-fg} {green-fg}->{/green-fg}'
      + '{|}'
      + '{green-fg}{bold}+' + tx.output_total + '{/bold}{/green-fg}\n';
  } else {
    text += '{|}' + '{red-fg}{bold}-' + tx.input_total + '{/bold}{/red-fg}\n';
    tx.inputs.forEach(function(input) {
      var value = bcoin.utils.toBTC(input.value);
      text += '{cyan-fg}' + input.addr + '{/cyan-fg}'
        + ' {red-fg}{bold}-' + value + '{/bold}{/red-fg}\n';
    });
  }

  text += '\n';

  text += 'Recipients:'
    + '{|}'
    + '{green-fg}(total: ' + tx.outputs.length + '){/green-fg}\n';
  text += '{|}'
    + '{green-fg}{bold}+' + tx.output_total + '{/bold}{/green-fg}\n';
  tx.outputs.forEach(function(output) {
    var value = bcoin.utils.toBTC(output.value);
    text += '{cyan-fg}' + output.addr + '{/cyan-fg}'
      + ' {green-fg}{bold}+' + value + '{/bold}{/green-fg}\n';
  });

  text += '\n';
  text += 'Input Scripts:\n';
  tx.inputs.forEach(function(input, i) {
    text += blockchain._formatScript(input.script || '').replace(/ /g, '\n');

    if (input.type === 'coinbase') {
      text += '\n{bold}{grey-fg}(text: {/grey-fg}{/bold}'
        + input.text
        + '{bold}{grey-fg}){/grey-fg}{/bold}';
    }

    if (input.type === 'scripthash') {
      s = bcoin.script.decode(input.script[input.script.length - 1]);
      text += '\n{bold}{grey-fg}redeem({{/grey-fg}{/bold}'
        + blockchain._formatScript(s)
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
    text += script + '\n';
    if (i !== tx.outputs.length - 1)
      text += '---\n';
  });

  return text;
};

blockchain._formatScript = function(script) {
  return bcoin.script.format(script).join(' | ');
};

blockchain._formatBlock = function(block, cols) {
  var text = '';

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
  if (this.lastBlock && block.rhash === this.lastBlock.rhash) {
    suffix = ' {green-fg}(last block){/green-fg}';
  }

  text += '{blue-fg}Block{/blue-fg}'
    + '{|}'
    + '{/}{bold}#' + block.height + suffix + '{/bold}\n';
  text += '{|}'
    + '(press {blue-bg}{bold} ? {/bold}{/blue-bg} to list keybinds)\n';

  text += '{blue-fg}Hashes{/blue-fg}\n';
  text += '{blue-fg}Hash:{/blue-fg}'
    + '{|}' + '{green-fg}' + block.rhash + '{/green-fg}\n';
  text += '{blue-fg}Previous Block:{/blue-fg}'
    + '{|}'
    + '{green-fg}' + bcoin.utils.revHex(block.prevBlock) + '{/green-fg}\n';
  if (block.nextBlock) {
    text += '{blue-fg}Next Block:{/blue-fg}'
      + '{|}'
      + '{green-fg}' + bcoin.utils.revHex(block.nextBlock) + '{/green-fg}\n';
  }
  text += '{blue-fg}Merkle Root:{/blue-fg}'
    + '{|}'
    + '{green-fg}' + block.merkleRoot + '{/green-fg}\n';

  text += '\n';

  text += '{blue-fg}Summary:{/blue-fg}\n';
  text += '{blue-fg}Transactions:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + block.txs.length + '{/yellow-fg}\n';
  text += '{blue-fg}Output Total:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + block.output_total + '{/yellow-fg}\n';
  // text += '{blue-fg}Est. TX Volume:{/blue-fg}'
  // + '{|}'
  // + '{yellow-fg}' + block.est_tx_volume + '{/yellow-fg}\n';
  text += '{blue-fg}TX Fees:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + bcoin.utils.btc(block.fee) + '{/yellow-fg}\n';
  text += '{blue-fg}Height:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + block.height + '{/yellow-fg}\n';
  text += '{blue-fg}Timestamp:{/blue-fg}'
    + '{|}'
    + '{green-fg}'
    + (new Date(block.ts * 1000).toISOString())
    + '{/yellow-fg}\n';
  if (block.receivedTime) {
    text += '{blue-fg}Received Time:{/blue-fg}'
      + '{|}'
      + '{green-fg}'
      + (new Date(block.receivedTime * 1000).toISOString())
      + '{/yellow-fg}\n';
  }
  text += '{blue-fg}Relayed By:{/blue-fg}'
    + '{|}'
    + '{green-fg}' + (block.relayedBy) + '{/green-fg}\n';
  if (block.difficulty) {
    text += '{blue-fg}Difficulty:{/blue-fg}'
      + '{|}'
      + '{yellow-fg}' + block.difficulty + '{/yellow-fg}\n';
  }
  text += '{blue-fg}Bits:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + block.bits + '{/yellow-fg}\n';
  text += '{blue-fg}Size:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + block._size + '{/yellow-fg}\n';
  text += '{blue-fg}Version:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + block.version + '{/yellow-fg}\n';
  text += '{blue-fg}Nonce:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + block.nonce + '{/yellow-fg}\n';
  text += '{blue-fg}Reward:{/blue-fg}'
    + '{|}'
    + '{yellow-fg}' + bcoin.utils.btc(block.reward) + '{/yellow-fg}\n';

  if (block.txs[0].inputs[0].type === 'coinbase') {
    text += '{blue-fg}Coinbase:{/blue-fg}'
      + '{|}'
      + '{yellow-fg}' + block.txs[0].inputs[0].text + '{/yellow-fg}\n';
  }

  text += '\n';

  text += '{bold}Transactions{/bold}\n';

  block.txs.forEach(function(tx) {
    var iaddr = tx.inputs[0].addr;
    var oaddr = tx.outputs[0].addr;

    var ival = tx.inputs.reduce(function(total, input) {
      return total + input.value.toNumber();
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
