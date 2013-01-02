var voicejs = require('voice.js')

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');

var client = new voicejs.Client({
  email: 'analogmidnight@gmail.com',
  password: process.argv[2] || 'password',
  tokens: require('./tokens.json')
});

client.on('status', function(status){
    console.log('UPDATED ACCOUNT STATUS:')
    console.log(status);
});
