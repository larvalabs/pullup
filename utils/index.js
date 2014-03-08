
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
