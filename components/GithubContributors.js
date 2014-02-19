
var NodeCache = require( "node-cache" );
var github = require('octonode');

/**
 * Used to retrieve and manage contributors list requested through GitHub
 * API.
 */
function GithubContributors() {

    /* Unauthenticated GitHub API requests a rate limited to 60 per hour.
       TTL of cache should be set appropriately */
    this.cache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 15 * 60 });
};

/**
 * Looks for contributors list in cache. In the event of a cache miss makes
 * a GitHub API request using the current users GitHub authentication 
 * information. 
 * @param {Object} args May contain on error and on success callbacks
 */
GithubContributors.prototype.getContributors = function(args) {
    var that = this;
    var errorCallback = args.onError || function() {};
    var successCallback  = args.onSuccess || function() {};
    
    this.cache.get('githubContributors', function (err, value) {

      if (err) {
        errorCallback();
      } else if (!Object.keys(value).length) { 
        /* Since contributors data isn't in the cache, request it via the
           GitHub API */
        console.log ('getUserGithubData: cache miss');

        var client = github.client();
        var ghrepo = client.repo('larvalabs/pullup');
        ghrepo.contributors (function(err, data, headers) {
          if (err) {
            errorCallback();
            return;
          }
          successCallback (data);

          // cache the results
          that.cache.set('githubContributors', data, 
            function (err, success) {

            if(!err && success) {
              console.log ('cached github contributors');
            } else {
              console.warn ('failed to cache github contributors');
            }
          });
        });

      } else {
        console.log ('getUserGithubData: cache hit');
        successCallback(value);
      }

    });
};

/**
 * @param {String} username Name of the user for which the number of 
 *  contributions should be returned
 * @param {Array} contributors The response of the GitHub API request made
 *  in getContributors()
 * @return {Number} 
 */
GithubContributors.prototype.getContributions = function(
    username, contributors) {

    var contributions = 0;
    for (var i in contributors) {
        if (contributors[i].login === username) {
            contributions = contributors[i].contributions;
            break;
        }
    }
    return contributions;
};

module.exports = new GithubContributors();

