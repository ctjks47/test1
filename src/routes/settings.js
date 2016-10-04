'use strict';

// Required modules
var config = require('getconfig');
var db = require('pg-bricks').configure(config.db.connString);

exports.get = function(req, res) {
  db.select()
    .from('settings')
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

exports.update = function(req, res) {

  var settings = req.body;

  settings.forEach(function(el) {
    delete el.description;
    delete el.type;
  });

  db.update('settings s', {value: db.sql('s2.value')})
    .from(db.sql.values(settings).as('s2').columns())
    .where('s.key', db.sql('s2.key'))
    .run(function(err) {
      if(err) {
        console.log(err);
        res.send({
          status: 'ERROR',
          message: 'There was an error updating the settings'
        });
        return;
      }

      res.send({
        status: 'OK',
        settings: req.body
      });
    });
};

exports.get_by_type = function(req, res) {
  db.select()
    .from('settings')
    .where('type', req.params.type)
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
