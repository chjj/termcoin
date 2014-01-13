/**
 * Mock Data
 */

// listtransactions
exports.transactions = [
  {
    "account" : "buy",
    "address" : "1PGFqEzfmQch1gKD3ra4k18PNj3tTUUSqg",
    "category" : "receive",
    "amount" : 76502.99990000,
    "confirmations" : 174,
    "blockhash" : "04e22b9ce92a3494e173f1efb1bb3fd7f17792f98a3d972fdf12ae5c4a849564",
    "blockindex" : 1,
    "txid" : "adcc4feede3099cc6006ed311019b86e1a71b13d5dff681e1fb1e0d101ba877d",
    "time" : 1389608079
  },
  {
    "account" : "",
    "address" : "1PGFqEzfmQch1gKD3ra4k18PNj3tTUUSqg",
    "category" : "send",
    "amount" : -1.00000000,
    "fee" : 0.00000000,
    "confirmations" : 144,
    "blockhash" : "1fe0138b93fe266748392e8530e8afda4edd2465649d3c0b182387ecf1fc6886",
    "blockindex" : 7,
    "txid" : "1380dfde217ff78e824eca0b7722d4a7bd2ed51e713019fc67f7a9ef4d8c30bb",
    "time" : 1389609118
  },
  {
    "account" : "buy",
    "category" : "move",
    "time" : 1389609481,
    "amount" : 1.00000000,
    "otheraccount" : "mining",
    "comment" : ""
  },
  {
    "account" : "mining",
    "category" : "move",
    "time" : 1389609481,
    "amount" : -1.00000000,
    "otheraccount" : "buy",
    "comment" : ""
  }
];

// gettransaction
exports.transaction = {
  "amount" : 76502.99990000,
  "confirmations" : 174,
  "blockhash" : "04e22b9ce92a3494e173f1efb1bb3fd7f17792f98a3d972fdf12ae5c4a849564",
  "blockindex" : 1,
  "txid" : "adcc4feede3099cc6006ed311019b86e1a71b13d5dff681e1fb1e0d101ba877d",
  "time" : 1389608079,
  "details" : [
    {
        "account" : "buy",
        "address" : "1PGFqEzfmQch1gKD3ra4k18PNj3tTUUSqg",
        "category" : "receive",
        "amount" : 76502.99990000,
    }
  ]
};

// listaccounts
exports.accounts = {
  "" : 0.00000000,
  "buy" : 76922.99990000,
  "donations" : 0.00000000,
  "mining" : 0.00000000
};

// getaddressesbyaccount
exports.addresses = [
  "1PGFqEzfmQch1gKD3ra4k18PNj3tTUUSqg"
];
