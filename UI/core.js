var squatApp = angular.module('squatApp', [])

function mainController ($scope, $http, $timeout) {

    $scope.formData = {to:"squattybot"};

    // when landing on the page, get all and show them
    $http.get('/api/quotes')
        .success(function(data) {
            newJson = [];
            for (var i = 0; i < data.length; i++) {
                if (!data[i].name.includes($scope.formData.name) && !data[i].to.includes($scope.formData.name)) delete data[i]
                else newJson.push(data[i])
            }
            data = newJson;
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
                $scope.formData = {name: $scope.formData.name, to: 'squattybot'}; // clear the form so our user is ready to enter another
                newJson = [];
                for (var i = 0; i < data.length; i++) {
                    if (!data[i].name.includes($scope.formData.name) && !data[i].to.includes($scope.formData.name)) delete data[i]
                    else newJson.push(data[i])
                }
                data = newJson;
                $scope.quotes = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };
    $scope.$watch('quotes.length', function(oldVal, newVal) {
        $timeout(
                () => {
                    var div = document.getElementById('messages')
                    div.scrollTop = div.scrollHeight
                }
            )
    }, true)
};
squatApp.controller("mainController", mainController);
