function encodeHTML(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

var RED = '#d64f42';
var GREEN = '#a1bd88';
var YELLOW = '#EBDB8C';
var BLUE = '#6D9FB6';
var PURPLE = '#a2676c';

var ORIGINAL_COUNT = 80;
var ORANGE = '#f4bc63';
var DULL = '#96797a';
var DARK = '#505a56';

var COLORS = {
  red: RED,
  yellow: YELLOW,
  green: GREEN,
  blue: BLUE,
  purple: PURPLE
};

var active = 'login';
var selectedColor = RED;
var currentCount = ORIGINAL_COUNT;

$(document).ready(function() {
  var loggedIn = false;
  var $liquid = $('.liquid');
  var $liquidAndNumber = $('.liquid, #number');
  var $number = $('#number');
  var $bubble = $('.bubble.up');

  var $menu = $('.menu');
  var $login = $('#login');
  var $happiness = $('#happiness');
  var $sadness = $('#sadness');
  var sadTime;
  var $username = $('.username');
  var $settings = $('#settings');
  var $colors = $('#colors');
  var $instructions = $('#instructions');

  function changeCount(number, color) {
    currentCount = number;
    var height = Math.min(100, Math.round(number / 200 * 100)) + '%';
    if (loggedIn) {
      $number.text(number);
      $number.stop().show();
    }
    $liquid.stop().animate({height: height, backgroundColor: ORANGE}, function() {
      changeColor(color || selectedColor);
    });
  }

  function changeColor(color) {
    selectedColor = color;
    $liquidAndNumber.stop().animate({backgroundColor: color});
  }

  function flashColor(color) {
    $liquidAndNumber.stop().animate({backgroundColor: color}, function() {
      $liquidAndNumber.stop().animate({backgroundColor: selectedColor});
    });
  }
  window.flashColor = flashColor;

  function unleashBubble() {
    var $newBubble = $bubble.clone(true);
    $bubble.before($newBubble);
    $bubble.remove();
    $bubble = $newBubble;
  }


  if (user) {
    loginUI(user);
  } else {
    logoutUI();
  }

  /**
   * SETTINGS
   */
  $('.settings.form').submit(function() {
    var sms = $(this).find('input[name=sms]').val();
    var email = $(this).find('input[name=email]').val();
    if (sms !== user.sms || email != user.email) {
      $.post('/save', {
        sms: sms,
        email: email
      }, function(res) {
        if (!res.err) {
          $settings.stop().hide();
          flashColor(ORANGE);
        } else {
          $('.settings-error').show();
          flashColor(DARK);
        }
      });
    } else {
      $settings.stop().hide();
    }
    return false;
  });

  $happiness.on('click', '.close', function() {
    $happiness.stop().hide();
  });

  $instructions.on('click', '.close', function() {
    $instructions.stop().hide();
  });

  $colors.on('click', 'div', function(ev) {
    changeColor(COLORS[$(ev.target).attr('class')]);
  });

  /**
   * LOGIN/LOGOUT
   */
  // Update UI for login.
  function loginUI(user) {
    loggedIn = true;
    // TODO
    if (user.email) {
      $settings.find('input[name=email]').val(encodeHTML(user.email));
    }
    if (user.sms) {
      $settings.find('input[name=sms]').val(encodeHTML(user.sms));
    }
    $login.stop().fadeOut(function() {
      $('.login-errors').hide();
      changeCount(user.happiness, user.color);
      $username.css('opacity', 0);
      $username.text(user.username + '\'s');
      $username.animate({'opacity': 1});
      $menu.stop().show();
    });
  };

  // Update UI for logout.
  function logoutUI() {
    loggedIn = false;
    selectedColor = RED;
    changeCount(ORIGINAL_COUNT);
    $('.sms.field').val('');
    $('.email.field').val('');
    $number.stop().hide();
    $username.text('');
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

  $menu.on('click', 'a.logout', function() {
    logout();
  });
  $menu.on('click', 'a.settings', function() {
    $settings.stop().show();
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
  $('a.instructions').click(function() {
    $instructions.stop().toggle();
  });

  $('.login.form').submit(function() {
    var url = active === 'login' ? '/login' : '/register';
    $.post(url, {
      username: $(this).find('input[name=username]').val(),
      password: $(this).find('input[name=password]').val()
    }, function(res) {
      if (res.user) {
        if (active === 'register') {
          loginUI(res.user[0]);
          $settings.stop().show();
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
        $happiness.stop().hide();
        if (!res.err) {
          $message.val('');
          unleashBubble();
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
      // TODO! WARN
      /*$('.warn').text('You\'re not logged in, so any happinesses you. save will be mixed in with every other anon\'s! Log in to save your own happiness. :)');
      $('.warn').slideDown();*/
    }
    $happiness.stop().show();
    $('input[name=message]').focus();
  });


  $('a.sad').click(function() {
    flashColor(DULL);

    if (!loggedIn) {
      return;
    }

    $.get('/random_happy', function(res) {

      // WHAT *TODO* WITH DATE??
      if (res.happiness) {
        $('.happy-message').text(res.happiness);
      } else {
        $('.happy-message').text('We couldn\'t find any happinesses. Just consider the bad times down payment for the good ones :).');
      }

      $sadness.fadeIn();
      if (sadTime !== undefined) {
        clearTimeout(sadTime);
      }
      sadTime = setTimeout(function() {
        sadTime = undefined;
        $sadness.fadeOut();
        unleashBubble();
      }, 5000);
    });
  });

  /** Save color before exiting */
  window.onbeforeunload = function() {
    if (loggedIn) {
      $.post('/leave', { color: selectedColor });
    }
  };

});
