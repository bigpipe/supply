/* istanbul ignore next */
describe('supply', function () {
  'use strict';

  var EventEmitter = require('events').EventEmitter
    , assume = require('assume')
    , Supply = require('./')
    , eventemitter
    , supply;

  beforeEach(function () {
    eventemitter = new EventEmitter();
    supply = new Supply(eventemitter);
  });

  afterEach(function () {
    supply.destroy();
  });

  it('is extendable', function () {
    assume(Supply.extend).is.a('function');
  });

  it('can be constructed without arguments', function () {
    supply.destroy();
    supply = new Supply();

    supply.use('hi', function foobar() {});
    supply.remove('hi');
  });

  it('can be constructed without new', function () {
    supply.destroy();
    supply = Supply('provider');

    assume(supply).is.instanceOf(Supply);
    assume(supply.provider).equals('provider');
  });

  it('calls the supplied initialize method when contructed', function (next) {
    var MySupply = Supply.extend({
      initialize: function initialize(options) {
        assume(options).is.a('object');
        next();
      }
    });

    new MySupply();
  });

  describe('#use', function () {
    it('extracts the name from the function', function () {
      supply.use(function foobar() {});

      assume(supply.layers.length).equals(1);
      assume(supply.layers.pop().name).equals('foobar');
    });

    it('increments the `.length`', function () {
      assume(supply.length).equals(0);

      supply.use(function foobar() {});
      assume(supply.length).equals(1);

      supply.use(function foobar() {});
      supply.use(function foobar() {});
      assume(supply.length).equals(3);
    });

    it('can set a custom name', function () {
      supply.use('mom', function foobar() {});

      assume(supply.layers.length).equals(1);
      assume(supply.layers.pop().name).equals('mom');
    });

    it('usefull information', function () {
      function foobar(one, two) {}
      supply.use('mom', foobar);

      var layer = supply.layers.pop();

      assume(layer.name).equals('mom');
      assume(layer.fn).equals(foobar);
      assume(layer.length).equals(2);
    });

    it('adds layers in order', function () {
      supply.use('foo', function () {});
      supply.use('bar', function () {});

      assume(supply.layers[0].name).equals('foo');
      assume(supply.layers[1].name).equals('bar');
    });

    it('normalizes an out of bound at to last', function () {
      supply.use('foo', function () {});
      supply.use('bar', function () {});
      supply.use('pez', function () {});
      supply.use('jam', function () {});

      supply.use('bek', function () {}, { at: 79789879 });
      assume(supply.layers.pop().name).equals('bek');
    });

    it('normalizes negative at to first', function () {
      supply.use('foo', function () {});
      supply.use('bar', function () {});
      supply.use('pez', function () {});
      supply.use('jam', function () {});

      supply.use('bek', function () {}, { at: -100 });
      assume(supply.layers.pop().name).equals('jam');
      assume(supply.layers.shift().name).equals('bek');
    });

    it('can insert a specified index', function () {
      supply.use('foo', function () {});
      supply.use('bar', function () {});
      supply.use('pez', function () {});
      supply.use('jam', function () {});

      supply.use('bek', function () {}, { at: 2 });
      assume(supply.layers[2].name).equals('bek');
    });

    it('can insert a specified index', function () {
      supply.use('foo', function () {});
      supply.use('bar', function () {});
      supply.use('pez', function () {});
      supply.use('jam', function () {});

      supply.use('bek', function () {}, { at: 'bar' });
      assume(supply.layers[1].name).equals('bek');
    });
  });

  describe('#before', function () {
    it('adds layers before all others', function () {
      supply.use('foo', function () {});
      supply.use('hi', function () {});
      supply.use('bar', function () {});
      supply.before(function mom() {});
      supply.before('pez', function () {});

      assume(supply.layers.pop().name).equals('bar');
      assume(supply.layers.shift().name).equals('pez');
      assume(supply.layers.shift().name).equals('mom');
    });

    it('emits an `use` event', function lol(next) {
      eventemitter.once('use', function (layer) {
        assume(layer.fn).equals(lol);
        next();
      });

      supply.use('foo', lol);
    });
  });

  describe('#indexOf', function () {
    it('return -1 if the layer is not found', function () {
      supply.use('foo', function () {});

      assume(supply.indexOf('afaf')).equals(-1);
    });

    it('returns the index of the layers', function () {
      supply.use('foo', function () {});
      supply.use('bar', function () {});
      supply.use('pez', function () {});
      supply.use('jam', function () {});

      assume(supply.indexOf('foo')).equals(0);
      assume(supply.indexOf('bar')).equals(1);
      assume(supply.indexOf('pez')).equals(2);
      assume(supply.indexOf('jam')).equals(3);
    });
  });

  describe('#remove', function () {
    it('decrements the layers', function () {
      assume(supply.length).equals(0);

      supply.use('foo', function () {});
      assume(supply.length).equals(1);
      assume(supply.layers.length).equals(1);

      supply.remove('foo');
      assume(supply.length).equals(0);
      assume(supply.layers.length).equals(0);
    });

    it('only removes known layers', function () {
      supply.use('foo', function () {});
      assume(supply.length).equals(1);

      supply.remove('bar');
      assume(supply.length).equals(1);
      assume(supply.layers.length).equals(1);
    });

    it('emits a `remove` event', function lol(next) {
      eventemitter.once('remove', function (layer) {
        assume(layer.fn).equals(lol);

        next();
      });

      supply.use('foo', lol);
      supply.remove('foo');
    });
  });

  describe('#each', function () {
    it('iterates over all middleware using sync calls', function (next) {
      next = assume.plan(3, next);

      supply.use('foo', function (data) { assume(data).equals('ok'); });
      supply.use('bar', function (data) { assume(data).equals('ok'); });
      supply.use('baz', function (data) { assume(data).equals('ok'); });

      supply.each('ok', next);
    });

    it('iterates over all middleware using async calls', function (next) {
      next = assume.plan(3, next);

      supply.use('foo', function (data, ok) { assume(data).equals('ok'); ok(); });
      supply.use('bar', function (data, ok) { assume(data).equals('ok'); ok(); });
      supply.use('baz', function (data, ok) { assume(data).equals('ok'); ok(); });

      supply.each('ok', next);
    });

    it('calls middleware in scope of the provider', function (next) {
      next = assume.plan(4, next);

      supply.provider.test = 'value';

      supply.use('baz', function (data) {
        assume(data).equals('ok');
        assume(this.test).equals('value');
      });

      supply.use('bar', function (data, ok) {
        assume(data).equals('ok');
        assume(this.test).equals('value');
        ok();
      });

      supply.each('ok', next);
    });

    it('bails out when a sync call thows error', function (next) {
      supply.use(function sync(arg) {
        throw new Error('everything');
      });

      supply.each('ok', function (err) {
        assume(err.message).equals('everything');
        next();
      });
    });

    it('bails out when an async call returns error', function (next) {
      supply.use(function sync(arg, ok) {
        setTimeout(function () {
          ok(new Error('everything'));
        }, 10);
      });

      supply.each('ok', function (err, early) {
        assume(err.message).equals('everything');
        assume(early).is.false();

        next();
      });
    });

    it('stops execution when sync call returns true', function (next) {
      supply.use(function sync(arg) {
        return true;
      });

      supply.use(function () {
        throw new Error('I should never get here');
      });

      supply.each('ok', function (err, early) {
        if (err) return next(err);

        assume(early).is.true();
        next();
      });
    });

    it('stops execution when sync call returns true', function (next) {
      supply.use(function sync(arg, ok) {
        ok(undefined, true);
      });

      supply.use(function (arg, ok) {
        throw new Error('I should never get here');
      });

      supply.each('ok', function (err, early) {
        if (err) return next(err);

        assume(early).is.true();
        next();
      });
    });

    it('has an optional callback', function () {
      supply.use(function (arg) { });
      supply.each('ok');
    });
  });

  describe('#destroy', function () {
    it('returns true on the first destruction', function () {
      assume(supply.destroy()).is.true();
    });

    it('returns false on the second destruction', function () {
      assume(supply.destroy()).is.true();

      assume(supply.destroy()).is.false();
      assume(supply.destroy()).is.false();
      assume(supply.destroy()).is.false();
    });
  });
});
