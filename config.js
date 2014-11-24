
var argv = require('optimist').argv;

// Database connect
var uristring = (argv.db)
    ? ('mongodb://localhost/' + argv.db)
    : 'mongodb://localhost/prod';

module.exports = {};

