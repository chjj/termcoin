/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

/**
 * Exports
 */

var ui = exports;

/**
 * Modules
 */

var fs = require('fs')
  , cp = require('child_process');

/**
 * Dependencies
 */

var blessed = require('blessed');

/**
 * Load
 */

var termcoin = require('./')
  , utils = termcoin.utils
  , config = termcoin.config
  , mock = termcoin.mock
  , bitcoin = termcoin.bitcoin
  , opt = config.opt
  , platform = config.platform
  , blockchain = require('./backend/blockchain');

var coined = require('coined')
  , bcoin = coined.bcoin
  , bn = coined.bn;

/**
 * Variables
 */

ui.decryptTime = 0;
ui.lock = false;

/**
 * Start
 */

ui.start = function(stats, callback) {
  var screen = blessed.screen({
    autoPadding: true,
    fastCSR: true
  });

  screen._.target = null;

  screen._.wrapper = blessed.box({
    parent: screen,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  });

  screen._.bar = blessed.listbar({
    parent: screen._.wrapper,
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    keys: true,
    mouse: true,
    autoCommandKeys: true,
    style: {
      item: {
        fg: 'blue',
        hover: {
          fg: 'white',
          bg: 'black'
        }
      },
      selected: {
        fg: 'white',
        bg: 'black'
      },
      prefix: {
        fg: 'white'
      }
    }
  });

  screen.on('prerender', function() {
    screen._.bar.setContent(Array(screen.width + 1).join(' '));
  });

  screen._.sep = blessed.line({
    parent: screen._.wrapper,
    top: 1,
    left: 0,
    right: 0,
    orientation: 'horizontal'
  });

  var tabs = screen._.tabs = {};

  ['overview',
   'send',
   'receive',
   'transactions',
   'addresses',
   'misc',
   'logs',
   'explore',
   'debug'].forEach(function(name) {
    var tab = tabs[name] = blessed.box({
      top: 2,
      left: 0,
      right: 0,
      bottom: 0,
      scrollable: true,
      keys: true,
      vi: true,
      alwaysScroll: true,
      scrollbar: {
        ch: ' '
      },
      style: {
        scrollbar: {
          inverse: true
        }
      }
    });

    screen._.bar.addItem({
      text: name,
      callback: function() {
        if (screen._.target) screen._.target.detach();
        screen._.wrapper.append(tab);
        tab.focus();
        screen._.target = tab;
        screen.render();
      }
    });
  });

  screen._.bar.commands[0].callback();

  /**
   * Overview
   */

  tabs.overview._.wallet = blessed.text({
    parent: tabs.overview,
    top: 0,
    left: 3,
    height: 'shrink',
    width: '40%',
    label: ' {blue-fg}Wallet{/blue-fg} ',
    tags: true,
    border: {
      type: 'line'
    },
    content: 'No balance.',
    tags: true
  });

  tabs.overview._.transactions = blessed.text({
    parent: tabs.overview,
    top: 0,
    right: 3,
    height: 'shrink',
    width: '40%',
    label: ' {blue-fg}Transactions{/blue-fg} ',
    tags: true,
    border: {
      type: 'line'
    },
    content: 'No transactions.',
    tags: true
  });

  tabs.overview._.data = blessed.box({
    parent: tabs.overview,
    bottom: 0,
    left: 3,
    // XXX Fix in blessed: - probably has something to do with bottom: 0
    // height: 'shrink',
    height: 6,
    width: '40%',
    label: ' {blue-fg}Data{/blue-fg} ',
    tags: true,
    border: 'line',
    content: 'Loading... ',
    style: {
      fg: 'lightblack',
      bar: {
        bg: 'blue'
      }
    }
  });

  tabs.overview._.bar = blessed.progressbar({
    parent: tabs.overview._.data,
    top: 3,
    left: 0,
    right: 0,
    height: 'shrink',
    orientation: 'horizontal',
    filled: 0,
    ch: '|',
    tags: true,
    //content: 'Syncing... ',
    style: {
      fg: 'lightblack',
      bar: {
        bg: 'blue'
      }
    }
  });

  (function self() {
    return bitcoin.getProgress(function(err, data) {
      if (data) {
        if (data.hoursBehind > 2) {
          tabs.overview._.wallet._label.setContent(
            ' {blue-fg}Wallet{/blue-fg} {red-fg}(Unsynced){/red-fg} ');
        } else {
          tabs.overview._.wallet._label.setContent(' {blue-fg}Wallet{/blue-fg} ');
        }
        tabs.overview._.data.setContent(
          'Connections: ' + data.connections + '\n'
          + 'Blocks: ' + data.blocks + ' (' + data.percent + '%)\n'
          + (data.daysBehind >= 1
          ? data.daysBehind + ' Days Behind'
          : data.hoursBehind + ' Hours Behind'));
        //tabs.overview._.bar.content = data.blocks + ' (' + data.percent + '%)';
        tabs.overview._.bar.setProgress(data.percent);
        screen.render();
      }
      setTimeout(self, 2000);
    });
  })();

  /**
   * Send
   */

  tabs.send.on('focus', function() {
    tabs.send._.form.focus();
  });

  tabs.send._.form = blessed.form({
    parent: tabs.send,
    top: 0,
    left: 1,
    right: 1,
    //height: 9,
    // Fixed in blessed:
    height: 'shrink',
    keys: true,
    mouse: true,
    label: ' {blue-fg}Send{/blue-fg} ',
    border: 'line',
    tags: true,
    autoNext: true
  });

  tabs.send._.ttext = blessed.text({
    parent: tabs.send._.form,
    top: 0,
    left: 0,
    height: 1,
    content: 'Pay {underline}T{/underline}o:',
    tags: true
  });

  tabs.send._.address = blessed.textbox({
    parent: tabs.send._.form,
    name: 'address',
    inputOnFocus: true,
    top: 0,
    left: 9,
    right: 1,
    height: 1,
    style: {
      bg: 'black',
      focus: {
        bg: 'blue'
      },
      hover: {
        bg: 'blue'
      }
    }
  });

  tabs.send._.ltext = blessed.text({
    parent: tabs.send._.form,
    top: 2,
    left: 0,
    height: 1,
    content: ' {underline}L{/underline}abel:',
    tags: true
  });

  tabs.send._.label = blessed.textbox({
    parent: tabs.send._.form,
    name: 'label',
    inputOnFocus: true,
    top: 2,
    left: 9,
    right: 1,
    height: 1,
    style: {
      bg: 'black',
      focus: {
        bg: 'blue'
      },
      hover: {
        bg: 'blue'
      }
    }
  });

  tabs.send._.mtext = blessed.text({
    parent: tabs.send._.form,
    top: 4,
    left: 0,
    height: 1,
    content: 'A{underline}m{/underline}ount:',
    tags: true
  });

  tabs.send._.amount = blessed.textbox({
    parent: tabs.send._.form,
    name: 'amount',
    inputOnFocus: true,
    top: 4,
    left: 9,
    right: 1,
    height: 1,
    style: {
      bg: 'black',
      focus: {
        bg: 'blue'
      },
      hover: {
        bg: 'blue'
      }
    }
  });

  tabs.send._.ftext = blessed.text({
    parent: tabs.send._.form,
    top: 6,
    left: 0,
    height: 1,
    content: ' {underline}F{/underline}rom:',
    tags: true,
    hidden: true
  });

  tabs.send._.from = blessed.textbox({
    parent: tabs.send._.form,
    name: 'from',
    inputOnFocus: true,
    top: 6,
    left: 9,
    right: 1,
    height: 1,
    style: {
      bg: 'black',
      focus: {
        bg: 'blue'
      },
      hover: {
        bg: 'blue'
      }
    },
    hidden: true
  });

  tabs.send._.submit = blessed.button({
    parent: tabs.send._.form,
    name: 'submit',
    top: 6,
    right: 1,
    height: 1,
    width: 'shrink',
    content: ' Send ',
    style: {
      bg: 'black',
      focus: {
        bg: 'blue'
      },
      hover: {
        bg: 'blue'
      }
    }
  });

  tabs.send._.note = blessed.text({
    parent: tabs.send._.form,
    top: 8,
    left: 0,
    height: 'shrink',
    right: 10,
    content: 'Press {blue-fg}Ctrl-E{/blue-fg} to select an address.',
    tags: true
  });

  tabs.send._.submit.on('press', function() {
    tabs.send._.form.submit();
  });

  tabs.send._.form.on('submit', function(data) {
    // Technically shouldn't need a lock here since checkEncrypt executes the
    // callback synchronously (if decrypted) and the loader is invoked in that
    // callback, but just put this here for good measure.
    if (tabs.send._.lock) return;
    tabs.send._.lock = true;

    if (tabs.send._.from.visible) {
      tabs.send._.ftext.hide();
      tabs.send._.from.hide();
      tabs.send._.submit.rtop = 6;
      tabs.send._.note.rtop = 8;
    }

    var alias = stats.addresses.reduce(function(out, item) {
      out[item.name] = item;
      return out;
    }, {});

    // Own addresses: for 'move' calls.
    alias = Object.keys(stats.accounts).reduce(function(out, key) {
      out[stats.accounts[key].name] = stats.accounts[key];
      return out;
    }, alias);

    if (data.address && alias[data.address]) {
      data.address = alias[data.address].address;
    }

    if (data.address && stats.accounts[data.address]) {
      data.move = true;
    }

    return checkEncrypt(function(err) {
      if (err) {
        tabs.send._.lock = false;
        return screen._.msg.error(err.message);
      }

      var checkLabel = function(callback) {
        if (!data.label) return callback();
        if (bitcoin.changeLabel) {
          return bitcoin.changeLabel(data.address, data.label, callback);
        }
        return bitcoin.setAccount(data.address, data.label, callback);
      };

      var sendTo = function(callback) {
        if (data.from) {
          // if (data.move) {
          //   return bitcoin.move(data.from, data.address, +data.amount, callback);
          // }
          return bitcoin.sendFrom(data.from, data.address, +data.amount, callback);
        }
        return bitcoin.send(data.address, +data.amount, callback);
      };

      screen._.loader.load('Sending...');

      return sendTo(function(err, result) {
        if (err || !result) {
          tabs.send._.lock = false;
          screen._.loader.stop();
          if (!err) {
            err = new Error('Transaction not completed.');
          }
          return screen._.msg.error(err.message);
        }

        return checkLabel(function(err) {
          tabs.send._.form.reset();
          tabs.send._.lock = false;
          screen._.loader.stop();
          screen._.msg.display(
            'Transaction completed successfully: '
            + result + '.');
        });
      });
    });
  });

  function pickAddress(callback) {
    var own = Object.keys(stats.accounts).map(function(key) {
      var item = stats.accounts[key];
      return item.name || item.address;
    });

    var other = stats.addresses.map(function(item) {
      return item.name || item.address;
    });

    var addr = own.concat(other);
    var addresses = [];

    addr.forEach(function(address) {
      if (!~addresses.indexOf(address)) {
        addresses.push(address);
      }
    });

    screen._.picker.setItems(addresses);

    return screen._.picker.pick(callback);
  }

  function _pick() {
    return pickAddress(function(err, value) {
      if (err) return screen._.msg.error(err.message);
      if (value == null) return screen.render();
      tabs.send._.address.setValue(value);
      tabs.send._.address.focus();
      screen.render();
    });
  }

  tabs.send._.form.key(['C-e', 'C-t', 'e', 't'], function() {
    tabs.send._.form._selected = tabs.send._.address;
    //tabs.send._.address.focus();
    _pick();
  });
  tabs.send._.form.key(['L', 'l'], function() {
    tabs.send._.label.focus();
  });
  tabs.send._.form.key('m', function() {
    tabs.send._.amount.focus();
  });
  tabs.send._.address.key(['C-e','C-t'], _pick);

  /**
   * Receive
   */

  tabs.receive.on('focus', function() {
    tabs.receive._.list.focus();
  });

  tabs.receive._.list = blessed.list({
    parent: tabs.receive,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    style: {
      scrollbar: {
        inverse: true
      },
      selected: {
        bg: 'blue'
      },
      item: {
        hover: {
          bg: 'blue'
        }
      }
    },
    scrollbar: {
      ch: ' '
    }
  });

  tabs.receive._.list.key('d', function() {
    deleteAddress();
  });

  function deleteAddress() {
    var list = tabs.receive._.list
      , el = list.items[list.selected];

    var parts = el.getText().trim().split(/\s+/)
      , label = parts[0]
      , balance = parts[1].replace(/[()]/g, '')
      , address = parts[2];

    screen._.question.ask('Are you sure you want to delete this?', function(err, value) {
      if (err) return screen._.msg.error(err.message);
      if (!value) return screen.render();

      if (!bitcoin.deleteAccount) {
        return screen._.msg.error('Not supported.');
      }

      return bitcoin.deleteAccount(address, function(err) {
        if (err) return screen._.msg.error(err.message);
        var text = 'Deleted address: {blue-fg}' + address + '{/blue-fg}';
        screen._.msg.display(text);
        screen.render();
        return refresh();
      });
    });
  }

  tabs.receive._.list.on('select', function(el, index) {
    var parts = el.getText().trim().split(/\s+/)
      , label = parts[0]
      , balance = parts[1] ? parts[1].replace(/[()]/g, '') : null
      , address = parts[2]
      , text;

    if (label === 'new') {
      text = 'Label for new address:';
      return screen._.prompt.type(text, '', function(err, value) {
        if (err) return screen._.msg.error(err.message);
        if (value == null) return screen.render();
        return bitcoin.createAddress(value, function(err, address) {
          if (err) return screen._.msg.error(err.message);
          text = 'Created address: {blue-fg}' + address + '{/blue-fg}';
          screen._.msg.display(text);
          screen.render();
          return refresh();
        });
      });
    }

    screen._.picker.setItems([
      // 'Show Transactions',
      // 'Received By',
      'View Blockchain',
      'Copy Address',
      'Copy Label',
      'Rename',
      'Delete',
      //'-',
      'Send From',
      'Show QR Code',
      'Save QR Code PNG',
      'Sign Message'
    ]);

    return screen._.picker.pick(function(err, option) {
      if (err) return screen._.msg.error(err.message);

      if (option === 'View Blockchain') {
        return tabs.explore._.view(address);
      }

      if (option === 'Copy Address') {
        return ui.copy(address);
      }

      if (option === 'Copy Label') {
        return ui.copy(label);
      }

      if (option === 'Rename') {
        text = 'Label for {blue-fg}' + address + '{/blue-fg}:';
        return screen._.prompt.type(text, '', function(err, newLabel) {
          if (err) return screen._.msg.error(err.message);

          if (!bitcoin.changeLabel) {
            return screen._.msg.error('Not supported.');
          }

          if (newLabel == null) return screen.render();

          // Does not associate address with new account name, just creates a
          // new account with a new address.
          // return bitcoin.setAccount(address, newLabel, function(err) {
          return bitcoin.changeLabel(address, newLabel, function(err) {
            if (err) return screen._.msg.error(err.message);
            text = 'Edited label: {blue-fg}'
              + label + '->' + (newLabel || '[none]') + '{/blue-fg}';
            screen._.msg.display(text);
            screen.render();
            return refresh();
          });
        });
      }

      if (option === 'Delete') {
        return deleteAddress();
      }

      if (option === 'Send From') {
        tabs.send._.submit.rtop = 8;
        tabs.send._.note.rtop = 10;
        tabs.send._.ftext.show();
        tabs.send._.from.show();
        // XXX Fix this in blessed - shouldn't have to do this:
        screen.emit('keypress', '2', { name: '2' });
        tabs.send._.from.setValue(address);
        tabs.send._.form.focusFirst();
        screen.render();
        return;
      }

      if (option === 'Show QR Code') {
        var code = 'bitcoin:' + address + '?label=' + label;
        // TODO: Add prompt for an optional message:
        //+ '&message=' + message;
        return cp.execFile('qrencode', ['-t', 'ANSI256', code], function(err, stdout, stderr) {
          if (err) {
            return screen._.msg.error('qrencode not found. Please install it.');
          }
          screen._.qrbox._.show(stdout.trim());
        });
      }

      if (option === 'Save QR Code PNG') {
        return screen._.prompt.type('Save to:', '~/', function(err, file) {
          if (err) return screen._.msg.error(err.message);
          if (file == null) return screen.render();
          file = file.replace(/^~/, process.env.HOME);
          var code = 'bitcoin:' + address + '?label=' + label;
          // TODO: Add prompt for an optional message:
          //+ '&message=' + message;
          return cp.execFile('qrencode', ['-t', 'PNG', '-o', file, code], function(err, stdout, stderr) {
            if (err) {
              return screen._.msg.error('qrencode not found. Please install it.');
            }
            return screen._.msg.display('Successfully saved file.');
          });
        });
      }

      if (option === 'Sign Message') {
        // XXX Fix this in blessed - shouldn't have to do this:
        screen.emit('keypress', '6', { name: '6' });
        tabs.misc._.list.select(3);
        tabs.misc._.list.emit('keypress', '\r', { name: 'enter' });
        var i = screen._.picker.ritems.indexOf(address);
        if (!~i) i = screen._.picker.ritems.indexOf(label);
        if (!~i) return;
        screen._.picker.select(i);
        screen._.picker.emit('keypress', '\r', { name: 'enter' });
        screen.render();
        return;
      }

      if (option === 'Received By') {
        return bitcoin.listReceivedByAddress(address, function(err, txs) {
          return;
        });
      }
    });
  });

  /**
   * Transactions
   */

  tabs.transactions.on('focus', function() {
    tabs.transactions._.list.focus();
  });

  tabs.transactions._.list = blessed.list({
    parent: tabs.transactions,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    style: {
      scrollbar: {
        inverse: true
      },
      selected: {
        bg: 'blue'
      },
      item: {
        hover: {
          bg: 'blue'
        }
      }
    },
    scrollbar: {
      ch: ' '
    }
  });

  tabs.transactions._.list.on('select', function(el, index) {
    var tx = tabs.transactions._.list._.ids[index];

    screen._.picker.setItems([
      'Details',
      'View Blockchain',
      'Copy Address',
      'Copy Label',
      'Copy Amount',
      'Edit Label'
    ]);

    return screen._.picker.pick(function(err, option) {
      if (err) return screen._.msg.error(err.message);

      if (option === 'Copy Address') {
        return ui.copy(tx.address || tx.otheraccount);
      }

      if (option === 'Copy Label') {
        return ui.copy(tx.label);
      }

      if (option === 'Copy Amount') {
        return ui.copy(tx.amount + '');
      }

      if (option === 'Edit Label') {
        return;
      }

      if (option === 'Details') {
        var getTransaction = function(id, callback) {
          if (opt.mock) {
            return callback(null, mock.transaction);
          }
          return bitcoin.getTransaction(id, callback);
        };

        return getTransaction(tx.txid, function(err, transaction) {
          if (err) return screen._.msg.error(err.message);
          var text = utils.inspect(transaction);
          screen._.details.display(text, -1);
        });
      }

      if (option === 'View Blockchain') {
        return tabs.explore._.view(tx.txid);
      }
    });
  });

  /**
   * Addresses
   */

  tabs.addresses.on('focus', function() {
    tabs.addresses._.list.focus();
  });

  tabs.addresses._.list = blessed.list({
    parent: tabs.addresses,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    style: {
      scrollbar: {
        inverse: true
      },
      selected: {
        bg: 'blue'
      },
      item: {
        hover: {
          bg: 'blue'
        }
      }
    },
    scrollbar: {
      ch: ' '
    }
  });

  tabs.addresses._.list.key('d', function() {
    deleteSendAddress();
  });

  function deleteSendAddress() {
    var list = tabs.addresses._.list
      , el = list.items[list.selected];

    var parts = el.getText().trim().split(/\s+/)
      , label = parts[0]
      , address = parts[1];

    screen._.question.ask('Are you sure you want to delete this?', function(err, value) {
      if (err) return screen._.msg.error(err.message);
      if (!value) return screen.render();

      if (!bitcoin.deleteAccount) {
        return screen._.msg.error('Not supported.');
      }

      // return bitcoin.setAccount(address, function(err) {
      return bitcoin.deleteAccount(address, function(err) {
        if (err) return screen._.msg.error(err.message);
        text = 'Deleted address: {blue-fg}' + address + '{/blue-fg}';
        screen._.msg.display(text);
        screen.render();
        return refresh();
      });
    });
  }

  tabs.addresses._.list.on('select', function(el, index) {
    var parts = el.getText().trim().split(/\s+/)
      , label = parts[0]
      , address = parts[1]
      , text;

    if (label === 'new') {
      text = 'Label for new address:';
      return screen._.prompt.type(text, '', function(err, label) {
        if (err) return screen._.msg.error(err.message);
        if (!label) return screen.render();
        text = 'Address:';
        return screen._.prompt.type(text, '', function(err, address) {
          if (err) return screen._.msg.error(err.message);
          if (!address) return screen.render();
          return bitcoin.setAccount(address, label, function(err) {
            if (err) return screen._.msg.error(err.message);
            text = 'Created address: {blue-fg}' + label + '{/blue-fg}';
            screen._.msg.display(text);
            screen.render();
            return refresh();
          });
        });
      });
    }

    screen._.picker.setItems([
      'View Blockchain',
      'Copy Address',
      'Copy Label',
      'Rename',
      'Delete',
      //'-',
      'Send Coins',
      'Show QR Code',
      'Save QR Code PNG',
      'Verify Message'
    ]);

    return screen._.picker.pick(function(err, option) {
      if (err) return screen._.msg.error(err.message);

      if (option === 'View Blockchain') {
        return tabs.explore._.view(address);
      }

      if (option === 'Copy Address') {
        return ui.copy(address);
      }

      if (option === 'Copy Label') {
        return ui.copy(label);
      }

      if (option === 'Rename') {
        text = 'Label for {blue-fg}' + address + '{/blue-fg}:';
        return screen._.prompt.type(text, label, function(err, newLabel) {
          if (err) return screen._.msg.error(err.message);
          if (!newLabel) return screen.render();

          if (!bitcoin.changeLabel) {
            return screen._.msg.error('Not supported.');
          }

          // return bitcoin.setAccount(address, newLabel, function(err) {
          return bitcoin.changeLabel(address, newLabel, function(err) {
            if (err) return screen._.msg.error(err.message);
            text = 'Edited label: {blue-fg}'
              + label + '->' + (newLabel || '[none]') + '{/blue-fg}';
            screen._.msg.display(text);
            screen.render();
            return refresh();
          });
        });
      }

      if (option === 'Delete') {
        return deleteSendAddress();
      }

      if (option === 'Send Coins') {
        // XXX Fix this in blessed - shouldn't have to do this:
        screen.emit('keypress', '2', { name: '2' });
        tabs.send._.address.setValue(address);
        tabs.send._.form.focusFirst();
        screen.render();
        return;
      }

      if (option === 'Show QR Code') {
        var code = 'bitcoin:' + address + '?label=' + label;
        // TODO: Add prompt for an optional message:
        //+ '&message=' + message;
        return cp.execFile('qrencode', ['-t', 'ANSI256', code], function(err, stdout, stderr) {
          if (err) {
            return screen._.msg.error('qrencode not found. Please install it.');
          }
          screen._.qrbox._.show(stdout.trim());
        });
      }

      if (option === 'Save QR Code PNG') {
        return screen._.prompt.type('Save to:', '~/', function(err, file) {
          if (err) return screen._.msg.error(err.message);
          if (file == null) return screen.render();
          file = file.replace(/^~/, process.env.HOME);
          var code = 'bitcoin:' + address + '?label=' + label;
          // TODO: Add prompt for an optional message:
          //+ '&message=' + message;
          return cp.execFile('qrencode', ['-t', 'PNG', '-o', file, code], function(err, stdout, stderr) {
            if (err) {
              return screen._.msg.error('qrencode not found. Please install it.');
            }
            return screen._.msg.display('Successfully saved file.');
          });
        });
      }

      if (option === 'Verify Message') {
        // XXX Fix this in blessed - shouldn't have to do this:
        screen.emit('keypress', '6', { name: '6' });
        tabs.misc._.list.select(2);
        tabs.misc._.list.emit('keypress', '\r', { name: 'enter' });
        screen._.prompt._.input.setValue(address);
        screen._.prompt._.input.emit('keypress', '\r', { name: 'enter' });
        screen.render();
        return;
      }
    });
  });

  /**
   * Misc
   */

  tabs.misc._.list = blessed.list({
    parent: tabs.misc,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    style: {
      scrollbar: {
        inverse: true
      },
      selected: {
        bg: 'blue'
      },
      item: {
        hover: {
          bg: 'blue'
        }
      }
    },
    scrollbar: {
      ch: ' '
    },
    items: [
      'Encrypt Wallet',
      'Backup Wallet',
      'Verify Message Signature',
      'Sign Message',
      'Rescan Block Chain',
      'Set Transaction Fee',
      'Import Private Key',
      'Dump Private Key',
      'Refill Key Pool',
      'Toggle Coin Generation',
      'Get Mining Info'
    ]
  });

  tabs.misc.on('focus', function() {
    tabs.misc._.list.focus();
  });

  process.on('uncaughtException', function(err) {
    if (ui.lock) return;
    console.error(err.stack);
    process.exit(1);
  });

  tabs.misc._.list.on('select', function(el, index) {
    var text = el.getText();

    if (text === 'Encrypt Wallet') {
      return bitcoin.isEncrypted(function(err, encrypted) {
        if (err) return screen._.msg.error(err.message);
        if (encrypted) {
          screen._.prompt._.input.censor = true;
          return screen._.prompt.type('Current Passphrase:', '', function(err, opassphrase) {
            screen._.prompt._.input.censor = false;
            if (err) return screen._.msg.error(err.message);
            if (opassphrase == null) return screen.render();
            screen._.prompt._.input.censor = true;
            return screen._.prompt.type('New passphrase:', '', function(err, npassphrase) {
              screen._.prompt._.input.censor = false;
              if (err) return screen._.msg.error(err.message);
              if (npassphrase == null) return screen.render();
              screen._.prompt._.input.censor = true;
              return screen._.prompt.type('Verify Passphrase:', '', function(err, verify) {
                screen._.prompt._.input.censor = false;
                if (err) return screen._.msg.error(err.message);
                if (verify == null) return screen.render();
                if (npassphrase !== verify) {
                  return screen._.msg.error('Passphrases do not match.');
                }
                return bitcoin.changePassphrase(opassphrase, npassphrase, function(err) {
                  if (err) return screen._.msg.error(err.message);
                  return screen._.msg.display('Passphrase changed.');
                });
              });
            });
          });
        }
        screen._.prompt._.input.censor = true;
        return screen._.prompt.type('Passphrase:', '', function(err, passphrase) {
          screen._.prompt._.input.censor = false;
          if (err) return screen._.msg.error(err.message);
          if (passphrase == null) return screen.render();
          screen._.prompt._.input.censor = true;
          return screen._.prompt.type('Verify Passphrase:', '', function(err, verify) {
            screen._.prompt._.input.censor = false;
            if (err) return screen._.msg.error(err.message);
            if (verify == null) return screen.render();
            if (passphrase !== verify) {
              return screen._.msg.error('Passphrases do not match.');
            }
            screen.render();
            return bitcoin.encryptWallet(passphrase, function(err) {
              if (err) return screen._.msg.error(err.message);
              if (opt.remote) {
                return screen._.msg.display('Wallet is now encrypted.');
              }
              if (!bitcoin.restart) {
                return screen._.msg.display('Wallet is now encrypted.');
              }
              ui.lock = true;
              screen._.loader.load('Restarting server...');
              return setTimeout(function() {
                return fs.unlink(platform.pid, function() {
                  return bitcoin.startServer(function() {
                    ui.lock = false;
                    return bitcoin.decryptWallet(passphrase, 60 * 60, function() {
                      screen._.loader.stop();
                      ui.decryptTime = Date.now();
                      return screen._.msg.display('Wallet is now encrypted.');
                    });
                  });
                });
              }, 10000);
            });
          });
        });
      });
    }

    if (text === 'Backup Wallet') {
      return screen._.prompt.type('Save to:', '~/', function(err, file) {
        if (err) return screen._.msg.error(err.message);
        if (file == null) return screen.render();

        file = file.replace(/^~/, process.env.HOME);

        var stat;
        try {
          stat = fs.statSync(file);
        } catch (e) {
          ;
        }

        if (stat && stat.isDirectory()) {
          file = file.replace(/\/+$/, '') + '/wallet.dat.bak';
        }

        return bitcoin.backupWallet(file, function(err) {
          if (err) return screen._.msg.error(err.messsage);
          screen._.msg.display('Wallet successfully backed up.');
          screen.render();
        });
      });
    }

    if (text === 'Verify Message Signature') {
      return screen._.prompt.type('Address (Ctrl-E to select):', '', function(err, address) {
        if (err) return screen._.msg.error(err.message);
        if (address == null) return screen.render();
        return screen._.prompt.type('Signature:', '', function(err, sig) {
          if (err) return screen._.msg.error(err.message);
          if (sig == null) return screen.render();
          return screen._.prompt.type('Message:', '', function(err, message) {
            if (err) return screen._.msg.error(err.message);
            if (message == null) return screen.render();
            return bitcoin.verifyMessage(address, sig, message, function(err, result) {
              if (err) return screen._.msg.error(err.message);
              if (!result) {
                return screen._.msg.error('Not verified.');
              }
              return screen._.msg.display('Verified!');
            });
          });
        });
      });
    }

    if (text === 'Sign Message') {
      return checkEncrypt(function(err) {
        if (err) return screen._.msg.error(err.message);
        screen._.picker.setItems(Object.keys(stats.accounts));
        return screen._.picker.pick(function(err, address) {
          if (err) return screen._.msg.error(err.message);
          if (address == null) return screen.render();
          return screen._.prompt.type('Message:', '', function(err, message) {
            if (err) return screen._.msg.error(err.message);
            if (message == null) return screen.render();
            return bitcoin.signMessage(address, message, function(err, signature) {
              if (err) return screen._.msg.error(err.message);
              if (signature == null) return screen.render();
              return screen._.msg.display('Signature:\n' + signature, -1);
            });
          });
        });
      });
    }

    if (text === 'Rescan Block Chain') {
      screen._.loader.load('Rescanning (this may take a while)...');
      bitcoin.stopServer(function(err) {
        if (err) {
          ui.lock = false;
          screen._.loader.stop();
          return screen._.msg.error(err.message);
        }
        return setTimeout(function() {
          return cp.execFile(platform.daemon, ['-rescan'], function(err, stdout, stderr) {
            if (err || stderr) {
              return bitcoin.startServer(function(err_) {
                ui.lock = false;
                screen._.loader.stop();
                if (err_) {
                  screen.leave();
                  console.error('Fatal error: Could not restart server. Quitting.');
                  return proces.exit(1);
                }
                return screen._.msg.error(stderr || err.message);
              });
            }
            return bitcoin.startServer(function(err) {
              ui.lock = false;
              screen._.loader.stop();
              if (err) {
                screen.leave();
                console.error('Fatal error: Could not restart server. Quitting.');
                return proces.exit(1);
              }
              return screen._.msg.display('Successfully rescanned addresses.');
            });
          });
        }, 12 * 1000);
      });
      ui.lock = true;
      return;
    }

    if (text === 'Set Transaction Fee') {
      return screen._.prompt.type('Transaction Fee:', '0', function(err, value) {
        if (err) return screen._.msg.error(err.message);
        if (value == null) return screen.render();
        return bitcoin.setTxFee(+value, function(err) {
          if (err) return screen._.msg.error(err.message);
          return screen._.msg.display('Successfully set transaction fee.');
        });
      });
    }

    if (text === 'Import Private Key') {
      return checkEncrypt(function(err) {
        if (err) return screen._.msg.error(err.message);
        return screen._.prompt.type('Key:', '', function(err, key) {
          if (err) return screen._.msg.error(err.message);
          if (key == null) return screen.render();
          return screen._.prompt.type('Label:', '', function(err, label) {
            if (err) return screen._.msg.error(err.message);
            if (label == null) return screen.render();
            return screen._.question.ask('Rescan?', function(err, rescan) {
              if (err) return screen._.msg.error(err.message);
              if (rescan) {
                screen._.loader.load('Rescanning (this may take a while)...');
              }
              return bitcoin.importPrivKey(key, label, !!rescan, function(err) {
                if (rescan) screen._.loader.stop();
                if (err) return screen._.msg.error(err.message);
                return screen._.msg.display('Successfully set transaction fee.');
              });
            });
          });
        });
      });
    }

    if (text === 'Dump Private Key') {
      return checkEncrypt(function(err) {
        if (err) return screen._.msg.error(err.message);
        screen._.picker.setItems(Object.keys(stats.accounts));
        return screen._.picker.pick(function(err, address) {
          if (err) return screen._.msg.error(err.message);
          if (address == null) return screen.render();
          return bitcoin.dumpPrivKey(address, function(err, key) {
            if (err) return screen._.msg.error(err.message);
            return screen._.msg.display('Private Key: ' + key);
          });
        });
      });
    }

    if (text === 'Refill Key Pool') {
      return checkEncrypt(function(err) {
        if (err) return screen._.msg.error(err.message);
        screen._.loader.load('Refilling key pool...');
        return bitcoin.keyPoolRefill(function(err) {
          screen._.loader.stop();
          if (err) return screen._.msg.error(err.message);
          return screen._.msg.display('Key pool refill complete.');
        });
      });
    }

    if (text === 'Toggle Coin Generation') {
      return bitcoin.getGenerate(function(err, generating) {
        if (err) return screen._.msg.error(err.message);
        if (generating) {
          return bitcoin.setGenerate(false, function(err, key) {
            if (err) return screen._.msg.error(err.message);
            return screen._.msg.display('Stopped mining.');
          });
        }
        return screen._.prompt.type('Threads? (-1 for no. of cores)', '1', function(err, threads) {
          if (err) return screen._.msg.error(err.message);
          return bitcoin.setGenerate(true, +threads, function(err, key) {
            if (err) return screen._.msg.error(err.message);
            return screen._.msg.display('Mining!');
          });
        });
      });
    }

    if (text === 'Get Mining Info') {
      return bitcoin.getMiningInfo(function(err, info) {
        if (err) return screen._.msg.error(err.message);
        return screen._.msg.display(utils.inspect(info), -1);
      });
    }
  });

  /**
   * Logs
   */

  tabs.logs.on('focus', function() {
    if (tabs.logs._.tail) return;
    tabs.logs._.tail = tailBox(bitcoin.log || platform.log, tabs.logs);
  });

  tabs.logs.on('blur', function() {
    if (tabs.logs._.tail) {
      tabs.logs._.tail();
      delete tabs.logs._.tail;
    }
  });

  /**
   * Explore
   */

  tabs.explore._.data = blessed.box({
    parent: tabs.explore,
    top: 0,
    left: 3,
    height: 'shrink',
    width: 'shrink',
    content: '',
    tags: true
  });

  tabs.explore._.view = function(id) {
    tabs.explore._._lookup = id;
    screen.emit('keypress', '8', { name: '8' });
  };

  function displayBlock(block) {
    if (!block) return;
    tabs.explore.setScroll(0);
    var text = blockchain._formatBlock(block, tabs.explore._.data.width);
    tabs.explore._.data.setContent(text);
    tabs.explore._.block = block;
    delete tabs.explore._.tx;
    delete tabs.explore._.addr;
    return screen.render();
  }

  function displayTX(tx, block) {
    if (!tx) return;
    tabs.explore.setScroll(0);
    var text = blockchain._formatTX(tx, block, tabs.explore._.data.width);
    tabs.explore._.data.setContent(text);
    tabs.explore._.tx = tx;
    delete tabs.explore._.addr;
    return screen.render();
  }

  function displayAddr(addrs) {
    tabs.explore.setScroll(0);
    var text = blockchain._formatAddr(addrs, tabs.explore._.data.width);
    tabs.explore._.data.setContent(text);
    return screen.render();
  }

  tabs.explore._.lookup = function(value) {
    var block = tabs.explore._.block;
    var tx = tabs.explore._.tx;
    var addr = tabs.explore._.addr;
    var type, parts;

    parts = value.split('/');
    if (parts.length > 1) {
      type = parts[0];
      value = parts[1];
    }

    if (type === 'addr' || (!type && bcoin.wallet.addr2hash(value).length)) {
      screen._.loader.load('Loading...');
      tabs.explore._.loading = true;
      return blockchain.getAddressTransactions(value, function(err, addr) {
        if (err) {
          return tabs.explore._.data.setContent(err.stack + '');
        }
        tabs.explore._.addr = addr;
        screen._.loader.stop();
        tabs.explore._.loading = false;
        if (err) {
          return tabs.explore._.data.setContent(err.stack + '');
        }
        return displayAddr(addr);
      });
    }

    // Terrible workaround:
    if (type === 'block' || (!type && value.indexOf('000') === 0 && value.length === 64)) {
      screen._.loader.load('Loading...');
      tabs.explore._.loading = true;
      return blockchain.getBlock(value, function(err, block) {
        screen._.loader.stop();
        tabs.explore._.loading = false;
        if (err) {
          return tabs.explore._.data.setContent(err.stack + '');
        }
        return displayBlock(block);
      });
    }

    if (type === 'tx' || !type) {
      screen._.loader.load('Loading...');
      tabs.explore._.loading = true;
      return blockchain.getTransaction(value, block, function(err, tx) {
        if (err) {
          return tabs.explore._.data.setContent(err.stack + '');
        }
        screen._.loader.stop();
        tabs.explore._.loading = false;
        if (err) {
          return tabs.explore._.data.setContent(err.stack + '');
        }
        delete tabs.explore._.addr;
        return displayTX(tx, { hash: '' });
      });
    }
  };

  tabs.explore.on('focus', function() {
    if (config.currency !== 'bitcoin') {
      tabs.explore._.data.setContent(
        'Blockchain explorer not supported'
        + ' for currencies other than Bitcoin.');
      return screen.render();
    }

    if (tabs.explore._.init) {
      if (tabs.explore._._lookup) {
        delete tabs.explore._._lookup;
        return tabs.explore._.lookup(tabs.explore._._lookup);
      }
      return;
    }
    tabs.explore._.init = true;

    tabs.explore.on('resize', function() {
      var block = tabs.explore._.block;
      var tx = tabs.explore._.tx;
      var addr = tabs.explore._.addr;
      if (addr) return displayAddr(addr);
      if (tx) return displayTX(tx, block);
      if (block) return displayBlock(block);
    });

    tabs.explore.key('i', function() {
      var text = 'Address/Block/TX:';
      return screen._.prompt.type(text, '', function(err, value) {
        if (err) return screen._.msg.error(err.message);
        if (value == null) return screen.render();
        tabs.explore._.lookup(value);
      });
    });

    tabs.explore.key('h', function() {
      var block = tabs.explore._.block;
      var tx = tabs.explore._.tx;
      var addr = tabs.explore._.addr;
      delete tabs.explore._.tx;
      if (!block) return;
      screen._.loader.load('Loading...');
      tabs.explore._.loading = true;
      return blockchain.getBlock(block.prev_block, function(err, block) {
        screen._.loader.stop();
        tabs.explore._.loading = false;
        if (err) {
          return tabs.explore._.data.setContent(err.stack + '');
        }
        return displayBlock(block);
      });
    });

    tabs.explore.key('q', function() {
      var block = tabs.explore._.block;
      var tx = tabs.explore._.tx;
      var addr = tabs.explore._.addr;
      if (tx && addr) {
        delete tabs.explore._.addr;
        return displayTX(tx, block);
      }
      if (tx && block) {
        delete tabs.explore._.tx;
        return displayBlock(block);
      }
    });

    tabs.explore.key('l', function() {
      var block = tabs.explore._.block;
      var tx = tabs.explore._.tx;
      var addr = tabs.explore._.addr;
      delete tabs.explore._.tx;
      if (!block) return;
      var height = block.height;
      screen._.loader.load('Loading...');
      tabs.explore._.loading = true;
      return blockchain.getBlockHeight(height + 1, function(err, block) {
        screen._.loader.stop();
        tabs.explore._.loading = false;
        if (err) {
          return tabs.explore._.data.setContent(err.stack + '');
        }
        return displayBlock(block);
      });
    });

    tabs.explore.key('a', function() {
      var block = tabs.explore._.block;
      var tx = tabs.explore._.tx;
      var addr = tabs.explore._.addr;

      var uniq = {}, addrs = [];

      if (!tx) return;

      tx.inputs.forEach(function(input) {
        if (!input.prev_out) return addrs;
        if (uniq[input.prev_out.addr]) return addrs;
        uniq[input.prev_out.addr] = true;
        addrs.push(input.prev_out.addr
          + ' {red-fg}-' + coined.utils.toBTC(new bn(input.prev_out.value))
          + '{/red-fg}');
        return addrs;
      });

      tx.out.forEach(function(output) {
        if (uniq[output.addr]) return addrs;
        uniq[output.addr] = true;
        addrs.push(output.addr
          + ' {green-fg}+' + coined.utils.toBTC(new bn(output.value))
          + '{/green-fg}');
        return addrs;
      });

      screen._.picker.setItems(addrs);
      screen._.picker.select(0);

      return screen._.picker.pick(function(err, addr) {
        if (err) {
          return tabs.explore._.data.setContent(err.stack + '');
        }
        screen._.loader.load('Loading...');
        tabs.explore._.loading = true;
        if (addr == null) return screen.render();
        addr = addr.split(' ')[0];
        return blockchain.getAddressTransactions(addr, function(err, addr) {
          if (err) {
            return tabs.explore._.data.setContent(err.stack + '');
          }
          tabs.explore._.addr = addr;
          screen._.loader.stop();
          tabs.explore._.loading = false;
          if (err) {
            return tabs.explore._.data.setContent(err.stack + '');
          }
          return displayAddr(addr);
        });
      });
    });

    tabs.explore.key('t', function() {
      var block = tabs.explore._.block;
      var tx = tabs.explore._.tx;
      var addr = tabs.explore._.addr;

      if (!block) return;

      var txs = addr
        ? addr.txs
        : block.tx;

      screen._.picker.setItems(txs.map(function(tx) {
        var total = tx.out.reduce(function(total, output) {
          return total.iadd(new bn(output.value));
        }, new bn(0));
        total = coined.utils.toBTC(total);
        return tx.hash + ' {yellow-fg}(' + total + '){/yellow-fg}';
      }));
      screen._.picker.select(0);

      return screen._.picker.pick(function(err, tx) {
        if (err) {
          return tabs.explore._.data.setContent(err.stack + '');
        }
        if (tx == null) return screen.render();
        tx = tx.split(' ')[0];
        screen._.loader.load('Loading...');
        tabs.explore._.loading = true;
        return blockchain.getTransaction(tx, block, function(err, tx) {
          if (err) {
            return tabs.explore._.data.setContent(err.stack + '');
          }
          screen._.loader.stop();
          tabs.explore._.loading = false;
          if (err) {
            return tabs.explore._.data.setContent(err.stack + '');
          }
          delete tabs.explore._.addr;
          return displayTX(tx, block);
        });
      });
    });

    if (tabs.explore._._lookup) {
      delete tabs.explore._._lookup;
      return tabs.explore._.lookup(tabs.explore._._lookup);
    }

    screen._.loader.load('Loading...');
    tabs.explore._.loading = true;
    blockchain.getLastBlock(function(err, block) {
      screen._.loader.stop();
      tabs.explore._.loading = false;
      if (err) {
        return tabs.explore._.data.setContent(err.stack + '');
      }
      return displayBlock(block);
    });
  });

  /**
   * Debug
   */

  tabs.debug._.data = blessed.text({
    parent: tabs.debug,
    top: 0,
    left: 3,
    height: 'shrink',
    width: 'shrink',
    content: '',
    tags: true
  });

  /**
   * Global Widgets
   */

  screen._.prompt = blessed.prompt({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 'shrink',
    width: 'shrink',
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    content: 'Label:',
    border: 'line',
    hidden: true
  });

  screen._.prompt._.input.key('C-e', function() {
    if (!screen.focused || screen.focused !== screen._.prompt._.input) {
      return;
    }
    var selected = tabs.misc._.list.selected;
    screen._.prompt._.cancel.press();
    return pickAddress(function(err, value) {
      if (err) return screen._.msg.error(err.message);
      if (value == null) return screen.render();
      tabs.misc._.list.emit('select', tabs.misc._.list.items[selected], selected);
      screen._.prompt._.input.setValue(value);
      screen.render();
    });
  });

  screen._.question = blessed.question({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 'shrink',
    height: 'shrink',
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    content: 'Label:',
    border: 'line',
    hidden: true
  });

  screen._.fm = blessed.filemanager({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '70%',
    height: '50%',
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    label: ' Choose a file... ',
    border: 'line',
    hidden: true
  });

  screen._.picker = blessed.list({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '70%',
    height: '50%',
    border: 'line',
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    hidden: true,
    style: {
      scrollbar: {
        inverse: true
      },
      selected: {
        bg: 'blue'
      },
      item: {
        hover: {
          bg: 'blue'
        }
      }
    },
    scrollbar: {
      ch: ' '
    }
  });

  /**
   * Loader
   */

  screen._.loader = blessed.loading({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 5,
    align: 'center',
    width: '50%',
    tags: true,
    hidden: true,
    border: 'line'
  });

  /**
   * Message
   */

  screen._.msg = blessed.message({
    parent: screen,
    top: 'center',
    left: 'center',
    // Fixed in blessed:
    // height: '50%',
    height: 'shrink',
    width: '50%',
    align: 'center',
    tags: true,
    hidden: true,
    border: 'line'
  });

  /**
   * Details
   */

  screen._.details = blessed.message({
    parent: screen,

    // Fixed in blessed.
    // top: 'center',
    // left: 'center',
    // height: 'shrink',
    // width: 'shrink',

    //top: 2,
    //left: 4,
    //right: 4,
    //bottom: 2,

    top: 'center',
    left: 'center',
    width: '70%',
    height: '50%',

    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    hidden: true,
    border: 'line',
    scrollbar: {
      ch: ' '
    },
    style: {
      scrollbar: {
        bg: 'blue'
      }
    }
  });

  /**
   * QR Box
   */

  screen._.qrbox = blessed.box({
    parent: screen,
    scrollable: true,
    alwaysScroll: true,
    //top: 0,
    //left: 0,
    //bottom: 0,
    //right: 0,

    top: 1,
    bottom: 1,
    width: 80 + 6,
    //width: 'shrink',
    left: 'center',
    border: 'line',

    align: 'center',
    tags: true,
    hidden: true,
    keys: true,
    vi: true,
    scrollbar: {
      ch: ' '
    },
    style: {
      scrollbar: {
        inverse: true
      }
    }
  });

  screen._.qrbox._.show = function(content) {
    screen.saveFocus();
    screen._.qrbox.focus();
    screen._.qrbox.setContent(content);
    screen._.qrbox.show();
    screen.render();
  };

  screen._.qrbox.key(['q', 'escape'], function() {
    screen._.qrbox.hide();
    screen.restoreFocus();
    screen.render();
  });

  if (!stats.encrypted) {
    screen._.msg.display('Welcome to {blue-fg}termcoin{/blue-fg}!');
  }

  function checkEncrypt(callback) {
    if (!stats.encrypted) return callback();
    if (ui.decryptTime && ui.decryptTime + 60 * 60 * 1000 > Date.now()) return callback();
    screen._.prompt._.input.censor = true;
    return screen._.prompt.type('Enter your passphrase (valid for 60 min):', '', function(err, value) {
      screen._.prompt._.input.censor = false;
      if (err) {
        screen.render();
        return callback(err);
      }
      if (value == null) {
        return screen.render();
      }
      return bitcoin.forgetKey(function() {
        return bitcoin.decryptWallet(value, 60 * 60, function(err) {
          if (err) {
            screen.render();
            return callback(err);
          }
          ui.decryptTime = Date.now();
          screen.render();
          return callback(null);
        });
      });
    });
  }

  function refresh(callback, showLoad) {
    if (refresh.lock) {
      if (callback) callback();
      return;
    }

    var done = function(err) {
      refresh.lock = false;
      if (!callback) return;
      return err
        ? callback(err)
        : callback();
    };

    refresh.lock = true;

    // Disable this functionality:
    // showLoad = false;
    refresh.lock = false;

    if (ui.lock) return done();

    if (screen._.prompt.visible
        || screen._.question.visible
        || screen._.msg.visible
        || screen._.loader.visible) {
      showLoad = false;
    }

    if (showLoad) {
      screen._.loader.load('Loading...');
    }

    return bitcoin.getStats(function(err, stats_) {
      if (ui.lock) {
        if (showLoad) screen._.loader.stop();
        return done();
      }

      if (err) {
        if (showLoad) screen._.loader.stop();
        return done(err);
      }

      stats = stats_;

      var items;

      // Wallet
      tabs.overview._.wallet.setContent(
        '{blue-fg}Balance{blue-fg}:     {yellow-fg}'
        + (+stats.balance.balance).toFixed(8) + '{/yellow-fg}\n'
        + '{red-fg}Unconfirmed{red-fg}: {yellow-fg}'
        + (+stats.balance.unconfirmed).toFixed(8) + '{/red-fg}');

      // Accounts
      var accounts = Object.keys(stats.accounts).map(function(key) {
        return stats.accounts[key];
      });
      accounts = utils.asort(accounts);
      items = accounts.reduce(function(out, account) {
        var w = screen.width;
        var name = account.name || '[none]';
        var balance = '(' + (+account.balance).toFixed(8) + ') ';
        var sp = Array(w - (account.address.length + name.length + balance.length) - 3 + 1).join(' ');
        out.push(
          '{blue-fg}' + name + '{/blue-fg}'
          + sp
          + '{yellow-fg}' + balance + '{/yellow-fg}'
          + '{green-fg}' + account.address + '{/green-fg}'
        );
        return out;
      }, []);
      items.unshift('new');
      tabs.receive._.list.setItems(items);

      // Transactions
      if (stats.transactions.length > tabs.transactions._.list.ritems.length
          && stats.transactions[0].category === 'receive') {
        screen.program.bel();
      }
      items = stats.transactions.reduce(function(out, tx) {
        var text;
        var sep = ' │ ';
        if (tx.category === 'move') {
          // ID | Date | Type | Address | Amount
          text = '[move]'
            + sep
            + '{black-fg}' + new Date(tx.time * 1000).toISOString() + '{/black-fg}'
            + sep
            + '{blue-fg}<->{/blue-fg}'
            + sep
            + '{green-fg}' + tx.account + '{/green-fg}'
            + sep
            + '{green-fg}' + tx.otheraccount + '{/green-fg}'
            + sep
            + '{yellow-fg}' + (+tx.amount).toFixed(8) + '{/yellow-fg}'
            + (tx.comment ? ' - "' + tx.comment + '"' : '');
        } else {
          // ID | Date | Type | Address | Amount-Fee | Confirmation
          text = tx.txid.substring(0, 6)
            + sep
            + '{black-fg}' + new Date(tx.time * 1000).toISOString() + '{/black-fg}'
            + sep
            //+ '{blue-fg}' + tx.category + '{/blue-fg}'
            + (tx.category === 'send'
              ? '{red-fg}->{/red-fg}'
              : '{green-fg}<-{/green-fg}')
            + sep
            + '{green-fg}' + tx.address + '{/green-fg}'
            + sep
            + '{yellow-fg}' + (+tx.amount).toFixed(8) + '{/yellow-fg}'
            + (tx.fee ? '({red-fg}' + tx.fee + '{/red-fg})' : '')
            + sep
            + (tx.confirmations < 3
              ? '{red-fg}Unconfirmed (' + tx.confirmations + '){/red-fg}'
              : '{green-fg}Confirmed (' + tx.confirmations + '){/green-fg}');
        }
        out.push(text);
        return out;
      }, []);
      tabs.transactions._.list.setItems(items);
      tabs.transactions._.list._.ids = stats.transactions.slice();

      tabs.overview._.transactions.setContent(items.slice(0, 3).join('\n'));

      // Addresses
      var addresses = utils.asort(stats.addresses);
      items = addresses.reduce(function(out, account) {
        var w = screen.width;
        var name = account.name || '[none]';
        var sp = Array(w - (account.address.length + name.length) - 3 + 1).join(' ');
        out.push('{blue-fg}' + name + '{/blue-fg}'
          + sp + '{green-fg}' + account.address + '{/green-fg}');
        return out;
      }, []);
      items.unshift('new');
      tabs.addresses._.list.setItems(items);

      // Debug
      tabs.debug._.data.setContent(utils.inspect(stats));

      screen.render();

      if (showLoad) screen._.loader.stop();

      return checkEncrypt(function(err) {
        if (err) screen._.msg.error(err.message);
        return done();
      });
    });
  }

  screen.key('f5', function() {
    return refresh(null, true);
  });

  (function self() {
    return refresh(function() {
      return setTimeout(self, 10 * 1000);
    });
  })();

  screen.on('element keypress', function(el, ch, key) {
    var _ = screen._;

    if (ch !== 'q') return;

    if (screen.grabKeys) return;

    if (el === _.question
        || el === _.prompt
        || el === _.msg
        || el === _.details
        || el === _.qrbox
        || el === _.fm
        || el === _.picker
        || (el === _.tabs.explore
        && (_.tabs.explore._.tx
        || _.tabs.explore._.addr))) {
      return;
    }

    if (_.msg.visible) {
      _.msg.hide();
      screen.render();
      return;
    }

    return exit();
  });

  screen.key('C-c', function(ch, key) {
    return exit();
  });

  function exit() {
    if (bitcoin.startServer.started) {
      return bitcoin.stopServer(function() {
        return callback();
      });
    }

    return callback();
  }

  screen.render();
};

