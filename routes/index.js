module.exports=function(app, passport){

	/**
	 * Load controllers.
	 */

	var homeController = require('../controllers/home');
	var userController = require('../controllers/user');
	var apiController = require('../controllers/api');
	var contactController = require('../controllers/contact');
	var newsController = require('../controllers/news');

	/**
	 * Passport configuration.
	 */

	var passportConf = require('../config/passport');

	/**
	 * Application routes.
	 */

	app.get('/', newsController.index);
	app.get('/login', userController.getLogin);
	app.post('/login', userController.postLogin);
	app.get('/logout', userController.logout);
	app.get('/signup', homeController.signup);
	app.get('/about', homeController.about);
	//app.post('/signup', userController.postSignup);
	app.get('/contact', contactController.getContact);
	app.post('/contact', contactController.postContact);
	app.get('/account', passportConf.isAuthenticated, userController.getAccount);
	app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
	app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
	app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
	app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);
	app.get('/news', newsController.index);
	app.get('/news/submit', passportConf.isAuthenticated, newsController.submitNews);
	app.post('/news/submit', passportConf.isAuthenticated, newsController.postNews);
	app.get('/news/:id', newsController.userNews);
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

}