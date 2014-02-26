var marked = require('marked');

marked.setOptions({
  sanitize: true,
  silent: true
});

module.exports = marked;