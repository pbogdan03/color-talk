var app = angular.module('colorTalk', ['ui.router']);

app.run(['$rootScope', function($rootScope){
  $rootScope.talkColor = 'white';
}]);

app.factory('talks', ['$http', 'auth', function($http, auth){
  var o = {
    talks: []
  };

  o.getAll = function() {
    return $http.get('/talks').success(function(data) {
      angular.copy(data, o.talks);
    });
  }

  o.create = function(talk) {
    return $http.post('/talks', talk, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    }).success(function(data) {
      o.talks.push(data);
    });
  }

  o.upvote = function(username, talk) {
    if(talk.voted.indexOf(username) < 0) {
      return $http.put('/talks/' + talk._id + '/upvote', null, {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      }).success(function(data) {
            talk.upvotes += 1;
            talk.voted.push(username);
        });
    }
  };

  o.downvote = function(username, talk) {
    if(talk.voted.indexOf(username) < 0) {
      return $http.put('/talks/' + talk._id + '/downvote', null, {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      }).success(function(data) {
          talk.upvotes = talk.upvotes > 0 ? talk.upvotes - 1 : 0;
          talk.voted.push(username);
        });
    }
  };

  o.get = function(id) {
    return $http.get('/talks/' + id).then(function(res) {
      return res.data;
    });
  };

  o.addComment = function(id, comment) {
    return $http.post('/talks/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    });
  };

  o.upvoteComment = function(username, talk, comment) {
    if(comment.voted.indexOf(username) < 0) {
      return $http.put('/talks/' + talk._id + '/comments/' + comment._id + '/upvote', null, {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      }).success(function(data) {
          comment.upvotes += 1;
          comment.voted.push(username);
        });
    }
  };

  o.downvoteComment = function(username, talk, comment) {
    if(comment.voted.indexOf(username) < 0) {
      return $http.put('/talks/' + talk._id + '/comments/' + comment._id + '/downvote', null, {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      }).success(function(data) {
          comment.upvotes = comment.upvotes > 0 ? comment.upvotes - 1 : 0;
          comment.voted.push(username);
        });
    }
  };

  return o;
}]);

app.factory('auth', ['$http', '$window', function($http, $window) {
  var auth = {};

  auth.saveToken = function (token) {
    $window.localStorage['color-talk-token'] = token;
  };

  auth.getToken = function() {
    return $window.localStorage['color-talk-token'];
  };

  auth.isLoggedIn = function() {
    var token = auth.getToken();

    if(token) {
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  auth.currentUser = function() {
    if(auth.isLoggedIn()) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };

  auth.register = function(user) {
    return $http.post('/register', user).success(function(data) {
      auth.saveToken(data.token);
    });
  };

  auth.logIn = function(user) {
    return $http.post('/login', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logOut = function() {
    $window.localStorage.removeItem('color-talk-token');
  };

  return auth;
}]);

app.controller('MainCtrl', ['$scope', 'talks', 'auth', function($scope, talks, auth) {
  $scope.talks = talks.talks;
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.activeForm = true;
  var currentUser = auth.currentUser();

  $scope.addTalk = function() {
    if($scope.title && $scope.title !== '') {
      talks.create({
        title: $scope.title, 
        link: $scope.link
      });
      $scope.title = '';
      $scope.link = '';
    }
  };

  $scope.incrementUpvotes = function(talk) {
    talks.upvote(currentUser, talk);
  };

  $scope.decrementUpvotes = function(talk) {
    talks.downvote(currentUser, talk);
  };

  $scope.commentsNumber = function(talk) {
    return talk.comments.length;
  };
}]);

app.controller('TalksCtrl', ['$scope', 'talks', 'talk', 'auth', function($scope, talks, talk, auth) {

  $scope.talk = talk;
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.activeForm = true;
  var currentUser = auth.currentUser();

  $scope.addComment = function() {
    if($scope.body && $scope.body !== '' && $scope.author && $scope.author !== '') {
      talks.addComment(talk._id, {
        body: $scope.body,
        author: $scope.author
      }).success(function(comment) {
        $scope.talk.comments.push(comment);
      });
      $scope.body = '';
      $scope.author = '';
    }
  };

  $scope.incrementUpvotes = function(comment) {
    talks.upvoteComment(currentUser, talk, comment);
  };

  $scope.decrementUpvotes = function(comment) {
    talks.downvoteComment(currentUser, talk, comment);
  };

}]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth) {
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function() {
      $state.go('home');
    });
  };

  $scope.logIn = function() {
    auth.logIn($scope.user).error(function(error) {
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}]);

app.controller('NavCtrl', ['$scope', '$rootScope', 'auth', function($scope, $rootScope, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
  $scope.changeColor = function(color) {
    $rootScope.talkColor = color;
  };
}]);

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      resolve: {
        talkPromise: ['talks', function(talks) {
          return talks.getAll();
        }]
      }
    })
    .state('talks', {
      url: '/talks/{id}',
      templateUrl: '/talks.html',
      controller: 'TalksCtrl',
      resolve: {
        talk: ['$stateParams', 'talks', function($stateParams, talks) {
          return talks.get($stateParams.id);
        }]
      }
    })
    .state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth) {
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    .state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    });

  $urlRouterProvider.otherwise('home');
}])