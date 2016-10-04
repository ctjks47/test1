'use strict';

// Required modules
var config = require('getconfig');
var db = require('pg-bricks').configure(config.db.connString);
var _ = require('lodash');
// var util = require('util');

exports.get = function(req, res) {
  var medId = req.params.id || '';

  // console.log(util.inspect(req.params.id));
  db.select()
    .from('getmedication(' + medId + ')')
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

exports.save = function(req, res) {
  var med = req.body;
  var query = _.template('savemedication(${med_id}, ${concentration}, '
    + '\'${description}\', \'${type}\', \'${unit_measure}\')');

  db.select()
    .from(query(med))
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
