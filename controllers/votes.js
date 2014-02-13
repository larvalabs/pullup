var Vote = require('../models/Vote');

// generic vote controller
exports.voteFor = function (type, root) {

  return function (req, res, next) {

    req.assert('amount', 'Items can only be upvoted.').equals('1');

    var errors = req.validationErrors();

    if (errors) {
      req.flash('errors', errors);
      return res.redirect(req.get('referrer') || root);
    }

    if (!req.user) {
      req.flash('errors', { msg: 'Only members can upvote items.' });
      return res.redirect('/signup');
    }

    var vote = new Vote({
      item: req.params.id,
      voter: req.user.id,
      amount: req.body.amount,
      itemType: type
    });

    vote.save(function (err) {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'You can only upvote an item once.' });
        }
        return res.redirect(req.get('referrer') || root);
      }

      req.flash('success', { msg: 'Item upvoted. Awesome!' });
      res.redirect(req.get('referrer') || '/');
    });
  };

};
