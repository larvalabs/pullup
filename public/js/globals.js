
// Extracts data-* attribute values from elements in data.jade

var pullup = {};

$('#pullup-global-js-object > .property').each (function () {
  var key = $(this).attr ('id');
  var val = $(this).attr ('data-val');
  pullup[key] = val;
});
