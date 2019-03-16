# XRP Ledger Orderbook

This is the source code of http://orderbook.xrp.ninja.

## Install Dependencies

- Clone this repository
- Run `npm install`
- Run `npm install nw --nwjs_build_type=sdk` (optional, needed only for
  development)

## Build

- Make a copy of the `config_example.js` file and name it `config.js`
- Save [Google analytics](https://analytics.google.com) code in `analytics.html`
- Save [Web
  monetization](https://github.com/interledger/rfcs/blob/master/0028-web-monetization/0028-web-monetization.md)
  in `web-monetization.html`
- Build:
  - Run `gulp` on command line for development
  - Run `gulp prod` on command line for production code (under `.build`
    directory)
- Open http://localhost:3000 in your browser
