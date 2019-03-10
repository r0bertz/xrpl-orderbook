/**
 * APP
 *
 * The app controller manages the global scope.
 */

var module = angular.module('app', []);

module.controller('AppCtrl', ['$rootScope', '$compile', 'rpNetwork',
                              '$route', '$timeout',
                              function ($scope, $compile, $network, $route,
                                $timeout)
{
    $network.connect();
}]);
