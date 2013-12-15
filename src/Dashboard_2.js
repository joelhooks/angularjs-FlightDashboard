(function() {
  "use strict";

  // Nested 3-call sequence:  getFlightDetails() -> getPlaneDetails() -> getForecast()

var FlightDashboard = function( $scope, user, flightService, weatherService )
    {
      // Level 1

      flightService
        .getFlightDetails( user.email )           // Request #1
        .then( function( details )              // Response Handler #1
        {
          $scope.flight = details.flight;

          // Level 2

          flightService
            .getPlaneDetails( details.flight.id )       // Request #2
            .then( function( plane  )             // Response Handler #2
            {
              $scope.plane = plane ;

              // Level 3

              weatherService
                .getForecast( details.flight.departure )  // Reqeust #3
                .then( function( info )           // Response Handler #3
                {
                  $scope.forecast = info.forecast;
                });
            });
        });
    };


  window.FlightDashboard = [ "$scope", "user", "flightService", "weatherService", FlightDashboard ];

}());

