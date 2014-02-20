

$(function () {

// retrieve number of contributions and insert into profile info
$.ajax ({
  url: pullup.baseUrl + '/news/ajaxGetUserGithubData/' +
    $('#filtered-user').attr ('data-val'),
  method: 'GET',
  success: function (data) {
    $('#contribution-count').text (data.contributions);
  }
});

});