/**
 * UI Helpers
 */

ui.copy = function(text, callback) {
  var callback = callback || function() {};

  function exec(args) {
    var file = args.shift();
    var ps = cp.spawn(file, args, {
      stdio: ['pipe', 'ignore', 'ignore']
    });
    ps.stdin.on('error', callback);
    ps.on('error', callback);
    ps.on('exit', function(code) {
      return callback(code !== 0 ? new Error('Exit code: ' + code) : null);
    });
    ps.stdin.end(text + '');
  }

  if (opt.remote) return callback();

  // X11:
  return exec(['xsel', '-i', '-p'], function(err) {
    if (!err) return callback(null);
    return exec(['xclip', '-i', '-selection', 'primary'], function(err) {
      if (!err) return callback(null);
      // Mac:
      return exec(['pbcopy'], function(err) {
        if (!err) return callback(null);
        return callback(new Error('Failed to set clipboard contents.'));
      });
    });
  });
};

// `tail -f` a file.
ui.tailf = function(file) {
  var self = this
    , StringDecoder = require('string_decoder').StringDecoder
    , decode = new StringDecoder('utf8')
    , buffer = new Buffer(64 * 1024)
    , Stream = require('stream').Stream
    , s = new Stream
    , buff = ''
    , pos = 0;

  s.readable = true;
  s.destroy = function() {
    s.destroyed = true;
    s.emit('end');
    s.emit('close');
  };

  fs.open(file, 'a+', 0644, function(err, fd) {
    if (err) {
      s.emit('error', err);
      s.destroy();
      return;
    }

    (function read() {
      if (s.destroyed) {
        fs.close(fd);
        return;
      }

      return fs.read(fd, buffer, 0, buffer.length, pos, function(err, bytes) {
        if (err) {
          s.emit('error', err);
          s.destroy();
          return;
        }

        if (!bytes) {
          if (buff) {
            stream.emit('line', buff);
            buff = '';
          }
          return setTimeout(read, 1000);
        }

        var data = decode.write(buffer.slice(0, bytes));

        s.emit('data', data);

        var data = (buff + data).split(/\n+/)
          , l = data.length - 1
          , i = 0;

        for (; i < l; i++) {
          s.emit('line', data[i]);
        }

        buff = data[l];

        pos += bytes;

        return read();
      });
    })();
  });

  return s;
};

