var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var OAuthStrategy = require('passport-oauth').OAuthStrategy;
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GitHubStrategy = require('passport-github').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('../models/User');
var secrets = require('./secrets');
var userlist = require('./userlist');
var _ = require('underscore');
var util = require('util');

function findUserIndex(username) {
  var userIndex = -1;

  userlist.users.some(function(name, index) {
    if (name.toLowerCase() === username.toLowerCase()) {
      userIndex = index;
      return true;
    }
  });

  return userIndex;
}

function replaceToken(user, kind, token) {
  for(var i=0; i<user.tokens.length; i++) {
    if(user.tokens[i].kind === kind) {
      user.tokens[i].accessToken = token;
      return user.tokens[i];
    }
  }

  user.tokens.push({ kind: kind, accessToken: token });

  return user.tokens[user.tokens.length - 1];
}

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
  User.findOne({ email: email }, function(err, user) {
    if (!user) return done(null, false, { message: 'Email ' + email + ' not found'});
    user.comparePassword(password, function(err, isMatch) {
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid email or password.' });
      }
    });
  });
}));

/**
 * Sign in with Facebook.
 */

passport.use(new FacebookStrategy(secrets.facebook, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({ $or: [{ facebook: profile.id }, { email: profile.email }] }, function(err, existingUser) {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, function(err, user) {
          user.facebook = profile.id;
          user.tokens.push({ kind: 'facebook', accessToken: accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
          user.save(function(err) {
            req.flash('info', { msg: 'Facebook account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ facebook: profile.id }, function(err, existingUser) {
      console.log(profile);
      if (existingUser) return done(null, existingUser);
      var user = new User();
      user.email = profile._json.email;
      user.facebook = profile.id;
      user.tokens.push({ kind: 'facebook', accessToken: accessToken });
      user.profile.name = profile.displayName;
      user.profile.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
      user.save(function(err) {
        done(err, user);
      });
    });
  }
}));

/**
 * Sign in with GitHub.
 */

passport.use(new GitHubStrategy(secrets.github, function(req, accessToken, refreshToken, profile, done) {

  // Check for user in authorized user list
  if (findUserIndex(profile.username) == -1) {
    req.flash('errors', { msg: 'Your GitHub account is not authorized.' });
    return done();
  }

  User.findOne({ github: profile.id }, function(err, existingUser) {
    if (existingUser) {
      replaceToken(existingUser, 'github', accessToken);
      return existingUser.save(function (err) {
        done(err, existingUser);
      });
    }
    var user = new User();
    user.username = profile.username;
    user.email = profile._json.email;
    user.github = profile.id;
    replaceToken(user, 'github', accessToken);
    user.profile.name = profile.displayName;
    user.profile.picture = profile._json.avatar_url;
    user.profile.location = profile._json.location;
    user.profile.website = profile._json.blog;
    user.save(function(err) {
      done(err, user);
    });
  });
}));

/**
 * Sign in with Twitter.
 */

passport.use(new TwitterStrategy(secrets.twitter, function(req, accessToken, tokenSecret, profile, done) {
  if (req.user) {
    User.findOne({ twitter: profile.id }, function(err, existingUser) {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, function(err, user) {
          user.twitter = profile.id;
          user.tokens.push({ kind: 'twitter', accessToken: accessToken, tokenSecret: tokenSecret });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.location = user.profile.location || profile._json.location;
          user.profile.picture = user.profile.picture || profile._json.profile_image_url;
          user.save(function(err) {
            req.flash('info', { msg: 'Twitter account has been linked.' });
            done(err, user);
          });
        });
      }
    });

  } else {
    User.findOne({ twitter: profile.id }, function(err, existingUser) {
      if (existingUser) return done(null, existingUser);
      var user = new User();
      user.email = profile.displayName;
      user.twitter = profile.id;
      user.tokens.push({ kind: 'twitter', accessToken: accessToken, tokenSecret: tokenSecret });
      user.profile.name = profile.displayName;
      user.profile.location = profile._json.location;
      user.profile.picture = profile._json.profile_image_url;
      user.save(function(err) {
        done(err, user);
      });
    });
  }
}));

/**
 * Sign in with Google.
 */

passport.use(new GoogleStrategy(secrets.google, function(req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({ $or: [{ google: profile.id }, { email: profile.email }] }, function(err, existingUser) {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, function(err, user) {
          user.google = profile.id;
          user.tokens.push({ kind: 'google', accessToken: accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile._json.picture;
          user.save(function(err) {
            req.flash('info', { msg: 'Google account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ google: profile.id }, function(err, existingUser) {
      if (existingUser) return done(null, existingUser);
      var user = new User();
      user.email = profile._json.email;
      user.google = profile.id;
      user.tokens.push({ kind: 'google', accessToken: accessToken });
      user.profile.name = profile.displayName;
      user.profile.picture = profile._json.picture;
      user.save(function(err) {
        done(err, user);
      });
    });
  }
}));

exports.isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

exports.isAuthorized = function(req, res, next) {
  var provider = req.path.split('/').slice(-1)[0];
  if (_.findWhere(req.user.tokens, { kind: provider })) next();
  else res.redirect('/auth/' + provider);
};
