# termcoin

**termcoin** bitcoin wallet and blockchain explorer for your terminal, written
for node.js

termcoin's UI is rendered by [blessed][blessed] which is a full ncurses
replacement and high-level widget library. Expect mouse support, eye-candy
hover effects, and so-on.

termcoin's bitcoin implementation is now based on [BCoin][bcoin] which fully
implements [BIP-37][bip37]'s description of bloom filters. This basically means
you don't have to download the entire blockchain to use your wallet. You ask
for and store only the transactions relevant to you (broadcasted in your bloom
filter), while at the same time being able to verify the merkleroot of blocks.

The blockchain explorer currently uses the [blockchain.info json
api][blockchain-api] as a backend. In the future, termcoin will leave an option
for the user to download the entire blockchain in the background (using bcoin -
out of sheer obsession, I implemented the original satoshi protocol in bcoin),
which means you will be able to explore the blockchain on your local disk
instead of waiting for api calls to return.

For data management, termcoin uses [tiny][tiny] as the database necessary to
store the (small) blockchain data and transactions relevant to your account.

[BCoin][bcoin] was conceived brilliantly, and [Fedor Indunty][indutny] also
went to the trouble of writing an [ecdsa][ecdsa] and [bignumber][bn] library in
pure javascript to supplement BCoin.

With all this being said, it's worth pointing out that termcoin is written
entirely in **pure javascript**.

All of this means:

- No compiling a database binding
- No compiling a binding to an ecdsa library
- No linking to ncurses
- No running a bitcoin rpc server in the background
- No downloading a 20gb blockchain
- Just use your wallet and enjoy!

Termcoin uses a basic JSON wallet format with private keys that are compatible
with bitcoind's importprivkey/dumpprivkey (128-prefixed+checksumed+base58)
keys. (It also supports AES-CBC encryption for your private keys, just like the
official bitcoin client).

**NOTE**: Termcoin used to use bitcoind/litecoind/etc as a backend. This
backend is still supported for other currencies. It's just not as featureful
due to limitations in the [coin]d rpc server.

termcoin is written in node.js, using [blessed][blessed], and uses bitcoind
(and optionally other cryptocurrency rpc servers) as its backend.

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

## Install

``` bash
# If Debian:
$ sudo apt-get install nodejs
# If Arch:
$ sudo pacman -S nodejs
$ sudo npm install termcoin -g
$ termcoin
```

## Usage

``` bash
$ termcoin
```

### Import your bitcoind wallet

``` bash
$ bitcoind dumpwallet ~/wallet.dump
$ termcoin --import-wallet ~/wallet.dump
# Open our much nicer format:
$ less ~/.termcoin/wallet.json
```

### Dump your wallet to the standard format

``` bash
$ termcoin --dump-wallet
$ bitcoin importwallet ~/wallet.dump
```

### Other cryptocurrencies

termcoin by default tries to connect to the rpc server in
`~/.{coin}/{coin}.conf`, but it can also be specified directly:

``` bash
$ termcoin http://coinrpc:foobar@localhost:8332/
```

To explicitly use for other cryptocurrencies (this will sadly use litecoind,
rather than a native litecoin implementation):

``` bash
$ termcoin -c litecoin
```

## Advantages

- Runs in a terminal. Possible to use over ssh. Easier than using bitcoind
  directly.
- No compilation required.
- No 20gb blockchain download required.
- Easy wallet management (does it get easier than a json file?)
- Can optionally use bitcoind as a backend, which means it is also possible to use with
  litecoin/namecoin/dogecoin/etc.

## Optional External Dependencies

These aren't necessary, but they might make things nicer for you.

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

[blessed]: https://github.com/chjj/blessed
[tiny]: https://github.com/chjj/tiny
[fedor]: https://github.com/indutny
[bn]: https://github.com/indutny/bn.js
[ecdsa]: https://github.com/indutny/elliptic
[bcoin]: https://github.com/indutny/bcoin
[bip37]: https://github.com/bitcoin/bips/blob/master/bip-0037.mediawiki
[blockchain-api]: https://blockchain.info/api/blockchain_api
