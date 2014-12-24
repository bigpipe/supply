# Supply

[![From bigpipe.io][from]](http://bigpipe.io)[![Version npm][version]](http://browsenpm.org/package/supply)[![Build Status][build]](https://travis-ci.org/bigpipe/supply)[![Dependencies][david]](https://david-dm.org/bigpipe/supply)[![Coverage Status][cover]](https://coveralls.io/r/bigpipe/supply?branch=master)

[from]: https://img.shields.io/badge/from-bigpipe.io-9d8dff.svg?style=flat-square
[version]: http://img.shields.io/npm/v/supply.svg?style=flat-square
[build]: http://img.shields.io/travis/bigpipe/supply/master.svg?style=flat-square
[david]: https://img.shields.io/david/bigpipe/supply.svg?style=flat-square
[cover]: http://img.shields.io/coveralls/bigpipe/supply/master.svg?style=flat-square

Supply is a minimal but high performance middleware system for Node.js. It's
extremely flexible in term of usage.

## Installation

```
npm install --save supply
```

## Usage

In all examples we assume that you've already required and created your first
`supply` instance using:

```js
'use strict';

var Supply = require('supply')
  , supply = new Supply();
```

Extending the `Supply` instance can be done using the `extend` method which is
exposed on the `Supply` constructor:

```js
var MySupply = Supply.extend({
  another: function method() {
    // do stuff
  }
});
```

So you could use this pattern to build your own framework or module on top of a
middleware system. Or override methods.

#### length

To see how many layers are in your middleware system, you can check the
`.length` property.

```js
supply.length; // 0
supply.use(function foo() {});
supply.length; // 1
```

#### use

Add a new middleware layer to the stack. This method accepts 3 arguments:

1. `name`, Name of the middleware layer so we can easily remove it again if
   needed. If no name is provided we attempt to extract it from the supplied
   function. So if you have `function foobar() {}` as middleware we will use
   `foobar` as name.
2. `fn`, Function which should be executed every. Please note that the callbacks
   will not have their `this` value set to `supply`.
3. `opts`, Optional object which allows you to further configure the middleware
   handling. The following options are currently supported:
   - **at** Specify the index or name where this layer should be added at. If a
   name is supplied we will resolve it back to the it's current index.

When you add a new middleware layer it will always be added as last item unless
you've specified the `at` option.

```js
supply.use('foo', function (arg) {
  console.log('arg', arg, 'foo');
});

supply.use('bar', function (arg, next) {
  console.log('arg', arg, 'bar');
  next();
});

supply.each('pez', function () {
  console.log('done');
});
```

In the example above you can see that we support async and sync execution of the
middleware. This is decided based on the amount of arguments supplied in the
`each` method (excluding it's optional callback). If you call `each` with 2
arguments e.g. `supply.each(1,2)` then your async middleware layer needs 3
arguments where the last argument is the callback function.

The supplied middleware layers are also able to stop the execution of the rest
of the middleware layers. In async mode you can supply the truthy value as second
argument to the callback:

```js
supply.use(function example(arg, next) {
  next(undefined, true);
});
```

If you have a sync function you can just return true:

```js
supply.use(function example(arg) {
  return true;
});
```

Error handling also build in. The async middleware layers can just call the
supplied callback with an error as first argument while the sync layers can just
throw errors as they are wrapped in a `try {} catch (e) {}` statement.

#### before

Same as the `use` method, but it automatically sets the `at` option to `0` so it
will be inserted at the beginning of the stack instead of the end. It also
accepts all the same arguments, except for the `at` option as that will
forcefully be overridden.

```js
supply.before('xxx', function yyy() {});
```

#### remove

Remove a middleware layer from the stack based on the name. The method will
return a boolean as indication if the layer was found and removed successfully.

```js
supply.use('foo', function bar() {});
supply.remove('foo');
```

#### each

Call all layers in the middleware stack with the supplied arguments. There is no
fixed limit to the amount of arguments that can be supplied. If the last
argument is a function we automatically assume that this should be the callback
for when all middleware layers are executed. The callback should follow the
error first callback pattern.

```js
supply.each('foo', 'bar'); // No callback
supply.each('beep', 'boop', function done(err, early) {

});
```

As you can see from the example above the callback receives two arguments. The
error and an boolean which will indicate the callback was called early so one of
the layers stopped the iteration.

#### indexOf

Find the location of a middleware layer in the stack based on the name. This is
used internally but might be useful for you in some use cases as well.

```js
supply.use('bar', function banana() {});
supply.use('foo', function bar() {});

var index = supply.indexOf('foo'); // 1 (it's zero based)
```

#### destroy

Destroy the middleware instance which removes all middleware layers, internal
references and object we've setup. Don't call this if you still have a `each`
running.

```js
supply.destroy();
```

## License

MIT
