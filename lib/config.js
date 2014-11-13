/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

/**
 * Exports
 */

var cfg = exports;

/**
 * Modules
 */

var fs = require('fs')
  , url = require('url')
  , cp = require('child_process');

/**
 * Load
 */

var termcoin = require('./')
  , utils = termcoin.utils;

/**
 * Config
 */

cfg.read = {};

cfg.read.self = function() {
  if (cfg.opt.config) {
    return path.extname(cfg.opt.config) === '.json'
      ? cfg.read._parseJSON(cfg.opt.config)
      : cfg.read._parseEqual(cfg.opt.config);
  }

  var file = process.env.HOME + '/.termcoin'
    , json = file + '.json'
    , stat;

  try {
    stat = fs.statSync(file);
  } catch (e) {
    ;
  }

  if (stat && stat.isDirectory()) {
    file += '/termcoin.conf';
    json = file.replace('.conf', '.json');
  }

  try {
    stat = fs.statSync(json);
  } catch (e) {
    ;
  }

  return stat
    ? cfg.read._parseJSON(json)
    : cfg.read._parseEqual(file);
};

cfg.read.platform = function() {
  return cfg.read._parseEqual(cfg.platform.config);
};

cfg.read._parseJSON = function(file) {
  var data;

  try {
    data = fs.readFileSync(file, 'utf8');
  } catch (e) {
    return { original: {} };
  }

  return JSON.parse(data);
};

cfg.read._parseEqual = function(file) {
  var data;

  try {
    data = fs.readFileSync(file, 'utf8');
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
};

/**
 * Arguments
 */

cfg.parseArg = function(argv) {
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
      case '--import-wallet':
        options.importWallet = +argv.shift();
        break;
      case '--dump-wallet':
        options.dumpWallet = true;
        break;
      case '-?':
      case '-h':
      case '--help':
        return cfg.help();
      case '--debug':
        options.debug = true;
        break;
      case '--mock':
        options.mock = true;
        break;
      case '-b':
      case '--backend':
        options.backend = argv.shift();
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--no-relay':
        options.noRelay = true;
        break;
      case '--no-preload':
        options.noPreload = true;
        break;
      case '--never-full':
        options.neverFull = true;
        break;
      case '--local-blockchain':
        options.noRelay = true;
        options.localBlockchain = true;
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

  if (process.env.NODE_ENV === 'development'
      || process.env.NODE_DEBUG) {
    options.debug = true;
  }

  return options;
};

/**
 * Man Page
 */

cfg.help = function() {
  var options = {
    cwd: process.cwd(),
    env: process.env,
    setsid: false,
    customFds: [0, 1, 2]
  };

  cp.spawn('man',
    [__dirname + '/../man/termcoin.1'],
    options);

  // Kill the current stack.
  process.once('uncaughtException', function() {});
  throw 'stop';
};

/**
 * Platform
 */

cfg.getPlatform = function(opt) {
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
    datadir: dir,
    config: dir + '/' + conf + '.conf',
    wallet: dir + '/wallet.dat',
    log: dir + '/debug.log',
    pid: dir + '/' + name + 'd.pid',
    port: port,
    unknown: unknown
  };
};

/**
 * Init
 */

