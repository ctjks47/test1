'use strict';

// Required modules
var config = require('getconfig');
var db = require('pg-bricks').configure(config.db.connString);

exports.get = function(req, res) {
  db.select()
    .from('message')
    .rows(function(err, rows) {
      if(err) {
        console.log(err);
        res.send({
          status: 'ERROR',
          message: err
        });
        return;
      }
      res.send(rows);
    });
};
