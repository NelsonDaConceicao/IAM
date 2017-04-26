'use strict';

/**
* @ngdoc function
* @name iamApp.controller:MainCtrl
* @description
* # MainCtrl
* Controller of the iamApp
*/
angular.module('iamApp')
.controller('MainCtrl', function ($route, $location, $window, ApiService) {
  var $ctrl = this;

  $ctrl.labels = {
    route : "Numéro de la ligne",
    direction : "Direction du bus",
    stop : "Arrêt de bus",
    search : "Rechercher",
    validate : "Valider"
  };
  $ctrl.informations = "Veuillez séléctionner la direction que prenait le bus lorsque vous en êtes descendus.";
  $ctrl.search = {
    route : 22,
    direction : null,
    stop : null
  };

  $ctrl.listBuses = null;
  $ctrl.listStops = null;
  $ctrl.listDirections = null;

  $ctrl.listStopsMarkers = [];
  $ctrl.BusTrackedMarker = null;
  $ctrl.busStopPosition = null;
  $ctrl.busTracked = null;

  $ctrl.isDirectionValid = false;
  $ctrl.isSearchValid = false;

  $ctrl.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: {lat: 41.980262, lng: -87.668452}
  });

  $ctrl.init = function(){
    var directions = ApiService.getDirectionssForRoute($ctrl.search.route, function(response){
      if(response.status == 200){
        $ctrl.listDirections = response.data['bustime-response'];
        console.log($ctrl.listDirections);
      } else {
        console.log(response);
      }
    });
  };
  $ctrl.initMap = function(){
    var officePosition = {lat: 41.980262, lng: -87.668452};

    var officeContentString = '<div id="content">'+
    '<div id="siteNotice">'+
    '</div>'+
    '<h4 id="firstHeading" class="firstHeading">Vous</h4>'+
    '<div id="bodyContent">'+
    '<p>Votre position actuelle</p>'+
    '</div>'+
    '</div>';
    var officeInfowindow = new google.maps.InfoWindow({
      content: officeContentString
    });
    var officeMarker = new google.maps.Marker({
      position: officePosition,
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      map: $ctrl.map,
      title: 'Bureau'
    });
    officeMarker.addListener('click', function() {
      officeInfowindow.open($ctrl.map, officeMarker);
    });
  };
  $ctrl.validateSearch = function(values){
    console.log(values);
    if(!$ctrl.isDirectionValid && values.route != null && values.direction != null){
      $ctrl.isDirectionValid = true;
      $ctrl.informations = "Veuillez séléctionner l'arrêt de bus au-quel vous vous êtes arrêté. Vous pouvez cliquer sur les points de la map afin d'obtenir des informations supplémentaires sur les arrêts";
      // Affiche l'ensemble des arrêt de bus dans la direction voulue pour que
      // L'utilisateur puisse retrouver le nom plus facilement
      var stops = ApiService.getStopsForRoute(values.route, values.direction, function(response){
        if(response.status == 200){
          $ctrl.listStops = response.data['bustime-response'];
          console.log($ctrl.listStops);

          $ctrl.listStops.stops.forEach(function(element, index){
            $ctrl.addBusStop(element);
          });
        } else {
          console.log(response);
        }
      });
    } else {
      $ctrl.isDirectionValid = false;
    }
  };
  $ctrl.searchBus = function (values){
    console.log(values);
    // Vérification des valeurs et suppressions des arrêts de bus
    if($ctrl.isDirectionValid && values.route != null && values.direction != null && values.stop != null){
      $ctrl.isSearchValid = true;
      $ctrl.informations = "Nous avons identifier pour vous le bus ayant le plus de chance de contenir la valise. Vous pouvez suivre à tout moment le déplacement du bus (marqueur rouge) par rapport à votre position (marqueur blueue) et à la position de votre arrêt (marqueur jaune). Si vous souhaitez réinitialiser la recherche, cliquez sur le lien disponible ci-dessus.";
      $ctrl.listStopsMarkers.forEach(function(element, index){
        element.setMap(null);
      });

      // Création de l'arrêt de bus séléctionné par l'utilisateur
      var busStop = JSON.parse(values.stop);
      $ctrl.addBusStop(busStop);
      $ctrl.busStopPosition = {lat: parseFloat(busStop.lat), lng: parseFloat(busStop.lon)};

      // Recherche du bus approprié
      var buses = ApiService.getBusesForRoute(values.route, function(response){
        if(response.status == 200){
          $ctrl.listBuses = response.data['bustime-response'];
          console.log($ctrl.listBuses);

          var potential = [];
          $ctrl.listBuses.vehicle.forEach(function(element, index){
            // Faire quelque chose
            if(values.direction === "Northbound"){
              console.log("NORTH");
              if(element.hdg > 270 || element.hdg < 90){
                if(parseFloat(element.lat) > $ctrl.busStopPosition.lat){
                  potential.push(element);
                }
              }
            } else{
              if(element.hdg < 270 && element.hdg > 90){
                console.log("SOUTH");
                if(parseFloat(element.lat) < $ctrl.busStopPosition.lat){
                  potential.push(element);
                }
              }
            }
          });

          // Tri le tableau selon le plus proche de l'arrêt de bus
          if(values.direction === "Northbound"){
            potential.sort(function(a,b){
              return a.lat - b.lat;
            });
          } else {
            potential.sort(function(a,b){
              return a.lat + b.lat;
            });
          }

          console.log(potential);

          // Suavegarde le résultat
          if(potential[0] != null){
            $ctrl.busTracked = potential[0];
            $ctrl.trackBus();
          }
        } else {
          console.log(response);
        }
      });
    } else {
      $ctrl.isSearchValid = false;
    }
  }
  $ctrl.trackBus = function(){
    var bus = {lat: parseFloat($ctrl.busTracked.lat), lng: parseFloat($ctrl.busTracked.lon)};
    var busContentString = '<div id="content">'+
    '<div id="siteNotice">'+
    '</div>'+
    '<h4 id="firstHeading" class="firstHeading">Bus contenant potentiellement votre valise - N° : ' + $ctrl.busTracked.vid + '</h4>'+
    '<div id="bodyContent">'+
    '<p>Bus contenant potentiellement votre valise. Durée estimé avant son arrivée à votre arrêt : "' + "busStop.stpnm" + '"</p>'+
    '</div>'+
    '</div>';
    var busInfowindow = new google.maps.InfoWindow({
      content: busContentString
    });

    if($ctrl.BusTrackedMarker != null){
      $ctrl.BusTrackedMarker.setMap(null);
    }

    $ctrl.BusTrackedMarker = new google.maps.Marker({
      position: bus,
      icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      map: $ctrl.map,
      title: 'Bus'
    });
    $ctrl.BusTrackedMarker .addListener('click', function() {
      busInfowindow.open($ctrl.map, $ctrl.BusTrackedMarker);
    });

    setInterval(function(){
      var bus = ApiService.getVehicle($ctrl.busTracked, function(response){
        if(response.status == 200){
          var vehicle = response.data['bustime-response'].vehicle;
          vehicle.forEach(function(element, index){
            $ctrl.busTracked = element;
          });
          console.log($ctrl.busTracked);

          var bus = {lat: parseFloat($ctrl.busTracked.lat), lng: parseFloat($ctrl.busTracked.lon)};
          var busContentString = '<div id="content">'+
          '<div id="siteNotice">'+
          '</div>'+
          '<h4 id="firstHeading" class="firstHeading">Bus contenant potentiellement votre valise - N° : ' + $ctrl.busTracked.vid + '</h4>'+
          '<div id="bodyContent">'+
          '<p>Bus contenant potentiellement votre valise. Durée estimé avant son arrivée à votre arrêt : "' + "busStop.stpnm" + '"</p>'+
          '</div>'+
          '</div>';
          var busInfowindow = new google.maps.InfoWindow({
            content: busContentString
          });

          if($ctrl.BusTrackedMarker != null){
            $ctrl.BusTrackedMarker.setMap(null);
          }

          $ctrl.BusTrackedMarker = new google.maps.Marker({
            position: bus,
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            map: $ctrl.map,
            title: 'Bus'
          });
          $ctrl.BusTrackedMarker .addListener('click', function() {
            busInfowindow.open($ctrl.map, $ctrl.BusTrackedMarker);
          });

          // Alerte
          var lat_bus = parseFloat($ctrl.busTracked.lat);
          var lat_stop = parseFloat($ctrl.busStopPosition.lat);
          var distance_alert = parseFloat((1/69)/3);
          console.log(lat_bus);
          console.log(lat_stop);
          console.log(distance_alert);

          if($ctrl.search.direction === "Northbound"){
            if(lat_stop - lat_bus <= distance_alert && lat_stop - lat_bus > 0){
              $ctrl.informations = "ATTENTION : IL EST TEMPS DE PARTIR POUR RECUPERER VOTRE BIEN";
            }
          } else {
            if(lat_bus - lat_stop <= distance_alert && lat_bus - lat_stop > 0){
              $ctrl.informations = "ATTENTION : IL EST TEMPS DE PARTIR POUR RECUPERER VOTRE BIEN";
            }
          }
        } else {
          console.log(response);
        }
      });
    }, 60000);
  }

  $ctrl.addBusStop = function (busStop){
    var stop = {lat: parseFloat(busStop.lat), lng: parseFloat(busStop.lon)};
    var stopContentString = '<div id="content">'+
    '<div id="siteNotice">'+
    '</div>'+
    '<h4 id="firstHeading" class="firstHeading">Stop "' + busStop.stpnm + '" - N° : ' + busStop.stpid + '</h4>'+
    '<div id="bodyContent">'+
    '<p>Arrêt de bus "' + busStop.stpnm + '"</p>'+
    '</div>'+
    '</div>';
    var stopInfowindow = new google.maps.InfoWindow({
      content: stopContentString
    });
    var marker = new google.maps.Marker({
      position: stop,
      icon: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
      map: $ctrl.map,
      title: 'Stop'
    });
    marker.addListener('click', function() {
      stopInfowindow.open($ctrl.map, marker);
    });
    $ctrl.listStopsMarkers.push(marker);
  }
  $ctrl.resetAll = function (){
    $window.location.reload();
  }

  // Initialisation du controller
  $ctrl.init();
  $ctrl.initMap();
});
