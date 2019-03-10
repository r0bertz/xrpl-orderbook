var module = angular.module('filters', []);

var iso4217 = require('../data/iso4217');

/**
 * Format a deprecated.Amount.
 *
 * If the parameter is a number, the number is treated the relative
 */
module.filter('rpamount', function () {
  return function (input, options) {
    var opts = _.extend(true, {}, options);

    if ("number" === typeof opts) {
      opts = {
        rel_min_precision: opts
      };
    } else if ("object" !== typeof opts) {
      opts = {};
    }

    if (!input) return "n/a";

    if (opts.xrp_human && input === ("" + parseInt(input, 10))) {
      input = input + ".0";
    }

    // Reference date
    // XXX Should maybe use last ledger close time instead
    if (!opts.reference_date && !opts.no_interest) {
      opts.reference_date = new Date();
    }

    var amount = deprecated.Amount.from_json(input);
    if (!amount.is_valid()) return "n/a";

    // Currency default precision
    var currency = iso4217[amount.currency().to_human()];
    var cdp = ("undefined" !== typeof currency) ? currency[1] : 4;

    // Certain formatting options are relative to the currency default precision
    if ("number" === typeof opts.rel_precision) {
      opts.precision = cdp + opts.rel_precision;
    }
    if ("number" === typeof opts.rel_min_precision) {
      opts.min_precision = cdp + opts.rel_min_precision;
    }

    // If no precision is given, we'll default to max precision.
    if ("number" !== typeof opts.precision) {
      opts.precision = 16;
    }

    // But we will cut off after five significant decimals
    if ("number" !== typeof opts.max_sig_digits) {
      opts.max_sig_digits = 5;
    }

    var out = amount.to_human(opts);

    // If amount is very small and only has zeros (ex. 0.0000), raise precision
    // to make it useful.
    if (out.length > 1 && 0 === +out && !opts.hard_precision) {
      opts.precision = 5;

      out = amount.to_human(opts);
    }

    return out;
  };
});

/**
 * Get the currency from an Amount or Currency object.
 *
 * If the input is neither an Amount or Currency object it will be passed to
 * Amount#from_json to try to interpret it.
 */
module.filter('rpcurrency', function () {
  return function (input) {
    if (!input) return "";

    var currency;
    if (input instanceof deprecated.Currency) {
      currency = input;
    } else {
      var amount = deprecated.Amount.from_json(input);
      currency = amount.currency();
    }

    return currency.to_human();
  };
});

/**
 * Get the currency issuer.
 */
module.filter('rpissuer', function () {
  return function (input) {
    if (!input) return "";

    var amount = deprecated.Amount.from_json(input);
    return amount.issuer();
  };
});
