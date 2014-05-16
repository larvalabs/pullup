(function() {
  var $newsFeed, $loading, $retryText, $newsFeed;

  $(document).ready(function() {
    $newsFeed = $(".news-feed");
    $loading = $newsFeed.find(".loading-animation");

    $retryText = $("<span class='retry'>Uh oh! That didn't work!<br />Click to try again.</span>").hide();
    $newsFeed.append($retryText);

    $retryText.click(getNewsFeed);

    if($newsFeed.length) {
      getNewsFeed();
    }
  })

  function getNewsFeed() {
    $loading.removeClass("hide").removeClass('error');
    $retryText.hide();

    $.get("/api/news", function(data, success, status) {
      $loading.hide();

      newsItems = JSON.parse(data);
      for(var i=0,max=newsItems.length; i<max; i++) {
        var $newsItem = buildNewsItem(newsItems[i]);
        $newsFeed.append($newsItem);
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

    return $("<div class='news-item'>"
            +  "<h3><a href='/news/"+newsItem._id+"'>"+newsItem.title+"</a></h3>"
            +  "<address>by <a href='/news/users/"+newsItem.poster.username+"'>"+newsItem.poster.username+"</a></address>"
            +  "<a href='/news/"+newsItem._id+"' class='comment-count'>"+commentsTerm+"</a>"
            +"</div>"
            )
  }
})();
