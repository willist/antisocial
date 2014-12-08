var ASQ = require('asynquence');
var config = require('../../config');
var db = require('../../db/db');


// =============================================================================
// HELPERS
// =============================================================================

/**
 * Most of our methods allow for either emails or ids
 * to be used in their search field. This standerdizes
 * the whole process.
 *
 * TODO: is it params or body (for email)
 *
 * @param {object} req The req from the client
 * @return {object} The search field for emails and ids
 */
var makeSearch = function(req) {
    var search = {};

    if (req.params.id || req.params._id) {
        search._id = req.params.id || req.params._id;
    } else if (req.params.email) {
        search.email = req.params.email;
    }

    return search;
};


// =============================================================================
// ROUTES
// =============================================================================

/**
 * Creates a new user in the database with the specified options
 *
 * Method   : POST
 * Path     : /api/users/
 */
exports.post = function(req, res) {
    var options = req.body;

    db.users.create(options)
        .val(function(user) { res.send(user); })
        .or(function(err) { res.status(400).send(err) });
};


/**
 * Updates a user in the database with the specified params
 *
 * Method   : PUT
 * Path     : /api/users/:id
 */
exports.put = function(req, res) {
    var search = makeSearch(req);

    var user = req.body;

    db.users.update(user)
        .val(function(numReplaced) { res.send(numReplaced); })
        .or(function(err) { res.status(400).send(err); })
};


/**
 * Removes a user in the database
 *
 * Method   : GET
 * Path     : /api/users/:id
 */
exports.getOne = function(req, res) {
    var search = makeSearch(req);

    db.users.get(search)
        .val(function(user) { res.send(user); })
        .or(function(err) { res.status(400).send(err); });
};


/**
 * removes a user in the database
 *
 * Method   : DELETE
 * Path     : /api/users/:id
 */
exports.del = function(req, res) {
    var search = makeSearch(req);

    db.users.remove(search)
        .val(function(numRemoved) { res.send(numRemoved); })
        .or(function(err) { res.status(400).send(err); });
};


