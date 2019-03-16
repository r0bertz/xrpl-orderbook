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
  module.controller('IntroCtrl', ['$scope', '$rootScope', '$window',
    function($scope, $rootScope, $window) {
      $scope.Options = $rootScope.globalOptions;
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
