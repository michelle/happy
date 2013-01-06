// TODO: refactor for new db schema.


/** Script to run to send everyone their messages. */
var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');
var users = db.collection('users');

var email = require('emailjs');
var server = email.server.connect({
  user: 'thehappinessjar@gmail.com',
  password: process.argv[2] || 'password',
  host: 'smtp.gmail.com',
  ssl: true
});

/** Formats a list prettily TODO: with HTML and stuff.. */
// Converts an array of JSON objects a CSV string.
function JSONtoCSV(jsonArray) {
  var csv = '';
  var header = '';
  for (var i = 0; i < jsonArray.length; i += 1) {
    var entry = '';
    var obj = jsonArray[i];
    for (var property in obj) {
      if (obj.hasOwnProperty(property)) {
        // Create header.
        if (i == 0) {
          if (header != '') header += ','
          header += property
        }
        // Comma-split unless line is empty.
        if (entry != '') entry += ','
        entry += jsonArray[i][property];
      }
    }
    csv += entry + '\r\n';
  }
  csv = header + '\r\n' + csv;
  return csv;
}

users.find({}).toArray(function(err, res) {
  for (var i = 0; i < res.length; i += 1) {
    user = res[i];
    if (!!user.email && user.happiness.length > 0) {
      var formatted_happiness = JSONtoCSV(user.happiness);
      var msg = {
        text:    'Enjoy this past year\'s moments...and don\'t forget to make new ones next year!', 
        from:    'Happiness Jar <thehappinessjar@gmail.com>', 
        to:      user.email,
        subject: '[Happiness Jar] Last year\'s happiest moments.',
        attachment:
        [
          { data: formatted_happiness, alternative: true},
        ]
      };

      server.send(msg, function(err, message) { console.log(err || message); });
    }
  }
});
