# termcoin - a bitcoin wallet for your terminal

termcoin is written in node.js and uses bitcoind (and other cryptocurrency rpc
servers) as its backend.

## Usage

`` bash
$ termcoin
``

termcoin by default tries to connect to the bitcoin rpc server in
~/.bitcoin/bitcoin.conf, but it can also be specified directly:

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

## Todo

- Wallet encryption/decryption

## Shortcomings

The bitcoin rpc server *is* limited in what it could do. Ideally I wanted this
to have all the capabilities of a full wallet, but that would require, for
example, linking to to berkeley db to parse the wallet.dat. I wanted to write
this entirely in node.
