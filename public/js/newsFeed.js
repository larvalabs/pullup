(function() {
  var $newsFeed, $loading, $retryText;
  var processingScroll = false;
  var page = 1;

  $(document).ready(function() {
    $newsFeed = $(".news-feed");
    $loading = $newsFeed.find(".loading-animation");

    $retryText = $("<span class='retry'>Uh oh! That didn't work!<br />Click to try again.</span>").hide();
    $newsFeed.append($retryText);

    $retryText.click(getNewsFeed);

    if($newsFeed.length) {
      getNewsFeed();
    }

    $newsFeed.on('scroll', processScroll);
  });

  function processScroll(e) {
    if(!processingScroll) {
      processingScroll = true;

      if($(this).height() >= $(this).children(".news-item").last().position().top) {
        getNewsFeed(doneProcessingScroll);
      } else {
        setTimeout(doneProcessingScroll, 10);
      }
    }
  }

  // Scroll events come SO fast..  Let's ignore them as early as possible
  // And only start listening when we're done processesing one
  // This is in a separate function so that we dont instantiate a bajillion
  // anonymous functions every time we scroll
  function doneProcessingScroll() {
    processingScroll = false;
  }

  function getNewsFeed(cb) {
    $loading.removeClass("hide").removeClass('error');
    $retryText.hide();

    $.get("/api/news?page="+page, function(data, success, status) {
      $loading.addClass('hide');

      newsItems = JSON.parse(data);

      if(newsItems.length > 0) {
        for(var i=0,max=newsItems.length; i<max; i++) {
          var $newsItem = buildNewsItem(newsItems[i]);
          $loading.before($newsItem);
        }

        page++;
      } else {
        $newsFeed.off('scroll');
        var $endText = $("<span class='end'>That's all, folks!</span>");
        $loading.before($endText);
      }

      if(typeof(cb) === "function") {
        cb();
      }
    }).fail(function() {
      $loading.addClass("error");
      $retryText.show();
    });
  }

  function buildNewsItem(newsItem) {
    var commentsTerm;
    if(newsItem.comment_count === 0) {
      commentsTerm = "no comments";
    } else if(newsItem.comment_count === 1) {
      commentsTerm = "1 comment";
    } else {
      commentsTerm = newsItem.comment_count+" comments";
    }


    //Turning off JSHint because of missing semicolon errors
    /* jshint ignore:start */
    return $("<div class='news-item'>"
            +  "<h3><a href='/news/"+newsItem._id+"'>"+newsItem.title+"</a></h3>"
            +  "<address>by <a href='/news/users/"+newsItem.poster.username+"'>"+newsItem.poster.username+"</a></address>"
            +  "<a href='/news/"+newsItem._id+"' class='comment-count'>"+commentsTerm+"</a>"
            +"</div>"
          );
    /* jshint ignore:end */
  }
})();
