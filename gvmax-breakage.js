// GVMax is broken, so the last few months of text messages have come into my inbox instead. Time to backfill!

var fs = require('fs');
var texts = fs.readFileSync('./2014-texts.txt', 'utf-8');

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');
var users = db.collection('users');
var happies = db.collection('2014happies');

texts = texts.split('-------------------------');
console.log(texts.length + ' total texts to process...');

texts.forEach(function(text) {
  // Need to strip (), and -.
  var number = /From: "(.*)" \</g.exec(text);
  if (!number) {
    return;
  }
  number = number[1];
  // Need to convert to timestamp.
  var date = /Date: (\d+\/\d+\/\d+, \d+:\d+ (PM|AM))/g.exec(text)[1];
  var body = /To: AnalogMidnight@gmail\.com\n\n(.*)/g.exec(text)[1].trim();

  if (body === ':(') {
    return;
  }

  console.log('Inserting:', number, date, body);

  // From server code.
  number = number.replace(/\D/g, '');
  users.findOne({sms: number}, function(err, user) {
    if (user && user.username) {

      happies().insert({
        username: user.username,
        date: new Date(date),
        message: body
      }, function(err, result) {
        if (!err) {
          users.update({username: user.username},
            { $inc: { happiness: 1 } },
            {},
            function(err) {
            }
          );
        }
      });

    }
  });
});
