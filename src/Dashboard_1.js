(function() {
    "use strict";

   // 1-call sequence:  getFlightDetails()

   var  FlightDashboard = function( $scope, user, flightService )
        {
            flightService
                .getFlightDetails( user.email )         // Request #1
                .then( function( response )
                {
                  $scope.flight = response.flight;       // Response #1

                });
        };

    window.FlightDashboard = [ "$scope", "user", "flightService", FlightDashboard ];

}());

