'use strict';

 angular.module('main')
 .controller('EventCtrl', function ($scope, $mdDialog, $mdToast, Event, Auth) {

  $scope.query = {
 		filter: '',
    date: null
 	};

 	$scope.events = [];

 	var showSimpleToast = function (message) {
 	  $mdToast.show(
 	    $mdToast.simple()
 		  .content(message)
 		  .action('OK')
 		  .hideDelay(3000)
 	  );
 	};

 	var loadEvents = function () {
    Auth.ensureLoggedIn().then(function () {
 		  $scope.promise = Event.all($scope.query).then(function (events) {
 			  $scope.events = events;
 		  });
    });
 	};

 	loadEvents();

  var loadCount = function () {
    Auth.ensureLoggedIn().then(function () {
      Event.count($scope.query).then(function (total) {
   		  $scope.query.total = total;
   	  });
    });
  }

  loadCount();

  $scope.onQueryChange = function () {
 		loadEvents();
    loadCount();
  }

 	$scope.onCreateEvent = function (ev) {

 		$mdDialog.show({
 			controller: 'DialogEventController',
 			templateUrl: '/views/partials/event.html',
 			parent: angular.element(document.body),
 			targetEvent: ev,
 			locals: {
 				event: null
 			},
 			clickOutsideToClose: true
 		})
 		.then(function (answer) {
 			loadEvents();
      loadCount();
 		});
 	};

 	$scope.openMenu = function ($mdOpenMenu, ev) {
 		$mdOpenMenu(ev);
 	};

 	$scope.onUpdateEvent = function (ev, event) {

    var objEvent = angular.copy(event);

 		$mdDialog.show({
 		  controller: 'DialogEventController',
 		  templateUrl: '/views/partials/event.html',
 		  parent: angular.element(document.body),
	    targetEvent: ev,
	    locals: {
        event: objEvent
      },
 		  clickOutsideToClose: true
 		}).then(function (answer) {
 			loadEvents();
      loadCount();
 		});
 	};

 	$scope.onDestroyEvent = function (ev, event) {

 	  var confirm = $mdDialog.confirm()
	    .title('Confirm action')
	    .content('Are you sure you want to delete this event?')
	 	  .ok('Delete')
	 	  .cancel('Cancel')
	 	  .targetEvent(ev);

 	  $mdDialog.show(confirm).then(function () {

   		Event.destroy(event).then(function (success) {
   		  showSimpleToast('Event deleted.');
   		  loadEvents();
        loadCount();
   	    },
   	    function (error) {
   		  showSimpleToast(error.message);
   		});

 	  });
 	};

}).controller('DialogEventController', function(
 	$scope, $mdDialog, $mdToast, Event, File, event) {

 	$scope.event = {};
 	$scope.imageFilename = '';
  $scope.isImageUploading = false;
 	$scope.isCreating = true;

 	if (event) {
 		$scope.event = event;
    $scope.imageFilename = $scope.event.image.name();
 		$scope.isCreating = false;
 	}

 	var showSimpleToast = function (message) {
 		$mdToast.show(
 			$mdToast.simple()
 			.content(message)
 			.action('OK')
 			.hideDelay(3000)
 		);
 	};

 	$scope.uploadImage = function (file, invalidFile) {

    if (file) {

      $scope.isImageUploading = true;
      $scope.imageFilename = file.name;

 		  File.upload(file).then(function (savedFile) {

        $scope.event.image = savedFile;
        $scope.isImageUploading = false;
        showSimpleToast('Image uploaded');
 		  },
      function (error) {
        $scope.isImageUploading = false;
        showSimpleToast(error.message);
 		  });

    } else {
      if (invalidFile) {
        if (invalidFile.$error === 'maxSize') {
          showSimpleToast('Image too big. Max ' + invalidFile.$errorParam);
        }
      }
    }
 	};

 	$scope.hide = function() {
 	  $mdDialog.cancel();
 	};

 	$scope.cancel = function() {
 	  $mdDialog.cancel();
 	};

 	$scope.onSaveEvent = function (isFormValid) {

 		if (!isFormValid) {
 			showSimpleToast('Please correct all highlighted errors.');
 		} else if (!$scope.event.image) {
 			showSimpleToast('Image is required.');
 		}
 		else {

      $scope.isSavingEvent = true;

 			Event.create($scope.event).then(function (event) {
 				showSimpleToast('Event saved');
 				$mdDialog.hide();
        $scope.isSavingEvent = false;
 			},
 			function (error) {
 				showSimpleToast(error.message);
        $scope.isSavingEvent = false;
 			});
 		}
 	};

 	$scope.onUpdateEvent = function (isFormValid) {

 		if(!isFormValid) {
 			showSimpleToast('Please correct all highlighted errors.');
 		} else {

      $scope.isSavingEvent = true;

 			Event.update($scope.event).then(function (event) {
 				showSimpleToast('Event updated');
 				$mdDialog.hide();
        $scope.isSavingEvent = false;
 			},
 			function (error) {
 				showSimpleToast(error.message);
        $scope.isSavingEvent = false;
 			});

 		}
 	};

});
