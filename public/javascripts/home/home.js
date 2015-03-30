(function() {
  'use strict';

  angular
    .module('app.home')
    .controller('Home', Home);

  Home.$inject = ['$scope', 'talks', 'auth'];

  function Home($scope, talks, auth) {
    var vm = this,
        currentUser = auth.currentUser();

    vm.talks = talks.talks;
    vm.isLoggedIn = auth.isLoggedIn;
    vm.activeForm = true;
    vm.addTalk = addTalk;
    vm.incrementUpvotes = incrementUpvotes;
    vm.decrementUpvotes = decrementUpvotes;
    vm.commentsNumber = commentsNumber;

    function addTalk() {
      if(vm.title && vm.title !== '') {
        talks.create({
          title: vm.title,
          color: vm.color || 'grey',
          author: currentUser
        });
        vm.title = '';
      }
    }

    function incrementUpvotes(talk) {
      talks.upvote(currentUser, talk);
    }

    function decrementUpvotes(talk) {
      talks.downvote(currentUser, talk);
    }

    function commentsNumber(talk) {
      return talk.comments.length
    }
  }
})();