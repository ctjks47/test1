'use strict';

// Required modules
var config = require('getconfig');
var db = require('pg-bricks').configure(config.db.connString);
var _ = require('lodash');
var util = require('util');

function _parseFields(fields) {
  var res = {};

  fields.forEach(function(item) {
    res[item.name] = item.value;
  });
  return res;
}


exports.get = function(req, res) {

  // console.log(util.inspect(req.body));
  db.select()
    .from('report')
    .where('id', req.params.id)
    .row(function(err, row) {
      if(err) {
        console.log(err);
        res.send({
          status: 'ERROR',
          message: err
        });
        return;
      }

      var query = _.template(row.template.replace(/\|(\w+)/, ''));

      console.log(query(_parseFields(req.body.fields)));
      db.select()
        .from(db.sql(query(_parseFields(req.body.fields))))
        .rows(function(err, rows) {
          if(err) {
            res.send({
              status: 'ERROR',
              message: err
            });
            return;
          }
          console.log('report: ', util.inspect(rows));
          res.send(rows);
        });

    });
};

exports.list = function(req, res) {

  // console.log('body: ', util.inspect(req.params.id));
  db.select()
    .from('report')
    .orderBy('label')
    .rows(function(err, rows) {
      if(err) {
        console.log(err);
        res.send({
          status: 'ERROR',
          message: err
        });
        return;
      }

      var reports = rows.map(function(row) {
        var report = row;
        var tmpl = report.template;
        var field_labels = report.field_labels.split('|');

        // we don't want to send these across the line
        delete report.template;
        delete report.field_labels;

        var regex = /\${(\w+)\|(\w+)}/gi;
        var matches;
        var idx = 0;

        report.fields = [];

        while((matches = regex.exec(tmpl))) {
          report.fields.push({
            label: field_labels[idx],
            name: matches[1],
            type: matches[2]
          });
          idx += 1;
        }

        report.return_fields = report.return_fields.split('|');

        return report;

      });

      // console.log('report: ', util.inspect(reports));
      res.send(reports);
    });
};
