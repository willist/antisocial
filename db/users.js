var Datastore = require('nedb')
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var ASQ = require('asynquence');
var nedbWrappers = require('./nedbWrappers');

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
// PRIVATE HELPERS
// =============================================================================

/**
 * We primarily want to search users by ID if it is present.
 * If it is not present, search by email. We do this in case
 * the user wants to update their email, address. It would fail
 * to find users as the new email would not be in the DB.
 * This method standerdizes the search process.
 *
 * @param {object} user The full or partial user document
 * @return {object} The search field for emails and ids
 */
var makeSearch = function(user) {
    var search = {};

    if (user._id) {
        search._id = user._id;
    } else if (user.email) {
        search.email = user.email;
    }

    return search;
};


// =============================================================================
// MONGODB WRAPPERS (./nedbWrappers.js)
// =============================================================================

var _find = exports._find = nedbWrappers.find(users);
var _findOne = exports._findOne = nedbWrappers.findOne(users);
var _insert = exports._insert = nedbWrappers.insert(users);
var _remove = exports._remove = nedbWrappers.remove(users);
var _update = exports._update = nedbWrappers.update(users);


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
    if (!options.password || !options.password.length) {
        return ASQ.failed('No password specified')
    }

    if (!options.email || !options.email.length) {
        return ASQ.failed('No email specified')
    }

    var defaults = {
        auditFields: {
            dateUpdated: Date.now(),
        }
    };

    return encryptPassword(options.password)
        .seq(function(hash) {
            options.password = hash;
            return _insert(mixin(defaults, options));
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
    return _findOne({ _id: id });
};

/**
 * Updates a user in the database by searching for the users
 * provided email or id. All attributes passed in will replace
 * old attributes. Very similar to create.
 *
 * TODO: Add validators before the write
 * TODO: Should we be returning the new user object or numreplaced?
 *
 * @param {object} user The user document you want to persist
 * @return {ASQ(object)} The user document
 */
var update = exports.update = function(user) {
    var search = makeSearch(user);
    var overrides = {
        auditFields: {
            dateUpdated: Date.now(),
        }
    };

    return encryptPassword(user.password)
        .seq(function(hash) {
            user.password = hash;
            return _update(search, mixin(user, overrides));
        });
};

/**
 * An aliase to use the promisified remove method
 */
var remove = exports.remove = function(user) {
    var search = makeSearch(user);
    return _remove(search);
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
var clean = exports.clean = omit(['password', '__v']);

/**
 * A convenience method to findOne based on email
 *
 * @param {string} email The email address to search by
 * @return {ASQ(object)} The promised user document
 */
var email = exports.email = function(email) {
    return _findOne({email: email});
};

/**
 * A convenience method to return all users
 *
 * @return {ASQ(object[])} A promised list of user documents
 */
var all = exports.all = function() {
    return _find({});
};

