'use strict';

 angular.module('main').factory('Event', function ($q, moment) {

 	var Event = Parse.Object.extend('Event', {

  }, {

 		create: function (event) {

 			var defer = $q.defer();

 			var objEvent = new Event();

 			objEvent.save(event, {
 				success: function (success) {
 					defer.resolve(success);
 				}, error: function (obj, error) {
 					defer.reject(error);
 				}
 			});

 			return defer.promise;
 		},

 		update: function (event) {

 			var defer = $q.defer();

    	event.save(null, {
    		success: function (success) {
    			defer.resolve(success);
    		}, error: function (obj, error) {
    			defer.reject(error);
    		}
    	});

    	return defer.promise;

 		},

 		destroy: function (event) {

 			var defer = $q.defer();

 			event.destroy({
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

      if (params.date && params.date !== null) {
        var start = moment(params.date).startOf('day');
        var end = moment(params.date).endOf('day');
        query.greaterThanOrEqualTo('createdAt', start.toDate());
        query.lessThanOrEqualTo('createdAt', end.toDate());
      }

      query.ascending('start');

 			query.find({
 				success: function(events) {
 					defer.resolve(events);
 				}, error: function(error) {
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

      if (params.date && params.date !== null) {
        var start = moment(params.date).startOf('day');
        var end = moment(params.date).endOf('day');
        query.greaterThanOrEqualTo('createdAt', start.toDate());
        query.lessThanOrEqualTo('createdAt', end.toDate());
      }

      query.count({
        success: function(count) {
          defer.resolve(count);
        },
        error: function(error) {
          defer.reject(error);
        }
      });

      return defer.promise;
    }

 	});

    Object.defineProperty(Event.prototype, 'title', {
        get: function () {
            return this.get('title');
        },
        set: function (value) {
            this.set('title', value);
        }
    });

    Object.defineProperty(Event.prototype, 'description', {
        get: function () {
            return this.get('description');
        },
        set: function (value) {
            this.set('description', value);
        }
    });

    Object.defineProperty(Event.prototype, 'start', {
        get: function () {
            return this.get('start');
        },
        set: function (value) {
            this.set('start', value);
        }
    });

    Object.defineProperty(Event.prototype, 'duration', {
        get: function () {
            return this.get('duration');
        },
        set: function (value) {
            this.set('duration', value);
        }
    });

    Object.defineProperty(Event.prototype, 'location', {
        get: function () {
            return this.get('location');
        },
        set: function (value) {
            this.set('location', value);
        }
    });

    Object.defineProperty(Event.prototype, 'image', {
        get: function () {
            return this.get('image');
        },
        set: function (value) {
            this.set('image', value);
        }
    });


    Object.defineProperty(Event.prototype, 'imageThumb', {
        get: function () {
            return this.get('imageThumb');
        }
    });

 	return Event;

 });
