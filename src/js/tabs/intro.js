var util = require('util');
var Tab = require('../client/tab').Tab;

var IntroTab = function ()
{
  Tab.call(this);
};

util.inherits(IntroTab, Tab);

IntroTab.prototype.tabName = 'intro';
IntroTab.prototype.mainMenu = 'intro';

IntroTab.prototype.generateHtml = function ()
{
  return require('../../templates/tabs/intro.jade')();
};


IntroTab.prototype.angular = function(module)
{
  module.controller('IntroCtrl', ['$scope', '$rootScope', '$window', '$sce',
    function($scope, $rootScope, $window, $sce) {
      $scope.Options = $rootScope.globalOptions;
      $scope.markets = [];
      pairs = [
        'XRP/CNY:rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y',
        'XRP/USD:rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
      ];
      issuerNames = new Map([
        ['rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y', 'Ripple Fox'],
        ['rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq', 'GateHub'],
      ]);
      pairs.forEach(function(p) {
        pair = [];
        p.split('/').forEach(function(c) {
          obj = {
            currency: c.match(/^(\w{3})/)[1],
          }
          im = c.match(/:(.+)$/);
          if (im !== null) {
            obj.issuer = im[1]
          }
          pair.push(obj);
        });
        base = JSON.stringify(pair[0]);
        counter = JSON.stringify(pair[1]);
        Url = "https://xrpcharts.ripple.com/embed/pricechart/?theme=light&type=candlestick&counter=" + counter + "=&base=" + base + "&live=true";
        market = "<div class='title'>"
        market += pair[0].hasOwnProperty('issuer') ? issuerNames.get(pair[0].issuer) + " " : ""
        market += pair[0].currency + "/" + pair[1].currency
        market += pair[1].hasOwnProperty('issuer') ? " " + issuerNames.get(pair[1].issuer) : ""
        market += "</div>"
        market += "<iframe src='" + Url + "'></iframe>"
        market += "<a href='/#/orderbook/" + p + "'></a>"
        $scope.markets.push($sce.trustAsHtml(market));
      })
      $scope.link = 'https://xrpcharts.ripple.com/#/markets/XRP/CNY:rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y?interval=5m&range=1d&type=candlestick'
      $scope.account = 'rJMWjmyAuJxG96SwU9iASCPz9GrpTivtzB';
      $scope.highlightAccount = true;
      $scope.clickHighlightAccount = function(highlightAccount) {
        if (!highlightAccount) {
          $scope.account = undefined;
        }
      }
      var linkPattern = /https:\/\/xrpcharts.ripple.com\/#\/markets\/([^\/]+\/[^?]+).*/g
      $scope.showOrderbook = function() {
        var match = linkPattern.exec($scope.link)
        if (!match) {
          alert('Invalid link: ' + $scope.link)
          return
        }
        var pair = match[1]
        if ($scope.account) {
          $window.location.href = '/#/orderbook/' + pair + '/' + $scope.account;
        } else {
          $window.location.href = '/#/orderbook/' + pair;
        }
      };
    }
  ]);
};

module.exports = IntroTab;
