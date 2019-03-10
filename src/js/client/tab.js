var Tab = function (config)
{
};

Tab.prototype.pageMode = 'default';

Tab.prototype.mainMenu = 'none';

/**
 * AngularJS dependencies.
 *
 * List any controllers the tab uses here.
 */
Tab.prototype.angularDeps = [
  'formatters',
  // Filters
  'filters',
];

/**
 * Other routes this tab should handle.
 */
Tab.prototype.aliases = [];

exports.Tab = Tab;
