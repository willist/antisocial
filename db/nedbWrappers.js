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

/**
 * A promised based wrapper around insert
 *
 * @param {object} db The collection you want to curry insert for
 * @param {object} query The search criteria
 * @param {object} options (optional) Modifies the search
 * @return {ASQ(object)} The promised document
 */
var remove = exports.remove = curryN(2, function(db, query, options) {
    options = options || {};

    return ASQ(function(done) {
        db.remove(query, options, function (err, numRemoved) {
            if (err) { return done.fail(err); }
            done(numRemoved);
        });
    });
});

/**
 * A promised based wrapper around update
 *
 * @param {object} db The collection you want to curry insert for
 * @param {object} query The search criteria
 * @param {object} update The new document to replace the old
 * @param {object} options (optional) Modifies the search
 * @return {ASQ(object)} The promised document
 */
var update = exports.update = curryN(3, function(db, query, update, options) {
    options = options || {};

    return ASQ(function(done) {
        db.update(query, update, options, function (err, numReplaced) {
            if (err) { return done.fail(err); }
            done(numReplaced);
        });
    });
});

/**
 * A helper function to auto Promise the above methods
 *
 * @param {object} db The collection you want to curry insert for
 * @return {object} The promised methods
 */
var auto = exports.auto = function(db) {
    return {
        find: find(db),
        findOne: findOne(db),
        insert: insert(db),
        remove: remove(db),
        update: update(db)
    };
};
