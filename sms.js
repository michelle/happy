var voicejs = require('voice.js')

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');

var client = new voicejs.Client({
  email: 'analogmidnight@gmail.com',
  password: process.argv[2] || 'password',
  tokens: require('./tokens.json')
});

function spamGoogleVoice() {
  client.get('unread', { limit: Infinity }, function(err, res, data) {
    console.log(data);
    var conversations = data.conversations_response.conversation;
    for (var i = 0; i < conversations.length; i += 1) {
      var conv = conversations[i];
      client.set('mark', { id: conv.id, read: true, archive: true }, function(err, res, data) {
        if (err) {
          console.log(err);
        }
      });
    }
  });
};

spamGoogleVoice();
setInterval(spamGoogleVoice, 5000);
