'use strict';

var url = require('url');
var redis = require('redis');

function get_client() {
  var client;

  if(process.env.REDISCLOUD_URL) {
    var redisURL = url.parse(process.env.REDISCLOUD_URL);

    client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true}); // eslint-disable-line max-len
    client.auth(redisURL.auth.split(':')[1]);
  }
  else {
    client = redis.createClient();
  }
  return client;
}

module.exports = get_client();
