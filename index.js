var Promise = require('es6-promise').Promise;
var reqlog = require('reqlog');
var responseBuilder = require('apier-responsebuilder');

// if true, no reject will be done but it will automatically respond
// with an INTERNAL_SERVER_ERROR
exports.handleError = true;

/**
 * Create a new documents
 * @method function
 * @param  {object} req          The request object
 * @param  {object} res          The response object
 * @param  {object} mongoose     The mongoose instance
 * @param  {object} customSchema The schema to use
 * @param  {string} schemaName   The schema name
 * @param  {object} save         The object to save
 * @param  {string} populations  Space delimited document attributes to populate
 * @return {promise}             A promise
 */
exports.create = function(req, res, mongoose, customSchema, schemaName, save,
	populations) {
	reqlog.info(schemaName + '.create', save);

	return new Promise(function(resolve, reject) {
		var Model = mongoose.model(schemaName, customSchema);

		Model.create(save, function(error, result) {
			// if there are populations, do them, or resolve the promise
			if (populations) {
				var options = [{path: populations}];
				Model.populate(result, options, function(error, result) {
					callback(req, res, resolve, reject, error, result,
						'User.create');
				});
			}

			callback(req, res, resolve, reject, error, result, 'User.create');
		});
	});
};

exports.findOne = function(req, res, mongoose, customSchema, schemaName, query,
	populations) {
	reqlog.info(schemaName + '.findOne', query);

	return new Promise(function(resolve, reject) {
		var Model = mongoose.model(schemaName, customSchema);

		Model
		.findOne(query)
		.populate(populations || '')
		.exec(function(error, result) {
			callback(req, res, resolve, reject, error, result, 'User.findOne');
		});
	});
};

exports.findById = function(req, res, mongoose, customSchema, schemaName, id,
	populations, exclude) {
	reqlog.info(schemaName + '.findById', id);

	return new Promise(function(resolve, reject) {
		var Model = mongoose.model(schemaName, customSchema);

		Model
		.findById(id)
		.populate(populations || '')
		// .select(getFields(Model, exclude, req.data.activeUser &&
		// 	req.data.activeUser.type) || '')
		.exec(function(error, result) {
			callback(req, res, resolve, reject, error, result, 'User.findById');
		});
	});
};
//
// exports.findByIdAndRemove = function(req, res, customSchema, schemaName, id, populations) {
// 	reqlog.info(schemaName + '.findByIdAndRemove', id);
//
// 	return new Promise(function(resolve) {
// 		var Model = mongoose.model(schemaName, customSchema);
//
// 		Model
// 		.findByIdAndRemove(id)
// 		.populate(populations || '')
// 		.exec(function(error, result) {
// 			if (!error) {
// 				var finalResult = callback(req, error, result);
// 				reqlog.info(schemaName + '.findByIdAndRemove.success', finalResult);
// 				resolve(finalResult);
// 			} else {
// 				reqlog.info('internal server error', error);
// 				errorHandler.error(req, res, 'INTERNAL_SERVER_ERROR');
// 			}
// 		});
// 	});
// };

