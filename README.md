# termcoin

## Termcoin is no longer maintain

Note that termcoin is no longer maintained. It is not recommended for use.

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

## Screenshots

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/01.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/02.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/03.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/04.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/05.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/06.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/07.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/08.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/09.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/10.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/11.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/12.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/13.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/14.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/15.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/16.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/17.png)

![](https://raw.githubusercontent.com/chjj/termcoin/master/img/19.png)

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

### Example Wallet

``` js
{
  "version": 1,
  "ts": 1402363259,
  "encrypted": false,
  "compressed": true,
  "balance": "0.10981134",
  "accounts": [
    {
      "address": "1Lzcrow4haAm6j4vyKhMeFQdHcaE1VbjTc",
      "label": "main",
      "priv": "L2bka1uvakQDLabdoPuYEwtTd8a416fjhHyEq99nmaDYeuotsfeG",
      "pub": "nFB3c1yquakfoEE1A98q1HX9hjCp3kAx3a5UHeNvfwMj",
      "balance": "0.00993134",
      "tx": 32
    },
    {
      "address": "1Q3tMMNWdu3pqqhc3Hdt3L5gS26P7FdtyD",
      "label": "secondary",
      "priv": "L2ACa1uvakQDLabdoPuaEwtTd8a416fjhHyEq99nmaDYeuotsfHf",
      "pub": "hY29VUa4xfrs4vDUd4aF3cjkMoH5xegU6VzGNBqjTtCm",
      "balance": "0.09488",
      "tx": 10
    },
    {
      "address": "1BKrkLFuyM8BsS5DuwrhPXKc8uFYmsCAAn",
      "label": "test",
      "priv": "L2KEa1uvakQDLabdoPuuEwtTd8a416fjhHyEq99nmaDYeuotsEya",
      "pub": "26srZooFArAzwtQiiQx9LZWTaCupwoVS6QTdQ7CX3QyGa",
      "balance": "0.005",
      "tx": 5
    }
  ],
  "recipients": {
    "195cjSkBUZtpw7ue7mTB6MheP8c3wLkaJe": "noodles",
    "1RVx9Ezsa3zSMc1QteHnaiTXJ64foyAGe": "maxie"
  }
}
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

## Dislaimer and Note

It is *your own* responsibility to backup and keep your wallet/privkeys safe.
The termcoin developer(s) will not be responsible if your coins are lost,
deleted, or stolen.

Termcoin automatically makes a backup of your wallet every time you write to
it. Keep this in mind when encrypting it.

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

## License

Copyright (c) 2014, Christopher Jeffrey. (MIT License)

See LICENSE for more info.

[blessed]: https://github.com/chjj/blessed
[tiny]: https://github.com/chjj/tiny
[indutny]: https://github.com/indutny
[bn]: https://github.com/indutny/bn.js
[ecdsa]: https://github.com/indutny/elliptic
[bcoin]: https://github.com/indutny/bcoin
[bip37]: https://github.com/bitcoin/bips/blob/master/bip-0037.mediawiki
[blockchain-api]: https://blockchain.info/api/blockchain_api
