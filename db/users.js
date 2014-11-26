var Datastore = require('nedb')
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var ASQ = require('asynquence');


// =============================================================================
// USER
// =============================================================================
//email           : String, required: true, unique: true, index: true
//name            : String,
//password        : String, required: true },
//admin           : Boolean
//auditFields     : { dateUpdated, dateCreated }

var users = exports.model = new Datastore({ filename: './data/users', autoload: true });
users.ensureIndex({ fieldName: 'email', unique: true }, function (err) {});


// =============================================================================
// USER HELPERS
// =============================================================================
// Encrypting passwords takes a non-trivial time, so we have a helper method
// which wraps the whole process in a promise and returns the hashed password
//+ encryptpassword :: string(password) -> ASQ(hash)
exports.encryptPassword = function(password) {
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


// This method takes in an object (presumably a user object) and strips
// out fields that we don't want escaping into the wild.
//+ clean:: object(user) -> object(user)
var clean = exports.clean = omit(['password', '_id', '__v']);


// Comparing passwords is a non-trivial task. Wrap it in a promise and
// return the curried user if the passwords line up. This method is tightly
// coupled with the login route.
//+ comparePassword :: string(challange) -> string(password) -> ASQ(valid)
exports.comparePassword = curry(function(user, challange) {
    var password = user.password;

    return ASQ(function(done) {
        bcrypt.compare(challange, password, function(err, isMatch) {
            if (err) { return done.fail(err); }
            if (!isMatch) { return done.fail('Incorrect Password'); }
            done(user);
        });
    });
});


