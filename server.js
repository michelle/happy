var express = require('express');
var fs = require('fs');
var app = express.createServer();
var io = require('socket.io').listen(app);

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');

var bcrypt = require('bcrypt');

/**
 * User: {
 *  username: unique,
 *  password: ***,
 *  email: optional, unique,
 *  sms: optional, unique,
 *  twitter: optional, unique,
 *  color: optional, default=purple,
 *  sessions: [hashes],
 *  happy: [happinesses]
 * },
 * generic, used to store random happinesses: {
 *  username: generic,
 *  password: None,
 *  happy: [happinesses]
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
  users.update({ username: username },
      { $push: { sessions: id } },
      {},
      function() { cb(id); });
};


/** SocketIO setup */
io.sockets.on('connection', function(socket) {
  // Sends to the client side number of happinesses, email & sms & color options.
  socket.on('init', function(data) {
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
    // retrieve a random happiness.
  });

  // Removes session ID from user on logout.
  socket.on('logout', function(data) {

  });

  // Saves user email, sms, twitter settings, errors if already used.
  socket.on('save', function(data) {

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
              login(data.username, function(session) {
                socket.emit('session', { id: session });
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
                sessions: []
              }, {}, function() {
                login(data.username, function(session) {
                  socket.emit('session', { id: session });
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
    
  });
});


// Initialize main server
app.use(express.bodyParser());

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');



app.get('/', function(req, res){
  res.render('index');
});


app.listen(8008);
