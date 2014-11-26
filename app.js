/* globals console, __dirname */

'use strict';

console.log('\n\n\n');
console.log('================================================================');
console.log(new Date());
console.log('================================================================');


// =============================================================================
// LOAD OUR MODULES
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
var jwtSecret = require('./config').jwtSecret;

var routes = {
    user: require('./routes/users/routes'),
    session: require('./routes/session/routes')
};

app.use(bodyParser.json());
app.use('/api', expressJwt({secret: jwtSecret}));


// =============================================================================
// ROUTES
// =============================================================================

app.route('/users')
    .post(routes.user.post);

app.route('/login')
    .get(expressJwt({secret: jwtSecret}), routes.session.get)
    .post(routes.session.post);

app.route('/api/ping')
    .all(function(req, res) { res.send('pong'); });


// =============================================================================
// START UP THE SERVER
// =============================================================================
app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});