cfg.init = function() {
  // Parse arguments
  cfg.opt = cfg.parseArg(process.argv);

  if (cfg.opt.server) {
    cfg.opt.backend = 'bitcoind';
  }

  // Parse non-platform config
  cfg.self = cfg.read.self();

  if (cfg.bdjs[cfg.opt.backend]
      || (cfg.bdjs[cfg.self.backend] && !cfg.opt.backend)) {
    cfg.platform = cfg.getPlatform({
      currency: 'bitcoin',
      datadir: cfg.opt.datadir
        || (cfg.bdjs[cfg.self.backend] && cfg.self.datadir)
        || process.env.HOME + '/.termcoin-bitcoind'
    });

    cfg.platform.name = 'bitcoind.js';
    cfg.platform.daemon = 'libbitcoind';

    cfg.config = {
      backend: cfg.opt.backend || cfg.self.backend,
      currency: 'bitcoin',
      libbitcoind: true
    };
    cfg.libbitcoind = true;

    termcoin.on('backend', function() {
      cfg.config = utils.merge(cfg.config, cfg.read.platform());

      utils.merge(cfg,
        cfg.config,
        cfg.self,
        cfg.opt);

      if (cfg.useTestnet || cfg.testnet || process.env.NODE_ENV === 'debug') {
        cfg.platform.wallet = cfg.platform.wallet.replace('/wallet.dat', '/testnet3/wallet.dat');
        cfg.platform.pid = cfg.platform.pid.replace('/bitcoind.pid', '/testnet3/bitcoind.pid');
        cfg.platform.log = cfg.platform.log.replace('/debug.log', '/testnet3/debug.log');
      }
    });
  } else if ((cfg.opt.currency && cfg.opt.currency !== 'bitcoin')
      || (cfg.opt.backend && cfg.opt.backend !== 'bcoin')
      || (cfg.self.currency && cfg.self.currency !== 'bitcoin')
      || (cfg.self.backend && cfg.self.backend !== 'bcoin')) {
    // Determine platform based on config and arguments
    cfg.platform = cfg.getPlatform(cfg.opt);

    // Parse platform's config.
    cfg.config = cfg.read.platform();

    // Setup options for JSON-RPC client
    if (cfg.opt.host
        && cfg.opt.host !== 'localhost'
        && cfg.opt.host !== '127.0.0.1'
        && cfg.opt.host !== '::1') {
      cfg.opt.remote = true;
    }
    cfg.config.rpcconnect = cfg.opt.host || cfg.config.rpcconnect || 'localhost';
    cfg.config.rpcport = cfg.opt.port || cfg.config.rpcport || cfg.platform.port;
    cfg.config.rpcuser = cfg.opt.user || cfg.config.rpcuser || 'coinrpc';
    cfg.config.rpcpassword = cfg.opt.password || cfg.config.rpcpassword || 'foobar';
    cfg.config.rpcssl = cfg.opt.ssl || cfg.config.rpcssl || false;

    // Setup default backend and currency.
    cfg.config.backend = cfg.config.backend || 'bitcoind';
    cfg.config.currency = cfg.config.currency || 'bitcoin';

    if (cfg.useTestnet || cfg.testnet || process.env.NODE_ENV === 'debug') {
      cfg.platform.wallet = cfg.platform.wallet.replace('/wallet.dat', '/testnet3/wallet.dat');
      cfg.platform.pid = cfg.platform.pid.replace('/bitcoind.pid', '/testnet3/bitcoind.pid');
      cfg.platform.log = cfg.platform.log.replace('/debug.log', '/testnet3/debug.log');
    }
  } else {
    // Make up a faux platform since we're not using one
    cfg.platform = {
      name: 'bitcoin',
      daemon: 'termcoin',
      datadir: process.env.HOME + '/.termcoin',
      config: process.env.HOME + '/.termcoin/termcoin.conf',
      wallet: process.env.HOME + '/.termcoin/wallet.json',
      log: process.env.HOME + '/.termcoin/debug.log',
      pid: process.env.HOME + '/.termcoin/termcoin.pid',
      port: 8332,
      unknown: false
    };

    // Re-use non-platform config (since we don't have a platform)
    cfg.config = cfg.self;

    // Setup default backend and currency.
    cfg.config.backend = cfg.config.backend || 'bcoin';
    cfg.config.currency = cfg.config.currency || 'bitcoin';
  }

  termcoin.on('backend', function() {
    utils.merge(cfg,
      cfg.config,
      cfg.self,
      cfg.opt);
  });
};

/**
 * Helpers
 */

cfg.bdjs = [
  'libbitcoind',
  'bitcoindjs',
  'bitcoind.js'
].reduce(function(obj, name) {
  obj[name] = name;
  return obj;
}, {});

/**
 * Expose
 */

cfg.init();
