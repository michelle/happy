function encodeHTML(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

var RED = '#d64f42';
var ORANGE = '#f4bc63';
var GREEN = '#a1bd88';
var YELLOW = '#EBDB8C';
var BLUE = '#6D9FB6';
var PURPLE = '#a2676c';
var ORIGINAL_COUNT = 80;

var active = 'login';
var selectedColor = RED;
var currentCount = ORIGINAL_COUNT;

$(document).ready(function() {
  var loggedIn = false;
  var $liquid = $('.liquid');
  var $number = $('#number');
  var $bubble = $('.bubble.up');

  var $menu = $('.menu');
  var $login = $('#login');
  var $happiness = $('#happiness');
  var $username = $('.username');

  function changeCount(number, color) {
    currentCount = number;
    var height = Math.min(100, Math.round(number / 200 * 100)) + '%';
    if (loggedIn) {
      $number.text(number);
      $number.show();
    }
    $liquid.stop().animate({height: height, backgroundColor: ORANGE}, function() {
      changeColor(color || selectedColor);
    });
  }

  function changeColor(color) {
    selectedColor = color;
    $liquid.stop().animate({backgroundColor: color});
    $number.stop().animate({backgroundColor: color});
  }
  change = changeColor;


  if (user) {
    loginUI(user);
  } else {
    logoutUI();
  }

  /**
   * SETTINGS
   */
  // TODO Resets the settings handler.
  $('.settings.form').submit(function() {
    sendSettings(function(res) {
      if (!res.err) {
        $('#settings').stop().fadeOut();
      }
    });
    return false;
  });

  $happiness.on('click', '.close', function() {
    $happiness.stop().fadeOut('fast');
  })

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

  /**
   * LOGIN/LOGOUT
   */
  // Update UI for login.
  function loginUI(user) {
    loggedIn = true;
    // TODO
    if (user.email) {
      $('.email.field').val(encodeHTML(user.email));
    }
    if (user.sms) {
      $('.sms.field').val(encodeHTML(user.sms));
    }
    $login.stop().fadeOut(function() {
      $('.login-errors').hide();
      changeCount(user.happiness, user.color);
      $username.css('opacity', 0);
      $username.text(user.username + '\'s');
      $username.animate({'opacity': 1});
      $menu.stop().fadeIn();
    });
  };

  // Update UI for logout.
  function logoutUI() {
    selectedColor = RED;
    loggedIn = false;
    changeCount(ORIGINAL_COUNT);
    $('.sms.field').val('');
    $('.email.field').val('');
    $menu.stop().fadeOut(function() {
      $login.stop().fadeIn();
    });
  };

  function logout() {
    $.post('/leave', { color: selectedColor });
    $.post('/logout', function() {
      logoutUI();
    });
  };

  $('a.logout').click(function() {
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
          loginUI(res.user[0]);
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

  $('.happiness.form').submit(function(ev) {
    ev.preventDefault();

    var $message = $(this).find('input[name=message]');
    var message = $message.val();
    if (message) {
      $.post('/happy', {
        message: message,
      }, function(res) {
        $happiness.stop().fadeOut('fast');
        if (!res.err) {
          $message.val('');
          var $newBubble = $bubble.clone(true);
          $bubble.before($newBubble);
          $bubble.remove();
          $bubble = $newBubble;
          setTimeout(function() {
            var height = $liquid.css('height');
            // TODO
            var increment = loggedIn ? 1 : 3;
            changeCount(currentCount + increment);
          }, 300);
        }
      });
    }

    return false;
  });


  /** Add a happy! */
  $('.lid').click(function() {
    if (!loggedIn) {
      $('.warn').text('You\'re not logged in, so any happinesses you. save will be mixed in with every other anon\'s! Log in to save your own happiness. :)');
      $('.warn').slideDown();
    }
    $happiness.stop().fadeIn('fast');
    $('input[name=message]').focus();
  });


  $('a.sad').click(function() {
    $.get('/random_happy', function(res) {
      if (res.happiness) {
        $('.happy-date').text(res.date);
        $('.happy-message').text(res.happiness);
      } else {
        $('.happy-date').text('Oh no...');
        $('.happy-message').text('we couldn\'t find any happinesses. Just consider the bad times down payment for the good ones :).');
      }
    });
  });


  $('.menu .logout').click(function() {
    logout();
  });

  /** Save color before exiting */
  window.onbeforeunload = function() {
    if (loggedIn) {
      $.post('/leave', { color: selected_color });
    }
  };

});
