var ASQ = require('asynquence');
var config = require('../../config');
var db = require('../../db/db');
var accessors = require('./accessors');


// =============================================================================
// Method   : POST
// Path     : /api/posts
// Summary  : Create a new post entry
// =============================================================================
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

