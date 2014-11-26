var ASQ = require('asynquence');
var config = require('../../config');
var db = require('../../db/db');


// Fetch a user by their email address
//+ email :: string(email) -> promise(user)
var email = exports.email = function(email) {
    return ASQ(function(done) {
        db.users.model.findOne({ email: email }, function(err, user) {
            if (err) { return done.fail(err); }
            if (!user) { return done.fail('Unknown user ' + email); }

            done(user);
        });
    });
};

// Fetch all users in the table
//+ all :: () -> promise([users])
var all = exports.all = function() {
    return ASQ(function(done) {
        db.users.model.find({}, function(err, users) {
            if (err) { return done.fail(err); }

            done(users ? users : []);
        });
    });
};

var create = exports.create = function(options) {
    return db.users.encryptPassword(options.password)
        .then(function(done, hash) {
            options.password = hash;

            db.users.model.insert(options, function(err, doc) {
                if (err) { return done.fail(err); }
                done(doc);
            });
        });
};
