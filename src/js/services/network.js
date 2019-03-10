/**
 * NETWORK
 *
 * The network service is used to communicate with the Ripple network.
 *
 * It encapsulates a RippleAPI instance.
 */

var module = angular.module('network', []);

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
    this.apiOrderbook = new RippleAPI(Options.connection);
  };

  Network.prototype.connect = async function() {
    this.apiOrderbook = new RippleAPI(Options.connection);
    this.apiOrderbook.on('connected', () => {
      console.log('connected');
      this.connected = true;
      $scope.connected = true;
      if(!$scope.$$phase) {
        $scope.$apply()
      }
    });
    await Promise.all([this.apiOrderbook.connect()]);
  };

  Network.prototype.disconnect = async function() {
    if (this.connected) {
      await Promise.all([this.apiOrderbook.disconnect()]);
    }
  };
  return new Network();
}]);
