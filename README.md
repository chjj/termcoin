# termcoin

A bitcoin wallet for your terminal.

termcoin is written in node.js, using [blessed][1], and uses bitcoind (and
optionally other cryptocurrency rpc servers) as its backend.

## Screenshots

![](https://raw.github.com/chjj/termcoin/master/img/1.png)

![](https://raw.github.com/chjj/termcoin/master/img/2.png)

![](https://raw.github.com/chjj/termcoin/master/img/3.png)

![](https://raw.github.com/chjj/termcoin/master/img/4.png)

![](https://raw.github.com/chjj/termcoin/master/img/5.png)

![](https://raw.github.com/chjj/termcoin/master/img/6.png)

![](https://raw.github.com/chjj/termcoin/master/img/7.png)

![](https://raw.github.com/chjj/termcoin/master/img/8.png)

## Usage

``` bash
$ termcoin
```

termcoin by default tries to connect to the bitcoin rpc server in
`~/.bitcoin/bitcoin.conf`, but it can also be specified directly:

``` bash
$ termcoin http://bitcoinrpc:foobar@localhost:8332/
```

To use for other cryptocurrencies:

``` bash
$ termcoin -c litecoin
```

## Advantages

- Runs in a terminal. Possible to use over ssh. Easier than using bitcoind
  directly.
- Uses bitcoind as a backend, which means it is also possible to use with
  litecoin/namecoin/dogecoin/etc.

## Shortcomings

The bitcoin rpc server *is* limited in what it could do. Ideally I wanted this
to have all the capabilities of a full wallet, but that would require, for
example, linking to to berkeley db to parse the wallet.dat. I wanted to write
this entirely in node.

## External Dependencies

- **bitcoind** - json-rpc server
- **qrencode** - for QR codes rendered in your terminal.
- **xsel/xclip** - clipboard support for X11.
- **pbcopy** - clipboard support for OSX.

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

## License

Copyright (c) 2014, Christopher Jeffrey. (MIT License)

See LICENSE for more info.

[1]: https://github.com/chjj/blessed
