'use strict';

/**
* @ngdoc service
* @name iamApp.ApiService
* @description
* # ApiService
* Factory in the iamApp.
*/
angular.module('iamApp')
.factory('ApiService', function ($http) {
  var service = {};
  service.api_key = 'A6P87EzvZRzA2qp385MzeWHR5';

  service.getDirectionssForRoute = function(route, callback){
    $http({
      method: 'GET',
      url: 'http://www.ctabustracker.com/bustime/api/v2/getdirections',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      params: {
        'format' : 'json',
        'key' : service.api_key,
        'rt' : route
      }
    }).then(function successCallback(response) {
      callback(response);
    }, function errorCallback(response) {
      callback(response);
    });
  };

  service.getBusesForRoute = function(route, callback){
    $http({
      method: 'GET',
      url: 'http://www.ctabustracker.com/bustime/api/v2/getvehicles',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      params: {
        'format' : 'json',
        'key' : service.api_key,
        'rt' : route
      }
    }).then(function successCallback(response) {
      callback(response);
    }, function errorCallback(response) {
      callback(response);
    });
  };

  service.getStopsForRoute = function(route, direction, callback){
    $http({
      method: 'GET',
      url: 'http://www.ctabustracker.com/bustime/api/v2/getstops',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      params: {
        'format' : 'json',
        'key' : service.api_key,
        'rt' : route,
        'dir' : direction
      }
    }).then(function successCallback(response) {
      callback(response);
    }, function errorCallback(response) {
      callback(response);
    });
  };

  service.getVehicle = function(vehicle, callback){
    $http({
      method: 'GET',
      url: 'http://www.ctabustracker.com/bustime/api/v2/getvehicles',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      params: {
        'format' : 'json',
        'key' : service.api_key,
        'vid' : vehicle.vid
      }
    }).then(function successCallback(response) {
      callback(response);
    }, function errorCallback(response) {
      callback(response);
    });
  };

  // Public API here
  return {
    getDirectionssForRoute: function(route, callback){
      service.getDirectionssForRoute(route, callback);
    },
    getBusesForRoute: function(route, callback){
      service.getBusesForRoute(route, callback);
    },
    getStopsForRoute: function(route, direction, callback){
      service.getStopsForRoute(route, direction, callback);
    },
    getVehicle: function(vehicle, callback){
      service.getVehicle(vehicle, callback);
    }
  };
});
