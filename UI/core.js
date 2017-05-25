var squatApp = angular.module('squatApp', []);

function mainController($scope, $http) {

    $scope.formData = {};

    // when landing on the page, get all and show them
    $http.get('/api/quotes')
        .success(function(data) {
            $scope.quotes = data;
            console.log("Fu")
            console.log("DATA IS: " +data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });

    $scope.sendData = function() {
        $http.post('/api/quotes', $scope.formData)
            .success(function(data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.quotes = data;
                $(".messages").scrollTop = $(".messages").scrollHeight
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

};
