/**
 * @author      Thomas Burleson
 * @date        November, 2013
 * @copyright   2013 Mindspace LLC.
 * @web         http://solutionOptimist.com
 *
 * @description
 *
 * Used within AngularJS to decorate/enhance the AngularJS `$q` service.
 *
 *
 */

angular.module('$QDecorator', [])
  .config(function($provide) {
    $provide.decorator('$q', ["$delegate",
      function ($delegate) {

        if (angular.isUndefined($delegate.spread)) {
          $delegate.spread = function (targetFn, scope) {
            return function () {
              var params = [].concat(arguments[0]);
              targetFn.apply(scope, params);
            };
          };
        }
        return $delegate;
      }
    ]);
  })
;