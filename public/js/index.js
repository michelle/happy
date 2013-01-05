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
        $('#settings').stop().fadeOut();
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
    if (!!user.email) {
      $('#email_field').val(user.email);
    }
    if (!!user.sms) {
      $('#sms_field').val(user.sms);
    }
    $('#login').stop().fadeOut(function() {
      $('.login-errors').hide();
      var color = user.color || '#ec8585'
      $('#liquid').stop().animate({ 'backgroundColor': color }, function() {
        selected_color = color;
        $('#moving').stop().animate({ 'height': Math.min(100, 22 + user.happiness) + '%' });
        for (var i = 0; i < bgColoredSelectors.length; i += 1) {
          bgColoredSelectors[i].css({ 'backgroundColor': selected_color });
        }
        for (var i = 0; i < fgColoredSelectors.length; i += 1) {
          fgColoredSelectors[i].css({ 'color': selected_color });
        }
      });
      $('#username').text(user.username + '\'s');
      $('#title').animate({ 'width': 210 + $('#username').width() + 'px' }, function() {
        $('#username').stop().fadeIn();
      });
      $('#number').text(user.happiness);
      $('#panel').stop().fadeIn();
      $('#add').stop().fadeIn();
    });
  };

  // Update UI for logout.
  function logoutUI() {
    $('#sms_field').val('');
    $('#email_field').val('');
    logged_in = false;
    $('#sadness').hide();
    $('#add').stop().fadeOut();
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
        if (active == 'register') {
          loginUI(res.user[0]);
          $('#settings').stop().fadeIn();
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


  /** Add a happy! */
  $('#add').click(function() {
    if (!logged_in) {
      $('.warn').text('You\'re not logged in, so any happinesses you save will be mixed in with every other anon\'s! Log in to save your own happiness. :)');
      $('.warn').slideDown();
    }
    $('#addbubble').stop().fadeIn();
  });


  /** Open up settings */
  $('#open_settings').click(function() {
    $('#add_happiness').hide();
    $('#settings').show();
  });

  /** Get a random happiness */
  $('#sadness').mouseover(function() {
    $('#panel').css({ opacity: 0.7 });
  });
  $('#sadness').mouseleave(function() {
    $('#panel').css({ opacity: 1 });
  });
  $('#sad').click(function() {
    $('#add_happiness').hide();
    var el = $('#bubble');
    var newone = el.clone(true);
    el.before(newone);
    el.remove();
    $.get('/random_happy', function(res) {
      if (res.happiness) {
        $('#date').text(res.date);
        $('#message').text(res.happiness);
        $('#sadness').stop().fadeIn();
      } else {
        $('#date').text('Oh no...');
        $('#message').text('you haven\'t added any happinesses. Just consider the bad times down payment for the good ones :).');
        $('#sadness').stop().fadeIn();
      }
    });
  });

  /** Add happiness online */
  $('#add').click(function() {
    $('#settings').hide();
    $('#sadness').hide();
    $('#add_happiness').show();
  });

  /** Handle happiness. */
  $('#form_happiness').submit(function() {
    var msg = $('#message_field').val();
    if (!!msg) {
      $.post('/happy', { message: msg }, function(res) {
        $('#add_happiness').stop().fadeOut();
        if (!res.err) {
          var new_count = parseInt($('#number').text()) + 1;
          $('#number').text(new_count);
          $('#message_field').val('');
          setTimeout(function() {
            $('#moving').animate({ 'height': (22 + new_count) + '%' });
          }, 500);
        }
      });
    }
    return false;
  });

  /** Close popups. */
  $('#settings').on('click', '.close', function() {
    $('#settings').hide();
  });
  $('#add_happiness').on('click', '.close', function() {
    $('#add_happiness').hide();
  });
  $('#sadness').click(function() {
    $(this).stop().fadeOut();
  });
  $('.info').click(function() {
    $(this).stop().fadeOut();
  });
  $('.error').click(function() {
    $(this).stop().fadeOut();
  });

  /** instructions */
  $('.instructions').click(function() {
    $('#instructions').fadeToggle();
  });
  $('#instructions').on('click', '.close', function() {
    $('#instructions').fadeOut();
  });

  /** Save color before exiting */
  window.onbeforeunload = function() {
    if (logged_in) {
      $.post('/leave', { color: selected_color });
    }
  };

});
