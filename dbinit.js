/** Init db with a generic entry. */
var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');
var users = db.collection('users');

var generic_user = {
  username: 'generic',
  password: '',
  happiness: []
}

var generic_happiness = [
  'I sang a song and hit the high notes.',
  'Today I took a bubble bath.'
]

for (var i = 0; i < generic_happiness.length; i += 1) {
  generic_user.happiness.push({ date: new Date(), message: generic_happiness[i] });
}

users.insert(generic_user);
