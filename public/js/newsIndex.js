

$(function () {

var userData = $('#filtered-user').attr ('data-val');

//only make this call if the user exists
if(typeof userData !== 'undefined'){

  // retrieve number of contributions and insert into profile info
  $.ajax ({
    url: pullup.baseUrl + '/news/ajaxGetUserGithubData/' + userData,
    method: 'GET',
    success: function (data) {
      $('#contribution-count').text (data.contributions);
    }
  });
  }

});
