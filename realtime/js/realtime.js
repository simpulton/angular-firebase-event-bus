var app = angular.module('realtimeApp', ['firebase']);

app.constant('RESTFUL_URI', 'https://realtime-event-bus.firebaseio.com/');
app.constant('FIREBASE_URI', 'https://realtime-event-bus.firebaseio.com/');

app.controller('RealtimeCtrl', function ($scope, RealtimeService, CurrentOrderService) {
  var realtime = this;

  realtime.orders = RealtimeService.all();
  realtime.currentOrder = CurrentOrderService.currentOrder;

  $scope.$on('currentOrderUpdated', function () {
    realtime.currentOrder = CurrentOrderService.getCurrentOrder();
  });
});

app.directive('order',
  function ($firebaseObject, FIREBASE_URI, RESTService, CurrentOrderService) {
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

app.factory('RealtimeService', function ($firebaseArray, FIREBASE_URI) {
  var ref = new Firebase(FIREBASE_URI + 'realtime-orders');
  var orders = $firebaseArray(ref);

  var all = function () {
    return orders
  };

  return {
    all: all
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