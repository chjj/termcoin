/**
 * termcoin - a bitcoin wallet for your terminal
 * Copyright (c) 2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/termcoin
 */

/**
 * Exports
 */

var utils = exports;

/**
 * Modules
 */

var url = require('url')
  , util = require('util')
  , cp = require('child_process')
  , http = require('http')
  , StringDecoder = require('string_decoder').StringDecoder
  , qs = require('querystring');

/**
 * Helpers
 */

utils.inspect = function(obj, level) {
  return typeof obj !== 'string'
    ? util.inspect(obj, false, level || 10, true)
    : obj;
};

utils.print = function(msg) {
  return typeof msg === 'object'
    ? process.stdout.write(utils.inspect(msg) + '\n')
    : console.log.apply(console, arguments);
};

utils.printl = function(msg, level) {
  return process.stdout.write(utils.inspect(msg, level) + '\n');
};

utils.asort = function(obj) {
  return obj.sort(function(a, b) {
    a = a.name.toLowerCase().charCodeAt(0);
    b = b.name.toLowerCase().charCodeAt(0);
    return a - b;
  });
};

utils.tsort = function(obj, desc) {
  return obj.sort(function(a, b) {
    return desc
      ? b.time - a.time
      : a.time - b.time;
  });
};

utils.merge = function(target) {
  var args = Array.prototype.slice.call(arguments, 1);
  args.forEach(function(obj) {
    Object.keys(obj).forEach(function(key) {
      target[key] = obj[key];
    });
  });
  return target;
};

utils.forEach = function(obj, iter, done) {
  var pending = obj.length;
  function next() {
    --pending || done();
  }
  obj.forEach(function(item, i) {
    iter(item, next, i);
  });
};

utils.parallel = function(obj, done) {
  var keys = Object.keys(obj)
    , pending = keys.length
    , results = []
    , errs = [];

  function next(key, err, result) {
    if (err) {
      errs.push(err.message);
    } else {
      results[key] = result;
    }
    if (--pending) return;
    return errs.length
      ? done(new Error(errs.join('\n')))
      : done(null, results);
  }

  keys.forEach(function(key) {
    obj[key](next.bind(null, key));
  });
};

utils.daemonize = function(file, args, callback) {
  var v = process.version.substring(1).split('.');

  // `detached` didn't exist pre-0.7.10.
  if (+v[0] === 0 && +v[1] <= 7 && +v[2] < 10) {
    args = file + ' ' + args.join(' ');
    return cp.exec('(setsid ' + args + ' > /dev/null 2>& 1 &)', callback);
  }

  cp.spawn(file, args, {
    stdio: ['ignore', 'ignore', 'ignore'],
    detached: true
  });

  setTimeout(callback.bind(null, null, null), 1000);
};

utils.request = function(options, callback) {
  if (typeof options === 'string' || options.hostname) {
    options = { uri: options };
  }

  var uri = options.uri || options.url
    , body = options.json
        ? JSON.stringify(options.json)
        : options.body || '';

  if (typeof uri !== 'object') {
    uri = url.parse(uri);
  }

  if (options.qs) {
    var query = uri.query ? qs.parse(uri.query) : {};
    Object.keys(options.qs).forEach(function(key) {
      query[key] = options.qs[key];
    });
    uri.path = uri.pathname + '?' + qs.stringify(query);
  }

  var protocol = uri.prototype === 'https:'
    ? require('https')
    : http;

  options.method = options.method || (body ? 'POST' : 'GET');
  options.method = options.method.toUpperCase();
  options.headers = options.headers || {};

  if (options.json) {
    options.headers['Content-Type'] = 'application/json; charset=utf-8';
    options.headers['Accept'] = 'application/json';
  }

  if (options.method !== 'GET' && options.method !== 'HEAD') {
    options.headers['Content-Length'] = Buffer.byteLength(body);
  }

  var opt = {
    auth: uri.auth,
    host: uri.hostname,
    port: uri.port || (protocol === http ? 80 : 443),
    path: uri.path,
    method: options.method,
    headers: options.headers
  };

  var req = protocol.request(opt);

  req.on('error', function(err) {
    callback(err);
  });

  req.on('response', function(res) {
    var decoder = new StringDecoder('utf8')
      , done = false
      , body = '';

    function end() {
      if (done) return;
      done = true;
      res.body = body;
      if (options.json) {
        try {
          body = JSON.parse(body);
        } catch (e) {
          ;
        }
      }
      res.socket.removeListener('error', error);
      res.socket.removeListener('end', end);
      callback(null, res, body);
    }

    function error(err) {
      res.destroy();
      callback(err);
    }

    res.on('data', function(data) {
      body += decoder.write(data);
    });

    res.on('error', error);
    res.socket.on('error', error);

    res.on('end', end);
    // An agent socket's `end` sometimes
    // wont be emitted on the response.
    res.socket.on('end', end);
  });

  req.end(body);
};
