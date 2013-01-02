var express = require('express');
var fs = require('fs');
var app = express.createServer();
var io = require('socket.io').listen(app);

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');

/**
 * User: {
 *  username: unique,
 *  password: ***,
 *  email: optional, unique,
 *  sms: optional, unique,
 *  twitter: optional, unique,
 *  color: default=purple,
 *  sessions: optional, [hashes],
 *  happy: [happinesses]
 * },
 * generic, used to store random happinesses: {
 *  username: generic,
 *  password: None,
 *  happy: [happinesses]
 * }
 */
var users = db.collection('users');


/** Generate random session ID. */
function sessionId() {
  return Math.random().toString(36).substr(2);
};


/** SocketIO setup */
io.sockets.on('connection', function(socket) {
  // Sends to the client side number of happinesses, email & sms & color options.
  socket.on('init', function(data) {
    
  });

  // Triggered when the client closes the window; saves their color choice.
  socket.on('leave', function(data) {

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
