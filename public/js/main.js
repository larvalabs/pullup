$(document).ready(function() {

  (function hideNavMenuOnBodyClick() {
    $('body').on('click', function() {
      $('.navbar-collapse').collapse('hide');
    });

    $('.navbar-collapse').on('click', function(event) {
      event.stopPropagation();
    });
  }());

});
