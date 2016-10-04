'use strict';
var user = require('./user'),
  settings = require('./settings'),
  stations = require('./stations'),
  messages = require('./messages'),
  medication = require('./medication'),
  report = require('./report'),
  options = require('./options'),
  call = require('./call'),
  other = require('./other');

// Routes
module.exports = function(app) {

// ===============================================================
// User
// ===============================================================

  app.route('/user')
    .post(user.create)
    .put(user.update)
    .delete(function(req, res) {
      res.send('Delete user');
    });

  app.route('/user/list')
    .get(user.list);

  app.route('/user/auth')
    .post(user.auth);

  app.route('/user/logout')
    .post(user.logout);

  app.route('/user/types')
    .get(user.types);

  app.route('/user/forgot')
    .post(user.initiate_forgot_password)
    .put(user.complete_forgot_password);

  app.route('/user/forgot/validate')
    .post(user.validate_reset_token);

  // app.route('/gettourdates/:id')
  //   .get(user.gettourdates);

  app.route('/user/:id')
    .get(user.read);


// ===============================================================
// Settings
// ===============================================================
//
  app.route('/admin/settings')
    .get(settings.get)
    .post(settings.update);

  app.route('/admin/settings/:type')
    .get(settings.get_by_type)
    .post(settings.update);


// ===============================================================
// Stations
// ===============================================================

  app.route('/stations')
    .get(stations.list);

  app.route('/station/list')
    .get(stations.list);

  app.route('/station')
    .post(stations.saveOrUpdate);

  app.route('/station/:stationId')
    .post(stations.saveOrUpdate)
    .get(stations.get);


// ===============================================================
// Messages
// ===============================================================

  app.route('/messages')
    .get(messages.get);


// ===============================================================
// Medication
// ===============================================================

  app.route('/medication')
    .post(medication.save)
    .get(medication.get);

  app.route('/medication/:id')
    .put(medication.save)
    .get(medication.get);


// ===============================================================
// Reports
// ===============================================================

  app.route('/report/list')
    .get(report.list);

  app.route('/report/:id')
    .post(report.get);


// ===============================================================
// Evaluations
// ===============================================================
  // var stations = require('./evaluation');
  // app.route('/evaluation') // might need more params here
  //  .get(evaluation.load);


// ===============================================================
// Calls
// ===============================================================

  app.route('/call')
    .post(call.saveUpdateCall);

  app.route('/call/tourtypes')
    .get(call.tourtypes);

  app.route('/call/competencies')
    .get(call.competencies);

  app.route('/call/pic')
    .get(call.pic);

  app.route('/call/dashboardcalls')
    .get(call.dashboardcalls);

  app.route('/call/dashboardreview')
    .get(call.dashboardreview);

  app.route('/call/submitted')
    .get(call.submitted);

  app.route('/call/late')
    .post(call.savelatecall);

  app.route('/call/:id')
    .get(call.retrieve)
    .post(call.saveUpdateCall);


// ===============================================================
// Options
// ===============================================================

  app.route('/provinces')
    .get(options.provinces);

// ===============================================================
// Others
// ===============================================================

  app.route('/ping')
    .get(other.ping)
    .post(other.ping);

  // '404'
  // app.use(function (req, res, next) {
  //  res.send([{}]);
  // });

};

// // route middleware to make sure a user is logged in
// function isLoggedIn(req, res, next) {

//     // if user is authenticated in the session, carry on
//     if (req.isAuthenticated()) {
//      return next();
//     }

//     // if they aren't redirect them to the home page
//     res.json({
//      status: 0,
//      message: 'Please login to use the API'
//     });
// }
