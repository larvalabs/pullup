(function( $ ) {
  'use strict';

  var FlashBuilder = function( type, messages ) {
    return {
      build: function() {
        if ( messages && messages.length ) {
          var $container = $('<div>', {
            'class': 'alert animated fadeIn alert-dismissable'
          }).addClass('alert-' + (type === 'error' ? 'danger' : type));

          // create dismiss button
          $('<button>', {
            type: 'button',
            'data-dismiss': 'alert',
            'aria-hidden': true,
            'class': 'close',
            text: 'x'
          }).appendTo($container);

          messages.forEach(function( message ) {
            $container.append($('<div>', { text: message.msg }));
          });

          $('#flash').empty().append($container);
        }
      }
    };
  };

  if ( $('#url').length ) {
    $('#title').on('focus', function() {
      var url = $('#url').val();

      $.get('/news/summarize?url=' + url, function( response ) {
        if ( response ) {
          if ( typeof response.title !== 'undefined' )
            $('#title').val(response.title);
     
          if ( typeof response.source !== 'undefined' )
			      $('#source').val(response.source);
          else
            $('#source').val(url);
      
          if ( typeof response.summary !== 'undefined' )
			      $('#summary').val(response.summary.join(' '));
		    }
      });
    });

    //force fire it on the autofocus element
    $('input[autofocus]').trigger('focus');
  }

  if ( $('.show-summary').length ) {
    $('.show-summary').on('click', function( e ) {
      e.preventDefault();

      if ( $('p.item-summary').length )
        $('p.item-summary').toggleClass('hidden');

      if ( $(this).siblings('p.summary').length )
        $(this).siblings('p').toggleClass('hidden');
    });
  }

  if ( $('label.post-type-btn').length ) {
    $('label.post-type-btn').on('click', function( e ) {
      e.preventDefault();

      if( $(this).hasClass('post-type-url') ) {
        $('.form-group-url').slideDown();
        $('.form-group-source').slideDown();
      } else {
        $('.form-group-url').slideUp();
        $('.form-group-source').slideUp();
      }
    });
  }

  $('#copyright').text(new Date().getFullYear());

  (function hideNavMenuOnBodyClick() {
    $('body').on('click', function( e ) {
      if ( !$('.navbar').has(e.target).length )
        $('.navbar-collapse.in').collapse('hide');
    });
  }());

  $('form').submit(function() {
    $(this).append(
      $('<input>', {
        type: 'hidden',
        name: 'windowscrolly',
        value: window.scrollY
      })
    );
  });

  if ( $('form.upvote-form').length ) {
    $('.upvote-form').on('submit', function (e) {
      var $form = $(this);

      e.preventDefault();

      $.post($form.attr('action'), $form.serialize())
        .done(function( data ) {
          if (data.messages)
            new FlashBuilder(data.success ? 'success' : 'error', data.messages).build();

          if (data.success)
            $('button.upvote', $form).remove();
        })
        .fail(function() {
          new FlashBuilder('error', [{ msg: 'Something went wrong!'}]).build();
        });
    });
  }

  var scrollDebouncer,
      $flash = $('#flash'),
      $pageHeader = $('.page-header:first'),
      initialMargin = parseFloat($pageHeader.css('margin-top')),
      positionFlash = function() {
        var margin = initialMargin + (window.scrollY < 1 ? 0 : $flash.height());

        $flash.css('position', window.scrollY < 1 ? 'static' : 'fixed');
        $pageHeader.css('margin-top', margin + 'px');
        scrollDebouncer = null;
      },
      onWindowScroll =function() {
        if ( scrollDebouncer )
          clearTimeout(scrollDebouncer);
        else
          positionFlash();

        if ( window.scrollY < 1 )
          positionFlash();
        else
          scrollDebouncer = setTimeout(positionFlash, 50);
      };

  $(window).scroll(onWindowScroll);

  $flash.find('.alert .close').on('click', function() {
    setTimeout(positionFlash, 1);
  });

  window.scrollTo(0, $('input[name=windowscrollto]').val() || 0);

  positionFlash();
})( jQuery );