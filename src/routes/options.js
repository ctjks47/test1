'use strict';

// Required modules
var config = require('getconfig');
var db = require('pg-bricks').configure(config.db.connString);

exports.provinces = function(req, res) {
  db.select()
    .from('province')
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
