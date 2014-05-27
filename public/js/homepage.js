$(document).ready(function() {
  var options = [];
  var visible = [];

  $.get("/api/news", function(data, success, status) {
    newsItems = JSON.parse(data);

    if(newsItems.length > 0) {
      var $shell = $(".news-item").first().clone();

      for(var i=0,max=newsItems.length; i<max; i++) {
        var $option = $shell.clone();
        var newsItem = newsItems[i];

        var commentsText = "";
        if(newsItem.comment_count === 0) {
          commentsText = "no comments";
        } else if(newsItem.comment_count === 1) {
          commentsText = "1 comment";
        } else {
          commentsText = newsItem.comment_count+" comments";
        }

        $option.find("h5 a").text(newsItem.title).attr('href', newsItem.url);
        $option.find(".poster").text(" "+newsItem.poster.username).attr('href', "/news/user/"+newsItem.poster.username);
        $option.find(".comments").text(commentsText).attr('href', "/news/"+newsItem._id);

        options.push($option);
      }

      setInterval(rotateOptions, 5000);
    }
  });

  function rotateOptions() {
    var $show = options.splice(Math.floor(Math.random() * (options.length - 1)), 1)[0];

    var position;
    if(visible.length < 3) {
      position = visible.length;
    } else {
      position = Math.floor(Math.random() * 2);
    }

    var elementToReplace = $(".news-item")[position];

    var oldHTML = $(elementToReplace).html();

    $(elementToReplace).addClass("animating").addClass("hideIt");

    if(visible.length === 3) {
      visible.splice(position, 1, $show);
    } else {
      visible.push($show);
    }

    setTimeout(function() {
      $(elementToReplace).html($show.html());
      $(elementToReplace).removeClass("hideIt");
    }, 1100);
  }

});
