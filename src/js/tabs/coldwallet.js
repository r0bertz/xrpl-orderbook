'use strict';

var util = require('util'),
    Tab = require('../client/tab').Tab;

function ColdWalletTab() {
  Tab.call(this);
}

util.inherits(ColdWalletTab, Tab);

ColdWalletTab.prototype.tabName = 'coldwallet';
ColdWalletTab.prototype.mainMenu = 'coldwallet';

ColdWalletTab.prototype.generateHtml = function () {
  return require('../../templates/tabs/tx.jade')();
};

ColdWalletTab.prototype.extraRoutes = [
  {name: '/coldwallet/:address'}
];

ColdWalletTab.prototype.angular = function (module) {
  module.controller('ColdWalletCtrl', ['$rootScope', '$routeParams', '$location', '$route', 'rpId', 'rpNetwork',
  function ($scope, $routeParams, $location, $route, id, $network) {
    $scope.sequenceNumber = 1;
    $scope.accountError = false;

    var address = $routeParams.address;
    $scope.address = address;

    // If we are online, fetch account info
    var watcher = $scope.$watch('connected', async function() {
      if (!$scope.connected) return;

      $scope.networkFee = await $network.api.getFee();

      var serverInfo = await $network.api.getServerInfo();

      $network.api.getSettings(address).then(settings => {
        $scope.$apply(function() {
          $scope.accountLoaded = true;
          $scope.regularKeyEnabled = settings.RegularKey ? 'Yes' : 'No';
        });

        var defaultRipple = !!settings.defaultRipple;
        var requireAuth = !!settings.requireAuthorization;
        var globalFreeze = !!settings.globalFreeze;

        $network.api.getAccountInfo(address).then(info => {
          $scope.$apply(function() {
            $scope.xrpBalance = info.xrpBalance;

            var ownerCount  = info.ownerCount || 0;
            $scope.reserve = Number(serverInfo.validatedLedger.reserveBaseXRP)
              + Number(serverInfo.validatedLedger.reserveIncrementXRP) * ownerCount;
            $scope.max_spend = $scope.xrpBalance - $scope.reserve;

            // If we have a sequence number from the network, display to user
            $scope.sequenceNumber = info.sequence;
          });
        }).catch(function(error) {
          console.log('Error getAccountInfo: ', error);
          $scope.$apply(function() {
            $scope.accountError = true;
          });
        });

        // Fetch account trustlines and determine if any should have a warning
        $network.api.request('account_lines', {account: address}).then(lines => {
          // There are three flags the user is concerned with
          var accountInfo = [];
          accountInfo.push({
            setting: 'Require authorization',
            enabled: requireAuth,
            description: 'Prevent issuances from being held without authorization'
          });
          accountInfo.push({
            setting: 'Default Ripple',
            enabled: defaultRipple,
            description: 'Allow balances in trust lines to Ripple by default'
          });
          accountInfo.push({
            setting: 'Global Freeze',
            enabled: globalFreeze,
            description: 'Freeze all issuances'
          });

          $scope.$apply(function() {
            $scope.accountInfo = accountInfo;
            $scope.lines = lines.lines;
            // Display any trustlines where the flag does not match the
            // corresponding flag on the account root
            $scope.warningLines = _.reduce(lines.lines, function(result, line) {
              var warning1 = '';
              var warning2 = '';
              if (!!line.no_ripple === defaultRipple) {
                warning1 += 'Rippling flag on line differs from flag on account root.';
              }
              if (!!line.authorized !== requireAuth) { // TODO line.authorized ?
                warning2 += 'Trust line must be authorized.';
              }
              line.warning1 = warning1;
              line.warning2 = warning2;
              // Convert to boolean so undefined displays as false
              line.no_ripple = !!line.no_ripple;
              line.authorized = !!line.authorized;
              if (warning1 || warning2) {
                result.push(line);
              }
              return result;
            }, []);
          });
        }).catch(function(error) {
          console.log("Error request 'account_lines': ", error);
          $scope.$apply(function() {
            $scope.accountError = true;
          });
        });

        watcher();
      }).catch(function(error) {
        console.log('Error getSettings: ', error);
        $scope.$apply(function() {
          $scope.accountError = true;
        });
      });

      $scope.refresh = function() {
        $route.reload();
      };
    });
  }]);
};

module.exports = ColdWalletTab;
