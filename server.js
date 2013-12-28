var express = require('express');
var fs = require('fs');
var app = express.createServer();

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/happy');
var SkinStore = require('connect-mongoskin');

var bcrypt = require('bcrypt');

// Temporary lost password links.
var lostUsers = {};

// Filtered from jQuery.ProfanityFilter
var SWEAR_WORDS = [ "2g1c",
  "2 girls 1 cup",
  "acrotomophilia",
  "anal",
  "anilingus",
  "anus",
  "arsehole",
  "assmunch",
  "auto erotic",
  "autoerotic",
  "baby batter",
  "ball gag",
  "ball gravy",
  "ball kicking",
  "ball licking",
  "ball sack",
  "ball sucking",
  "bangbros",
  "bareback",
  "barely legal",
  "bbw",
  "bdsm",
  "beaver cleaver",
  "beaver lips",
  "bestiality",
  "bi curious",
  "big breasts",
  "big knockers",
  "big tits",
  "bimbos",
  "birdlock",
  "bitch",
  "black cock",
  "blow j",
  "blow your l",
  "bondage",
  "boner",
  "boob",
  "boobs",
  "booty call",
  "brown showers",
  "brunette action",
  "bukkake",
  "bulldyke",
  "bullet vibe",
  "bung hole",
  "bunghole",
  "busty",
  "buttcheeks",
  "butthole",
  "camel toe",
  "carpet muncher",
  "carpetmuncher",
  "chocolate rosebuds",
  "circlejerk",
  "clit",
  "clitoris",
  "clover clamps",
  "clusterfuck",
  "cock",
  "cocks",
  "coprolagnia",
  "coprophilia",
  "cornhole",
  "cum",
  "cumming",
  "cunnilingus",
  "cunt",
  "darkie",
  "date rape",
  "daterape",
  "deep throat",
  "deepthroat",
  "dick",
  "dildo",
  "dirty pillows",
  "dirty sanchez",
  "dog style",
  "doggie style",
  "doggiestyle",
  "doggy style",
  "doggystyle",
  "dolcett",
  "domination",
  "dominatrix",
  "dommes",
  "donkey punch",
  "double dong",
  "double penetration",
  "dp action",
  "eat my ass",
  "ejaculation",
  "erotic",
  "erotism",
  "ethical slut",
  "eunuch",
  "faggot",
  "felch",
  "fellatio",
  "feltch",
  "female squirting",
  "femdom",
  "figging",
  "fingering",
  "fisting",
  "foot fetish",
  "footjob",
  "frotting",
  "fuck",
  "fuck buttons",
  "fudge packer",
  "fudgepacker",
  "futanari",
  "g-spot",
  "gang bang",
  "gay sex",
  "genitals",
  "giant cock",
  "girl on top",
  "gonewild",
  "gone wild",
  "goatcx",
  "goatse",
  "gokkun",
  "golden shower",
  "goo girl",
  "goregasm",
  "grope",
  "group sex",
  "guro",
  "hand job",
  "handjob",
  "hentai",
  "homoerotic",
  "honkey",
  "hooker",
  "huge fat",
  "humping",
  "incest",
  "jack off",
  "jail bait",
  "jailbait",
  "jerk off",
  "jigaboo",
  "jiggaboo",
  "jiggerboo",
  "jizz",
  "juggs",
  "kike",
  "kinbaku",
  "kinkster",
  "kinky",
  "knobbing",
  "leather restraint",
  "leather straight jacket",
  "lemon party",
  "lemonparty",
  "lolita",
  "lovemaking",
  "make me cum",
  "male squirting",
  "masturbate",
  "menage a trois",
  "milf",
  "missionary position",
  "motherfucker",
  "mound of venus",
  "muff diver",
  "muffdiving",
  "nambla",
  "nawashi",
  "neonazi",
  "nig nog",
  "nigga",
  "nigger",
  "nimphomania",
  "nipple",
  "nipples",
  "nsfw images",
  "nude",
  "nudity",
  "nympho",
  "nymphomania",
  "octopussy",
  "omorashi",
  "one cup two girls",
  "one guy one jar",
  "orgasm",
  "orgy",
  "paedophile",
  "pedobear",
  "pedophile",
  "pegging",
  "penis",
  "phone sex",
  "piece of shit",
  "piss pig",
  "pissing",
  "pisspig",
  "playboy",
  "pleasure chest",
  "pole smoker",
  "ponyplay",
  "poop chute",
  "poopchute",
  "porn",
  "porno",
  "pornography",
  "prince albert piercing",
  "pthc",
  "pubes",
  "pussy",
  "queef",
  "raghead",
  "raging boner",
  "rape",
  "raping",
  "rapist",
  "rectum",
  "reverse cowgirl",
  "rimjob",
  "rimming",
  "rosy palm",
  "rosy palm and her 5 sisters",
  "rusty trombone",
  "s&m",
  "sadism",
  "scat",
  "schlong",
  "scissoring",
  "semen",
  "sex",
  "sexo",
  "sexy",
  "shaved beaver",
  "shaved pussy",
  "shemale",
  "shibari",
  "shit",
  "shota",
  "shrimping",
  "slanteye",
  "slut",
  "smut",
  "snatch",
  "snowballing",
  "sodomize",
  "sodomy",
  "spic",
  "spooge",
  "spread legs",
  "strap on",
  "strapon",
  "strappado",
  "strip club",
  "style doggy",
  "suicide girls",
  "sultry women",
  "swastika",
  "swinger",
  "tainted love",
  "taste my",
  "tea bagging",
  "threesome",
  "throating",
  "tied up",
  "tight white",
  "tit",
  "tits",
  "titties",
  "titty",
  "tongue in a",
  "topless",
  "tosser",
  "towelhead",
  "tranny",
  "tribadism",
  "tub girl",
  "tubgirl",
  "tushy",
  "twat",
  "twink",
  "twinkie",
  "two girls one cup",
  "undressing",
  "upskirt",
  "urethra play",
  "urophilia",
  "vagina",
  "venus mound",
  "vibrator",
  "violet blue",
  "violet wand",
  "vorarephilia",
  "voyeur",
  "vulva",
  "wank",
  "wet dream",
  "wetback",
  "white power",
  "women rapping",
  "wrapping men",
  "wrinkled starfish",
  "yaoi",
  "yellow showers",
  "yiffy",
  "zoophilia"
]



