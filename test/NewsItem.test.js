describe('NewsItem', function(){

  var should = require('should'),
      NewsItem = require('../models/NewsItem'),
      item = {};

  beforeEach(function(done) {
    item = new NewsItem();
    done();
  });

  describe('sanity test', function() {
    it('Item should exist and have an ID', function(){
      /*jshint expr: true*/
      item.should.be.ok;
      item._id.should.be.ok;
    });
  });

  describe('#isSelfPost()', function(){
    it('should be true when the URL points to this post', function(){
      item.url = '/news/' + item._id;
      item.isSelfPost().should.equal(true);
    });

    it('should NOT be true if the URL does not point to this post', function(){
      item.url = 'http://pullup.io/about';
      item.isSelfPost().should.not.equal(true);
    });

    it('should NOT be true just because the source is "pullup.io"', function(){
      item.source = 'pullup.io';
      item.isSelfPost().should.not.equal(true);
    });
  });

  describe('#formatUrl()', function() {
    it('should append "http://" to a given URL if a protocol is not specified', function() {
      item.url = NewsItem.formatUrl('ianvonwalter.com');
      item.url.lastIndexOf('http://').should.equal(0);
    });

    it('should NOT modify a given URL if a protocol is specified', function() {
      item.url = NewsItem.formatUrl('https://gmail.com');
      item.url.lastIndexOf('https://').should.equal(0);
    });
  });

});