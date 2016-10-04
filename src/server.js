'use strict';

// ===============================================================
// Dependancies
// ===============================================================
var env = process.env.NODE_ENV || 'dev';
var config = require('getconfig');

var express = require('express');
var cors = require('cors');
var client = require('./modules/client');

var app = express();
var port = process.env.PORT || 8080;
var token = require('./token');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

// Session management
var session = require('express-session');

// Error handling and testing
var errorHandler = require('errorhandler');
var morgan = require('morgan');

// ===============================================================
// Configuration
// ===============================================================
var whitelist = [
  'http://ape.localhost',
  'http://pma.romeo-whiskey.com',
  'http://192.168.1.70',
  'http://ape-dist.localhost',
  'http://pma-app.romeo-whiskey.ca'
];
var corsOptions = {
  origin: function(origin, callback) {
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;

    callback(null, originIsWhitelisted);
  },
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Accept', 'Content-Type', 'Authorization'],
  credentials: true
};

// development only
if ('dev' === env) {
  app.use(errorHandler());
  app.use(morgan('dev'));
  corsOptions = {};
}

// We are going to protect /api routes with JWT
// var secret = 'ilovescotchscotchyscotchscotch';
// app.use('/user', expressJwt({secret: secret}));
// var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });
var secret = 'tencookiessittingoneaplatecookiemonstereatoneyumnowtherearenine';

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser(secret));

// Add a little humor to the response
app.use(function(req, res, next) {
  res.header('X-Powered-By', 'Redbull and Coffee');
  next();
});

// Kick unauthorized calls
app.use(function(req, res, next) {
  var whitelist = [
    '/user/forgot',
    '/user/forgot/validate',
    '/user/logout',
    '/ping'
  ];

  // User is either trying to access somewhere which doesn't require auth
  if((req.url === '/user/auth' && req.body.username && req.body.password)
      || whitelist.indexOf(req.url) !== -1) {

    next();

  }
  else if(req.headers.authorization) {

    // User has authenticated in the past. Let's parse the supplied data
    var crypted = req.headers.authorization.split('.');
    var user = token.decrypt(crypted[0], true);
    var userToken = token.decrypt(crypted[1]);

    if(!user || !userToken) {

      // Something is missing from the request
      // so let's pull the shoot just to be safe
      res.status(401).json({
        status: 'ERROR',
        message: 'Not authorized'
      });

    }
    else if(req.url === '/user/logout') {

      // Logout user
      client.del('api_user:' + user.id + ':token');
      res.status(200).send({message: 'User logged out'});

    }
    else {

      // User has logged in. Let's verify their session is still active
      client.get('api_user:' + user.id + ':token', function(err, token) {

        if(err) {
          res.status(401).send({
            status: 'ERROR',
            message: 'Error retrieving session'
          });
        }

        if(!token) {

          // Session has expired
          res.status(401).send({
            status: 'ERROR',
            message: 'Session expired'
          });

        }
        else if(userToken === token) {

          // Session is valid so let's reset the TTL
          res.user = user;
          var sessionTimeout = config.redis.sessionTimeout;

          client.expire('api_user:' + user.id + ':token', sessionTimeout);
          next();
        }

      });
    }

  }
  else {
    res.status(401).json({
      status: 'ERROR',
      message: 'Not authorized'
    });
  }

});

// ===============================================================
// Redis
// ===============================================================
client.on('error', function(err) {
  console.log('Error ' + err);
});

// ===============================================================
// Routes
// ===============================================================
app.options('*', cors(corsOptions));    // enables pre-flight across the board
require('./routes/index.js')(app);      // load our routes and pass in our app

// Try to recover dropped session
app.use(function(req, res, next) {
  var tries = 3;

  function lookupSession(error) {
    if (error) {
      return next(error);
    }

    tries -= 1;

    if (req.session !== undefined) {
      return next();
    }

    if (tries < 0) {
      return next(new Error('oh no')); // TODO
    }

    session(req, res, lookupSession);
  }

  lookupSession();
});

// if(!module.parent) {
//  app.listen(3000, function () {
//    console.log("Express server started on port 3000");
//  });
// }

var server = app.listen(port, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('PMA API listening at http://%s:%s', host, port);
});