/**
 * User: {
 *  username: unique,
 *  password: ***,
 *  email: optional, unique,
 *  sms: optional, unique,
 *  twitter: optional, unique,
 *  color: optional, default=purple,
 *  ignore: default=false, optional, -- don't send emails if true.
 *  happiness: default=0
 * }
 */
var users = db.collection('users');
users.ensureIndex({ 'username' : 1 });
/**
 * Happiness: {
 *  username: String,
 *  date: Date,
 *  message: String
 * }
 */
function happies() {
  return db.collection(new Date().getFullYear() + 'happies');
};

function valid(username) {
  return username.length < 21 && /^[a-zA-Z0-9\_]+$/.test(username);
};


/** Generate random session ID. */
function randomId() {
  return Math.random().toString(36).substr(2);
};



// Initialize main server
app.use(express.bodyParser());
app.use(express.cookieParser());

app.use(express.static(__dirname + '/public'));
app.use(express.session({
  secret: process.argv[3],
  maxAge : new Date(Date.now() + 2628000000),
  store: new SkinStore(db)
}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', function(req, res) {
  if (req.session.username) {
    users.findOne({ username: req.session.username }, function(err, user) {
      if (user) {
        res.render('index', { user: JSON.stringify(user) });
      } else {
        res.redirect('/logout');
      }
    });
  } else {
    res.render('index', { user: '' });
  }
});

// Password reset page.
app.get('/reset/:key', function(req, res) {
  var key = req.params.key;
  if (lostUsers[key]) {
    res.render('reset', { user: lostUsers[key] });
  } else {
    res.redirect('/');
  }
});

// Save new password, redirect to index.
app.post('/reset/:key', function(req, res) {
  var key = req.params.key;
  if (lostUsers[key] && lostUsers[key] == req.body.username) {
    // TODO: Reset password of associated user.
  } else {
    res.redirect('/');
  }
});

// Triggered when the client closes the window; saves their color choice.
app.post('/leave', function(req, res) {
  if (req.session.username) {
    users.update({ username: req.session.username }, { $set: { color: req.body.color } }, {}, function() {});
  }
  res.send(200);
  // Shouldn't be called without a username.
});

// Removes session from user on logout.
app.post('/logout', function(req, res) {
  delete req.session.username;
  res.send(200);
});

// Retrieves a random happiness for the user, else return generic.
app.get('/random_happy', function(req, res) {
  happies().find({username: req.session.username || ''}).toArray(function(err, h) {
    if (!err) {
      if (h.length > 0) {
        var hh = h[Math.floor(Math.random() * h.length)];
        var date = (hh.date.getMonth() + 1) + '/' + hh.date.getDate() + '/' + hh.date.getFullYear();
        var message = hh.message;

        // Filter out swear words if user is not logged in.
        /*if (!req.session.username) {
          for(var i = 0, ii = SWEAR_WORDS.length; i < ii; i += 1) {
            var pattern = new RegExp(SWEAR_WORDS[i], 'g');
            var replacement = new Array(SWEAR_WORDS[i].length + 1).join('*');
            message = message.replace(pattern, replacement);
          }
        }*/
        res.send({happiness: message, date: date});
        return;
      }
    }
    res.send({err: 'Nothing found'});
  });
});

