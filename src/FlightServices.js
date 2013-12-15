(function(angular) {
    "use strict";

    var resolveWith = function( $q)
        {
           return  function resolved( response )
                   {
                        var dfd = $q.defer();
                            dfd.resolve( response );

                       return dfd.promise;
                   };
        }

    angular.module( "FlightServices", [ ] )
           .config( window.$QDecorator )
            /**
             * User model
             */
           .service( "user", function(){
                return {
                    email : "ThomasBurleson@Gmail.com"
                };
            })
            /**
             * Flight service
             */
           .service( "flightService", function( user, $q )
            {
               resolveWith = resolveWith( $q )

               return {
                   /**
                    * Return mock flight data for the specified user
                    */
                   getFlightDetails : function( user )
                   {
                       return resolveWith ({
                                userID : user.email,
                                flight : {
                                    id        : "UA_343223",
                                    departure : "01/14/2014 8:00 AM"
                                }
                              });

                   },
                   /**
                    * Get mock plane information
                    */
                   getPlaneDetails : function( flightID )
                   {
                       return resolveWith ({
                                  id    : flightID,
                                  pilot : "Captain Morgan",
                                  make : {
                                      model : "Boeing 747 RC"
                                  },
                                  status: "onTime"
                              });
                   }
               };
            })
            /**
             * Weather service
             */
            .service( "weatherService", function( )
            {
                return {
                    getForecast : function( date )
                    {
                        return resolveWith({
                                   date     : date,
                                   forecast : "rain"
                               });
                    }
                };

            });


}(window.angular));

