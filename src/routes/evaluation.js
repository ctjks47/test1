'use strict';

// Required modules
var config = require('getconfig');
var db = require('pg-bricks').configure(config.db.connString);

exports.load = function(req, res) {

  var query = 'getreviewquestions(\'' + res.user.email + '\', 1)';

  db.select()
    .from(db.sql(query))
    .where({'': req.body.formType})
    .rows(function(err, rows) {
      if(err) {
        res.send({
          status: 'ERROR',
          error: err
        });
        return;
      }
      res.send(rows);
    });
};
