'use strict';

var assert = require('assert');

var Bluebird = require('bluebird');
var resolve = Bluebird.resolve;

var resolveDeep = require('../');

describe('resolveDeep', function() {
  it('resolves a simple number', function() {
    return resolveDeep(10)
      .then(function(v) {
        assert.equal(v, 10);
      });
  });

  it('resolves an array of values', function() {
    return resolveDeep([ 'a', 42, resolve(true) ])
      .then(function(arr) {
        assert.equal(arr.length, 3);
        assert.equal(arr[0], 'a');
        assert.equal(arr[1], 42);
        assert.equal(arr[2], true);
      });
  });

  it('resolves an object', function() {
    return resolveDeep({
        x: -15, y: resolve(7), z: resolve('more')
      })
      .then(function(obj) {
        assert.equal(obj.x, -15);
        assert.equal(obj.y, 7);
        assert.equal(obj.z, 'more');
      });
  });

  it('ignores a wrapping promise', function() {
    return resolveDeep(resolve(99))
      .then(function(v) {
        assert.equal(v, 99);
      });
  });

  it('honors toJSON methods', function() {
    return resolveDeep({ toJSON: function() { return [ resolve('foo'), 13 ]; } })
      .then(function(arr) {
        assert.equal(arr.length, 2);
        assert.equal(arr[0], 'foo');
        assert.equal(arr[1], 13);
      });
  });

  it('rejects cyclic structures', function() {
    var target = { };
    var source = { target: resolve(target) };
    target.source = source;

    return resolveDeep([ 'a', [ 'deep', { nested: resolve(source) } ] ])
      .then(function(arr) {
        throw new Error('Unexpect value: ' + String(arr));
      }, function(err) {
        assert.equal(err.message, 'Cannot resolve circular structure');
        assert.equal(err.name, 'TypeError');
      });
  });
});
