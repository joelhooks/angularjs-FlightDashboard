angular.module('flightServices', [])
  .factory('resolveWith', function ($q) {
    return function resolved(response) {
      var dfd = $q.defer();
      dfd.resolve(response);

      return dfd.promise;
    }
  })

  .service("user", function () {
    return {
      email: "ThomasBurleson@Gmail.com"
    };
  })

  .service("flightService", function (user, resolveWith) {
    return {
      /**
       * Return mock flight data for the specified user
       */
      getFlightDetails: function (user) {
        return resolveWith({
          userID: user.email,
          flight: {
            id: "UA_343223",
            departure: "01/14/2014 8:00 AM"
          }
        });

      },

      getPlaneDetails: function (flightID) {
        return resolveWith({
          id: flightID,
          pilot: "Captain Morgan",
          make: {
            model: "Boeing 747 RC"
          },
          status: "onTime"
        });
      }
    };
  })

  .service("weatherService", function (resolveWith) {
    return {
      getForecast: function (date) {
        return resolveWith({
          date: date,
          forecast: "rain"
        });
      }
    };
  })
;
