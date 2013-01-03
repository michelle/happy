var express = require('express');
var fs = require('fs');
var app = express.createServer();
var io = require('socket.io').listen(app);

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');

var bcrypt = require('bcrypt');

var email = require('emailjs');
var mailer = email.server.connect({
  user: 'thehappinessjar@gmail.com',
  password: process.argv[2] || 'password',
  host: 'smtp.gmail.com',
  ssl: true
});
// Temporary lost password links.
var lostUsers = {};

// Default happiness color.
var DEFAULT_COLOR = '#dcc2e2';

/**
 * User: {
 *  username: unique,
 *  password: ***,
 *  email: optional, unique,
 *  sms: optional, unique,
 *  twitter: optional, unique,
 *  color: optional, default=purple,
 *  sessions: [hashes],
 *  ignore: default=false, optional, -- don't send emails if true.
 *  happiness: [happinesses]
 * },
 * generic, used to store random happinesses: {
 *  username: generic,
 *  password: None,
 *  happiness: [happinesses]
 * }
 */
var users = db.collection('users');
users.ensureIndex({ 'username' : 1 });


/** Generate random session ID. */
function sessionId() {
  return Math.random().toString(36).substr(2);
};

/** Provides session id to save to clientside. */
function login(username, cb) {
  var id = sessionId();
  users.findAndModify({ username: username },
    {},
    { $push: { sessions: id } },
    function(err, entry) {
      var color = entry.color || DEFAULT_COLOR;
      cb(id, color);
    });
};


/** SocketIO setup */
io.sockets.on('connection', function(socket) {
  // Sends to the client side number of happinesses, email & sms & color options.
  socket.on('init', function(data) {
    users.findOne({ username: data.username }, function(err, user) {
      // Confirm session ID.
      if (user.sessions.indexOf(data.session) != -1) {
        socket.emit('init', { count: user.happiness.length });
      }
    });
  });

  // Triggered when the client closes the window; saves their color choice.
  socket.on('leave', function(data) {
    if (!!data.username) {
      users.update({ username: data.username, color: data.color }, {}, function() {});
    }
    // Shouldn't be called without a username.
  });

  // Retrieves a random happiness for the user, else return generic.
  socket.on('random_happy', function(data) {
    users.findOne({ username: data.username }, function(err, user) {
      // TODO: error handling?
      // Confirm session ID.
      if (user.sessions.indexOf(data.session) != -1 && user.happiness.length > 0) {
        var happiness = user.happiness[Math.floor(Math.random() * user.happiness.length)];
        socket.emit('random_happy', { happiness: happiness });
      } else {
        // TODO: insert a generic user.
        users.findOne({ username: 'generic' }, function(err, generic) {
          if (!err) {
            var happiness = generic.happiness[Math.floor(Math.random() * generic.happiness.length)];
            socket.emit('random_happy', { happiness: happiness });
          }
        });
      });
  });

  // Removes session ID from user on logout.
  socket.on('logout', function(data) {
    users.update({ username: data.username },
      { $pull: { sessions: data.sessions }},
      {},
      function(err) {
        if (!err) {
          socket.emit('logout');
        } else {
          console.log('+ logout', err);
        }
      });
  });

  // Saves user email, sms, twitter settings, errors if already used.
  socket.on('save', function(data) {
    // TODO: check to see what changed.
    users.update({ username: data.username },
      { $set: { email: data.email, twitter: data.twitter, sms: data.sms }},
      {},
      function(err) {
        if (!err) {
          socket.emit('saved');
        } else {
          console.log('+ save', err);
        }
      });
  });

  // Registers/logs in a user, saves session ID, errors if already taken username.
  socket.on('login', function(data) {
    // if data.type == register, then error should say username taken.
    // otherwise error should say wrong pw. done on front end?
    if (!data.password) {
      socket.emit('login-error', { err: 'Please enter a password.' });
      return;
    }
    users.findOne({ username: data.username }, function(err, res) {
      if (data.type == 'login') {
        if (!err && !!res && !!res.hash) {
          bcrypt.compare(data.password, res.hash, function(err, match) {
            if (match) {
              login(data.username, function(session, color) {
                socket.emit('session', { id: session, color: color });
              });
            } else {
              socket.emit('login-error', { err: 'Username and password do not match.' });
          });
        } else {
          console.log(err);
          socket.emit('login-error', { err: err });
        }
      } else {
        // Register.
        if (!res) {
          bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(data.password, salt, function(err, hash) {
              // Save new user to database.
              users.insert({
                username: data.username,
                hash: hash,
                happiness: [],
                sessions: [],
                count: 0
              }, {}, function() {
                login(data.username, function(session, color) {
                  socket.emit('session', { id: session, color: color });
                });
              });
            });
          });
        } else {
          socket.emit('login-error', { err: 'Username is taken.' });
        }
      }
    });

  });

  // Saves a happiness.
  socket.on('happy', function(data) {
    users.update({ username: data.username },
      { $push: { happiness: { date: new Date(), message: data.happiness } } },
      {},
      function(err) {
        if (!err) {
          socket.emit('happiness');
        } else {
          console.log('+ happy', err);
        }
      });
  });

  // TODO: Sends a lost password email.
  socket.on('lost', function(data) {
    if (data.email) {
      users.findOne({ email: data.email }, function(err, res) {
        if (!err && !!res) {
          var random = sessionId();
          while (!!lostUsers[random]) {
            random = sessionId();
          }

          var randomUrl = 'http://happinessjar.com/reset/' + random;
          var msg = {
            text:    'Hi, ' + res.username + '. Please visit ' + randomURL + ' to change your password to something that\'s easy to remember.',
            from:    'Happiness Jar <thehappinessjar@gmail.com>',
            to:      res.email,
            subject: '[Happiness Jar] Reset your password.',
          };

          mailer.send(msg, function(err, message) {
            if (err) {
              socket.emit('error', 'Message could not be sent.');
            } else {
              lost.push(random);
              lostUsers[random] = res.username;
              socket.emit('info', 'A password reset link has been sent to your email.');
            }
          });
        } else {
          socket.emit('error', 'Email does not belong to an account.');
        }
      });
    } else {
      socket.emit('error', 'Please enter an email.');
    }
  });
});


// Initialize main server
app.use(express.bodyParser());

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', function(req, res) {
  res.render('index');
});

// Password reset page.
app.get('/reset/:key', function(req, res) {
  var key = req.params.key;
  if (!!lostUsers[key]) {
    res.render('reset', { user: lostUsers[key] });
  } else {
    res.redirect('/');
  }
});

// Save new password, redirect to index.
app.post('/reset/:key', function(req, res) {
  var key = req.params.key;
  if (!!lostUsers[key] && lostUsers[key] == req.body.username) {
    // TODO: Reset password of associated user.
  } else {
    res.redirect('/');
  }

});

// Handle a new text message.
// Query users for that phone number. If ':(', send back a random happiness.
// Otherwise, store it.
app.post('/new_text', function(req, res) {

});

app.listen(8008);
