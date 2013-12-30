var express = require('express');
var fs = require('fs');
var app = express.createServer();

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');
var SkinStore = require('connect-mongoskin');

var bcrypt = require('bcrypt');
var request = require('request');

// mailer
var nodemailer = require('nodemailer');
var smtpTransport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: 'moosefrans@gmail.com',
    pass: process.argv[2] || 'password'
  }
});


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
users.ensureIndex({username: 1});
users.ensureIndex({email: 1});
users.ensureIndex({sms: 1});
var passwordCodes = db.collection('password_codes');
passwordCodes.ensureIndex({user: 1});
/**
 * Happiness: {
 *  username: String,
 *  date: Date,
 *  message: String
 * }
 */
function happies() {
  return db.collection(new Date().getFullYear() + 'happies');
}

function validateUsername(username) {
  return username.length < 21 && /^[a-zA-Z0-9\_]+$/.test(username);
}

function validateEmail(email) { 
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

/** Generate random session ID. */
function randomId() {
  return Math.random().toString(36).substr(2);
}

function changePassword(username, password, params, cb) {
  bcrypt.genSalt(10, function(err, salt) {
    if (err) {
      cb(err);
    } else {
      bcrypt.hash(password, salt, function(err, hash) {
        if (err) {
          cb(err);
        } else {
          params = params || {};
          params.hash = hash;
          users.update({username: username}, {$set: params}, {}, function(err, user) {
            cb(err);
          });
        }
      });
    }
  });
}

function loginRequired(req, res, next) {
  if (!req.session.username) {
    res.send(401);
    return;
  }
  next();
}

function findRandomHappiness(username, cb) {
  happies().find({username: username}).toArray(function(err, h) {
    if (!err) {
      if (h.length > 0) {
        var hh = h[Math.floor(Math.random() * h.length)];
        var date = (hh.date.getMonth() + 1) + '/' + hh.date.getDate() + '/' + hh.date.getFullYear();
        var message = hh.message;

        cb(null, {happiness: message, date: date});
      } else {
        cb('Nothing found');
      }
    } else {
      cb(err);
    }
  });
}


// Initialize main server
app.use(express.bodyParser());
app.use(express.cookieParser());

app.use(express.static(__dirname + '/public'));
app.use(express.session({
  secret: process.argv[3],
  maxAge : new Date(Date.now() + 2628000000),
  store: new SkinStore(db)
}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', function(req, res) {
  if (req.session.username) {
    users.findOne({ username: req.session.username }, function(err, user) {
      if (user) {
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
  passwordCodes.findById(key, function(err, code) {
    if (code) {
      users.findById(code.user, function(err, user) {
        if (user) {
          res.render('reset', {user: user})
        } else {
          res.redirect('/');
        }
      });
    } else {
      res.redirect('/');
    }
  });
});

// Save new password, redirect to index.
app.post('/reset/:key', function(req, res) {
  var key = req.params.key;
  var newPassword = req.body.password;
  var confirmPassword = req.body.confirm;
  if (newPassword !== confirmPassword) {
    res.send({err: 'Passwords do not match.'});
    return;
  }
  passwordCodes.findById(key, function(err, code) {
    if (code) {
      users.findById(code.user, function(err, user) {
        if (user) {
          changePassword(user.username, newPassword, {}, function(err) {
            if (err) {
              res.send({err: 'An unexpected error has occurred. Please email michelle@michellebu.com if this problem persists.'});
            } else {
              res.send(200);
            }
          });
        } else {
          res.send({err: 'This password reset link has expired. Please try again.'});
        }
      });

      passwordCodes.removeById(code._id);
    } else {
      res.send({err: 'This password reset link has expired. Please try again.'});
    }
  });
});

// Triggered when the client closes the window; saves their color choice.
app.post('/leave', loginRequired, function(req, res) {
  users.update({ username: req.session.username }, { $set: { color: req.body.color } }, {}, function() {
    res.send(200);
  });
});

// Removes session from user on logout.
app.post('/logout', loginRequired, function(req, res) {
  delete req.session.username;
  res.send(200);
});

// Retrieves a random happiness for the user.
app.get('/random_happy', loginRequired, function(req, res) {
  findRandomHappiness(req.session.username, function(err, happiness) {
    if (err) {
      res.send({err: 'Nothing found'});
    } else {
      res.send(happiness);
    }
  });
});

// logs in a user, saves session ID, errors if already taken username.
app.post('/login', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.send({err: 'Please enter a username and password.'});
    return;
  }
  users.findOne({username: req.body.username.toLowerCase()}, function(err, user) {
    if (!err && user && user.hash) {
      bcrypt.compare(req.body.password, user.hash, function(err, match) {
        if (match) {
          req.session.username = req.body.username.toLowerCase();;
          res.send({user: user});
        } else {
          res.send({err: 'Password is incorrect.'});
        }
      });
    } else {
      res.send({err: 'Username does not exist.'});
    }
  });

});

app.post('/register', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.send({err: 'Please enter a username and password.'});
    return;
  }
  if (!validateUsername(req.body.username)) {
    res.send({err: 'Your username can contain up to 20 letters, numbers, or _.'});
    return;
  }
  users.findOne({username: req.body.username.toLowerCase()}, function(err, user) {
    if (!user) {
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(req.body.password, salt, function(err, hash) {
          // Save new user to database.
          users.insert({
            twitter: '',
            email: '',
            sms: '',
            ignore: false,
            color: '',
            username: req.body.username.toLowerCase(),
            hash: hash,
            happiness: 0,
            count: 0
          }, {}, function(err, result) {
            if (err) {
              res.send({err: 'Username is taken.'});
            } else {
              req.session.username = req.body.username.toLowerCase();
              res.send({user: result});
            }
          });
        });
      });
    } else {
      res.send({err: 'Username is taken.'});
    }
  });
});

