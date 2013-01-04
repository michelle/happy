var express = require('express');
var fs = require('fs');
var app = express.createServer();

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


/**
 * User: {
 *  username: unique,
 *  password: ***,
 *  email: optional, unique,
 *  sms: optional, unique,
 *  twitter: optional, unique,
 *  color: optional, default=purple,
 *  ignore: default=false, optional, -- don't send emails if true.
 *  happiness: default=0
 * }
 */
var users = db.collection('users');
users.ensureIndex({ 'username' : 1 });
/**
 * Happiness: {
 *  username: String,
 *  date: Date,
 *  message: String
 * }
 */
var happies = db.collection('2013happies');


/** Generate random session ID. */
function randomId() {
  return Math.random().toString(36).substr(2);
};



// Initialize main server
app.use(express.bodyParser());
app.use(express.cookieParser());

app.use(express.static(__dirname + '/public'));
app.use(express.session({ secret: 'michelle', maxAge : new Date(Date.now() + 2628000000) }));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', function(req, res) {
  if (req.session.username) {
    users.findOne({ username: req.session.username }, function(err, user) {
      if (!!user) {
        res.render('index', { user: JSON.stringify(user) });
      } else {
        res.redirect('/logout');
      }
    });
  } else {
    res.render('index', { user: '' });
  }
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

// Triggered when the client closes the window; saves their color choice.
app.post('/leave', function(req, res) {
  if (req.session.username) {
    users.update({ username: req.session.username, color: req.body.color }, {}, function() {});
  }
  // Shouldn't be called without a username.
});

// Removes session from user on logout.
app.get('/logout', function(req, res) {
  req.session.username = null;
  res.redirect('/');
});

// Retrieves a random happiness for the user, else return generic.
app.get('/random_happy', function(req, res) {
  happies.find({ username: req.session.username }).toArray(function(err, h) {
    if (!err) {
      if (h.length > 0) {
        var happiness = h[Math.floor(Math.random() * h.length)];
        res.send({ happiness: happiness });
      } else {
        happies.find({ username: '' }).toArray(function(err, h) {
          if (!err) {
            var happiness = h[Math.floor(Math.random() * h.length)];
            res.send({ happiness: happiness });
          }
        });
      }
    } else {
      res.send({ err: 'Nothing found' });
    }
  });
});

// logs in a user, saves session ID, errors if already taken username.
app.post('/login', function(req, res) {
  // if data.type == register, then error should say username taken.
  // otherwise error should say wrong pw. done on front end?
  if (!req.body.username || !req.body.password) {
    res.send({ err: 'Please enter a username and password.' });
    return;
  }
  users.findOne({ username: req.body.username }, function(err, user) {
    if (!err && !!user && !!user.hash) {
      bcrypt.compare(req.body.password, user.hash, function(err, match) {
        if (match) {
          req.session.username = req.body.username;
          res.send({ user: user });
        } else {
          res.send({ err: 'Password is incorrect.' });
        }
      });
    } else {
      res.send({ err: 'Username does not exist.' });
    }
  });

});

app.post('/register', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.send({ err: 'Please enter a username and password.' });
    return;
  }
  users.findOne({ username: req.body.username }, function(err, user) {
    if (!user) {
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(req.body.password, salt, function(err, hash) {
          // Save new user to database.
          users.insert({
            username: req.body.username,
            hash: hash,
            happiness: 0,
            count: 0
          }, {}, function(err, result) {
            if (err) {
              res.send({ err: 'Username is taken.' });
            } else {
              req.session.username = req.body.username;
              res.send({ user: result });
            }
          });
        });
      });
    } else {
      res.send({ err: 'Username is taken.' });
    }
  });
});

// Saves a happiness.
app.post('/happy', function(req, res) {
  happies.insert({
    username: req.session.username,
    date: new Date(),
    message: req.body.message
  }, function(err, result) {
    if (!err) {
      users.update({ username: req.session.username },
        { $inc: { happiness: 1 } },
        {},
        function(err) {
          res.send({ result: result });
        }
      );
    } else {
      res.send({ err: 'Whoops, try again later.' });
    }
  });
});

// Saves user email, sms, twitter settings, errors if already used.
app.post('/save', function(req, res) {
  // TODO: check to see what changed.
  users.update({ username: req.session.username },
    { $set: {
              email: req.body.email,
              ignore: req.body.ignore,
              twitter: req.body.twitter,
              sms: req.body.sms }
    },
    {},
    function(err) {
      if (!err) {
        res.send({ result: 'Details successfully saved.' });
      } else {
        res.send({ err: err });
      }
    }
  );
});

// Sends a lost password email.
app.post('/lost', function(req, res) {
  if (!!req.body.email) {
    users.findOne({ email: req.body.email }, function(err, user) {
      if (!err && !!user) {
        var random = randomId();
        while (!!lostUsers[random]) {
          random = randomId();
        }

        var randomUrl = 'http://happinessjar.com/reset/' + random;
        var msg = {
          text:    'Hi, ' + user.username + '. Please visit ' + randomURL + ' to change your password to something that\'s easy to remember.',
          from:    'Happiness Jar <thehappinessjar@gmail.com>',
          to:      user.email,
          subject: '[Happiness Jar] Reset your password.',
        };

        mailer.send(msg, function(err, message) {
          if (err) {
            res.send({ error: 'Message could not be sent.' });
          } else {
            lostUsers[random] = res.username;
            res.send({ info: 'A password reset link has been sent to your email.' });
          }
        });
      } else {
        res.send({ error: 'Email does not belong to an account.' });
      }
    });
  } else {
    res.send({ error: 'Please enter an email.' });
  }
});

// Handle a new text message.
// Query users for that phone number. If ':(', send back a random happiness.
// Otherwise, store it.
app.post('/new_text', function(req, res) {

});

app.listen(8008);
