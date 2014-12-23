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
