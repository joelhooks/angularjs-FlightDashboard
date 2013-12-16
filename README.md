### Introduction

Promises are a great solution to address complexities of asynchronous requests and responses. AngularJS provides Promises using services such as `$q` and `$http`; other services also use promises, but I will not discuss those here.

Promises allow developers to easily attach *1x-only notifications of response* to any asynchronous request/action. Promises also enable two (2) other very important things. We can:

*  Transform the responses before subsequent handlers (in the chain) are notified of the response.
*  Use the response to invoke more async requests (which could generate more promises).

But even more important than the features above, Promises support easy **chaining** of custom activity or computations. Managing sequences or chains of asynchronous activity can be a very difficult and complex effort. Promise chains are **amazing** and provide means to easily build sequences of asynchronous requests or asynchronous activity. 

Let's explore the hidden power in chain promises. 

>
...and we will also discuss the some of hidden anti-patterns

---

### The FlightDashboard

Consider the Flight Service shown which loads information about the user's upcoming flight. Below our *service* shows how a a remote web service by returns a JSON data file... Remember that data calls are asynchronous and our FlightService request generates **a promise to respond** when the information is loaded.

```javascript

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

Now let's use this service from a `FlightDashboard` to load the user's scheduled flight:

```javascript

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

>
Okay this is nice... but nothing shockingly new is shown here. So let's add some `real-world` complexity. 

---

### Nesting Promise Chains

Now let's assume that once we have flight details, then we will also want to check the weather forecast and the flight status. 

The scenario here is a cascaded 3-call sequence:  `getFlightDetails()` -> `getPlaneDetails()` -> `getForecast()`

![Flight-Chain](https://f.cloud.github.com/assets/210413/1750918/99369b2c-65be-11e3-8a96-c7cf8119a306.jpg)


```javascript

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

The above implementation uses deep-nesting to create a sequential, cascading chain of three (3) asynchronous requests; requests to load the user's last flight, current flight, and weather forecast. 

---

### Flattened Promise Chains

While this works, deep nesting can quickly become difficult to manage if each level has non-trivial logic. Promise chain nesting also requires developers to careful consider how they will manage errors within the chain segments.

>
Note that the code show above does NOT handle errors.

I personally consider deep nesting to be an **anti-pattern**. Fortunately we can restructure the code for errors, clarity, and maintenance. Here we leverage the fact that a promise handler can return:

*  A value - that will be delivered to subsequent resolve handlers
*  A **promise** - that will create a branch queue of async activity
*  A exception - to reject sebsequent promise activity
*  A rejected promise - to propogate rejections to subsequent handlers

Since promise handlers can **return Promises**, let's use that technique to refactor a new implementation:

```javascript
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

The important change here is to notice that the reponse handler **returns** a Promise. See how the handler for `getFlightDetails()` returns a promise for `getPlaneDetails()`? And the success handler for `getPlaneDetails()` which returns a promise for `getForecast()` ? 

>
Remember that success handlers can return (1) the response value, (2) throw an exception, or (3) return a **Promise**

This is a good example of a flattened **promise chain** approach.

---

### Better Refactors

What else can we do? Notice that if we consider the async **request-response** pairs as a self-contained process, then we can simplify our code even further:

```javascript
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
								$scope.plane = plane;						// Response Handler #2
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

This is better; each segment of the *chain* is now a self-contained, named function. 

>
This solution has one (1) funky hack: In this approach, `loadWeatherForecast()` could accept a `plane` argument... but does not have direct access to the `flight` reference. Notice how the weather service had to use `$scope.flight.departure` within its `getForecast()` call. 

---

### Finally 

Finally, we should consider the dependencies of each segment of the *chain*. Notice that not all of our requests have to be sequential [and thus wait for all previous segments to finish first]. In our scenario, the Plane and Weather service calls could be requested in parallel [independent of each other]. 

We will use the `$q.all()` and the `$q.spread()` methods to condense our code and centralize all `$scope` changes. 

```javascript
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

The last version is very clean and terse. I simplified even further AND I also added a **exception handler**!

>
The `$q.spread()` is a special [add-on](https://github.com/ThomasBurleson/angularjs-FlightDashboard/blob/master/lib/%24QDecorator.js) that is currently not part of AngularJS. I used `$QDecorator` to decorate the $q service and provide this feature.

### Live Demo

Click here to open the [Live Demo](http://thomasburleson.github.io/angularjs-FlightDashboard/)

Open Chrome Developer tools and you can breakpoint/step thru the logic and code base:

![screen shot 2013-12-15 at 2 03 59 pm](https://f.cloud.github.com/assets/210413/1750999/562d582e-65c4-11e3-93ea-de9e5a1b0eed.jpg)

### Summary

Hopefully I have shown you some elegant and sophisticated techinques for chaining promises. The above chain even become more complicated:

![TreeOfChains](https://f.cloud.github.com/assets/210413/1750919/afbfb5a4-65be-11e3-93d6-b5b61865bd0b.jpg)

But even these complicated chains are easy to manage with the techniques that I have demonstrated.

And if this somewhat trivial example does  not convince you... check out a real-world refactor of the Dash.js class [DownloadRules.js](https://gist.github.com/ThomasBurleson/7576083). The link jumps the use to a Gist thread with source. Readers can see how complex code and logic can be reduced and flattened into something very manageable and conceptually understandable.

>
You will have to decide whether you want to nest or flatten your promise chains. Just note that all of these approaches are simply chaining of functions that either request more asynchronous activity or `handle` their async responses.