// Saves a happiness.
app.post('/happy', loginRequired, function(req, res) {
  happies().insert({
    username: req.session.username,
    date: new Date(),
    message: req.body.message
  }, function(err) {
    if (!err) {
      users.update({username: req.session.username},
        {$inc: {happiness: 1}},
        {},
        function(err) {
          res.send(200);
        }
      );
    } else {
      res.send({err: 'Whoops, try again later.'});
    }
  });
});

app.post('/ignore', loginRequired, function(req, res) {
  res.send(200);
});

// Saves user email, sms, twitter settings, errors if already used.
app.post('/save', loginRequired, function(req, res) {
  if (req.body.email && !validateEmail(req.body.email)) {
    res.send({err: 'The email you entered is not valid.'});
    return;
  }

  var sms = req.body.sms;
  if (sms) {
    sms = sms.replace(/\D/g, '');
  }

  // TODO: make this not so stupid of a codepath.
  if (req.body.password) {
    changePassword(req.body.username, req.session.username, {
      email: req.body.email,
      sms: sms
    }, function(err) {
      if (!err) {
        res.send({result: 'Details successfully saved.'});
      } else {
        res.send({err: err});
      }
    });
  } else {
    users.update(
      {username: req.session.username},
      {
        $set: {
          email: req.body.email,
          sms: sms
        }
      },
      {},
      function(err) {
        if (!err) {
          res.send({result: 'Details successfully saved.'});
        } else {
          res.send({err: err});
        }
      }
    );
  }
});



// Sends a lost password email.
app.post('/forgot', function(req, res) {
  function findByQuery(query, input) {
    users.findOne(query, function(err, user) {
      if (user && validateEmail(user.email)) { // we need to validate again because legacy.

        // TODO: make this less shitty.
        passwordCodes.insert({user: user._id}, function(err, result) {
          if (!err) {
            var result = result[0];

            var randomURL = 'http://happinessjar.com/reset/' + result._id;
            var msg = {
              text:    'Hi, ' + user.username + '. Please visit ' + randomURL + ' to change your password to something that\'s easy to remember.',
              from:    'Happiness Moose <moosefrans@gmail.com>',
              to:      user.email,
              subject: '[Happiness Jar] Reset your password.',
            };

            smtpTransport.sendMail(msg, function(err, ignore) {
              if (err) {
                res.send({err: 'An unexpected error occurred. Please email michelle@michellebu.com if this keeps happening.'});
                console.log('MAILER ERROR: ' + err);
              } else {
                res.send({email: user.email});
              }
            });

          } else {
            res.send({err: 'An unexpected error occurred. Please email michelle@michellebu.com if this keeps happening.'});
          }
        });

      } else if (user) {
        res.send({err: 'We could not find a valid email address associated with ' + input + '. Please email michelle@michellebu.com to get your password reset.'});
      } else {
        res.send({err: 'We could not find an account associated with ' + input + '.'});
      }
    });
  }

  var input = req.body.username;
  if (input) {
    findByQuery({'$or': [{email: input}, {username: input}]}, input);
  } else {
    // Shouldn't get here.
    res.send({err: 'Please enter a username or email.'});
  }
});



// Handle a new text message.
// Query users for that phone number. If ':(', send back a random happiness.
// Otherwise, store it.
app.post('/new_text', function(req, res) {
  var sms = req.body;
  if (sms && sms.text && sms.number) {
    users.findOne({sms: sms.number}, function(err, user) {
      if (user && user.username) {

        // Trim text.
        if (sms.text.replace(/(^\s*)|(\s*$)/g, '') === ':(') {

          findRandomHappiness(user.username, function(err, happiness) {
            if (!err) {
              request({
                method: 'POST',
                url: 'https://www.gvmax.com/api/send',
                form: {
                  callbackUrl: 'http://happinessjar.com/ignore',
                  pin: '40d1165fdb6442e3be3f3a4d1d3f8dec',
                  number: sms.number,
                  text: happiness.happiness
                }
              }, function(err, msg, response) {
                // TODO: figure out how to handle these.
                // For now we're just assuming success.
                if (err) {
                  console.log(err);
                }
              });
            }
          });

        } else {

          happies().insert({
            username: user.username,
            date: new Date(),
            message: sms.text
          }, function(err, result) {
            if (!err) {
              users.update({ username: user.username },
                { $inc: { happiness: 1 } },
                {},
                function(err) {
                }
              );
            }
          });

        }

      }
    });
  }
  // always send ok.
  res.send(200);
});

app.listen(8009);
