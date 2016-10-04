'use strict';

// Required modules
var config = require('getconfig');
var db = require('pg-bricks').configure(config.db.connString);
var _ = require('lodash');
var util = require('util');
var moment = require('moment');

var result = {};
var groups = {};
var subgroups = {};
var competencies = {};

function buildCompetencies() {

  groups.forEach(function(group) {

    group.subgroups = subgroups.filter(function(subgroup) {
      return subgroup.id.indexOf(group.id) === 0;
    });

    group.subgroups.forEach(function(subgroup) {
      subgroup.competencies = competencies.filter(function(competency) {
        return competency.id.indexOf(subgroup.id) === 0;
      });
    });

  });

  result = groups;

}

/**
 * Builds list of competencies
 */
exports.competencies = function(req, res) {

  db.select()
    .from('competency_group')
    .orderBy('id')
    .rows(function(err, rows) {
      if(err) {
        console.log(err);
        return;
      }

      groups = rows;

      db.select()
        .from('competency_subgroup')
        .orderBy('id')
        .rows(function(err, rows) {
          if(err) {
            console.log(err);
            return;
          }

          subgroups = rows;

          db.select()
            .from('getcomp(\'' + res.user.email + '\')')
            .rows(function(err, rows) {
              if(err) {
                console.log(err);
                return;
              }
              competencies = rows;

              buildCompetencies();
              res.send(result);

            });

        });

    });

};

/**
 * Saves new call
 * TODO: edit to use both states of savecall
 */
// console.log('body: ', util.inspect(req.body));
exports.saveUpdateCall = function(req, res) {
  var call = req.body;

  call.email = res.user.email; // is this the best way to do this?
  call.date = moment(call.calldate[0].date).format('YYYY-MM-DD HH:mm:ss');

  call.competency_ids = call.competencies.map(function(el) {
    return el.id;
  });
  call.competency_ids = '{"' + call.competency_ids.join('","') + '"}';

  call.student_comments = call.competencies.map(function(el) {
    return el.student_comments;
  });
  call.student_comments = '{"' + call.student_comments.join('","') + '"}';

  call.grades = call.competencies.map(function(el) {
    return el.grade;
  });
  call.grades = '{"' + call.grades.join('","') + '"}';

  var function_params = '\'${email}\', ${age}, \'${gender}\', ${picid}, '
    + '\'${details}\', \'${date}\', \'${competency_ids}\', '
    + '\'${student_comments}\', \'${grades}\'';

  if(call.callid) {
    function_params += ', ${callid}';
  }

  var query = _.template('savecall(' + function_params + ')');

  db.select()
    .from(db.sql(query(call)))
    .rows(function(err, rows) {
      if(err) {
        console.log(err);
        return;
      }
      console.log(rows);
      res.send(rows);
    });

  console.log(util.inspect(query(call)));
};


exports.savelatecall = function(req, res) {

  var call = req.body;

  call.email = res.user.email; // is this the best way to do this?
  var query = _.template('savelatecall(\'${email}\', '
      + '\'${reason}\', ${callId})');

  // console.log(util.inspect(query(call)));
  // console.log(util.inspect(call));

  db.select()
    .from(db.sql(query(call)))
    .rows(function(err) {
      if(err) {
        res.send({
          status: 'ERROR',
          message: err
        });
        return;
      }
      res.send({
        status: 'OK',
        message: 'Call updated'
      });
    });
};

/**
 * Get existing call
 */
// Should this maybe be named 'get'
exports.retrieve = function(req, res) {

  var call = {};
  var query = 'getcalldata(\'' + res.user.email + '\', ' + req.params.id + ' )';

  db.select()
    .from(db.sql(query))
    .row(function(err, row) {
      if(err) {
        console.log(err);
        return;
      }

      call = _.assign(call, row);

      query = 'getcallcompdata(\''
        + res.user.email + '\', ' + req.params.id + ' )';

      db.select()
        .from(db.sql(query))
        .rows(function(err, rows) {
          if(err) {
            console.log(err);
            return;
          }

          var competencies = {};

          rows.forEach(function(el) {
            competencies[el.id] = el;
          });
          call.competencies = competencies;
          res.send(call);
        });

    });

  // console.log(util.inspect(query(call)));
};

/**
 * Retrieve list of PICs
 */
exports.pic = function(req, res) {

  db.select()
    .from('pic')
    .orderBy('id')
    .rows(function(err, rows) {
      if(err) {
        console.log(err);
        return;
      }

      res.send(rows);
    });
};

exports.dashboardcalls = function(req, res) {

  var user = req.params.id || res.user.email;

  db.select()
    .from(db.sql('getdashboardcalls(\'' + user + '\')'))
    .rows(function(err, rows) {
      if(err) {
        console.log(err);
        return;
      }

      res.send(rows);
    });
};

exports.dashboardreview = function(req, res) {

  var user = req.params.id || res.user.email;

  db.select()
    .from(db.sql('getdashboardreview(\'' + user + '\')'))
    .rows(function(err, rows) {
      if(err) {
        console.log(err);
        return;
      }

      res.send(rows);
    });
};

exports.submitted = function(req, res) {

  var user = req.params.id || res.user.email;

  db.select()
    .from(db.sql('getdashboardreview(\'' + user + '\')'))
    .rows(function(err, rows) {
      if(err) {
        console.log(err);
        return;
      }

      res.send(rows);
    });
};

exports.tourtypes = function(req, res) {
  db.select()
    .from('tour_type')
    .orderBy('description ASC') // should be like this anyways but lets force it
    .rows(function(err, rows) {
      if(err) {
        console.log(err);
        return;
      }

      res.send(rows);
    });
};
