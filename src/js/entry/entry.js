// Dependencies
require("setimmediate");

// Load app modules
require('../controllers/app');
require('../directives/formatters');
require('../filters/filters');
require('../services/network');
require('../services/books');

// Angular module dependencies
var appDependencies = [
  'ng',
  'ngRoute',
  // Controllers
  'app',
  // Directives
  'formatters',
  // Filters
  'filters',
];

// Load tabs
var tabdefs = [
  require('../tabs/intro'),
  require('../tabs/orderbook')
];

// Language
window.lang = (function(){
  return 'en'
})();

// Prepare tab modules
var tabs = tabdefs.map(function (Tab) {
  var tab = new Tab();

  if (tab.angular) {
    var module = angular.module(tab.tabName, tab.angularDeps);
    tab.angular(module);
    appDependencies.push(tab.tabName);
  }

  return tab;
});

var app = angular.module('rp', appDependencies);

app.config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
  // Since AngularJS 1.6, the default hash-prefix used for $location hash-bang
  // URLs has changed from the empty string ('') to the bang ('!'). To make old
  // url (e.g. 'href="#/history') work, set hash prefix to empty string.
  $locationProvider.hashPrefix('');

    // Set up routing for tabs
  _.forEach(tabs, function (tab) {
    var config = {
      tabName: tab.tabName,
      tabClass: 't-' + tab.tabName,
      pageMode: 'pm-' + tab.pageMode,
      mainMenu: tab.mainMenu,
      templateUrl: 'templates/' + lang + '/tabs/' + tab.tabName + '.html'
    };

    if ('intro' === tab.tabName) {
      $routeProvider.when('/', config);
    }
    $routeProvider.when('/' + tab.tabName, config);

    if (tab.extraRoutes) {
      _.forEach(tab.extraRoutes, function(route) {
        $.extend({}, config, route.config);
        $routeProvider.when(route.name, config);
      });
    }
  });

  $routeProvider.otherwise({redirectTo: '/'});
}]);

app.run(['$rootScope', '$route', '$routeParams',
  function ($rootScope, $route, $routeParams)
  {
    // This is the desktop client
    $rootScope.productName = 'Ripple Admin Console';

    // Helper for detecting empty object enumerations
    $rootScope.isEmpty = function (obj) {
      return angular.equals({},obj);
    };

    var scope = $rootScope;
    $rootScope.$route = $route;
    $rootScope.$routeParams = $routeParams;
    $rootScope.lang = lang;
    $('#main').data('$scope', scope);

    // put Options to rootScope so it can be used in html templates
    $rootScope.globalOptions = Options;

    // Show loading while waiting for the template load
    $rootScope.$on('$routeChangeStart', function() {
      $rootScope.pageLoading = true;
    });

    $rootScope.$on('$routeChangeSuccess', function() {
      $rootScope.pageLoading = false;
    });

    // Once the app controller has been instantiated
    // XXX ST: I think this should be an event instead of a watch
    scope.$watch("app_loaded", function on_app_loaded(oldval, newval) {
      $('nav a').click(function() {
        if (location.hash == this.hash) {
          scope.$apply(function () {
            $route.reload();
          });
        }
      });
    });
  }
]);
