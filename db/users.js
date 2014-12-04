var Datastore = require('nedb')
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var ASQ = require('asynquence');

/**
 * =============================================================================
 * THE USER (GENERAL) SCHEMA
 * =============================================================================
 * email        : String, required: true, unique: true, index: true
 * name         : String,
 * password     : String, required: true },
 * admin        : Boolean
 * auditFields  : { dateUpdated, dateCreated }
 */

var users = exports.model = new Datastore({
    filename: './data/users',
    autoload: true
});

users.ensureIndex({
    fieldName: 'email',
    unique: true
}, function (err) {});



// =============================================================================
// MONGODB WRAPPERS
// =============================================================================
/**
 * A promised based wrapper around find
 *
 * @param {object} options The search criteria
 * @return {ASQ(object[])} The promised user documents
 */
var find = exports.find = function(options) {
    return ASQ(function(done) {
        users.find(options, function(err, users) {
            if (err) { return done.fail(err); }

            done(users);
        });
    });
};

/**
 * A promised based wrapper around findOne
 *
 * @param {object} options The search criteria
 * @return {ASQ(object)} The promised user document
 */
var findOne = exports.findOne = function(options) {
    return ASQ(function(done) {
        users.findOne(options, function(err, user) {
            if (err) { return done.fail(err); }

            done(user);
        });
    });
};



// =============================================================================
// USER CRUD METHODS
// =============================================================================

/**
 * Creates a new user in the database with the specified options. Provides
 * defaults so things line up with the schema
 *
 * TODO: When should default check happen? On GET, POST, or PUT?
 *
 * @param {object} options The user's properties
 * @return {ASQ(object)} The user document
 */
var create = exports.create = function(options) {
    return encryptPassword(options.password)
        .then(function(done, hash) {
            options.password = hash;

            users.insert(options, function(err, doc) {
                if (err) { return done.fail(err); }
                done(doc);
            });
        });
};

/**
 * Fetch a user by ID
 *
 * TODO: Should we sanitize the user object to match the schema here?
 *
 * @param {string} id The user's ID
 * @return {ASQ(object)} The user document
 */
var get = exports.get = function(id) {
    return findOne({ _id: id });
};

/**
 * Updates a user in the database by searching for the users
 * provided email or id. All attributes passed in will replace
 * old attributes
 *
 * TODO: Add validators before the write
 *
 * @param {object} user The user document you want to persist
 * @return {ASQ(object)} The user document
 */
var update = exports.update = function(user) {
    return ASQ(function(done) {
        var options = {};
        var search = {
            _id: user._id,
            email: user.email
        };

        users.update(search, user, options, function(err, numReplaced) {
            if (err) { return done.fail(err); }
            done(user);
        });
    });
};

/**
 * remove a user by ID
 *
 * @param {string} id The user's ID
 * @return {ASQ(number)} The number of objects removed
 */
var remove = exports.remove = function(id) {
    return ASQ(function(done) {
        users.remove({ _id: id}, {}, function (err, numRemoved) {
            if (err) { return done.fail(err); }
            done(numRemoved);
        });
    });
};


// =============================================================================
// USER HELPERS
// =============================================================================

/**
 * Encrypting passwords takes a non-trivial time, so we have a helper method
 * which wraps the whole process in a promise and returns the hashed password
 *
 * @param {string} password The password to encrypt
 * @return {ASQ(string)} The encrypted password
 */
var encryptPassword = exports.encryptPassword = function(password) {
    return ASQ(function(done) {
        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
            if(err) { return done.fail(err); }

            bcrypt.hash(password, salt, function(err, hash) {
                if(err) { return done.fail(err); }
                done(hash);
            });
        });
    });
};

/**
 * Comparing passwords is a non-trivial task. Wrap it in a promise and
 * return the curried user if the passwords line up. This method is tightly
 * coupled with the login route.
 *
 * @param {object} user The user whose password you will be checking
 * @param {string} challange The supplied password to check against
 * @return {ASQ(object)} The promised user
 */
var comparPassword = exports.comparePassword = curry(function(user, challange) {
    var password = user.password;

    return ASQ(function(done) {
        bcrypt.compare(challange, password, function(err, isMatch) {
            if (err) { return done.fail(err); }
            if (!isMatch) { return done.fail('Incorrect Password'); }
            done(user);
        });
    });
});

/**
 * This method takes in an object (presumably a user object) and strips
 * out fields that we don't want escaping into the wild.
 *
 * @param {object} user The user document from the database
 */
var clean = exports.clean = omit(['password', '_id', '__v']);

/**
 * A convenience method to findOne based on email
 *
 * @param {string} email The email address to search by
 * @return {ASQ(object)} The promised user document
 */
var email = exports.email = function(email) {
    return findOne({email: email});
};

/**
 * A convenience method to return all users
 *
 * @return {ASQ(object[])} A promised list of user documents
 */
var all = exports.all = function() {
    return find({});
};

