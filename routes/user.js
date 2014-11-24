var db = require('../db/db');

var config = require('../config');
var ASQ = require('asynquence');


var byEmail = function(email) {
    return ASQ(function(done) {
        db.users.findOne({ email: email }, function(err, user) {
            if (err) { return done.fail(err); }
            if (!user) { return done.fail({ message: 'Unknown user ' + email }); }

            done(user);
        });
    });
};

exports.post = function(req, res) {
    var user = {
        // password is handled bellow
        name: req.body.name,
        email: req.body.email,
        auditFields: {
            dateUpdated: Date.now(),
            dateCreated: Date.now()
        }
    };

    db.users.encryptPassword(req.body.password)
        .then(function(done, hash) {
            user.password = hash;

            db.users.insert(user, function(err, doc) {
                if (err) { return res.status(400).send(err); }

                res.send(doc);
            });
        })
        .or(function(err) { res.status(400).send(err) });
};
