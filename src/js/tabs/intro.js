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
      $scope.pair = 'XRP/XLM:rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y';
      $scope.account = 'rLLgJmQxrLEXrSDNkQEr9tvGoUdafFHTKP';
      $scope.showAccount = true;
      $scope.clickShowAccount = function(showAccount) {
        if (!showAccount) {
          $scope.account = undefined;
        }
      }
      $scope.showOrderbook = function() {
        if ($scope.account) {
          $window.location.href = '/#/orderbook/' + $scope.pair + '/' + $scope.account;
        } else {
          $window.location.href = '/#/orderbook/' + $scope.pair;
        }
      };
    }
  ]);
};

module.exports = IntroTab;
