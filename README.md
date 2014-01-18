# termcoin

A bitcoin wallet for your terminal.

termcoin is written in node.js, using [blessed][1], and uses bitcoind (and
optionally other cryptocurrency rpc servers) as its backend.

## Screenshots

![overview 1](https://i.imgur.com/r0w7bHD.png)

![send address menu middle 5](https://i.imgur.com/sYzTE4v.png)

![receive menu 8](https://i.imgur.com/TCX6kLW.png)

![receive qr code 9](https://i.imgur.com/SYfeRGu.png)

![transactions menu 11](https://i.imgur.com/vjR3Yha.png)

![transaction details 12](https://i.imgur.com/lMZCITM.png)

![addresses menu 13](https://i.imgur.com/Q434liE.png)

![misc encrypt prompt 15](https://i.imgur.com/nxMOg45.png)

![logs 16](https://i.imgur.com/RqV50K6.png)

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

## Donations

- **BTC**:  14UwZi7hY2gQKUvA1Poz7vyxK9SzwAJ6CR
- **LTC**:  Lg2FyTZn1YRGMUAbL5xYhmjiCZvWM6f2Z1
- **DOGE**: DAwtjssd9y3HQp5vTXqZhsdshxkDzDXoRT
- **COYE**: 5Vqi6WYbK6fixQ4A1ypiJZXJtJkMBnAfpu

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

## License

Copyright (c) 2014, Christopher Jeffrey. (MIT License)

See LICENSE for more info.

[1]: https://github.com/chjj/blessed
