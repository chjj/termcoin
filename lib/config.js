/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

/**
 * Modules
 */

var fs = require('fs')
  , url = require('url')
  , cp = require('child_process');

/**
 * Load
 */

var opt = parseArg(process.argv)
  , platform = getPlatform(opt)
  , config = readConf();

/**
 * Options
 */

function getPlatform(opt) {
  var name = opt.currency || 'bitcoin'
    , conf = name
    , dir = opt.datadir || process.env.HOME + '/.' + name
    , unknown = false
    , port = 8332;

  switch (name) {
    case 'bitcoin':
      port = 8332;
      break;
    case 'litecoin':
      port = 9332;
      //port = 9333;
      break;
    case 'namecoin':
      port = 8334;
      conf = 'bitcoin';
      break;
    case 'dogecoin':
      port = 22555;
      //port = 22556;
      break;
    case 'coinyecoin':
      port = 41337;
      //port = 41338;
      break;
    case 'vertcoin':
      port = 5888;
      break;
    case 'primecoin':
      port = 9912;
      break;
    default:
      unknown = true;
      port = 18332;
      break;
  }

  return {
    name: name,
    daemon: name + 'd',
    config: dir + '/' + conf + '.conf',
    wallet: dir + '/wallet.dat',
    log: dir + '/debug.log',
    pid: dir + '/' + name + 'd.pid',
    port: port,
    unknown: unknown
  };
}

/**
 * Config
 */

function readConf() {
  var data;

  try {
    data = fs.readFileSync(platform.config, 'utf8');
  } catch (e) {
    return { original: {} };
  }

  data = data.trim().split(/(\r?\n)+/);

  return data.reduce(function(out, line) {
    var parts = line.trim().split(/\s*=\s*/)
      , key = parts[0].replace(/\s/g, '').toLowerCase()
      , val = parts[1];

    if (!key) return out;

    out[key] = val;
    out.original[key] = val;

    return out;
  }, { original: {} });
}

/**
 * Arguments
 */

function parseArg(argv) {
  var argv = argv.slice(2)
    , options = {}
    , files = [];

  function getarg() {
    var arg = argv.shift();

    if (arg.indexOf('--') === 0) {
      // e.g. --opt
      arg = arg.split('=');
      if (arg.length > 1) {
        // e.g. --opt=val
        argv.unshift(arg.slice(1).join('='));
      }
      arg = arg[0];
    } else if (arg[0] === '-') {
      if (arg.length > 2) {
        // e.g. -abc
        argv = arg.substring(1).split('').map(function(ch) {
          return '-' + ch;
        }).concat(argv);
        arg = argv.shift();
      } else {
        // e.g. -a
      }
    } else {
      // e.g. foo
    }

    return arg;
  }

  while (argv.length) {
    arg = getarg();
    switch (arg) {
      case '-c':
      case '--currency':
        options.currency = argv.shift();
        break;
      case '-s':
      case '--server':
        options.server = url.parse(argv.shift());
        if (options.server.auth) {
          var parts = options.server.auth.split(':');
          options.server.user = parts[0];
          options.server.password = parts[1] || '';
        }
        options.host = options.server.hostname;
        options.port = +options.server.port;
        options.user = options.server.user;
        options.password = options.server.password;
        options.ssl = options.server.protocol === 'https:';
        break;
      case '-d':
      case '--datadir':
        options.datadir = argv.shift();
        break;
      case '--max-attempts':
        options.maxAttempts = +argv.shift();
        break;
      case '-?':
      case '-h':
      case '--help':
        return help();
      case '--debug':
        options.debug = true;
        break;
      case '--mock':
        options.mock = true;
        break;
      default:
        if (~arg.indexOf('://')) {
          argv.unshift(arg);
          argv.unshift('-s');
        } else {
          files.push(arg);
        }
        break;
    }
  }

  if (!options.currency) {
    options.currency = 'bitcoin';
  }

  return options;
}

/**
 * Man Page
 */

function help() {
  var options = {
    cwd: process.cwd(),
    env: process.env,
    setsid: false,
    customFds: [0, 1, 2]
  };

  cp.spawn('man',
    [__dirname + '/../../man/termcoin.1'],
    options);

  // Kill the current stack.
  process.once('uncaughtException', function() {});
  throw 'stop';
}

/**
 * Init
 */

function init() {
  if (opt.host
      && opt.host !== 'localhost'
      && opt.host !== '127.0.0.1'
      && opt.host !== '::1') {
    opt.remote = true;
  }

  config.rpcconnect = opt.host || config.rpcconnect || 'localhost';
  config.rpcport = opt.port || config.rpcport || platform.port;
  config.rpcuser = opt.user || config.rpcuser || 'coinrpc';
  config.rpcpassword = opt.password || config.rpcpassword || 'foobar';
  config.rpcssl = opt.ssl || config.rpcssl || false;

  return {
    config: config,
    platform: platform,
    opt: opt
  };
}

/**
 * Expose
 */

module.exports = init();
