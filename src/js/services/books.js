/**
 * BOOKS
 *
 * The books service is used to keep track of orderbooks.
 */

var module = angular.module('books', ['network']);


module.factory('rpBooks', ['rpNetwork', '$q', '$rootScope', '$filter', 'rpId',
                           function($network, $q, $scope, $filter, $id) {

  var rowCount;

  function loadBook(gets, pays) {
    return new OrderBook.createOrderBook($network.api, {
      currency_gets: gets.currency,
      issuer_gets: gets.issuer,
      currency_pays: pays.currency,
      issuer_pays: pays.issuer
    });
  }

  function filterRedundantPrices(data, action, combine) {
    var max_rows = Options.orderbook_max_rows || 100;

    var lastprice;
    var current;
    var rpamount = $filter('rpamount');
    var newData = $.extend(true, {}, data);

    rowCount = 0;
    newData = _.values(_.compact(_.map(newData, function(d, i) {

      // This check is redundant, but saves the CPU some work
      if (rowCount > max_rows) {
        return false;
      }

      // rippled has a bug where it shows some unfunded offers
      // We're ignoring them
      if (d.taker_gets_funded === '0' || d.taker_pays_funded === '0') {
        return false;
      }

      if (d.TakerGets.value) {
        d.TakerGets.value = d.taker_gets_funded;
      } else {
        d.TakerGets = parseInt(Number(d.taker_gets_funded), 10);
      }

      if (d.TakerPays.value) {
        d.TakerPays.value = d.taker_pays_funded;
      } else {
        d.TakerPays = parseInt(Number(d.taker_pays_funded), 10);
      }

      d.TakerGets = deprecated.Amount.from_json(d.TakerGets);
      d.TakerPays = deprecated.Amount.from_json(d.TakerPays);

      // You never know
      if (!d.TakerGets.is_valid() || !d.TakerPays.is_valid()) {
        return false;
      }

      if (action === 'asks') {
        d.price = deprecated.Amount.from_quality(d.BookDirectory, d.TakerPays.currency(),
          d.TakerPays.issuer(), {
            base_currency: d.TakerGets.currency(),
            reference_date: new Date()
          });
      } else {
        d.price = deprecated.Amount.from_quality(d.BookDirectory, d.TakerGets.currency(),
          d.TakerGets.issuer(), {
            inverse: true,
            base_currency: d.TakerPays.currency(),
            reference_date: new Date()
          });
      }

      var price = rpamount(d.price, {
        rel_precision: 4,
        rel_min_precision: 2
      });

      // Don't combine current user's orders.
      if (d.Account === $id.account) {
        d.my = true;
      }

      if (lastprice === price && !d.my) {
        if (combine) {
          newData[current].TakerPays = deprecated.Amount.from_json(newData[current].TakerPays).add(d.TakerPays);
          newData[current].TakerGets = deprecated.Amount.from_json(newData[current].TakerGets).add(d.TakerGets);
        }
        d = false;
      } else {
        current = i;
      }

      if (!d.my) {
        lastprice = price;
      }

      if (d) {
        rowCount++;
      }

      if (rowCount > max_rows) {
        return false;
      }

      return d;
    })));

    var key = action === 'asks' ? 'TakerGets' : 'TakerPays';
    var sum;
    _.forEach(newData, function (order) {
      if (sum) {
        sum = order.sum = sum.add(order[key]);
      } else {
        sum = order.sum = order[key];
      }
    });

    return newData;
  }

  return {
    get: function(first, second) {
      var asks = loadBook(first, second);
      var bids = loadBook(second, first);

      var model = {
        asks: filterRedundantPrices(asks.getOffersSync(), 'asks', true),
        bids: filterRedundantPrices(bids.getOffersSync(), 'bids', true)
      };

      function handleAskModel(offers) {
        $scope.$apply(function () {
          model.asks = filterRedundantPrices(offers, 'asks', true);
          model.updated = true;
        });
      }

      // Currency and issuer are not set because we only want to call
      // ratio_human which only cares about value.
      function toAmount(value) {
        var amount = new deprecated.Amount(value);
        amount._is_native = value instanceof XRPValue;
        return amount;
      }

      function handleAskTrade(gets, pays) {
        $scope.$apply(function () {
          console.log('gets: ', gets._value.toString());
          console.log('pays: ', pays._value.toString());
          model.last_price = toAmount(gets).ratio_human(toAmount(pays));
          console.log('price: ', model.last_price.to_human());
          model.updated = true;
        });
      }
      asks.on('model', handleAskModel);
      asks.on('trade', handleAskTrade);

      function handleBidModel(offers) {
        $scope.$apply(function () {
          model.bids = filterRedundantPrices(offers, 'bids', true);
          model.updated = true;
        });
      }

      function handleBidTrade(gets, pays) {
        $scope.$apply(function () {
          console.log('pays: ', pays._value.toString());
          console.log('gets: ', gets._value.toString());
          model.last_price = toAmount(pays).ratio_human(toAmount(gets));
          console.log('price: ', model.last_price.to_human());
          model.updated = true;
        });
      }
      bids.on('model', handleBidModel);
      bids.on('trade', handleBidTrade);

      model.unsubscribe = function() {
        asks.removeListener('model', handleAskModel);
        asks.removeListener('trade', handleAskTrade);
        bids.removeListener('model', handleBidModel);
        bids.removeListener('trade', handleBidTrade);
      };

      return model;
    },

    getLength: function() {
      return rowCount;
    }
  };
}]);
