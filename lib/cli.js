/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

/**
 * Exports
 */

var cli = exports;

/**
 * Modules
 */

var util = require('util')
  , readline = require('readline')
  , resolve = require('path').resolve
  , cp = require('child_process')
  , fs = require('fs')
  , isatty = require('tty').isatty;

var setImmediate = typeof global.setImmediate !== 'function'
  ? process.nextTick.bind(proccess)
  : global.setImmediate;

/**
 * Dependencies
 */

// May not need this:
// var blessed = require('blessed');

/**
 * Load
 */

var termcoin = require('./')
  , utils = termcoin.utils
  , config = termcoin.config
  , mock = termcoin.mock
  , transforms = termcoin.transforms
  , bitcoin = termcoin.bitcoin
  , opt = config.opt
  , platform = config.platform
  , blockchain = require('./explore/blockchain');

var coined = require('coined')
  , bcoin = coined.bcoin
  , bn = coined.bn;

/**
 * Variables
 */

cli.decryptTime = 0;
cli.lock = false;
cli.sep = ' │ ';

/**
 * Interactive
 */

cli.interactive = function() {
  cli.rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: cli.completion
  });

  return cli.askOption(function() {
    return cli.prompt();
  });
};

cli.askOption = function(callback) {
  if (cli.options.foo) return callback();
  return cli.rl.question('Foo (optional): ', function(result) {
    cli.options.foo = result.trim();
    return callback();
  });
};

cli.prompt = function() {
  cli.rl.on('line', function(line) {
    if (cli._promptLock) return;
    cli._promptLock = true;
    cli.exec(line, function() {
      cli._promptLock = false;
      cli.rl.prompt(true);
    });
  });

  cli.rl.on('close', function() {
    return process.exit(0);
  });

  cli.rl.setPrompt('\x1b[1;32;40m[termcoin]\x1b[m ', 11);

  cli.rl.prompt(true);
};

/**
 * Backend
 */

cli.__defineGetter__('bitcoin', function() {
  if (cli._bitcoin) return cli._bitcoin;

  if (!cli.options.foo) {
    if (isatty(1)) cli.help();
    return process.exit(1);
  }

  cli._bitcoin = termcoin.bitcoin;

  return cli._bitcoin;
});

/**
 * Read Command
 */

cli.readCommand = function() {
  function exec(cmd) {
    return cli.exec(cmd, function() {
      return process.exit(0);
    });
  }

  if (cli.options.command) {
    return exec(cli.options.command);
  }

  return getStdin(function(err, cmd) {
    return err
      ? process.exit(1)
      : exec(cmd);
  });
};

/**
 * Commands
 */

cli.info = {
  'help':   ['Syntax: help [command].',
             'Lookup info about a command.'].join('\n')
};

// TODO: Create list of commands dynamically.
cli.commands = [].map(utils.toDash);
// cli.commands = [].map(utils.toLower);

/**
 * Execute Command
 */

cli.exec = function(args, callback) {
  var args = args.trim().split(/\s+/)
    , cmd = args.shift();

  if (!cmd) {
    return callback();
  }

  if (!~cli.commands.indexOf(cmd)) {
    utils.error('No such command: `' + cmd + '`. Type `help` for commands.');
    return callback();
  }

  cmd = utils.toCamel(cmd);

  args.forEach(function(arg, i) {
    if (!arg) return;

    try {
      if (arg[0] === '{' || arg[0] === '[') {
        arg = 'return (' + arg + ');';
        arg = new Function('', arg).call(null);
      }
    } catch (e) {
      ;
    }

    args[i] = arg;
  });

  if (cli.options.debug) {
    console.log(cmd, args);
    return callback();
  }

  args.push(function(err, results) {
    if (err) {
      utils.error(err.message);
      return callback();
    }
    if (results) utils.print(results);
    return callback();
  });

  return cli.bitcoin[cmd].apply(cli.bitcoin, args);
};

/**
 * Completion
 */

cli.completion = function(line, callback) {
  var parts = line.replace(/^\s+/, '').split(/\s+/);

  function done() {
    return callback(null, ['example', 'completion', line]);
  }

  return done();
};

/**
 * Help
 */

cli.help = function() {
  return utils.print('TODO');
};

/**
 * Start
 */

cli.start = function(stats, callback) {
  return callback();
};

/**
 * Main
 */

cli.main = function(callback) {
  return cli.bitcoin.startServer(function(err) {
    if (err) return callback(err);
    return cli.bitcoin.getStats(function(err, stats) {
      if (err) return callback(err);
      return cli.start(stats, function(err) {
        if (err) return callback(err);
        return callback();
      });
    });
  });
};
