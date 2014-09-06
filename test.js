describe('supply', function () {
  'use strict';

  var assume = require('assume')
    , supply = require('./')
    , s;

  function Supply() {}
  require('util').inherits(Supply, require('events').EventEmitter);

  require('./').middleware(Supply);
  require('./').plugin(Supply);

  beforeEach(function each() {
    s = new Supply();
  });

  describe('.middleware', function () {
    it('is exposed as function', function () {
      assume(supply.middleware).to.be.a('function');
    });

    describe('.before', function () {
      it('emits a `before` event when adding a layer', function (next) {
        s.once('before', function (layer) {
          assume(layer).to.be.instanceOf(Supply.Layer);
          assume(layer.name).to.equal('bar');

          next();
        });

        assume(s.before('bar', function (bar) {})).to.equal(s);
      });

      it('receives the supplied options in the `before` event', function (next) {
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
        assume(s.before('bar', function (bar) {})).to.equal(s);

        var layer = s.before('bar');

        assume(layer).to.be.instanceOf(Supply.Layer);
        assume(layer.name).to.equal('bar');
      });

      it('adds the middleware layers in order of specification', function () {
        s.before('bar', function (bar) {});
        s.before('foo', function (foo) {});

        assume(s._before[0].name).to.equal('bar');
        assume(s._before[1].name).to.equal('foo');
      });

      it('allows specifiying a custom index', function () {
        s.before('bar', function (bar) {});
        s.before('foo', function (foo) {}, { index: 0 });

        assume(s._before[0].name).to.equal('foo');
        assume(s._before[1].name).to.equal('bar');
      });

      it('normalizes the index when its out of bound', function () {
        s.before('bar', function (bar) {});
        s.before('foo', function (foo) {}, { index: 100 });

        assume(s._before).to.have.length(2);
      });

      it('allows adding before a different middleware', function () {
        s.before('bar', function (bar) {});
        s.before('foo', function (foo) {}, { before: 'bar' });

        assume(s._before[0].name).to.equal('foo');
        assume(s._before[1].name).to.equal('bar');
      });

      it('stores the custom context');
      it('allows modification of the layer during `before` event');
    });

    describe('.each', function () {
      it('calls the supplied callback', function (next) {
        s.each(next);
      });

      it('calls the middleware layer', function (next) {
        var called = 0;

        s.before('cow', function cow(next) {
          assume(next).is.a('function');

          called++;
          next();
        });

        s.each(function each(err) {
          if (err) return next(err);

          assume(called).equals(1);
          next();
        });
      });

      it('receives the supplied arguments', function (next) {
        s.before('cow', function (a, b, next) {
          assume(next).is.a('function');
          assume(a).equals('foo');
          assume(b).equals('bar');

          next();
        });

        s.each('foo', 'bar', next);
      });

      it('calls the middleware in order', function (next) {
        var pattern = '';

        s.before('bar', function (next) {
          pattern += 'bar';
          next();
        });

        s.before('foo', function (next) {
          pattern += 'foo';
          next();
        });

        s.each(function (err) {
          if (err) return next(err);

          assume(pattern).equal('barfoo');
          next();
        });
      });

      it('bails out when giving an error', function (next) {
        var pattern = '';

        s.before('bar', function (next) {
          pattern += 'bar';
          next(new Error('foo'));
        });

        s.before('foo', function (next) {
          pattern += 'foo';
          next();
        });

        s.each(function (err) {
          assume(err).is.instanceOf('error');
          assume(err.message).to.equal('foo');

          assume(pattern).equal('bar');
          next();
        });
      });
    });
  });

  describe('.plugin', function () {
    it('is exposed as function', function () {
      assume(supply.plugin).to.be.a('function');
    });
  });
});
