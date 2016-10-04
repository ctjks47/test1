'use strict';
var uuid = require('node-uuid');

var crypto = require('crypto');
var cryptoAlgorithm = 'aes-256-ctr';
var cryptoSecret = 'ilovescotchscotchyscotchscotch';

exports.encrypt = function(token, algorithm) {

  // TODO: set 'cryptoSecret' in config
  var cipher = crypto.createCipher(algorithm || cryptoAlgorithm, cryptoSecret);
  var crypted = cipher.update(token, 'utf8', 'hex');

  crypted += cipher.final('hex');
  return crypted;
};

exports.generate = function() {
  return uuid.v1();
};

exports.decrypt = function(token, toJSON) {

  // TODO: set 'cryptoSecret' in config
  var decipher = crypto.createDecipher(cryptoAlgorithm, cryptoSecret);

  try {
    var dec = decipher.update(token, 'hex', 'utf8');

    dec += decipher.final('utf8');

    return toJSON ? JSON.parse(dec) : dec;

  }
  catch(e) {
    return false;
  }
};