exports.find = function(req, res, mongoose, customSchema, schemaName, query,
	populations, exclude) {
	reqlog.info(schemaName + '.find', query);

	return new Promise(function(resolve, reject) {
		var Model = mongoose.model(schemaName, customSchema);

		Model
		.find(query)
		.populate(populations || '')
		// .select(getFields(Model, exclude, req.data.activeUser && req.data.activeUser.type) || '')
		.exec(function(error, result) {
			callback(req, res, resolve, reject, error, result, 'User.find');
		});
	});
};
//
// exports.findOneAndUpdate = function(req, res, customSchema, schemaName, query, update, options, populations) {
// 	reqlog.info(schemaName + '.findOneAndUpdate', query, update);
//
// 	return new Promise(function(resolve) {
// 		var Model = mongoose.model(schemaName, customSchema);
//
// 		Model
// 		.findOneAndUpdate(query, update, options)
// 		.populate(populations || '')
// 		.exec(function(error, result) {
// 			if (!error) {
// 				var finalResult = callback(req, error, result);
// 				reqlog.info(schemaName + '.findOneAndUpdate.success', finalResult);
// 				resolve(finalResult);
// 			} else {
// 				reqlog.info('internal server error', error);
// 				errorHandler.error(req, res, 'INTERNAL_SERVER_ERROR');
// 			}
// 		});
// 	});
// };
//
// exports.findByIdAndUpdate = function(req, res, customSchema, schemaName, id, update, options, populations) {
// 	reqlog.info(schemaName + '.findByIdAndUpdate', id, update);
//
// 	return new Promise(function(resolve) {
// 		var Model = mongoose.model(schemaName, customSchema);
//
// 		Model
// 		.findByIdAndUpdate(id, update, options)
// 		.populate(populations || '')
// 		.exec(function(error, result) {
// 			if (!error) {
// 				var finalResult = callback(req, error, result);
// 				reqlog.info(schemaName + '.findByIdAndUpdate.success', finalResult);
// 				resolve(finalResult);
// 			} else {
// 				reqlog.info('internal server error', error);
// 				errorHandler.error(req, res, 'INTERNAL_SERVER_ERROR');
// 			}
// 		});
// 	});
// };
//
// // NOTE: mongoose method update returns the number of documents updated
// // You need to query the object in the service to return it
// exports.update = function(req, res, customSchema, schemaName, query, update, options) {
// 	reqlog.info(schemaName + '.update', query, update, options);
//
// 	return new Promise(function(resolve) {
// 		var Model = mongoose.model(schemaName, customSchema);
//
// 		Model
// 		.update(query, update, options)
// 		.exec(function(error, result) {
// 			if (!error) {
// 				var finalResult = callback(req, error, result);
// 				reqlog.info(schemaName + '.update.success', finalResult);
// 				resolve(finalResult);
// 			} else {
// 				reqlog.info('internal server error', error);
// 				errorHandler.error(req, res, 'INTERNAL_SERVER_ERROR');
// 			}
// 		});
//
// 	});
// };

function callback(req, res, resolve, reject, error, result, action) {
	if (error) {
		reqlog.error('internal server error', error);
		if (exports.handleError) {
			responseBuilder.error(req, res, 'INTERNAL_SERVER_ERROR');
		} else {
			reject(error);
		}
	} else {
		// filter the result attributes to send only those that this userType can see
		// check if the result is an array, to iterate it
		if (Array.isArray(result)) {
			for (var i = 0, length = result.length; i < length; i++) {
				result[i] = permissions(result[i]);
			}
		} else {
			result = permissions(result);
		}
		reqlog.info(action + '.success', result);
		resolve(result);
	}

	function permissions(object) {
		// var filters = object.getFilters();
		// var userType = req.data.activeUser && req.data.activeUser.type || 'null';
		// // for unknown reason, the log of object, exists in object._doc
		// for (var attribute in object._doc) {
		// 	if (object._doc.hasOwnProperty(attribute)) {
		// 		if (
		// 			!filters[attribute] // if this attribute is not defined in filters
		// 			|| filters[attribute][0] !== 'null' // this attribute is not set as public
		// 			&& filters[attribute].indexOf(userType) === -1 // this attribute is not available to this userType
		// 			&& userType !== 'admin' // the user is not admin
		// 		) {
		// 			// dont return this attribute
		// 			delete object._doc[attribute];
		// 		}
		// 	}
		// }

		return object;
	}
}

function getFields(Model, requestExclude, userType) {
	// will store the schema attributes that need to be excluded
	var exclude = [];
	// get the schema permissions
	var permissions = Model.permissions();

	for (var attribute in permissions) {
		if (
			permissions[attribute][0] !== 'null' &&
			userType !== 'admin' &&
			permissions[attribute].indexOf(userType) === -1
		) {
			exclude.push(attribute);
		}
	}

	// add the user requested exclude fields
	exclude = exclude.concat(requestExclude || []);

	exclude = '-' + exclude.join(' -');

	if (exclude) {
		// debugger;
	}

	return exclude;
}
