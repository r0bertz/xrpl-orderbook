'use strict';

window.jQuery = window.$ = require('jquery');
window.RippleAPI = require('ripple-lib').RippleAPI;
window.OrderBook = require('ripple-lib-orderbook').OrderBook;
window.IOUValue = require('ripple-lib-value').IOUValue;
window.XRPValue = require('ripple-lib-value').XRPValue;
window.deprecated = require('../deprecated');
window.RippleAddressCodec = require('ripple-address-codec');
window._ = require('lodash');

require('angular');
require('angular-route');
require('angular-messages');
require('angular-ui-bootstrap');
require('bootstrap');
