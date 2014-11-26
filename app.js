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

var argv = require('optimist').argv;
var port = argv.port ? argv.port : 3000;

var socketio = require('socket.io');
var socketioJWT = require('socketio-jwt');

var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var jwtSecret = require('./config').jwtSecret;

var db = require('./db/db');

var routes = {
    user: require('./routes/users/routes'),
    session: require('./routes/session/routes')
};

// Set up our app server
var app = require('express')();
app.use(require('body-parser').json());
app.use('/api', expressJwt({secret: jwtSecret}));


// =============================================================================
// ROUTES
// =============================================================================

app.route('/users')
    // .delete(routes.user.delete)
    // .get(routes.user.get)
    // .put(routes.user.put)
    .post(routes.user.post);

app.route('/login')
    // .delete(routes.session.delete)
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

