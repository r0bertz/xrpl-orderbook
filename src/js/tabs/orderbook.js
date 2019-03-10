var util = require('util');
var Tab = require('../client/tab').Tab;

var OrderbookTab = function ()
{
  Tab.call(this);
};

util.inherits(OrderbookTab, Tab);

OrderbookTab.prototype.tabName = 'orderbook';
OrderbookTab.prototype.mainMenu = 'orderbook';

OrderbookTab.prototype.generateHtml = function ()
{
  return require('../../templates/tabs/orderbook.jade')();
};

OrderbookTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['books']);

OrderbookTab.prototype.extraRoutes = [
  { name: '/orderbook/:first/:second/:account?' }
];

OrderbookTab.prototype.angular = function(module)
{
  module.controller('OrderbookCtrl', [
    'rpBooks', '$scope', 'rpNetwork', '$routeParams', '$location', '$filter',
    '$rootScope', '$timeout', '$document', '$sce',
    function(books, $scope, $network, $routeParams, $location, $filter,
             $rootScope, $timeout, $document, $sce) {
      if ($routeParams.first === undefined || $routeParams.second === undefined) {
        window.location.href = '/';
      }
      $rootScope.account = $routeParams.account;
      $scope.orderbookEmbeddedHTML = '';
      $scope.order = {};

      var OrderbookFilterOpts = {
        'precision':5,
        'min_precision':5,
        'max_sig_digits':20
      };

      $scope.loadMore = function () {
        $scope.orderbookLength = books.getLength();
        var multiplier = 30;
        Options.orderbook_max_rows += multiplier;
        loadOffers();
        $scope.orderbookState = (($scope.orderbookLength - Options.orderbook_max_rows + multiplier) < 1) ? 'full' : 'ready';
      }

      var updateOrderbookChart = function(){
        var base = {
          currency: $scope.order.first_currency.to_json()
        };

        var counter = {
          currency: $scope.order.second_currency.to_json()
        };

        if(base.currency != 'XRP'){
          base.issuer = $scope.order.first_issuer;
        }

        if(counter.currency != 'XRP'){
          counter.issuer = $scope.order.second_issuer;
        }

        $scope.orderbookChartJsonBase = JSON.stringify(base);
        $scope.orderbookChartJsonCounter = JSON.stringify(counter);

        var rawUrl = "https://xrpcharts.ripple.com/embed/pricechart?theme=light&type=candlestick&counter=" + $scope.orderbookChartJsonCounter + "=&base=" + $scope.orderbookChartJsonBase + "&live=true";
        $scope.orderbookEmbeddedHTML = $sce.trustAsHtml(
          "<iframe src='" + rawUrl + "' height='300' width='100%' " +
          "frameborder='0' />");
      }

      // This functions is called whenever the settings, specifically the pair and
      // the issuer(s) have been modified. It checks the new configuration and
      // sets $scope.valid_settings.
      function updateSettings() {
        $scope.orderbookEmbeddedHTML = '';

        var order = $scope.order;
        var pair = order.currency_pair;

        if ("string" !== typeof pair) pair = "";
        pair = pair.split('/');

        // Invalid currency pair
        if (pair.length != 2 || pair[0].length === 0 || pair[1].length === 0) {
          order.first_currency = Currency.from_json('XRP');
          order.second_currency = Currency.from_json('XRP');
          order.valid_settings = false;
          return;
        }

        var first_currency = order.first_currency = deprecated.Currency.from_json(pair[0].substring(0,3));
        var second_currency = order.second_currency = deprecated.Currency.from_json(pair[1].substring(0,3));

        if(first_currency.is_native()) {
          order.first_issuer = '';
        }

        if(second_currency.is_native()) {
          order.second_issuer = '';
        }

        // Invalid issuers or XRP/XRP pair
        if ((!first_currency.is_native() && !RippleAddressCodec.isValidAddress(order.first_issuer)) ||
            (!second_currency.is_native() && !RippleAddressCodec.isValidAddress(order.second_issuer)) ||
            (first_currency.is_native() && second_currency.is_native())) {
          order.valid_settings = false;
          return;
        }

        order.valid_settings = true;

        // Remember pair
        // Produces currency/issuer:currency/issuer
        var key = "" +
          order.first_currency.to_json() +
          (order.first_currency.is_native() ? "" : "/" + order.first_issuer) +
          ":" +
          order.second_currency._iso_code +
          (order.second_currency.is_native() ? "" : "/" + order.second_issuer);

        var changedPair = false;
        // Load orderbook
        if (order.prev_settings !== key) {
          changedPair = true;
          loadOffers();
          order.prev_settings = key;
        }

        updateOrderbookChart();

        return changedPair;
      }

      /**
       * Load orderbook
       */
      function loadOffers() {
        $scope.book = books.get({
          currency: ($scope.order.first_currency.has_interest() ?
                     $scope.order.first_currency.to_hex() :
                     $scope.order.first_currency.get_iso()),
          issuer: $scope.order.first_issuer
        }, {
          currency: ($scope.order.second_currency.has_interest() ?
                     $scope.order.second_currency.to_hex() :
                     $scope.order.second_currency.get_iso()),
          issuer: $scope.order.second_issuer
        });

        $scope.orderbookState = 'ready';
      }


      var rpamountFilter = $filter('rpamount');

      $scope.$watchCollection('book', function () {
        if (!_.isEmpty($scope.book)) {
          ['asks','bids'].forEach(function(type){
            if ($scope.book[type]) {
              $scope.book[type].forEach(function(order){
                order.showSum = rpamountFilter(order.sum,OrderbookFilterOpts);
                order.showPrice = rpamountFilter(order.price,OrderbookFilterOpts);

                var showValue = type === 'bids' ? 'TakerPays' : 'TakerGets';
                order['show' + showValue] = rpamountFilter(order[showValue],OrderbookFilterOpts);
              });
            }
          });
        }
      });

      /**
       * Route includes currency pair
       */
      if ($routeParams.first && $routeParams.second) {
        var routeIssuers = {};
        var routeCurrencies = {};

        ['first','second'].forEach(function(prefix){
          routeIssuers[prefix] = $routeParams[prefix].match(/:(.+)$/);
          routeCurrencies[prefix] = $routeParams[prefix].match(/^(\w{3})/);

          if (routeIssuers[prefix]) {
            if (RippleAddressCodec.isValidAddress(routeIssuers[prefix][1])) {
              $scope.order[prefix + '_issuer'] = routeIssuers[prefix][1];
            } else {
              $location.path('/orderbook');
            }
          }
        });

        if (routeCurrencies['first'] && routeCurrencies['second']) {
          if (routeCurrencies['first'][1] !== routeCurrencies['second'][1]) {
            $scope.order.currency_pair = routeCurrencies['first'][1] + '/' + routeCurrencies['second'][1];
          } else {
            $location.path('/orderbook');
          }
        }

        updateSettings();
      }
    }
  ]);
};

module.exports = OrderbookTab;
