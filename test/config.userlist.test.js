describe('config.userlist', function(){

  var should = require('should'),
      _ = require('underscore'),
      users = require('../config/userlist').users;

  it('should be alphabetical', function(){
    var usersSorted = users.slice().sort(function(a,b){
       return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    users.should.eql(usersSorted);
  });
});
