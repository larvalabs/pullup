module.exports=function(app, express, mongoose){

	
	var MongoStore = require('connect-mongo')(express);
	var flash = require('express-flash');
	var less = require('less-middleware');
	var path = require('path');
	var passport = require('passport');
	var expressValidator = require('express-validator');

	var hour = 3600000;
	var day = (hour * 24);
	var week = (day * 7);
	var month = (day * 30);

	app.locals.cacheBuster = Date.now();
	app.set('port', process.env.PORT || 3000);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');
	app.use(express.compress());
	app.use(express.favicon());
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
	  next();
	});
	app.use(flash());
	app.use(less({ src: __dirname + '/public', compress: true }));
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public'), { maxAge: week }));
	app.use(function(req, res) {
	  res.render('404', { status: 404 });
	});
	app.use(express.errorHandler());

}