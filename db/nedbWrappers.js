/**
 * A promised based wrapper around find
 *
 * @param {object} db The collection you want to curry find for
 * @param {object} options The search criteria
 * @return {ASQ(object[])} The promised documents
 */
var find = exports.find = curry(function(db, options) {
    return ASQ(function(done) {
        db.find(options, function(err, docs) {
            if (err) { return done.fail(err); }

            done(docs);
        });
    });
});

/**
 * A promised based wrapper around findOne
 *
 * @param {object} db The collection you want to curry findOne for
 * @param {object} options The search criteria
 * @return {ASQ(object)} The promised document
 */
var findOne = exports.findOne = curry(function(db, options) {
    return ASQ(function(done) {
        db.findOne(options, function(err, doc) {
            if (err) { return done.fail(err); }

            done(doc);
        });
    });
});

/**
 * A promised based wrapper around insert
 *
 * @param {object} db The collection you want to curry insert for
 * @param {object} options The search criteria
 * @return {ASQ(object)} The promised document
 */
var insert = exports.insert = curry(function(db, options) {
    return ASQ(function(done) {
        db.insert(options, function(err, doc) {
            if (err) { return done.fail(err); }
            done(doc);
        });
    });
});

