# exp-query-solana-proxy
An example of using a proxy to query Solana blockchain. The code to query the blockchain is borrowed from a tutorial.

Set a proxy in `.env`:
```sh
HTTP_PROXY=http://user:pass@ip:port
```
Install and run:
```sh
yarn install
node index.mjs <WALLET_ADDRESS>
```
