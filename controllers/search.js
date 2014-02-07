var mongoose = require('mongoose');
var NewsItem = require('../models/NewsItem');

exports.searchNews = function(req, res) {
  var searchQuery = req.body.query;
  console.log('asdsa');
  console.log(searchQuery);
  NewsItem
  .find({})
  .limit(120)
  .exec(function(err, searchItems) {
  	console.log(searchItems);
  	var searchSuccesses = [];
  	var searchCount = 0;
  	for(var i in searchItems) {
  		if(searchItems[i].title.indexOf(searchQuery) !== -1) {
  			searchSuccesses.push(searchItems[i]);
  			searchCount++;
  			if(searchCount === 30) {
  				break;
  			}
  		}
  	};
  	console.log(searchItems);
  	res.render('search', {
  		searchQuery: searchQuery,
  		searchCount: searchCount,
  		items: searchItems,

  	});
  });
};

