var FlashBuilder = function (type, messages) {
  function createFlashContainer () {
    var container = $('<div></div>')
      .addClass('alert animated fadeIn alert-dismissable')
      .html(createDismissButton());
 
      switch(type) {
        case 'success':
          container.addClass('alert-success');
          break;
        case 'info':
          container.addClass('alert-info');
          break;
        case 'error':
          container.addClass('alert-danger');
          break;
      }

      return container;
  }

  function createDismissButton () {
    return $('<button></button>')
      .attr('type', 'button')
      .attr('data-dismiss', 'alert')
      .attr('aria-hidden', true)
      .addClass('close')
      .text('x');
  }

  function createMessage (message) {
    return $('<div></div>')
      .text(message);
  }

  function clearFlash () {
    $('#flash').empty();
  }

  function buildMessage () {
    if (messages && messages.length > 0) {
      clearFlash();

      var container = createFlashContainer(type);

      messages.forEach(function (message) {
        container.append(createMessage(message.msg));
      });

      $('#flash').append(container);
    }
  }

  return {
    build: buildMessage
  };
};

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

  if ($('form.upvote-form').length > 0) {
    $('.upvote-form').on('submit', function (e) {
      var form = $(this);

      $.post(form.attr('action'), form.serialize())
        .done(function (data) {
          if (data.messages) {
            var builder = new FlashBuilder(data.success ? 'success' : 'error', data.messages);

            builder.build();
          }

          if (data.success) {
            $('button.upvote', form).remove();
          }
        })
        .fail(function (data) {
          var builder = new FlashBuilder('error', [{ msg: 'Something went wrong!'}]);
        });

      e.preventDefault();
    });
  }
});
