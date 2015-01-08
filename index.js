'use strict';

var dollars = require('dollars')
  , display = require('fn.name');

/**
 * Representation of a single middleware layer.
 *
 * @constructor
 * @param {String} name Identification of the middleware.
 * @param {Function} fn Middleware function.
 * @param {Mixed} context Execution context of the function.
 * @api private
 */
function Layer(name, fn) {
  this.length = fn.length;
  this.name = name;
  this.fn = fn;
}

/**
 * A minimal middleware layer system.
 *
 * @constructor
 * @param {EventEmitter} provider EventEmitter instance.
 * @param {Object} options Optional options.
 * @api public
 */
function Supply(provider, options) {
  if (!this) return new Supply(provider, options);

  options = options || {};

  this.provider = provider || this;
  this.layers = [];
  this.length = 0;

  if ('function' === typeof this.initialize) {
    this.initialize(options);
  }
}

Supply.extend = require('extendible');
Supply.Layer = Layer;

/**
 * Removes the middleware from the stack.
 *
 * @param {String} name Name of the layer we wish to remove.
 * @returns {Boolean} Indication of successful removal.
 * @api public
 */
Supply.prototype.remove = function remove(name) {
  var i = this.indexOf(name)
    , layer;

  if (i === -1) return false;

  layer = this.layers.splice(i, 1)[0];

  this.length--;
  if (this.provider.emit) {
    this.provider.emit('remove', layer);
  }

  return true;
};

/**
 * Add a new middleware layer at the beginning of the stack.
 *
 * @param {String} name Middleware name
 * @param {Function} fn Function to execute
 * @param {Object} opts Additional middleware configuration.
 * @returns {Provider|Supply}
 * @api public
 */
Supply.prototype.before = function before(name, fn, opts) {
  if ('function' === typeof name) {
    fn = name;
    name = display(name);
  }

  return this.use(name, fn, dollars.object.concat(opts || {}, {
    at: 0
  }));
};

/**
 * Add a new middleware layer to the stack.
 *
 * @param {String} name Middleware name
 * @param {Function} fn Function to execute
 * @param {Object} opts Additional middleware configuration.
 * @returns {Provider|Supply}
 * @api public
 */
Supply.prototype.use = function use(name, fn, opts) {
  if ('function' === typeof name) {
    fn = name;
    name = display(name);
  }

  opts = dollars.object.concat({
    at: this.layers.length
  }, opts || {});

  if ('string' === typeof opts.at) opts.at = this.indexOf(opts.at);
  if (opts.at > this.layers.length) opts.at = this.layers.length;
  if (opts.at < 0) opts.at = 0;

  var layer = new Layer(name, fn, opts);
  this.layers.splice(opts.at, 0, layer);

  this.length++;
  if (this.provider.emit) {
    this.provider.emit('use', layer);
  }

  return this.provider;
};

/**
 * Find the index an object which has the given name.
 *
 * @param {Array} array Array to search for index.
 * @param {String} name Name we should match.
 * @returns {Number} Index.
 * @api private
 */
Supply.prototype.indexOf = function index(name) {
  for (var i = 0, l = this.layers.length; i < l; i++) {
    if (name === this.layers[i].name) return i;
  }

  return -1;
};

/**
 * Iterate over all existing middleware layers.
 *
 * @returns {Supply}
 * @api public
 */
Supply.prototype.each = function each() {
  var length = arguments.length
    , args = new Array(length)
    , fn = dollars.nope
    , supply = this
    , i = 0;

  //
  // Create a copy of the arguments to prevent it from leaking.
  //
  for (; i < length; i++) {
    args[i] = arguments[i];
  }

  if ('function' === typeof args[args.length - 1]) fn = args.pop();

  /**
   * Simple middleware layer iterator.
   *
   * @param {Error} err A failed middleware iteration.
   * @param {Boolean} done Stop iterating the layers as we are done.
   * @api private
   */
  function next(err, done) {
    var layer = supply.layers[i++];

    if (err || done || !layer) return fn(err, !!done);

    if (layer.length > length) return layer.fn.apply(supply.provider, args.concat(next));
    else dollars.catch(function catching() {
      return layer.fn.apply(supply.provider, args);
    }, next);
  }

  length = args.length;
  i = 0;
  next();

  return this.provider;
};

/**
 * Completely destroy the instance and nuke all references.
 *
 * @returns {Boolean}
 * @api public
 */
Supply.prototype.destroy = function supply() {
  if (!this.layers) return false;

  this.layers = this.provider = null;

  return true;
};

//
// Expose the middleware layer.
//
module.exports = Supply;
