'use strict';

// Required modules
var config = require('getconfig');
var db = require('pg-bricks').configure(config.db.connString);
var _ = require('lodash');

exports.list = function(req, res) {
  db.select()
    .from('station_info')
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

exports.get = function(req, res) {
  db.select()
    .from('getstation(' + req.params.stationId + ')')
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

exports.saveOrUpdate = function(req, res) {
  var function_params = '\'${address}\', \'${city}\', \'${phone}\',  '
    + '\'${postal}\', ${provinceid}, \'${service}\'';

  if(req.body.id) {
    function_params += ', ${id}';
  }
  var query = _.template('saveconfigstation(' + function_params + ')');

  db.select()
    .from(db.sql(query(req.body)))
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
