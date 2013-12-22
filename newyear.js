// TODO: refactor for new db schema.


/** Script to run to send everyone their messages. */
var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');
var users = db.collection('users');
var happinesses = db.collection('2013happies');

var nodemailer = require('nodemailer');
var smtpTransport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: 'moosefrans@gmail.com',
    pass: process.argv[2] || 'password',
  }
});

// Converts an array of JSON objects a CSV/text string.
function jsonToCsvAndText(arr) {
  var text = '<ul>';
  var csv = '';
  var header = '';
  for (var i = 0; i < arr.length; i += 1) {
    var obj = arr[i];

    // For text.
    text += '<li>"' + obj.message + '" <em>(' + obj.date.getMonth() + '/' + obj.date.getDate() + ')</em></li>';

    // For CSV.
    var entry = '';
    for (var property in obj) {
      if (obj.hasOwnProperty(property) && ['_id', 'username'].indexOf(property) === -1) {
        // Create header.
        if (i == 0) {
          if (header != '') header += ',';
          header += property;
        }
        // Comma-split unless line is empty.
        if (entry != '') {
          entry += ',';
        }
        entry += arr[i][property];
      }
    }
    csv += entry + '\r\n';
  }
  csv = header + '\r\n' + csv;
  return {csv: csv, text: text + '</ul>'};
}

users.find({'email': {'$ne': ''}}).toArray(function(err, res) {
  for (var i = 0; i < 1; i += 1) {
    user = res[i];
    if (!!user.email && user.happiness > 0) {
      (function(u) {
        happinesses.find({username: u.username}).toArray(function(err, happies) {
          happies = jsonToCsvAndText(happies);
          var html = 'Hey <strong>' + u.username + '</strong>,<br><br>Enjoy 2013\'s happiest moments...and don\'t forget to make new ones in the new year!<br>' + happies.text + '<br>Love,<br><strong><a href="http://happinessjar.com">Your Happiness Jar</strong></a>';
          var msg = {
            html: html,
            from: 'The Happiness Moose <moosefrans@gmail.com>',
            to: 'analogmidnight@gmail.com', //u.email,
            subject: '[Your Happiness Jar] Last year\'s happiest moments.'
          };

          smtpTransport.sendMail(msg, function(err, message) { console.log(err || message.message); });
        });
      })(user);
    }
  }
});
