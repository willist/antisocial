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
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var argv = require('optimist').argv;
var port = argv.port ? argv.port : 3000;

var expressJwt = require('express-jwt');



var Datastore = require('nedb')
var db = {};

// =============================================================================
// UserSchema
// =============================================================================
//email           : String, required: true, unique: true, index: true
//name            : String,
//password        : String, required: true },
//admin           : Boolean
//auditFields     : { dateUpdated, dateCreated }
db.users = new Datastore({ filename: './data/users', autoload: true });
db.users.ensureIndex({ fieldName: 'email', unique: true }, function (err) {});






var http = require('http');

var socketio = require('socket.io');
var socketioJWT = require('socketio-jwt');

var jwt = require('jsonwebtoken');
var jwtSecret = 'keyboard cat';

app.use(bodyParser.json());

// set up authorization for all API requests
app.use('/api', expressJwt({secret: jwtSecret}));

// Cleans a user model so we can send it back
// Expects a mongoose model
var cleanUser = omit(['password', '_id', '__v']);

// Password verification
// comparePassword :: string(challange) -> string(password) -> ASQ(boolean)
var comparePassword = curry(function(user, challange) {
    var password = user.password;

    return ASQ(function(done) {
        bcrypt.compare(challange, password, function(err, isMatch) {
            if (err) { return done.fail(err); }
            if (!isMatch) { return done.fail('Incorrect Password'); }
            done(user);
        });
    });
});

var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var ASQ = require('asynquence');


// encryptpassword :: string(password) -> ASQ(hash)
var encryptPassword = function(password) {
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

app.route('/users')
    .post(function(req, res) {
        var user = {
            name: req.body.name,
            email: req.body.email,
            auditFields: {
                dateUpdated: Date.now(),
                dateCreated: Date.now()
            }
        };

        encryptPassword(req.body.password)
            .then(function(done, hash) {
                user.password = hash;

                db.users.insert(user, function(err, doc) {
                    if (err) { return res.status(400).send(err); }

                    res.send(doc);
                });
            })
            .or(function(err) { res.status(400).send(err) });
    });



var byEmail = function(email) {
    return ASQ(function(done) {
        db.users.findOne({ email: email }, function(err, user) {
            if (err) { return done.fail(err); }
            if (!user) { return done.fail({ message: 'Unknown user ' + email }); }

            done(user);
        });
    });
}

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
        console.log(req.user);
        res.send('ok')
    });



// Login
// -----------------------------------------------------------------------------
//app.post('/login', express.bodyParser(), routes.session.login);
//app.get('/logout', express.bodyParser(), routes.session.logout);

//// Users
//// -----------------------------------------------------------------------------
//app.get('/users',
        //express.bodyParser(),
        //routes.user.get);

//app.post('/users',
        //express.bodyParser(),
        //routes.user.post);

//app.post('/users/subscribe',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.user.subscribe);

//app.get('/admin',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //pass.ensureAdmin,
        //routes.user.stats);

//// Context
//// -----------------------------------------------------------------------------
//app.get ('/contexts',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.get);

//app.get ('/contexts/shared',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.shared);

//app.post('/contexts',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.post);

//app.get('/contexts/shared',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.shared);

//app.put('/contexts/:cid',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.ensureContext,
        //routes.context.ensureUser,
        //routes.context.put);

//app.del('/contexts/:cid',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.ensureContext,
        //routes.context.ensureUser,
        //routes.context.del);

//app.get('/contexts/:cid',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.ensureContext,
        //routes.context.ensureUser,
        //routes.context.getOne);

//// Example Stuff
//app.post('/contexts/:cid/example',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.ensureContext,
        //routes.context.ensureUser,
        //routes.context.example.post);

//app.get('/contexts/example/:token',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.example.get);

//app.get('/contexts/example/:token/copy',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.example.copy);

//app.post('/contexts/:cid/example/give',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.ensureContext,
        //routes.context.ensureUser,
        //routes.context.example.give);

//// Profiles
//// -----------------------------------------------------------------------------
//app.get('/stripe/plan',
        //express.bodyParser(),
        //routes.stripe.get);

//// Profiles
//// -----------------------------------------------------------------------------
//app.get('/contexts/:cid/profiles',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.ensureContext,
        ////routes.context.ensureUser,
        //routes.profiles.all);

//app.post('/contexts/:cid/profiles',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.ensureContext,
        //routes.context.ensureUser,
        //routes.profiles.post);

//app.del('/contexts/:cid/profiles/:pid',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.ensureContext,
        //routes.context.ensureUser,
        //routes.profiles.del);

//app.put('/contexts/:cid/profiles/:pid',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.ensureContext,
        ////routes.context.ensureUser,
        //routes.profiles.put);

//app.put('/contexts/:cid/profiles/:pid/share',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.ensureContext,
        //routes.context.ensureUser,
        //routes.profiles.share);

//app.put('/contexts/:cid/profiles/:pid/unshare',
        //express.bodyParser(),
        //pass.ensureAuthenticated,
        //routes.context.ensureContext,
        //routes.context.ensureUser,
        //routes.profiles.unshare);


// =============================================================================
// Start up the server
// =============================================================================
app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});

