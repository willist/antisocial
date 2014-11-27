
var jwt = require('jsonwebtoken');
var jwtSecret = require('../../config').jwtSecret;

var db = require('../../db/db');

exports.get = function(req, res) {
    res.send('ok');
};

exports.post = function(req, res) {
    db.users.email(req.body.email)

        // Check if the user entered the right password
        .seq(function(user) {
            return db.users.comparePassword(user, req.body.password);
        })

        // Map the user to a token and send it
        .val(function(user) {
            var token = jwt.sign(db.users.clean(user), jwtSecret);
            res.send({token: token});
        })

        // No user found, send a 400
        .or(function(err) { console.log(err); res.status(400).json(err); });
};

