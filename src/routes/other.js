'use strict';

exports.ping = function(req, res) {
  res.send({
    status: 'OK',
    message: 'App is available'
  });
};
