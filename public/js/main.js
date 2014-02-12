$(document).ready(function() {

  if ($("#url").length > 0) {
    $("#title").on('focus', function() {
      var url = $("#url").val();
      $.get("/news/summarize?url=" + url, function(response) {
        if (response) {
      if(typeof response.title !== "undefined"){
			$("#title").val(response.title);
      }
     
      if(typeof response.source !== "undefined"){
			$("#source").val(response.source);
      }
      else $("#source").val(url);
      
      if(typeof response.summary !== "undefined"){
			$("#summary").val(response.summary.join(" "));
      }
        
		}
      });
    });
    $('input[autofocus]').trigger('focus');//force fire it on the autofocus element
  }

  if($(".show-summary").length > 0) {
    $(".show-summary").on('click', function(e) {

      if ($("p.item-summary").length ) {
        $("p.item-summary").toggleClass('hidden');
      }

      if ($(this).siblings("p.summary").length ) {
        $(this).siblings("p").toggleClass('hidden');
      }

      e.preventDefault();
    });
  }

  if ($("label.post-type-btn").length) {
    $("label.post-type-btn").click( function(e) {
      if($(this).hasClass('post-type-url')) {
	$('.form-group-url').slideDown();
	$('.form-group-source').slideDown();
      } else {
	$('.form-group-url').slideUp();
	$('.form-group-source').slideUp();
      }
    });
  }

  $("#copyright").text(new Date().getFullYear());

  (function hideNavMenuOnBodyClick() {
    $('body').on('click', function(e) {
      if (! $('.navbar').has(e.target).length) {
        $('.navbar-collapse.in').collapse('hide');
      }
    });
  }());

});
