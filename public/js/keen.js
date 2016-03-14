$(function() {
  if (window.location.hostname === 'localhost') {
    return;
  }

  var keen = new Keen({
    projectId: pullup.keenProjectID,
    writeKey: pullup.keenWriteKey,
    readKey: pullup.keenReadKey
  });

  var pageViewData = {
    ip_address: "${keen.ip}",
    user_agent: "${keen.user_agent}",
    referrer: document.referrer,
    page: window.location.href
  };

  keen.addEvent("pageviews", pageViewData, function (err, res) {
    if (err) {
      console.log("Keen.io error", err);
    }
  });
});
