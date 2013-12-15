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

(function ( window ){
    "use strict";

        /**
         * Decorate the $q to use inject a `spread()` function
         */
    var $QDecorator = function ($provide)
        {
            // Register our $log decorator with AngularJS $provider

            $provide.decorator('$q', ["$delegate",
                function ($delegate)
                {

                    if ( angular.isUndefined( $delegate.spread ))
                    {
                        $delegate.spread = function( targetFn,scope )
                        {
                            return function()
                            {
                                var params = [].concat(arguments[0]);
                                targetFn.apply(scope, params);
                            };
                        };
                    }

                    return $delegate;
                }
            ]);
        };


    if ( window.define != null )
    {
        window.define([ ], function ( )
        {
            return [ "$provide", $QDecorator ];
        });

    } else {

        window.$QDecorator = $QDecorator;
    }

})( window );
