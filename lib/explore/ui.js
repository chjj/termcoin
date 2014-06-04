/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

/**
 * Dependencies
 */

var blessed = require('blessed')
  , coined = require('coined')
  , bcoin = coined.bcoin
  , bn = coined.bn;

/**
 * Load
 */

var termcoin = require('../')
  , utils = termcoin.utils
  , config = termcoin.config
  , mock = termcoin.mock
  , bitcoin = termcoin.bitcoin
  , opt = config.opt
  , platform = config.platform
  , blockchain = require('./blockchain');

/**
 * Blockchain Explorer
 */

var screen = termcoin.screen;
var tabs = screen._.tabs;

tabs.explore.on('focus', function() {
  tabs.explore._.data.focus();
});

tabs.explore._.data = blessed.box({
  parent: tabs.explore,
  top: 0,
  left: 3,
  right: 0,
  bottom: 0,
  content: '',
  scrollable: true,
  alwaysScroll: true,
  tags: true,
  keys: true,
  vi: true,
  mouse: true,
  style: {
    scrollbar: {
      inverse: true
    }
  },
  scrollbar: {
    ch: ' '
  }
});

tabs.explore._.view = function(id) {
  if (typeof id === 'object') {
    tabs.explore._._data = id;
  } else {
    tabs.explore._._lookup = id;
  }
  screen._.bar.selectTab(7);
};

tabs.explore._.displayBlock = function(block) {
  if (!block) return;
  var text = blockchain._formatBlock(block, tabs.explore._.data.width);
  tabs.explore._.data.setScroll(0);
  tabs.explore._.data.setContent(text);
  tabs.explore._.block = block;
  delete tabs.explore._.tx;
  delete tabs.explore._.addr;
  tabs.explore._.displayed = block;
  return screen.render();
};

tabs.explore._.displayTX = function(tx, block) {
  if (!tx) return;
  var text = blockchain._formatTX(tx, block, tabs.explore._.data.width);
  tabs.explore._.data.setScroll(0);
  tabs.explore._.data.setContent(text);
  tabs.explore._.tx = tx;
  delete tabs.explore._.addr;
  tabs.explore._.displayed = tx;
  return screen.render();
};

tabs.explore._.displayAddr = function(addr) {
  if (!addr) return;
  var text = blockchain._formatAddr(addr, tabs.explore._.data.width);
  tabs.explore._.data.setScroll(0);
  tabs.explore._.data.setContent(text);
  tabs.explore._.addr = addr;
  tabs.explore._.displayed = addr;
  return screen.render();
};

tabs.explore._.lookup = function(value) {
  var block = tabs.explore._.block
    , tx = tabs.explore._.tx
    , addr = tabs.explore._.addr
    , type
    , parts;

  parts = value.split('/');
  if (parts.length > 1) {
    type = parts[0];
    value = parts[1];
  }

  if (type === 'addr' || (!type && coined.isAddress(value))) {
    screen._.loader.load('Loading... (press {blue-bg}{bold} ? {/bold}{/blue-bg} for help)');
    return blockchain.getAddressTransactions(value, function(err, addr) {
      screen._.loader.stop();
      if (err) return screen._.msg.error(err.message);
      return tabs.explore._.displayAddr(addr);
    });
  }

  if (type === 'block' || (!type && value.indexOf('000') === 0 && value.length === 64)) {
    screen._.loader.load('Loading... (press {blue-bg}{bold} ? {/bold}{/blue-bg} for help)');
    return blockchain.getBlock(value, function(err, block) {
      screen._.loader.stop();
      if (err) return screen._.msg.error(err.message);
      return tabs.explore._.displayBlock(block);
    });
  }

  if (type === 'index' || (!type && /^[0-9]{1,7}$/.test(value))) {
    screen._.loader.load('Loading... (press {blue-bg}{bold} ? {/bold}{/blue-bg} for help)');
    return blockchain.getBlockHeight(value, function(err, block) {
      screen._.loader.stop();
      if (err) return screen._.msg.error(err.message);
      return tabs.explore._.displayBlock(block);
    });
  }

  if (type === 'tx' || !type) {
    screen._.loader.load('Loading... (press {blue-bg}{bold} ? {/bold}{/blue-bg} for help)');
    return blockchain.getTransaction(value, block, function(err, tx) {
      screen._.loader.stop();
      if (err) return screen._.msg.error(err.message);
      return tabs.explore._.displayTX(tx);
    });
  }
};

