(function( ) {
    "use strict";

    var FlightDashboard = function( $scope, user, flightService, weatherService, $q, $log )
        {
            var loadFlight = function( user )
                {
                    return flightService.getFlightDetails( user.email );            // Request #1
                },
                loadStatusAndWeather = function ( response )
                {
                    var flight = response.flight;

                    // Execute #2 & #3 in parallel...

                    return $q.all([
                            flightService.getPlaneDetails( flight.id ),             // Request #2
                            weatherService.getForecast( flight.departure )          // Reqeust #3
                        ])
                        .then( $q.spread( function( plane, info )
                        {
                            $scope.flight      = flight;                            // Response Handler #1
                            $scope.plane       = plane;                             // Response Handler #2
                            $scope.forecast    = info.forecast;                     // Response Handler #3

                            throw( new Error("Just to prove catch() works! ") );
                        }));
                },
                reportProblems = function( fault )
                {
                    $log.error( String(fault) );
                };


            // 3-easy steps to load all of our information...
            // and now we can include logging for of problems within ANY of the steps

            loadFlight( user )
                .then( loadStatusAndWeather )
                .catch( reportProblems );

        };

    window.FlightDashboard = [ "$scope", "user", "flightService", "weatherService", "$q", "$log", FlightDashboard ];

}( ));

