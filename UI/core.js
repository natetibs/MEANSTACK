var squatApp = angular.module('squatApp', [])

function mainController ($scope, $http, $timeout, $routeParams) {

    var QueryString = function () {
      // This function is anonymous, is executed immediately and
      // the return value is assigned to QueryString!
      var query_string = {};
      var query = window.location.search.substring(1);
      var vars = query.split("&");
      for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
            // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
          query_string[pair[0]] = decodeURIComponent(pair[1]);
            // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
          var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
          query_string[pair[0]] = arr;
            // If third or later entry with this name
        } else {
          query_string[pair[0]].push(decodeURIComponent(pair[1]));
        }
      }
      return query_string;
    }();
    $scope.formData = {name:QueryString.name,to:'squattybot'}
    // when landing on the page, get all and show them
    $http.get('/api/quotes')
        .success(function(data) {
            console.log($routeParams)
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
    $scope.goData = function() {
      $http.post('/api/quotes', $scope.formData)
          .success(function(data) {
              let user = $scope.formData.name;
              $scope.formData = {name: $scope.formData.name, to: 'squattybot'}; // clear the form so our user is ready to enter another
              newJson = [];
              for (var i = 0; i < data.length; i++) {
                  if (!data[i].name.includes($scope.formData.name) && !data[i].to.includes($scope.formData.name)) delete data[i]
                  else newJson.push(data[i])
              }
              data = newJson;
              $scope.quotes = data;
              console.log(data);
              document.location = "landing.html?name=" + user;
          })
          .error(function(data) {
              console.log('Error: ' + data);
          });

    }
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
