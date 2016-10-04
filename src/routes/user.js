'use strict';

// Required modules
var config = require('getconfig');
var db = require('pg-bricks').configure(config.db.connString);
var token = require('../token');
var bcrypt = require('bcrypt-nodejs');
var nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');
var client = require('../modules/client');

exports.types = function(req, res) {
  db.select()
    .from('roles')
    .rows(function(err, rows) {
      if(err) {
        res.send({
          status: 'ERROR',
          message: err
        });
        return;
      }
      res.send(rows);
    });
};

exports.initiate_forgot_password = function(req, res) {

  var username = req.body.username;
  var returnUrl = req.body.returnUrl;

  if(!username) {
    res.send({
      status: 'MISSING_PARAMETER',
      message: 'No username provided'
    });
  }
  else if(!returnUrl) {
    res.send({
      status: 'MISSING_PARAMETER',
      message: 'No returnUrl provided'
    });
  }
  else {

    db.select()
      .from('users')
      .where({email: username})
      .row(function(err, user) {

        // Abort if no user found
        // Return OK to prevent phishing
        if(err) {
          console.log('err: ', err);
          res.send({
            status: 'OK',
            message: 'Password request initiated'
          });
          return;
        }

        /* eslint-disable lines-around-comment, max-len */
        // Handlebars options
        var options = {
          viewEngine: {
            extname: '.hbs',
            // defaultLayout : 'template', // base template/wrapper
            layoutsDir: 'views/email/', // where the engine will look for the template specified below
            partialsDir: 'views/partials/' // where to find partials called in layout above
          },
          viewPath: 'views/email/',
          extName: '.hbs'
        };
        /* eslint-enable lines-around-comment, max-len */

        // Create mailer
        var mailer = nodemailer.createTransport({
          service: 'postmark',
          auth: {
            user: process.env.POSTMARK_API_KEY || config.email.user,
            pass: process.env.POSTMARK_API_KEY || config.email.password
          }
        });

        // Generate reset URL
        var uid = token.generate();
        var url_token = token.encrypt(uid + ':' + username);

        client.set('forgot_password:' + username + ':token', uid);
        client.expire('forgot_password:' + username + ':token', config.redis.passwordResetTimeout); // eslint-disable-line max-len

        // Send mail
        mailer.use('compile', hbs(options));
        mailer.sendMail({
          from: config.email.from,
          to: username,
          subject: 'Forgot Password',
          template: 'forgot-password-2',
          context: {
            subject: 'Forgot Password',
            user_first_name: user.first_name,
            action_url: returnUrl.replace(/\/$/, '') + '/?token=' + url_token,
            validFor: Math.floor(config.redis.passwordResetTimeout / 60),
            app_name: config.app_name
          }
        }, function(err, response) {
          if(err) {
            console.log(err);
            res.send({
              status: 'REQUEST_FAILED',
              message: 'There was an error performing your request'
            });
          }
          else {
            console.log('Forgot Password email for user id ' + user.id + ' [via Postmark]'); // eslint-disable-line max-len
            console.log(response);
            res.send({
              status: 'OK',
              // message: response
              message: 'Password request initiated'
            });
          }
          mailer.close();

        });

      });
  }
};

exports.validate_reset_token = function(req, res) {

  // TODO: validate token
  var url_token = req.body.token;
  var parsed = token.decrypt(url_token).split(':');

  client.get('forgot_password:' + parsed[1] + ':token', function(err, data) {

    if(err) {
      console.log(err);
      res.send({
        status: 'ERROR',
        message: ''
      });
      return;
    }
    if(data === parsed[0]) {
      console.log('Password reset: Token is valid');

      res.send({
        status: 'OK',
        message: 'Token is valid'
      });
    }
    else {
      console.log('TOKEN_INVALID');
      res.send({
        status: 'TOKEN_INVALID',
        message: 'Token has expired or is invalid'
      });
    }

  });
};

exports.complete_forgot_password = function(req, res) {

  // TODO: set new password

  var url_token = req.body.token;
  var password = req.body.password;
  var parsed = token.decrypt(url_token).split(':');
  var email = parsed[1];

  client.get('forgot_password:' + email + ':token', function(err, data) {

    if(err) {
      console.log(err);
      res.send({
        status: 'ERROR',
        message: 'Token not valid'
      });
      return;
    }
    if(data === parsed[0]) {
      console.log('Password Reset: token still valid');

      var values = {};

      if(password !== '') {
        values.password = bcrypt.hashSync(password);
      }
      db.update('users', values)
        .where('email', email)
        .run(function(err) {
          if(err) {
            res.send({
              status: 'ERROR',
              message: 'There was an error updating user'
            });
            console.log(err);
            return;
          }

          res.send({
            status: 'OK',
            message: 'Password updated successfully'
          });

        });
    }
    else {
      console.log('ERROR');
      res.send({
        status: 'ERROR',
        message: 'There was an error making the request'
      });
    }

  });

};

