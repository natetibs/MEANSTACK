
var scotchTodo = angular.module('scotchTodo', []);

function mainController($scope, $http) {
    $scope.formData = {};

    // when landing on the page, get all scores and show them
    $http.get('/api/quotes')
        .success(function(data) {
            $scope.quotes = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });

}
