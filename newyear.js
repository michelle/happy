/** Script to run to send everyone their messages on 1/1. */
var YEAR = 2014;

var cronJob = require('cron').CronJob;

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');
var users = db.collection('users');
var happinesses = db.collection(YEAR + 'happies');

var nodemailer = require('nodemailer');
var smtpTransport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: 'moosefrans@gmail.com',
    pass: process.argv[2] || 'password',
  }
});

/*
var j = new cronJob(new Date(YEAR + 1, 0, 1), job, function() {
  console.log('HAPPY NEW YEAR!!!#@');
}, true);
*/

job();

// Converts an array of JSON objects a CSV/text string.
function jsonToCsvAndText(arr) {
  var text = '<ul>';
  var csv = '';
  var header = '';
  for (var i = 0; i < arr.length; i += 1) {
    var obj = arr[i];

    // For text.
    text += '<li>"' + obj.message + '" <em>('
        + (obj.date.getMonth() + 1) + '/' + obj.date.getDate() + ')</em></li>';

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

function job() {
  users.find({'email': {'$gt': 'bullseye567@gmail.com'}}).toArray(function(err, res) {
    for (var i = 0, ii = res.length; i < ii; i += 1) {
      user = res[i];
      if (!!user.email && user.happiness > 0) {
        (function(u) {
          happinesses.find({username: u.username}).toArray(function(err, happies) {
            console.log('DRYRUN send to ' + user.email, user.happiness, happies.length);
            if (happies.length === 0) {
              console.log('No happinesses for ' + u.username);
              return;
            }
            return;
            happies = jsonToCsvAndText(happies);
            var html = 'Hey <strong>' + u.username + '</strong>,<br><br>'
                + 'Enjoy 2014\'s happiest moments...and don\'t forget to make '
                + 'new ones in the new year!<br>' + happies.text
                + '<br>Love,<br><strong><a href="http://happinessjar.com">'
                + 'Your Happiness Jar</strong></a>';

            var msg = {
              html: html,
              from: 'The Happiness Moose <moosefrans@gmail.com>',
              to: u.email,
              subject: '[Your Happiness Jar] 2014\'s happiest moments.'
            };

            smtpTransport.sendMail(msg, function(err, res) {
              console.log(err || res);
            });
          });
        })(user);
      }
    }
  });
}
