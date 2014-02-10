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
 
});