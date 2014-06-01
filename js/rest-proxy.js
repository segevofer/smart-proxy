var app = angular.module("admin",[]);

var parseJSON = function(res) {
	var jres;
	try{
		jres = JSON.parse(res);
	}
	catch(ex){
		return null;
	}
	return jres;
};

app.controller("MainCtrl", function($scope) {

    var socket = io.connect("http://localhost:9091");

	$scope.map = {};
    $scope.options = {};

	$scope.showJSON = function(url, json) {
		$scope.selected = url;
		$scope.preview = json;
	}

    $scope.toggleListening = function() {
        socket.emit("setOptions", {
			listening: !$scope.options.listening
		});
    }
	
	$scope.setActive = function(url, json) {
		socket.emit("setURL", {
			url: url,
			active: json
		});
	}
	
	socket.on("interception",function (res) {
		if(!$scope.map[res.url]) $scope.map[res.url] = { url: res.url, data: [] };
		$scope.map[res.url].data.push(res);
		$scope.$digest();
	});
	
	socket.emit("ready");

	socket.on("init", function(data) {
		$scope.map = _.object(_.pluck(data.map, "url"), data.map);
        console.log("initialize",$scope.map);
        $scope.options = data.options;
		$scope.$digest();
	});

    socket.on("updateOptions",function(data){
        console.log("updateOptions",data);
        _.extend($scope.options, data);
		$scope.$digest();
    });
	
	socket.on("updateURL", function(obj) {
		console.log("updateURL", obj);
		_.extend($scope.map[obj.url], obj);
		if(!obj.active) delete $scope.map[obj.url].active;
		$scope.$digest();
	});

});

app.directive('jsonEditor', ['$timeout', function ($timeout) {
			return {
				restrict: 'A',
				require: '?ngModel',
				//scope: true,
				link: function (scope, elem, attrs, ngModel) {
				
					var node = elem[0];

					var editor = new jsoneditor.JSONEditor(node,{
						change: function() {
							$timeout(function () {
								scope.$apply(function () {
									var value = editor.get();
									ngModel.$setViewValue(value);
								});
							});
						}
					});

					// data binding to ngModel
					ngModel.$render = function () {
						editor.set(ngModel.$viewValue);
					};

				}
			};
		}]);