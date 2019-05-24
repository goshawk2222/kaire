'use strict';

 angular.module('main').factory('Sponsor', function ($q) {

 	var Sponsor = Parse.Object.extend('Sponsor', {

  }, {

 		create: function (sponsor) {

 			var defer = $q.defer();

 			var objSponsor = new Sponsor();

 			objSponsor.save(sponsor, {
 				success: function (success) {
 					defer.resolve(success);
 				}, error: function (obj, error) {
 					defer.reject(error);
 				}
 			});

 			return defer.promise;
 		},

 		update: function (sponsor) {

 			var defer = $q.defer();

    	sponsor.save(null, {
    		success: function (success) {
    			defer.resolve(success);
    		}, error: function (obj, error) {
    			defer.reject(error);
    		}
    	});

    	return defer.promise;

 		},

 		destroy: function (sponsor) {

 			var defer = $q.defer();

 			sponsor.destroy({
 				success: function (obj) {
 					defer.resolve(obj);
 				}, error: function (obj, error) {
 					defer.reject(error);
 				}
 			});

 			return defer.promise;

 		},

 		all: function(params) {

 			var defer = $q.defer();

 			var query = new Parse.Query(this);

      if (params.filter != '') {
        query.contains('canonical', params.filter);
      }

      query.ascending('order');

 			query.find({
 				success: function (sponsors) {
 					defer.resolve(sponsors);
 				}, error: function (error) {
 					defer.reject(error);
 				}
 			});

 			return defer.promise;
 		},

    count: function (params) {

      var defer = $q.defer();

      var query = new Parse.Query(this);

      if (params.filter != '') {
        query.contains('canonical', params.filter);
      }

      query.count({
        success: function (count) {
          defer.resolve(count);
        },
        error: function (error) {
          defer.reject(error);
        }
      });

      return defer.promise;
    }

 	});

  Object.defineProperty(Sponsor.prototype, 'name', {
      get: function () {
          return this.get('name');
      },
      set: function (value) {
          this.set('name', value);
      }
  });

  Object.defineProperty(Sponsor.prototype, 'website', {
      get: function () {
          return this.get('website');
      },
      set: function (value) {
          this.set('website', value);
      }
  });

  Object.defineProperty(Sponsor.prototype, 'order', {
      get: function () {
          return this.get('order');
      },
      set: function (value) {
          this.set('order', value);
      }
  });

  Object.defineProperty(Sponsor.prototype, 'image', {
      get: function () {
          return this.get('image');
      },
      set: function (value) {
          this.set('image', value);
      }
  });


  Object.defineProperty(Sponsor.prototype, 'imageThumb', {
      get: function () {
          return this.get('imageThumb');
      }
  });

 	return Sponsor;

 });
