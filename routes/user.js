// =============================================================================
// POST     : /api/users
// GET      : /api/users
// GET      : /api/users/:id
// PUT      : /api/users/:id
// DELETE   : /api/users/:id
// =============================================================================
var db = require('../db/config');
var _ = require('lodash');

var config = require('../config');
var stripe = require('stripe')(config.stripe.current);
var config = require('../config');
var ASQ = require('asynquence');

exports.stats = function(req, res) {
    db.User.find({}, function(err, users) {
        db.Context.find({}, function(err, contexts) {
            db.Profile.find({}, function(err, profiles) {

                var byContext = _.groupBy(profiles, 'context');
                var bySize = _.mapValues(byContext, function(arr) {
                    return arr.length;
                });

                contexts = _.map(contexts, function(context) {
                    return {
                        profiles: bySize[context._id],
                        user: context.user
                    };
                });

                var byUser = _.groupBy(contexts, 'user');
                byUser = _.mapValues(byUser, function(arr) {
                    return {
                        contexts: arr.length,
                        profiles: _.reduce(arr, function(memo, context) {
                                        return memo + context.profiles;
                                    }, 0)
                    };
                });

                users = _.map(users, function(user) {
                    var lookup = byUser[user._id] || {};

                    user.contexts = lookup.contexts || 0;
                    user.profiles = lookup.profiles || 0;

                    return user;
                });

                res.render('stats', {users: users});
            });
        });
    });
};

exports.get = function(req, res) {
    if (!req.user) {
        return res.send({message: 'Not logged in'});
    }

    res.send(req.user)
};


exports.post = function(req, res) {

    var user = new db.User({
        name        : req.body.name,
        email       : req.body.email,
        password    : req.body.password,
        admin       : req.body.adm
    });

    user.save(function(err) {
        if (err) {
            res.send({
                message:  err.code === 11000 ? 'Username already exists' : ''
            });
        } else {
            res.send({user: user});
        }
    });
};

exports.subscribe = function(req, res) {
    var stripeToken = req.body.token;

    var customerId = req.user.customerId;
    var customer = (customerId)
                    ? stripe.customers.retrieve(req.user.customerId)
                    : stripe.customers.create({
                        description: 'Customer for ' + stripeToken.email,
                        card: stripeToken.id,
                        email: req.user.email
                    });

    customer.done(function(customer) {
        stripe.customers.update(customer.id, {
            plan: config.plans[config.env].plan,
            email: req.user.email
        }, function(err, customer) {
            if (err) {
                return res.send({ok: false});
            }

            req.user.planLevel = 1;

            req.user.save(function(err) {
                res.send({ok: !!err});
            });
        });

    });
};











// =============================================================================
// USER ACCESSORS
// =============================================================================

// byEmail :: string(email) -> ASQ(user)
exports.byEmail = function(email) {
    return ASQ(function(done) {
        db.User.findOne({ email: email }, function(err, user) {
            if (err) { return done.fail(err); }
            if (!user) { return done.fail({ message: 'Unknown user ' + email }); }

            done(user);
        });
    });
}






