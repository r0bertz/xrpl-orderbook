/**
 * NETWORK
 *
 * The network service is used to communicate with the Ripple network.
 *
 * It encapsulates a ripple.Remote instance.
 */

var module = angular.module('network', []),
    ripple = require('ripple-lib');

module.factory('rpNetwork', ['$rootScope', function($scope)
{
  /**
   * Manage network state.
   *
   * This class is intended to manage the connection status to the
   * Ripple network.
   *
   * Note that code in other places *is allowed* to call the Ripple
   * library directly. This is not to be intended to be an abstraction
   * layer on top of an abstraction layer.
   */
  var Network = function() {
    this.connected = false;
    this.remote = new ripple.RippleAPI(Options.connection);
  };

  Network.prototype.connect = async function(serverSettings) {
    serverSettings = serverSettings ? serverSettings : Options.connection;

    this.remote = new ripple.RippleAPI(serverSettings);
    this.remote.on('connected', this.handleConnect.bind(this));
    this.remote.on('disconnected', this.handleDisconnect.bind(this));

    if (serverSettings && serverSettings.server.length) {
      await this.remote.connect();
    }
  };

  Network.prototype.disconnect = async function() {
    if (this.connected) {
      await this.remote.disconnect();
    }
  };

  /**
   * Setup listeners for identity state.
   *
   * This function causes the network object to start listening to
   * changes in the identity state and automatically subscribe to
   * accounts accordingly.
   */
  Network.prototype.listenId = function (id)
  {
    var self = this;
  };

  Network.prototype.handleConnect = function (e)
  {
    var self = this;

    self.connected = true;
    $scope.connected = true;
    $scope.$broadcast('$netConnected');

    if(!$scope.$$phase) {
      $scope.$apply()
    }
  };

  Network.prototype.handleDisconnect = function (e)
  {
    var self = this;
    self.connected = false;
    $scope.connected = false;
    $scope.$broadcast('$netDisconnected');

    if(!$scope.$$phase) {
      $scope.$apply()
    }
  };

  return new Network();
}]);

