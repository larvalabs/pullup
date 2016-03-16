// Return a URL with just a single query parameter stripped out of it
exports.urlWithoutQueryParam = function urlWithoutQueryParam(originalUrl, paramName) {
    var queryStart = originalUrl.indexOf('?'),
      queryString = originalUrl.slice(queryStart + 1),
      urlWithoutQueryString = originalUrl.slice(0, queryStart),
      params = queryString.split('&');

    params = params.filter(function (param) {
      return param.indexOf(paramName) !== 0;
    });

    if(!params.length) {
      return urlWithoutQueryString;
    }

    return urlWithoutQueryString + '?' + params.join('&');
};

exports.usernameRegexp = "@\\w+(?!(\\]|\\w|\\/))";

exports.replaceUserMentions = function(body) {
  var match,
      usernameRegexp = new RegExp(this.usernameRegexp);

  while(match = usernameRegexp.exec(body)) {
    body = body.replace(match[0], '[' + match[0] + ']' + '(/user/' + match[0].slice(1) + '/)');
  }

  return body;
};

exports.findUserMentions = function (body) {
  var match,
      matches = [],
      usernameRegexp = new RegExp(this.usernameRegexp, 'g');

  while(match = usernameRegexp.exec(body)) {
    matches.push(match[0].slice(1));
  }

  return matches;
};

exports.uniqueMongo = function (arr) {
  var foundIds = [],
      found = [];

  arr.forEach(function (obj) {
    if(foundIds.indexOf(obj.id.toString()) < 0){
      found.push(obj);
      foundIds.push(obj.id.toString());
    }
  });

  return found;
};
