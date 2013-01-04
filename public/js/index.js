$(document).ready(function() {

  var bgColoredSelectors = [
    $('#login input'),
    $('.login-errors')
  ];

  var fgColoredSelectors = [
    $('#login label'),
    $('#username')
  ];

  if (!!user) {
    loginUI(user);
  }
  /**
   * These should already be on the page:
   *   Interfaces
   *   Jar, with liquid nearly full, custom jar height if logged in.
   *   Default title, special title if logged in.
   *   Count of happiness if logged in.
   *   Color of the liquid if logged in.
   *   Appropriate bubbles if logged in.
   *   Color changes if logged in.
   */
  // For sad note, bubble popup.

  var active = 'login';
  var selected_color = '#ec8585';
  var current_color_selector = 'fred';

  // Resets the settings handler.
  function rebindSettings() {
    $('#form_settings').submit(function() {
      sendSettings(function() {
        $('#settings').fadeOut();
      });
    });
  };

  // Send a new set of settings to the user.
  function sendSettings(cb) {
    // TODO: maybe preprocess?
    $.post('/save', {
      sms: $('#sms_field').val(),
      email: $('#email_field').val(),
      ignore: $('#ignore_field').val(),
      twitter: $('#twitter_field').val()
    }, function(res) {
      if (!res.err) {
        cb();
      }
    });
  };

  // Update UI for login.
  function loginUI(user) {
    $('#login').stop().fadeOut(function() {
      $('.login-errors').hide();
      var color = user.color || '#ec8585'
      $('#liquid').stop().animate({ 'backgroundColor': color }, function() {
        $('#moving').stop().animate({ 'height': Math.min(100, 18 + user.happiness) + '%' });
      });
      $('#username').text(user.username + '\'s');
      $('#title').animate({ 'width': 210 + $('#username').width() + 'px' }, function() {
        $('#username').stop().fadeIn();
      });
      $('#panel').stop().fadeIn(function() {
        // TODO: animate
        $('#number').text(user.happiness);
      });
    });
  };

  // Update UI for logout.
  function logoutUI() {
    $('#panel').stop().fadeOut(function() {
      $('#username').stop().fadeOut(function() {
        $('#title').animate({ 'width': 190 });
      });
      $('#liquid').stop().animate({ 'backgroundColor': '#ec8585' }, function() {
        $('#moving').stop().animate({ 'height': '90%' }, function() {
          $('#login').stop().fadeIn();
        });
      });
    });
  };

  function logout() {
    $.get('/logout', function() {
      logoutUI();
    });
  };

  $('#logout').click(function() {
    logout();
  });

  // Toggle login form.
  $('#content').on('click', '#select_login', function() {
    active = 'login';
    $('.active').removeClass();
    $('#select_login').addClass('active');
    $('#select_login').addClass(current_color_selector);
  });
  $('#content').on('click', '#select_register', function() {
    active = 'register';
    $('.active').removeClass();
    $('#select_register').addClass('active');
    $('#select_register').addClass(current_color_selector);
  });

  $('#form_login').submit(function() {
    var url = active == 'login' ? '/login' : '/register';
    $.post(url, {
      username: $('#username_field').val(),
      password: $('#password_field').val()
    }, function(res) {
      if (res.user) {
        if (active == 'register') {
          $('#login').fadeOut(function() {
            $('#settings').fadeIn();
            $('#form_settings').submit(function() {
              sendSettings(function() {
                loginUI(res.user);
                rebindSettings();
              });
            });
          });
        } else {
          loginUI(res.user);
        }
      } else {
        $('.login-errors').text(res.err);
        $('.login-errors').slideDown();
      }
    });

    return false;
  });

  /** Change color of happiness. */
  $('.color').click(function() {
    $('.selected').removeClass('selected');
    $(this).addClass('selected');
    if (selected_color != $(this).css('backgroundColor')) {
      selected_color = $(this).css('backgroundColor');
      current_color_selector = 'f' + $(this).attr('id');
      var lr = $('.active');
      lr.removeClass();
      lr.addClass('active');
      lr.addClass(current_color_selector);
      $('#liquid').stop().animate({ 'backgroundColor': selected_color });
      for (var i = 0; i < bgColoredSelectors.length; i += 1) {
        bgColoredSelectors[i].css({ 'backgroundColor': selected_color });
      }
      for (var i = 0; i < fgColoredSelectors.length; i += 1) {
        fgColoredSelectors[i].css({ 'color': selected_color });
      }
    }
  });



});
