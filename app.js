/* globals console, __dirname */

'use strict';

console.log('\n\n\n');
console.log('================================================================');
console.log(new Date());
console.log('================================================================');


// =============================================================================
// Load our modules
// =============================================================================
require('ramda').installTo(global);
var ASQ = require('asynquence');
var argv = require('optimist').argv;
var port = argv.port ? argv.port : 3000;

var db = require('./db/db');

var http = require('http');

var socketio = require('socket.io');
var socketioJWT = require('socketio-jwt');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var jwtSecret = 'keyboard cat';

var routes = {
    user: require('./routes/users/routes')
};


app.use(bodyParser.json());
// Require authentication for all API routes
app.use('/api', expressJwt({secret: jwtSecret}));


app.route('/users')
    .post(routes.user.post);


app.route('/login')
    .get(expressJwt({secret: jwtSecret}), function(req, res) {
        res.send('ok');
    })
    .post(function(req, res) {
        byEmail(req.body.email)

            // Check if the user entered the right password
            .seq(function(user) {
                return comparePassword(user, req.body.password);
            })

            // Map the user to a token and send it
            .val(function(user) {
                var token = jwt.sign(cleanUser(user), jwtSecret);
                res.send({token: token});
            })

            // No user found, send a 400
            .or(function(err) { res.status(400).json(err); });
    });


app.route('/api/ping')
    .all(function(req, res) {
        res.send();
    });



// =============================================================================
// Start up the server
// =============================================================================
app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});

