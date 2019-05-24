'use strict';

 angular.module('main')
 .controller('SponsorCtrl', function ($scope, $mdDialog, $mdToast, Sponsor, Auth) {

  $scope.query = {
 		filter: '',
 		total: 0,
 	};

 	$scope.sponsors = [];

 	var showSimpleToast = function (message) {
 	  $mdToast.show(
 	    $mdToast.simple()
 		  .content(message)
 		  .action('OK')
 		  .hideDelay(3000)
 	  );
 	};

 	var loadSponsors = function () {
    Auth.ensureLoggedIn().then(function () {
 		  $scope.promise = Sponsor.all($scope.query).then(function (sponsors) {
 			  $scope.sponsors = sponsors;
 		  });
    });
 	};

 	loadSponsors();

  var loadCount = function () {
    Auth.ensureLoggedIn().then(function () {
      Sponsor.count($scope.query).then(function (total) {
   		  $scope.query.total = total;
   	  });
    });
  }

  loadCount();

  $scope.onQueryChange = function () {
 		loadSponsors();
    loadCount();
  }

 	$scope.onCreateSponsor = function (ev) {

 		$mdDialog.show({
 			controller: 'DialogSponsorController',
 			templateUrl: '/views/partials/sponsor.html',
 			parent: angular.element(document.body),
 			targetEvent: ev,
 			locals: {
 				sponsor: null
 			},
 			clickOutsideToClose: true
 		})
 		.then(function (answer) {
 			loadSponsors();
      loadCount();
 		});
 	};

 	$scope.openMenu = function ($mdOpenMenu, ev) {
 		$mdOpenMenu(ev);
 	};

 	$scope.onUpdateSponsor = function (ev, sponsor) {

    var objSponsor = angular.copy(sponsor);

 		$mdDialog.show({
 		  controller: 'DialogSponsorController',
 		  templateUrl: '/views/partials/sponsor.html',
 		  parent: angular.element(document.body),
	    targetEvent: ev,
	    locals: {
        sponsor: objSponsor
      },
 		  clickOutsideToClose: true
 		}).then(function (answer) {
 			loadSponsors();
      loadCount();
 		});
 	};

 	$scope.onDestroySponsor = function (ev, sponsor) {

 	  var confirm = $mdDialog.confirm()
	    .title('Confirm action')
	    .content('Are you sure you want to delete this sponsor?')
	 	  .ok('Delete')
	 	  .cancel('Cancel')
	 	  .targetEvent(ev);

 	  $mdDialog.show(confirm).then(function () {

   		Sponsor.destroy(sponsor).then(function (success) {
   		  showSimpleToast('Sponsor deleted.');
   		  loadSponsors();
        loadCount();
   	    },
   	    function (error) {
   		  showSimpleToast(error.message);
   		});

 	  });
 	};

}).controller('DialogSponsorController', function(
 	$scope, $mdDialog, $mdToast, Sponsor, File, sponsor) {

 	$scope.sponsor = {
    website: 'http://'
  };
 	$scope.imageFilename = '';
  $scope.isImageUploading = false;
 	$scope.isCreating = true;

 	if (sponsor) {
 		$scope.sponsor = sponsor;
    $scope.imageFilename = $scope.sponsor.image.name();
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

        $scope.sponsor.image = savedFile;
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

 	$scope.onSaveSponsor = function (isFormValid) {

 		if (!isFormValid) {
 			showSimpleToast('Please correct all highlighted errors.');
 		} else if (!$scope.sponsor.image) {
 			showSimpleToast('Image is required.');
 		}
 		else {

      $scope.isSavingSponsor = true;

 			Sponsor.create($scope.sponsor).then(function (sponsor) {
 				showSimpleToast('Sponsor saved');
 				$mdDialog.hide();
        $scope.isSavingSponsor = false;
 			},
 			function (error) {
 				showSimpleToast(error.message);
        $scope.isSavingSponsor = false;
 			});
 		}
 	};

 	$scope.onUpdateSponsor = function (isFormValid) {

 		if (!isFormValid) {
 			showSimpleToast('Please correct all highlighted errors.');
 		} else {

      $scope.isSavingSponsor = true;

 			Sponsor.update($scope.sponsor).then(function (sponsor) {
 				showSimpleToast('Sponsor updated');
 				$mdDialog.hide();
        $scope.isSavingSponsor = false;
 			},
 			function (error) {
 				showSimpleToast(error.message);
        $scope.isSavingSponsor = false;
 			});

 		}
 	};

});
