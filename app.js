/**
 * Module dependencies.
 */

var express = require('express');
var MongoStore = require('connect-mongo')(express);
var flash = require('express-flash');
var less = require('less-middleware');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var argv = require('optimist').argv;
var timeago = require('timeago');
var _ = require('underscore');

/**
 * Create Express server.
 */

var app = express();


/**
 * Load controllers.
 */

var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');
var contactController = require('./controllers/contact');
var newsController = require('./controllers/news');
var issuesController = require('./controllers/issues');
var votesController = require('./controllers/votes');

/**
 * API keys + Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Mongoose configuration.
 */

mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.log('✗ MongoDB Connection Error. Please make sure MongoDB is running.'.red);
});


/**
 * Express configuration.
 */

var hour = 3600000;
var day = (hour * 24);
var week = (day * 7);
var month = (day * 30);

app.locals.cacheBuster = Date.now();
app.set('port', process.env.PORT || argv.p || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.compress());
app.use(express.favicon(path.join(__dirname, 'public/img/favicon.ico')));
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.methodOverride());
app.use(express.session({
  secret: 'your secret code',
  store: new MongoStore({
    db: mongoose.connection.db,
    auto_reconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;

  if (!_.isObject(req.session.flash) || !Object.keys(req.session.flash).length) {
    req.session.windowscrolly = 0;
  }
  if (req.body.windowscrolly) req.session.windowscrolly = req.body.windowscrolly;
  res.locals.windowscrolly = req.session.windowscrolly;
  
  res.setHeader("Content-Security-Policy", "script-src 'self' https://apis.google.com; frame-src 'none';");
  
  res.setHeader("X-Frame-Options", "DENY");
  
  next();
});
app.use(flash());
app.use(less({ src: __dirname + '/public', compress: true }));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: week }));
app.use(function(req, res) {
  res.render('404', { status: 404 });
});
app.use(function(err, req, res, next){
  console.error("req: "+req +"\nerror:"+err.stack);
  res.statusCode = 500;
  res.render('error',{error:err});
});

app.locals.timeago = timeago;

/**
 * Application routes.
 */

/**
 * Sign in / out Routes
 */
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);

/**
 * Static Page Routes
 */

app.get('/about', homeController.about);
app.get('/bookmarklet', homeController.bookmarklet);
app.get('/signup', homeController.signup);

/**
 * Contact Routes
 */

app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);

/**
 * User Account Routes
 */

app.get('/', newsController.index);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

/**
 * News Routes
 */

app.get('/news', newsController.index);
app.get('/news/submit', passportConf.isAuthenticated, newsController.submitNews);
app.post('/news/submit', passportConf.isAuthenticated, newsController.postNews);

app.get('/news/summarize', passportConf.isAuthenticated, newsController.summarize);

app.get('/news/source/:source', newsController.sourceNews);
app.get('/news/:id', newsController.comments);
app.post('/news/:id/comments', passportConf.isAuthenticated, newsController.postComment);
app.post('/news/:id/comments/:comment_id/delete', passportConf.isAuthenticated, newsController.deleteComment);
app.post('/news/:id', votesController.voteFor('news', '/'));
app.get('/news/user/:id', newsController.userNews);

/**
 * Issues Routes
 */

app.get('/issues', issuesController.index);
app.post('/issues/:id', votesController.voteFor('issue', '/issues'));

/**
 * API Routes
 */

app.get('/api', apiController.getApi);
app.get('/api/foursquare', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFacebook);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/github', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getGithub);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTwitter);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);

/**
 * OAuth routes for sign-in.
 */

app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' }));

/**
 * OAuth routes for API examples that require authorization.
 */

app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/tumblr');
});

app.listen(app.get('port'), function() {
  console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});