// logs in a user, saves session ID, errors if already taken username.
app.post('/login', function(req, res) {
  // if data.type == register, then error should say username taken.
  // otherwise error should say wrong pw. done on front end?
  if (!req.body.username || !req.body.password) {
    res.send({err: 'Please enter a username and password.'});
    return;
  }
  users.findOne({ username: req.body.username.toLowerCase() }, function(err, user) {
    if (!err && user && user.hash) {
      bcrypt.compare(req.body.password, user.hash, function(err, match) {
        if (match) {
          req.session.username = req.body.username.toLowerCase();;
          res.send({user: user});
        } else {
          res.send({err: 'Password is incorrect.'});
        }
      });
    } else {
      res.send({err: 'Username does not exist.'});
    }
  });

});

app.post('/register', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.send({err: 'Please enter a username and password.'});
    return;
  }
  if (!valid(req.body.username)) {
    res.send({err: 'Your username can contain up to 20 letters, numbers, or _.'});
    return;
  }
  users.findOne({username: req.body.username.toLowerCase()}, function(err, user) {
    if (!user) {
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(req.body.password, salt, function(err, hash) {
          // Save new user to database.
          users.insert({
            twitter: '',
            email: '',
            sms: '',
            ignore: false,
            color: '',
            username: req.body.username.toLowerCase(),
            hash: hash,
            happiness: 0,
            count: 0
          }, {}, function(err, result) {
            if (err) {
              res.send({err: 'Username is taken.'});
            } else {
              req.session.username = req.body.username.toLowerCase();
              res.send({user: result});
            }
          });
        });
      });
    } else {
      res.send({err: 'Username is taken.'});
    }
  });
});

// Saves a happiness.
app.post('/happy', function(req, res) {
  happies().insert({
    username: req.session.username || '',
    date: new Date(),
    message: req.body.message
  }, function(err, result) {
    if (!err) {
      users.update({username: req.session.username},
        {$inc: {happiness: 1}},
        {},
        function(err) {
          res.send({result: result});
        }
      );
    } else {
      res.send({err: 'Whoops, try again later.'});
    }
  });
});

// Saves user email, sms, twitter settings, errors if already used.
app.post('/save', function(req, res) {
  // TODO: check to see what changed.
  var sms = req.body.sms;
  if (sms) {
    sms = sms.replace(/\D/g, '');
  }
  users.update(
    {username: req.session.username},
    {
      $set: {
        email: req.body.email,
        ignore: req.body.ignore,
        twitter: req.body.twitter,
        sms: sms
      }
    },
    {},
    function(err) {
      if (!err) {
        res.send({result: 'Details successfully saved.'});
      } else {
        res.send({err: err});
      }
    }
  );
});



// Sends a lost password email.
app.post('/lost', function(req, res) {
  if (req.body.email) {
    users.findOne({email: req.body.email}, function(err, user) {
      if (!err && user) {
        var random = randomId();
        while (lostUsers[random]) {
          random = randomId();
        }

        var randomUrl = 'http://happinessjar.com/reset/' + random;
        var msg = {
          text:    'Hi, ' + user.username + '. Please visit ' + randomURL + ' to change your password to something that\'s easy to remember.',
          from:    'Happiness Jar <thehappinessjar@gmail.com>',
          to:      user.email,
          subject: '[Happiness Jar] Reset your password.',
        };

        // TODO: send mail
      } else {
        res.send({error: 'Email does not belong to an account.'});
      }
    });
  } else {
    res.send({error: 'Please enter an email.'});
  }
});



// Handle a new text message.
// Query users for that phone number. If ':(', send back a random happiness.
// Otherwise, store it.
app.post('/new_text', function(req, res) {
  var sms = req.body;
  if (sms && sms.text && sms.number) {
    users.findOne({sms: sms.number}, function(err, user) {
      if (user && user.username) {
        happies().insert({
          username: user.username,
          date: new Date(),
          message: sms.text
        }, function(err, result) {
          if (!err) {
            users.update({ username: user.username },
              { $inc: { happiness: 1 } },
              {},
              function(err) {}
            );
          }
        });
      }
    });
  }
});

app.listen(8009);
