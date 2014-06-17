'use strict';

var Bluebird = require('bluebird');
var resolve = Bluebird.resolve;
var reject = Bluebird.reject;
var all = Bluebird.all;

function zipObject(keys, values) {
  var out = {}, i;
  for (i = 0; i < keys.length; ++i) {
    out[keys[i]] = values[i];
  }
  return out;
}

function isObject(v) {
  return v !== null && typeof v === 'object';
}

module.exports = function resolveDeep(root) {
  var seen = [];

  function _verifyUnseen(x) {
    if (seen.indexOf(x) === -1) {
      seen.push(x);
      return true;
    } else {
      return false;
    }
  }

  function _resolveDeep(value) {
    if (isObject(value)) {
      if(!_verifyUnseen(value)) {
        return reject(new TypeError('Cannot resolve circular structure'));
      }

      if (Array.isArray(value)) {
        return all(value).map(_resolveDeep);
      } else if (typeof value.toJSON === 'function') {
        return resolve(value.toJSON()).then(_resolveDeep);
      } else {
        return _resolveObject(value);
      }
    }

    return resolve(value);
  }

  function _resolveObject(obj) {
    var keys = Object.keys(obj);
    var values = keys.map(function(key) { return obj[key]; });
    return all(values).map(_resolveDeep).then(function(resolvedValues) {
      return zipObject(keys, resolvedValues);
    });
  }

  return _resolveDeep(root);
};