function tailBox(file, box) {
  var stream = ui.tailf(file)
    , rendering;

  var lines = [];

  stream.on('line', function(line) {
    box.pushLine(line);
    if (box._clines.fake.length > 200) {
      //box.setContent('');
      box.shiftLine(100);
    }
    if (rendering) return;
    rendering = true;
    process.nextTick(function() {
      rendering = false;
      //box.setScroll(box.getScrollHeight());
      box.setScroll(box._clines.length);
      box.screen.render();
    });
  });

  return stream.destroy.bind(stream);

  stream.on('line', function(line) {
    var h = box.height;
    if (lines.length >= h) {
      while (lines.length > h) {
        lines.shift();
      }
      box.setContent(lines.join('\n'));
      lines = [];
    }
    lines.push(line);
    if (rendering) return;
    rendering = true;
    process.nextTick(function() {
      rendering = false;
      //box.setScroll(box.getScrollHeight());
      box.setScroll(box._clines.length);
      box.screen.render();
    });
  });

  return stream.destroy.bind(stream);
}

/**
 * Main
 */

ui.main = function(callback) {
  return bitcoin.startServer(function(err) {
    if (err) return callback(err);
    return bitcoin.getStats(function(err, stats) {
      if (err) return callback(err);
      return ui.start(stats, function(err) {
        if (err) return callback(err);
        return callback();
      });
    });
  });
};
