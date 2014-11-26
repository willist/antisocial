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
    var options = {
        password: req.body.password,
        name: req.body.name,
        email: req.body.email,
        auditFields: {
            dateUpdated: Date.now(),
            dateCreated: Date.now()
        }
    };

    accessors.create(options)
        .then(function(done, user) {
            res.send(user);
        })
        .or(function(err) { res.status(400).send(err) });
};

