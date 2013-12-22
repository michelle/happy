// TODO: refactor for new db schema.


/** Script to run to send everyone their messages. */
var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');
var users = db.collection('users');
var happinesses = db.collection('2013happy');

var nodemailer = require('nodemailer');
var smtpTransport = nodemailer.createTransport("SMTP",{
  service: "Gmail",
  auth: {
    user: 'moosefrans@gmail.com',
    password: process.argv[2] || 'password',
  }
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
    if (!!user.email && user.happiness > 0) {
      (function(u) {
        happinesses.find({username: u.username}).toArray(function(err, happies) {
          console.log(happies)
          happies = jsonToCsvAndText(happies);
          var text = 'Enjoy this past year\'s happiest moments...and don\'t forget to make new ones next year!' + happies[1];
          var msg = {
            text: text,
            from: 'The Happiness Moose <moosefrans@gmail.com>',
            to: 'analogmidnight@gmail.com', //u.email,
            subject: '[Your Happiness Jar] Last year\'s happiest moments.',
            attachments: [
              {content: happies[0], contentType: 'text/csv'},
            ]
          };

          smtpTransport.sendMail(msg, function(err, message) { console.log(err || message.message); });
        });
      })(user);
    }
  }
});
