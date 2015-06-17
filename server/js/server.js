var app = angular.module('serverApp', []);

app.constant('RESTFUL_URI', 'https://realtime-event-bus.firebaseio.com/');
app.constant('FIREBASE_URI', 'https://realtime-event-bus.firebaseio.com/');

app.controller('ServerCtrl', function ($scope, RESTService, RealtimeService) {
  var server = this;

  server.newOrder = {
    title: '',
    description: ''
  };

  server.resetForm = function () {
    server.newOrder = {
      title: '',
      description: ''
    };
  };

  server.getOrders = function () {
    RESTService.all()
      .then(function (result) {
        server.orders = result.data !== 'null' ? result.data : {};
      });
  };

  server.createOrder = function (title, description) {
    RESTService.create(title, description)
      .then(function (result) {
        server.getOrders();
        server.resetForm();
        RealtimeService.update(result.data.name)
      });
  };

  $scope.updateOrder = function (id, title, description) {
    RESTService.update(id, title, description)
      .then(function (result) {
        RealtimeService.update(id);
      });
  };

  $scope.removeOrder = function (id) {
    RESTService.destroy(id)
      .then(function () {
        server.getOrders();
        RealtimeService.destroy(id);
      });
  };

  server.getOrders();
});

app.factory('RealtimeService', function ($http, FIREBASE_URI) {
  var getUrlWithId = function (id) {
    return FIREBASE_URI + 'realtime-orders/' + id + '.json';
  };

  var update = function (id) {
    var params = {updated_at: new Date().toString()};
    return $http.put(getUrlWithId(id), params);
  };

  var destroy = function (id) {
    return $http.delete(getUrlWithId(id));
  };

  return {
    update: update,
    destroy: destroy
  };
});

app.factory('RESTService', function ($http, RESTFUL_URI) {
  var getUrl = function () {
    return RESTFUL_URI + 'orders.json';
  };

  var getUrlWithId = function (orderId) {
    return RESTFUL_URI + 'orders/' + orderId + '.json';
  };

  var all = function () {
    return $http.get(getUrl());
  };

  var fetch = function (orderId) {
    return $http.get(getUrlWithId(orderId));
  };

  var create = function (title, description) {
    var params = {title: title, description: description};
    return $http.post(getUrl(), params);
  };

  var update = function (orderId, title, description) {
    var params = {title: title, description: description};
    return $http.put(getUrlWithId(orderId), params);
  };

  var destroy = function (orderId) {
    return $http.delete(getUrlWithId(orderId));
  };

  return {
    all: all,
    fetch: fetch,
    create: create,
    update: update,
    destroy: destroy
  };
});