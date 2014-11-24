var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var ASQ = require('asynquence');

// =============================================================================
// User
// =============================================================================
var UserSchema = schema({
    email           : { type: String,
                        required: true,
                        index: { unique: true, dropDups: true }
                        },
    cardEmail       : String,
    customerId      : String,
    name            : String,
    planLevel       : { type: Number, default: 0 },
    dateCreated     : { type: Date, default: Date.now },
    password        : { type: String, required: true },
    companies       : [{ type: ObjectId, ref: 'Company' }],
    lastUpdated     : { type: Date, default: Date.now },
    admin           : Boolean,
    invitedContexts : [{type: ObjectId, ref: 'Context'}]
});


// Password validation
// -----------------------------------------------------------------------------
// Bcrypt middleware
UserSchema.pre('save', function(next) {
	var user = this;
    lastUpdated = new Date();

	if(!user.isModified('password')) return next();

	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if(err) return next(err);

		bcrypt.hash(user.password, salt, function(err, hash) {
			if(err) return next(err);
			user.password = hash;
			next();
		});
	});
});

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


// =============================================================================
// Exports
// =============================================================================
module.exports = {
    model: mongoose.model('User', UserSchema),
    schema: UserSchema
};

