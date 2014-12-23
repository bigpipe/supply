describe('supply', function () {
  'use strict';

  var assume = require('assume')
    , provider = { foo: 'bar'}
    , Supply = require('./')
    , supply;

  beforeEach(function () {
    supply = new Supply(provider);
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
  });
});
