
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

exports.replaceUserMentions = function(body) {
  var usernameRegexp = /@\w+(?!(\]|\w|\/))/;
  var match;

  while(match = usernameRegexp.exec(body)) {
    body = body.replace(match[0], '[' + match[0] + ']' + '(/news/user/' + match[0].slice(1) + '/)');
    console.log(usernameRegexp.exec(body));
  }

  return body;
}
