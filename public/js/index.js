$(document).ready(function() {
  var active = 'login';
  var selected_color = '#ec8585';
  var current_color_selector = 'fred';
  var logged_in = false;

  var bgColoredSelectors = [
    $('#login input'),
    $('.login-errors')
  ];

  var fgColoredSelectors = [
    $('#login label'),
    $('#username')
  ];

  if (!!user) {
    console.log(user);
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


  // Resets the settings handler.
  $('#form_settings').submit(function() {
    sendSettings(function(res) {
      if (!res.err) {
        $('.info').text('Settings saved successfully.');
        $('.info').fadeIn();
        $('#settings').fadeOut();
      } else {
        $('.warn').text('Uh oh, try again later.');
      }
    });
    return false;
  });

  // Send a new set of settings to the user.
  function sendSettings(cb) {
    // TODO: maybe preprocess?
    $.post('/save', {
      sms: $('#sms_field').val(),
      email: $('#email_field').val(),
      ignore: $('#ignore_field').val(),
      twitter: $('#twitter_field').val()
    }, function(res) {
      cb(res);
    });
  };

  // Update UI for login.
  function loginUI(user) {
    logged_in = true;
    $('#login').stop().fadeOut(function() {
      $('.login-errors').hide();
      var color = user.color || '#ec8585'
      $('#username').css({ 'color': color });
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
    logged_in = false;
    $('#settings').stop().fadeOut();
    $('#panel').stop().fadeOut(function() {
      $('#username').stop().fadeOut(function() {
        $('#title').animate({ 'width': 190 });
      });
      $('#moving').stop().animate({ 'height': '90%' }, function() {
        $('#login').stop().fadeIn();
      });
    });
  };

  function logout() {
    $.post('/leave', { color: selected_color });
    $.get('/logout', function() {
      logoutUI();
    });
  };

  $('#logout').click(function() {
    logout();
  });

  // Toggle login form.
  $('#select_login').click(function() {
    active = 'login';
    $('.active').removeClass();
    $(this).addClass('active');
    $(this).addClass(current_color_selector);
  });
  $('#select_register').click(function() {
    active = 'register';
    $('.active').removeClass();
    $(this).addClass('active');
    $(this).addClass(current_color_selector);
  });

  $('#form_login').submit(function() {
    var url = active == 'login' ? '/login' : '/register';
    $.post(url, {
      username: $('#username_field').val(),
      password: $('#password_field').val()
    }, function(res) {
      if (res.user) {
        loginUI(res.user);
        if (active == 'register') {
          $('#settings').stop().fadeIn();
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


  /** Add a happy! */
  $('#add').click(function() {
    if (!logged_in) {
      $('.warn').text('You\'re not logged in, so any happinesses you save will be mixed in with every other anon\'s! Log in to save your own happiness. :)');
      $('.warn').slideDown();
    }
    $('#addbubble').fadeIn();
  });

  $('#form_happy').submit(function() {
    // TODO: get info and $.post!
    return false;
  });

  /** Open up settings */
  $('#open_settings').click(function() {
    $('#settings').fadeIn();
  });

  /** Get a random happiness */
  $('#sad').click(function() {
    var el = $('#bubble');
    var newone = el.clone(true);
    el.before(newone);
    $("." + el.attr("class") + ":last").remove();
    $.get('/random_happy', function(res) {
      console.log(req.happiness);
    });
  });

  /** Add happiness online */
  $('#add').click(function() {
  });

  /** Save color before exiting */
  window.onbeforeunload = function() {
    if (logged_in) {
      $.post('/leave', { color: selected_color });
    }
  };

});
