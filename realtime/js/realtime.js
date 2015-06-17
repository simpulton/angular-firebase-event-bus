var app = angular.module('realtimeApp', ['firebase']);

app.constant('RESTFUL_URI', 'https://realtime-event-bus.firebaseio.com/');
app.constant('FIREBASE_URI', 'https://realtime-event-bus.firebaseio.com/');

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

      orderCtrl.order.$loaded()
        .then(function () {
          orderCtrl.order.$watch(function () {
            orderCtrl.getOrder(orderCtrl.orderId);
          });
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

app.factory('RealtimeService', function ($firebaseArray, $firebaseObject, FIREBASE_URI) {
  var ref = new Firebase(FIREBASE_URI + 'realtime-orders');
  var orders = $firebaseArray(ref);

  var all = function () {
    return orders
  };

  var create = function(id) {
    var ref = new Firebase(FIREBASE_URI + 'realtime-orders/' + id);
    var order = $firebaseObject(ref);
    order.updated_at = new Date().toString();
    order.$save();
  };

  var save = function (id) {
    var order = orders.$getRecord(id);
    order.updated_at = new Date().toString();
    orders.$save(order);
  };

  var destroy = function (id) {
    var order = orders.$getRecord(id);
    orders.$remove(order);
  };

  return {
    all: all,
    create: create,
    save: save,
    destroy: destroy
  };
});

app.factory('RESTService', function ($http, RESTFUL_URI) {
  var getUrlWithId = function (orderId) {
    return RESTFUL_URI + 'orders/' + orderId + '.json';
  };

  var fetch = function (orderId) {
    return $http.get(getUrlWithId(orderId));
  };

  return {
    fetch: fetch
  };
});