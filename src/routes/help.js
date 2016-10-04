'use strict';
exports.help = function(req, res, next) {
  var app = req.app;
  var config = app.locals.config;
  var routes = [];
  var mounts = app._router.stack;

  req.accepts('json, text');

  for (var key in mounts) {
    if (!mounts.hasOwnProperty(key) || mounts[key].route === undefined) {
      continue;
    }

    var routeSpec = mounts[key].route;
    var route = {};
    var util = require('util');
    route.route = util.format('%s %s', routeSpec.stack[0].method.toUpperCase(), routeSpec.path);

    // Route.authenticate = routeSpec.authenticate;
    // route.contentType = routeSpec.contentType;
    // route.parameters = routeSpec.parameters;
    routes.push(route);
    console.log(routeSpec);
  }

  res.send({version: config.version, routes: routes});

  return next();
};
