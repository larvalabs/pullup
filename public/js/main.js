$(document).ready(function() {

  if ($("#url").length > 0) {
    $("#url").on('change', function() {
      var url = $(this).val();
      $.get("/news/summarize?url=" + url, function(response) {
        if (response) {
          $("#title").val(response.title);
          $("#source").val(response.source);
          $("#summary").val(response.summary.join(" "));
        }
      });
    })
  }

  if($(".show-summary").length > 0) {
    $(".show-summary").on('click', function(e) {
      e.preventDefault();
      $(this).siblings("p").toggleClass('hidden');
    })
  }

});
