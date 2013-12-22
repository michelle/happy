// TODO: refactor for new db schema.


/** Script to run to send everyone their messages. */
var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');
var users = db.collection('users');

var email = require('emailjs');
var server = email.server.connect({
  user: 'moosefrans@gmail.com',
  password: process.argv[2] || 'password',
  host: 'smtp.gmail.com',
  ssl: true
});

/** Formats a list prettily TODO: with HTML and stuff.. */
// Converts an array of JSON objects a CSV string.
function jsonToCsvAndText(arr) {
  var text = '';
  var csv = '';
  var header = '';
  for (var i = 0; i < arr.length; i += 1) {
    var obj = arr[i];

    // For text.
    text += obj.message + ' (' + obj.date.toString() + ')\n';

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
  return [csv, text];
}

users.find({'email': {'$ne': ''}}).toArray(function(err, res) {
  for (var i = 0; i < res.length; i += 1) {
    user = res[i];
    if (!!user.email && user.happiness.length > 0) {
      var happinessInfo = jsonToCsvAndText(happinesses.find({username: user.username}));
      var text = 'Enjoy this past year\'s happiest moments...and don\'t forget to make new ones next year!' + happinessInfo[1];
      var msg = {
        text: text,
        from: 'The Happiness Moose <moosefrans@gmail.com>',
        to: 'analogmidnight@gmail.com', //user.email,
        subject: '[Your Happiness Jar] Last year\'s happiest moments.',
        attachment: [
          {data: happinessInfo[0], alternative: true},
        ]
      };

      server.send(msg, function(err, message) { console.log(err || message); });
    }
  }
});
