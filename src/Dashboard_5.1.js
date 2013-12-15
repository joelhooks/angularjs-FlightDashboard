(function( ) {
    "use strict";

    var FlightDashboard = function( $scope, user, flightService, weatherService, $log )
        {
            /**
             * Cool logging feature for rejections or exceptions
             */
            var reportProblems = function( fault )
            {
                $log.error( String(fault) );
            };

            // Level 1

            flightService
                .getFlightDetails( user.email )                     // Request #1
                .then( function( details )                          // Response Handler #1
                {
                    $scope.flight = details.flight;

                    // Level 2

                    return flightService
                        .getPlaneDetails( details.flight.id )           // Request #2
                        .then( function( plane  )                       // Response Handler #2
                        {
                            $scope.plane = plane ;

                            // Level 3

                            return weatherService
                                .getForecast( details.flight.departure )    // Reqeust #3
                                .then( function( info )                     // Response Handler #3
                                {
                                    $scope.forecast = info.forecast;
                                });
                        });
                })
                .catch( reportProblems );
        };


    window.FlightDashboard = [ "$scope", "user", "flightService", "weatherService", "$log", FlightDashboard ];

}( ));
