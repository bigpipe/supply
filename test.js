describe('supply', function () {
  'use strict';

  var assume = require('assume')
    , supply = require('./');

  function Supply() {}
  require('util').inherits(Supply, require('events').EventEmitter);

  require('./').middleware(Supply);
  require('./').plugin(Supply);

  describe('.middleware', function () {
    it('is exposed as function', function () {
      assume(supply.middleware).to.be.a('function');
    });
  });

  describe('.plugin', function () {
    it('is exposed as function', function () {
      assume(supply.plugin).to.be.a('function');
    });
  });

  describe('.before', function () {
    it('emits a `before` event when adding a layer', function (next) {
      var s = new Supply();

      s.once('before', function (layer) {
        assume(layer).to.be.instanceOf(Supply.Layer);
        assume(layer.name).to.equal('bar');

        next();
      });

      assume(s.before('bar', function (bar) {})).to.equal(s);
    });

    it('receives the supplied options in the `before` event', function (next) {
      var s = new Supply();

      s.once('before', function (layer, options) {
        assume(options).to.be.a('object');
        assume(options.foo).to.equal('bar');
        assume(options.index).to.be.a('number');
        assume(options.index).to.equal(0);

        next();
      });

      s.before('bar', function (bar) {}, {
        foo: 'bar'
      });
    });

    it('returns the layer if no function is supplied', function () {
      var s = new Supply();
      assume(s.before('bar', function (bar) {})).to.equal(s);

      var layer = s.before('bar');

      assume(layer).to.be.instanceOf(Supply.Layer);
      assume(layer.name).to.equal('bar');
    });

    it('adds the middleware layers in order of specification', function () {
      var s = new Supply();

      s.before('bar', function (bar) {});
      s.before('foo', function (foo) {});

      assume(s._before[0].name).to.equal('bar');
      assume(s._before[1].name).to.equal('foo');
    });

    it('allows specifiying a custom index', function () {
      var s = new Supply();

      s.before('bar', function (bar) {});
      s.before('foo', function (foo) {}, { index: 0 });

      assume(s._before[0].name).to.equal('foo');
      assume(s._before[1].name).to.equal('bar');
    });

    it('normalizes the index when its out of bound', function () {
      var s = new Supply();

      s.before('bar', function (bar) {});
      s.before('foo', function (foo) {}, { index: 100 });

      assume(s._before).to.have.length(2);
    });

    it('allows adding before a different middleware', function () {
      var s = new Supply();

      s.before('bar', function (bar) {});
      s.before('foo', function (foo) {}, { before: 'bar' });

      assume(s._before[0].name).to.equal('foo');
      assume(s._before[1].name).to.equal('bar');
    });

    it('stores the custom context');
    it('allows modification of the layer during `before` event');
  });
});
