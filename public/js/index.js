$(document).ready(function() {
  var active = 'login';
  var selected_color = '#ec8585';
  var logged_in = false;


  if (user) {
    loginUI(user);
  }

  // TODO Resets the settings handler.
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
    }, function(res) {
      cb(res);
    });
  };

  // Update UI for login.
  function loginUI(user) {
    logged_in = true;
    // TODO
    if (user.email) {
      $('#email_field').val(user.email);
    }
    if (user.sms) {
      $('#sms_field').val(user.sms);
    }
    $('#login').stop().fadeOut(function() {
      $('.login-errors').hide();
      var color = user.color || '#ec8585'; // TODO
      $('.liquid').stop().animate({ 'backgroundColor': color, 'height': Math.min(100, Math.round((35 + user.happiness) / 200 * 100)) + '%' });
      $('.username').text(user.username + '\'s');
    });
  };

  // Update UI for logout.
  function logoutUI() {
    // TODO
    $('#sms_field').val('');
    $('#email_field').val('');
    logged_in = false;
    $('#sadness').hide();
  };

  function logout() {
    $.post('/leave', { color: selected_color });
    $.post('/logout', function() {
      logoutUI();
    });
  };

  $('#logout').click(function() {
    logout();
  });

  // Toggle login form.
  $('a.login').click(function() {
    $('.button.register, a.login').addClass('hidden');
    $('.button.login, a.register').removeClass('hidden');
    active = 'login';
  });
  $('a.register').click(function() {
    $('.button.login, a.register').addClass('hidden');
    $('.button.register, a.login').removeClass('hidden');
    active = 'register';
  });

  $('.login.form').submit(function() {
    var url = active == 'login' ? '/login' : '/register';
    $.post(url, {
      username: $(this).find('input[name=username]').val(),
      password: $(this).find('input[name=password]').val()
    }, function(res) {
      if (res.user) {
        if (active == 'register') {
          //loginUI(res.user[0]);
          console.log('Registered');
        } else {
          //loginUI(res.user);
          console.log('Logged in');
        }
      } else {
        $('.login-errors').text(res.err);
        $('.login-errors').slideDown();
      }
    });

    return false;
  });


  /** Add a happy! */
  $('#add').click(function() {
    if (!logged_in) {
      $('.warn').text('You\'re not logged in, so any happinesses you. save will be mixed in with every other anon\'s! Log in to save your own happiness. :)');
      $('.warn').slideDown();
    }
    // TODO
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
    $('#message_field').focus();
  });

  /** Handle happiness. */
  $('#form_happiness').submit(function() {
    var msg = $('#message_field').val();
    if (msg) {
      $.post('/happy', { message: msg }, function(res) {
        $('#add_happiness').stop().fadeOut();
        if (!res.err) {
          var new_count = parseInt($('#number').text()) + 1;
          $('#number').text(new_count);
          $('#message_field').val('');
          setTimeout(function() {
            $('#moving').stop().animate({ 'height': Math.min(100, Math.round((35 + new_count) / 200 * 100)) + '%' });
          }, 500);
        }
      });
    }
    return false;
  });


  /** Save color before exiting */
  window.onbeforeunload = function() {
    if (logged_in) {
      $.post('/leave', { color: selected_color });
    }
  };

});
