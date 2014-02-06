/**
 * Module dependencies.
 */

var express = require('express');
var mongoose = require('mongoose');

/**
 * Create Express server.
 */

var app = express();

/**
 * Mongoose configuration.
 */

var secrets = require('./config/secrets');
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.log('✗ MongoDB Connection Error. Please make sure MongoDB is running.'.red);
});

/**
 * Express configuration.
 */

require('./config')(app, express, mongoose);

require('./routes')(app);

app.listen(app.get('port'), function() {
  console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});
