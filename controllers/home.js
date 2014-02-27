/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  res.redirect('/news');
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

exports.bookmarklet = function(req, res) {
  res.render('bookmarklet', {
    title: 'Bookmarklet'
  });
};
