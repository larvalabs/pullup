/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.signup = function(req, res) {
  res.render('howtosignup', {
    title: 'Signup'
  });
};

exports.about = function(req, res) {
  res.render('about', {
    title: 'About'
  });
};