tabs.explore._.lastBlock = function() {
  screen._.loader.load('Loading... (press {blue-bg}{bold} ? {/bold}{/blue-bg} for help)');
  return blockchain.getLastBlock(function(err, block) {
    screen._.loader.stop();
    if (err) return screen._.msg.error(err.message);
    return tabs.explore._.displayBlock(block);
  });
};

tabs.explore._.setTitle = function(type) {
  var block = tabs.explore._.block
    , tx = tabs.explore._.tx
    , addr = tabs.explore._.addr
    , picker = screen._.picker;

  if (addr) {
    picker.setLabel(' ' + type + ' for ' + addr.address.slice(0, 10) + ' ');
  } else if (tx) {
    picker.setLabel(' ' + type + ' for ' + tx.hash.slice(0, 10) + ' ');
  } else if (block) {
    picker.setLabel(' ' + type + ' for '
      + block.hash.replace(/^0+/g, '').slice(0, 10)
      + ' ');
  }
};

tabs.explore._.clearTitle = function() {
  screen._.picker.removeLabel();
  screen.render();
};

tabs.explore._.data.on('focus', function() {
  var lookup, data;

  if (config.currency !== 'bitcoin') {
    tabs.explore._.data.setContent(
      'Blockchain explorer not supported'
      + ' for currencies other than Bitcoin.');
    return screen.render();
  }

  if (tabs.explore._._lookup) {
    lookup = tabs.explore._._lookup;
    tabs.explore._.lookup(lookup);
    delete tabs.explore._._lookup;
  } else if (tabs.explore._._data) {
    data = tabs.explore._._data;
    delete tabs.explore._._data;
    if (data.type === 'block') {
      tabs.explore._.block = data.value;
      tabs.explore._.displayBlock(tabs.explore._.block);
    } else if (data.type === 'tx') {
      tabs.explore._.tx = data.value;
      tabs.explore._.displayTX(tabs.explore._.tx);
    } else if (data.type === 'addr') {
      tabs.explore._.addr = data.value;
      tabs.explore._.displayAddr(tabs.explore._.block);
    }
  }

  if (tabs.explore._.init) {
    return;
  }

  tabs.explore._.init = true;

  if (!lookup && !data) {
    tabs.explore._.lastBlock();
  }

  function refresh(callback) {
    var displayed = tabs.explore._.displayed;
    // if (displayed && displayed._noRefresh) {
    //   delete displayed._noRefresh;
    if (displayed && displayed._transformed) {
      ;
    } else if (displayed) {
      screen._.loader.load('Refreshing...');

      if (displayed.mrkl_root) {
        return blockchain.getBlock(displayed.hash, function(err, block) {
          tabs.explore._.displayBlock(block);
          return blockchain.getLastBlock(function() {
            screen._.loader.stop();
            if (callback) callback();
          });
        });
      }

      if (displayed.inputs) {
        return blockchain.getTransaction(displayed.hash, tabs.explore._.block, function(err, tx) {
          tabs.explore._.displayTX(tx, tabs.explore._.block);
          return blockchain.getLastBlock(function() {
            screen._.loader.stop();
            if (callback) callback();
          });
        });
      }

      if (displayed.address) {
        return blockchain.getAddressTransactions(displayed.address, function(err, addr) {
          tabs.explore._.displayAddr(addr);
          return blockchain.getLastBlock(function() {
            screen._.loader.stop();
            if (callback) callback();
          });
        });
      }
    }
    return blockchain.getLastBlock(function() {
      if (callback) callback();
    });
  }

  (function callee() {
    return refresh(function() {
      return setTimeout(callee, 5 * 60 * 1000);
    });
  })();

  tabs.explore._.data.key(['r', 'f5'], function() {
    return refresh();
  });

  tabs.explore._.data.on('resize', function() {
    var block = tabs.explore._.block
      , tx = tabs.explore._.tx
      , addr = tabs.explore._.addr;

    if (addr) return tabs.explore._.displayAddr(addr);
    if (tx) return tabs.explore._.displayTX(tx, block);
    if (block) return tabs.explore._.displayBlock(block);
  });

  tabs.explore._.data.key('i', function() {
    var text = 'Address / Block-Hash / Block-Index / TX-Hash:';
    return screen._.prompt.type(text, '', function(err, value) {
      if (err) return screen._.msg.error(err.message);
      if (value == null) return screen.render();
      return tabs.explore._.lookup(value);
    });
  });

  tabs.explore._.data.key('q', function() {
    var block = tabs.explore._.block
      , tx = tabs.explore._.tx
      , addr = tabs.explore._.addr;

    if (tx && addr) {
      return tabs.explore._.displayTX(tx, block);
    }

    if (tx && block) {
      return tabs.explore._.displayBlock(block);
    }

    delete tabs.explore._.addr;
    delete tabs.explore._.tx;
    delete tabs.explore._.block;

    if (blockchain.lastBlock) {
      tabs.explore._.block = blockchain.lastBlock;
      tabs.explore._.data.setScroll(0);
      return tabs.explore._.displayBlock(blockchain.lastBlock);
    }

    return tabs.explore._.lastBlock();
  });

  tabs.explore._.data.key('?', function() {
    screen._.details.display(''
      + 'Press {blue-bg}{bold} q {/bold}{/blue-bg} to'
      + ' {bold}leave{/bold} the current layer.\n'

      + 'Press {blue-bg}{bold} b {/bold}{/blue-bg} to display a menu listing'
      + ' the current {bold}blocks{/bold}.\n'

      + 'Press {blue-bg}{bold} h/left {/bold}{/blue-bg} &'
      + ' {blue-bg}{bold} l/right {/bold}{/blue-bg} to navigate'
      + ' {bold}blocks{/bold}.\n'

      + 'Press {blue-bg}{bold} t {/bold}{/blue-bg} to display a menu listing'
      + ' the relevant {bold}transactions{/bold}.\n'

      + 'Press {blue-bg}{bold} a {/bold}{/blue-bg} to display a menu listing'
      + ' the relevant {bold}addresses{/bold}.\n'

      + 'Press {blue-bg}{bold} i {/bold}{/blue-bg} to display an'
      + ' {bold}input-window{/bold} allowing you to enter'
      + ' a block hash, block height, tx hash, or address to go'
      + ' directly to it.\n'

      + 'Press {blue-bg}{bold} r/f5 {/bold}{/blue-bg} to refresh the current'
      + ' {bold}resource{/bold}.', -1);
  });

  tabs.explore._.data.key(['h', 'left'], function() {
    var block = tabs.explore._.block
      , tx = tabs.explore._.tx
      , addr = tabs.explore._.addr;

    if (tx || addr || !block) {
      return;
    }

    screen._.loader.load('Loading... (press {blue-bg}{bold} ? {/bold}{/blue-bg} for help)');
    return blockchain.getBlock(block.prev_block, function(err, block) {
      screen._.loader.stop();
      if (err) return screen._.msg.error(err.message);
      return tabs.explore._.displayBlock(block);
    });
  });

  tabs.explore._.data.key(['l', 'right'], function() {
    var block = tabs.explore._.block
      , tx = tabs.explore._.tx
      , addr = tabs.explore._.addr;

    if (tx || addr || !block) {
      return;
    }

    var height = block.height;

    screen._.loader.load('Loading... (press {blue-bg}{bold} ? {/bold}{/blue-bg} for help)');
    return blockchain.getBlockHeight(height + 1, function(err, block) {
      screen._.loader.stop();
      if (err) return screen._.msg.error(err.message);
      return tabs.explore._.displayBlock(block);
    });
  });

  tabs.explore._.data.key('a', function() {
    var block = tabs.explore._.block
      , tx = tabs.explore._.tx
      , addr = tabs.explore._.addr;

    var uniq = {}
      , addrs = [];

    function onInput(input) {
      if (!input.prev_out) return addrs;
      if (uniq[input.prev_out.addr]) return addrs;
      uniq[input.prev_out.addr] = true;
      addrs.push(input.prev_out.addr
        + ' {red-fg}{bold}-' + coined.utils.ntoBTC(input.prev_out.value)
        + '{/bold}{/red-fg}');
      return addrs;
    }

    function onOutput(output) {
      if (uniq[output.addr]) return addrs;
      uniq[output.addr] = true;
      addrs.push(output.addr
        + ' {green-fg}{bold}+' + coined.utils.ntoBTC(output.value)
        + '{/bold}{/green-fg}');
      return addrs;
    }

    if (addr) {
      addr.txs.forEach(function(tx) {
        tx.inputs.forEach(onInput);
        tx.out.forEach(onOutput);
      });
    } else if (tx) {
      tx.inputs.forEach(onInput);
      tx.out.forEach(onOutput);
    } else if (block) {
      block.tx.forEach(function(tx) {
        tx.inputs.forEach(onInput);
        tx.out.forEach(onOutput);
      });
    }

    screen._.picker.setItems(addrs);
    screen._.picker.select(0);

    tabs.explore._.setTitle('Addresses');
    return screen._.picker.pick(function(err, addr) {
      tabs.explore._.clearTitle();
      if (err) return screen._.msg.error(err.message);
      if (addr == null) return screen.render();
      var address = addr.split(' ')[0];
      screen._.loader.load('Loading... (press {blue-bg}{bold} ? {/bold}{/blue-bg} for help)');
      return blockchain.getAddressTransactions(address, function(err, addr) {
        screen._.loader.stop();
        if (err) return screen._.msg.error(err.message);
        return tabs.explore._.displayAddr(addr);
      });
    });
  });

  tabs.explore._.data.key('b', function() {
    var block = tabs.explore._.block
      , tx = tabs.explore._.tx
      , addr = tabs.explore._.addr;

    if (tx && (tx.block || block)) {
      if (block) {
        return tabs.explore._.displayBlock(block);
      }
      return blockchain.getBlock(tx.block, function(err, block) {
        if (err) return screen._.msg.error(err.message);
        return tabs.explore._.displayBlock(block);
      });
    }

    function getBlock(callback) {
      if (block) return callback(null, block);
      return blockchain.getLastBlock(callback);
    }

    screen._.loader.load('Loading... (press {blue-bg}{bold} ? {/bold}{/blue-bg} for help)');
    return getBlock(function(err, block) {
      screen._.loader.stop();
      if (err) return screen._.msg.error(err.message);

      var height = block.height
        , items = []
        , interval = 100;

      if (height < interval) {
        height = interval - 1;
      }

      if (blockchain.lastBlock) {
        height = Math.min(height + (interval / 2), blockchain.lastBlock.height);
      }

      for (var i = 0; i < interval; i++) {
        items.push('Block Height: ' + (height-- + ''));
      }

      screen._.picker.setItems(items);
      screen._.picker.select(0);

      tabs.explore._.setTitle('Blocks');
      return screen._.picker.pick(function(err, block) {
        tabs.explore._.clearTitle();
        if (err) return screen._.msg.error(err.message);
        if (block == null) return screen.render();
        var hash = block.split(' ').pop();
        screen._.loader.load('Loading... (press {blue-bg}{bold} ? {/bold}{/blue-bg} for help)');
        return blockchain.getBlockHeight(hash, function(err, block) {
          screen._.loader.stop();
          if (err) return screen._.msg.error(err.message);
          return tabs.explore._.displayBlock(block);
        });
      });
    });
  });

  tabs.explore._.data.key('t', function() {
    var block = tabs.explore._.block
      , tx = tabs.explore._.tx
      , addr = tabs.explore._.addr
      , txs;

    if (addr) {
      txs = addr.txs;
    } else if (block) {
      txs = block.tx;
    } else {
      return;
    }

    screen._.picker.setItems(txs.map(function(tx, i) {
      var total = tx.out.reduce(function(total, output) {
        return total + output.value;
      }, 0);
      total = coined.utils.ntoBTC(total);
      return (i + 1) + '. ' + tx.hash.slice(0, 7)
        + ' {cyan-fg}' + tx.out[0].addr + '{/cyan-fg}'
        + ' {bold}{yellow-fg}(' + total + '){/yellow-fg}{/bold}';
    }));

    screen._.picker.select(0);

    tabs.explore._.setTitle('Transactions');
    return screen._.picker.pick(function(err, tx) {
      tabs.explore._.clearTitle();
      if (err) return screen._.msg.error(err.message);
      if (tx == null) return screen.render();
      var i = +tx.split('.')[0] - 1;
      var hash = txs[i].hash;
      screen._.loader.load('Loading... (press {blue-bg}{bold} ? {/bold}{/blue-bg} for help)');
      return blockchain.getTransaction(hash, block, function(err, tx) {
        screen._.loader.stop();
        if (err) return screen._.msg.error(err.message);
        return tabs.explore._.displayTX(tx, block);
      });
    });
  });
});