exports.read = function(req, res) {

  var query = db.select()
    .from('users')
    .where({id: req.params.id})
    .run();

  query.on('error', function(err) {
    res.send({
      status: 'ERROR',
      message: err
    });
    return;
  });

  query.on('row', function(user) {

    db.select()
      .from('roles')
      .where({id: user.role_id})
      .row(function(err, role) {

        if(err) {
          console.log(err);
          res.send({
            status: 'ERROR',
            message: ''
          });
          return;
        }

        user.role = role;

        // remove data we don't want to send back
        delete user.password;
        delete user.role_id;
        res.send(user);

      });

  });

};

exports.create = function(req, res) {
  var user = req.body;

  user.created_on = new Date();
  user.password = bcrypt.hashSync(user.password);
  var query = db.insert('users', user)
    .returning('*')
    .run();

  query.on('row', function(user) {
    delete user.password;
    res.send({
      user: user
    });
  });

  query.on('error', function(err) {
    if(err.code === '23505' && err.detail.indexOf('email')) {
      res.send({
        error: 'User with this email already exists'
      });
    }
    return;
  });
};

exports.update = function(req, res) {

  var user = req.body;

  var values = {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role_id: user.role.id,
    edited_on: new Date()
  };

  if(user.password !== '') {
    values.password = bcrypt.hashSync(user.password);
  }
  db.update('users', values)
    .where('id', user.id)
    .run(function(err) {
      if(err) {
        res.send({
          status: 'ERROR',
          message: 'There was an error updating user'
        });
        console.log(err);
        return;
      }

      res.send(user);

    });
};


exports.list = function(req, res) {
  var users = [];

  db.select()
    .from('roles')
    .rows(function(err, roles) {

      if(err) {
        res.send({
          status: 'ERROR',
          message: 'There was an error retrieving users'
        });
        console.log(err);
        return;
      }

      db.select()
        .from('users')
        .orderBy('id')
        .rows(function(err, rows) {
          if(err) {
            res.send({
              status: 'ERROR',
              message: 'There was an error retrieving users'
            });
            console.log(err);
            return;
          }


          rows.forEach(function(user) {
            user.role = roles.findByObjectId('id', user.role_id);
            delete user.role_id;
            delete user.password;
            users.push(user);
          });

          res.send(users);

        });
    });
};

exports.logout = function(req, res) {
  if(res.user) {
    client.del('api_user:' + res.user.id + ':token');
    res.status(200).json({
      status: 'LOGOUT',
      message: 'User logged out'
    });
  }
  else {
    res.send({
      status: 'ERROR',
      message: 'No user provided'
    });
  }
};

exports.auth = function(req, res) {

  db.select('id', 'first_name', 'last_name', 'email', 'role_id', 'password')
    .from('users')
    .where({
      email: req.body.username.toLowerCase()
    })
    .limit(1)
    .row(function(err, user) {

      if(err) {
        res.send({
          status: 'ERROR',
          message: 'Authentication failed: ' + err
        });
        return;
      }
      if (!bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          status: 'ERROR',
          message: 'Authentication failed: invalid credentials'
        });
        return;
      }

      // generate user api token
      var auth_token = token.generate();
      var encrypted_token = token.encrypt(auth_token);

      // add token to Redis
      client.set('api_user:' + user.id + ':token', auth_token);
      client.expire('api_user:'
        + user.id + ':token', config.redis.sessionTimeout);

      // record login
      db.update('users', {last_login: new Date()})
        .where('id', user.id)
        .run();

      // get user role
      db.select()
        .from('roles')
        .where({id: user.role_id})
        .limit(1)
        .row(function(err, role) {

          if(err) {
            res.send({
              status: 'ERROR',
              message: err
            });
            return;
          }

          user.role = role.short_name;
          delete user.role_id;
          delete user.password;

          var encrypted_user = token.encrypt(JSON.stringify(user));

          res.send({
            status: 'OK',
            user: user,
            token: encrypted_user + '.' + encrypted_token
          });

        });

    });

};

if(!Array.prototype.findByObjectId) {
  Array.prototype.findByObjectId = function(param, value) {
    if (this === null) {
      throw new TypeError('Array.prototype.findByObjectId called on null or undefined'); // eslint-disable-line max-len
    }

    if (typeof param !== 'string') {
      throw new TypeError();
    }

    var Obj = Object(this);
    var len = Obj.length >>> 0;
    var k = 0;

    while (k < len) {

      if(Obj[k][param] === value) {
        return Obj[k];
      }

      k++; // eslint-disable-line no-plusplus

    }
  };
}
