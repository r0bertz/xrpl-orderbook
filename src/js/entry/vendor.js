'use strict';

window.RippleAPI = require('ripple-lib').RippleAPI;
window.OrderBook = require('ripple-lib-orderbook').OrderBook;
window.IOUValue = require('ripple-lib-value').IOUValue;
window.XRPValue = require('ripple-lib-value').XRPValue;
window.deprecated = require('../deprecated');
window._ = require('lodash');

require('angular');
require('angular-route');
