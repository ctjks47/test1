'use strict';

// Required modules
var config = require('getconfig');
var db = require('pg-bricks').configure(config.db.connString);

exports.takeoff = function(req, res) {

  var rocketship = {};

  db.select()
    .from('province')
    .rows(function(err, rows) {
      if(err) {
        res.send({
          status: 'ERROR',
          error: 'No returnUrl provided'
        });
        return;
      }
      rocketship.provinces = rows;
      res.send(rocketship);
    });
};
