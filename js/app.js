var app = angular.module('myApp', ['firebase']);

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
        RealtimeService.save(result.name)
      });
  };

  $scope.updateOrder = function (id, title, description) {
    RESTService.update(id, title, description)
      .then(function (result) {
        RealtimeService.save(id);
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

app.controller('RealtimeCtrl', function ($scope, RESTService, RealtimeService, CurrentOrderService) {
  var realtime = this;

  realtime.orders = RealtimeService.all();
  realtime.currentOrder = CurrentOrderService.getCurrentOrder();

  $scope.$on('currentOrderUpdated', function () {
    realtime.currentOrder = CurrentOrderService.getCurrentOrder();
  });

  realtime.getOrder = function () {
    RESTService.all()
      .then(function (result) {
        realtime.orders = result !== 'null' ? result : {};
      });
  };
});

app.directive('order',
  function ($rootScope, $firebaseObject, RESTService, FIREBASE_URI, CurrentOrderService) {
    var controller = function () {
      var orderCtrl = this,
        ref = new Firebase(FIREBASE_URI + 'realtime-orders/' + orderCtrl.orderId);

      orderCtrl.order = $firebaseObject(ref);

      orderCtrl.order.$watch(function () {
        console.log('HELLO! HELLO!', orderCtrl.orderId);
        
        orderCtrl.getOrder(orderCtrl.orderId);
      });

      orderCtrl.getOrder = function (id) {
        RESTService.fetch(id)
          .then(function (result) {
            CurrentOrderService.setCurrentOrder(result.data);
          });
      };
    };

    return {
      scope: true,
      bindToController: {
        orderId: '@'
      },
      controller: controller,
      controllerAs: 'orderCtrl'
    };
  });

app.factory('CurrentOrderService', function ($rootScope) {
  var currentOrder = {};

  var getCurrentOrder = function () {
    return currentOrder;
  };

  var setCurrentOrder = function (order) {
    currentOrder = order;
    $rootScope.$broadcast('currentOrderUpdated');
  };

  return {
    getCurrentOrder: getCurrentOrder,
    setCurrentOrder: setCurrentOrder
  };
});

app.factory('RealtimeService', function ($firebaseArray, FIREBASE_URI) {
  var orders = $firebaseArray(new Firebase(FIREBASE_URI + 'realtime-orders'));

  var all = function () {
    return orders
  };

  var save = function (id) {
    var orderIndex = orders.$indexFor(id);
    var order = orders[orderIndex];
    order.updated_at = new Date();
    orders.$save(order);
  };

  var destroy = function (id) {
    var child = orders.$child(id);
    child.$remove();
  };

  return {
    all: all,
    save: save,
    destroy: destroy
  };
});

app.factory('RESTService', function ($http, $q, FIREBASE_URI) {
  var getUrl = function () {
    return FIREBASE_URI + 'orders.json';
  };

  var getUrlWithId = function (orderId) {
    return FIREBASE_URI + 'orders/' + orderId + '.json';
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