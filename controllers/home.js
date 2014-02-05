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
    title: 'How to Sign Up'
  });
};
