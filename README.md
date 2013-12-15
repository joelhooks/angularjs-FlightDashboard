### Introduction

Promises are a great solution to address complexities of asynchronous requests and responses. AngularJS provides Promises using services such as `$q` and `$http`; other services also use promises, but I will not discuss those here.

Promises allow developers to do two (2) very important things:

1) We can transform the responses before anyone is notified of the response.

2) We can use the response to invoke more async requests (which could generate more promises).

But even more important that (1) and (2) above, Promises enables `easy` chaining of custom activity or computations. Promise chains are **amazing** and means that we can easily build sequences of asynchronous requests or asynchronous activity.

Let's explore the hidden power in chain promises... (and we will also discuss the hidden anti-patterns)

---

Consider the Flight Service shown which loads information about the last flight viewed during a previous application session
Here we simulate a remote web service by returning a JSON data file... but the request is still asynchronous and the request generates a promise `to respond` when the information is loaded.

```
var FlightService = function( $http )
	{
		return {

			getFlightdDetails : function( user )
			{
				return $http.get (
					URL_LAST_FLIGHT,
					{ userID : user.email }
				);
			}
		};
	}
```

Making this call from a FlightDashboard to load the users:

```
var FlightDashboard = function( $scope, user, flightService )
	{
		flightService
			.getFlightdDetails( user )
			.then( function( response )
			{
				// Publish the flight details to the view
				$scope.flight = response.flight;
			});

		$scope.flight = null;
	};
```

Okay this is nice... but nothing shockingly new is shown here. So let's add some `real-world` complexity.

### Nesting Promise Chains

Now let's assume that once we have flight details, then we will also want to check the weather forecast and the flight status. 

The scenario here is a cascaded 3-call sequence:  `getFlightDetails()` -> `getPlaneDetails()` -> `getForecast()`

More requests, more complexity...


```
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
```

The solution above used deep-nesting to create a sequential chain of three (3) asynchronous requests; requests to load the user's last flight, current flight, and weather forecast. 

While this works, deep nesting can quickly become difficult to manage if each level has logic. I personally consider deep nesting to be an anti-pattern. Fortunately we can restructure the code for clarity and maintenance:

```
var FlightDashboard = function( $scope, user, flightService, weatherService )
	{
		flightService
			.getFlightdDetails( user )										// Request #1
			.then( function( flight )
			{
				$scope.flight = flight;										// Response Handler #1

				return getPlaneDetails( flight.id );		// Request #2

			})
			.then( function( plane )
			{
				$scope.plane = plane;							// Response Handler #2

				return weatherService.getForecast( $scope.flight.departure );			// Reqeust #3
			})
			.then( function( forecast )
			{
				$scope.forecast = forecast;									// Response Handler #3
			});

		$scope.flight     = null;
		$scope.planStatus = null;
		$scope.forecast   = null;
	};
```

So now we have flattened the chain. Let's try a cycle of refactoring:

Notice that we can perceive the request and response as a self-contained process. Thinking that way, we can simplify this even further:

```
var FlightDashboard = function( $scope, user, flightService, weatherService, $log )
	{
		var loadFlight = function( user )
			{
				return flightService
							.getUpcomingFlight( user )				// Request #1
							.then( function( flight )
							{
								$scope.flight = flight;				// Response Handler #1

								return flight;
							});
			},
			loadPlaneStatus = function( flight )
			{
				return FlightService
							.getPlaneStatus( flight.id );			// Request #2
							.then( function( plane )
							{
								$plane = plane;						// Response Handler #2
								return plane;
							});
			},
			loadWeatherForecast = function()
			{
				return weatherService
							.getForecast( $scope.flight.departure );	// Reqeust #3
							.then(function( forecast )
							{
								$scope.forecast = forecast;				// Response Handler #3
								return forecast
							});
			};


		// 3-easy steps to load all of our information...
		// and includes logging of problems with ANY of the steps

		loadFlight( user )
			.then( loadPlaneStatus )
			.then( loadWeatcherForecast );

		$scope.flight     = null;
		$scope.planStatus = null;
		$scope.forecast   = null;
	};
```

This is better. Each segment of the *chain* is now a self-contained, named function. 

But Can we go further?

Once we realize that not all of our requests have to be sequential. In our scenario, the Plane  and Weather service calls could be requested in parallel (independent of each other). 

So let's simplify even further AND add a exception handler... We will use the `$q.all()` and the `$q.spread()` methods to condense our code and centralize all `$scope` changes. 

```
var FlightDashboard = function( $scope, user, flightService, weatherService, $log, $q )
	{
		var loadFlight = function( user )
			{
				return flightService.getUpcomingFlight( user );					// Request #1
			},
			/**
			 * Parallel processing for request #2 & #3
			 * Also only updates scope when ALL is ready...
			 */
			loadStatusAndWeather = function ( flight )
			{
				// Execute #2 & #3 in parallel...

				return $q.all([
							getPlaneDetails( flight.id ),						// Request #2
							weatherService.getForecast( flight.departure )		// Reqeust #3
						])
						.then( $q.spread( function( status, forecast )
						{
								$scope.flight      = flight;					// Response Handler #1
								$scope.planeStatus = planeStatus;				// Response Handler #2
								$scope.forecast    = forecast;					// Response Handler #3
						}));
			}
			/**
			 * Cool logging feature for rejections or exceptions
			 */
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
```

The last version is very clean and terse.

### Summary

Hopefully I have shown you some elegant and sophisticated techinques for chaining promises. You will have to decide whether you want to nest or flatten your promise chains. Just note that all of these approaches are simply chaining functions that either request more asynchronous activity or `handle` their async responses.
