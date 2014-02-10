$(document).ready(function() {

<<<<<<< HEAD
  if ($("#url").length > 0) {
    $("#title").on('focus', function() {
      var url = $("#url").val();
      $.get("/news/summarize?url=" + url, function(response) {
        if (response) {
          $("#title").val(response.title);
          $("#source").val(response.source);
          $("#summary").val(response.summary.join(" "));
        }
      });
    })
    $('input[autofocus]').trigger('focus');//force fire it on the autofocus element
  }

  if($(".show-summary").length > 0) {
    $(".show-summary").on('click', function(e) {
      e.preventDefault();
      $(this).siblings("p").toggleClass('hidden');
    })
  }

  $("#copyright").text(new Date().getFullYear());

  (function hideNavMenuOnBodyClick() {
    $('body').on('click', function() {
      $('.navbar-collapse.in').collapse('hide');
    });

    $('.navbar-collapse').on('click', function(event) {
      event.stopPropagation();
    });
  }());

});
