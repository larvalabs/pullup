function reportPageView(client) {
  if (window.location.hostname !== 'localhost') {
    var pageViewData = {
      ip_address: "${keen.ip}",
      user_agent: "${keen.user_agent}",
      referrer: document.referrer,
      page: window.location.href
    };

    client.addEvent("pageviews", pageViewData, function (err, res) {
      if (err) {
        console.log("Keen.io error", err);
      }
    });
  }
}

function renderPageViews(client) {
  Keen.ready(function(){
    var referrerQuery = new Keen.Query("count", {
      eventCollection: "pageviews",
      filters: [
        {
          "operator": "not_contains",
          "property_name": "page",
          "property_value": "localhost"
        }
      ],
      groupBy: [
        "referrer"
      ],
      timeframe: "this_14_days",
      timezone: "UTC"
    });

    client.draw(referrerQuery, document.getElementById("keen-chart-referrer"), {
      title: "Referrer"
    });
  });
}

function renderReferrals(client) {
  Keen.ready(function() {
    var query = new Keen.Query("count", {
      eventCollection: "pageviews",
      filters: [
        {
          "operator": "not_contains",
          "property_name": "page",
          "property_value": "localhost"
        }
      ],
      groupBy: [
        "page"
      ],
      timeframe: "this_14_days",
      timezone: "UTC"
    });

    client.draw(query, document.getElementById("keen-chart-page"), {
      title: "Pages"
    });
  });
}

$(function() {
  var client = new Keen({
    projectId: pullup.keenProjectID,
    writeKey: pullup.keenWriteKey,
    readKey: pullup.keenReadKey
  });

  reportPageView(client);
  renderPageViews(client);
  renderReferrals(client);
});
