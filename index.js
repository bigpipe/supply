'use strict';

var supply = module.exports;

supply.middleware = function middleware(Supply, methods) {
  methods = methods || {};

  //
  // Allow customization of the API names.
  //
  methods.run = methods.run || 'each';
  methods.add = methods.add || 'before';
  methods.remove = methods.remove || 'remove';

  /**
   * Add or retrieve a middleware layer. If no function argument is given we
   * assume that you want to retrieve a middleware layer that matches the given
   * name.
   *
   * If you do supply it with a function argument we assume that you wish to
   * register this middleware layer for the given name. When adding a new layer
   * you can supply the following options:
   *
   * - `index` The position of the middleware layer where we should add it.
   * - `before` Name of a middleware layer that you want to run this before.
   * - `context` Function execution context.
   *
   * @param {String} name Name of the layer we wish to add.
   * @param {Function} fn Middleware layer.
   * @param {Object} options Middleware layer configuration.
   * @returns {Supply|Layer}
   * @api public
   */
  Supply.prototype[methods.add] = function before(name, fn, options) {
    if (!this._before) this._before = [];
    if (!fn) return this._before[index(this._before, name)];

    options = options || {};

    options.index = 'index' in options ? +options.index : this._before.length;
    options.context = options.context || this;

    if (options.before) options.index = index(this._before, options.before);
    if (options.index > this._before.length) options.index = this._before.length;

    var layer = new Layer(name, fn, options);

    if (this.emit) this.emit(methods.add, layer, options);
    this._before.splice(options.index, 0, layer);

    return this;
  };

  /**
   * Removes the middleware from the stack.
   *
   * @param {String} name Name of the layer we wish to remove.
   * @returns {Boolean} Indication of successful removal.
   * @api public
   */
  Supply.prototype[methods.remove] = function remove(name) {
    var i = index(this._plugin, name);
    if (i === -1) return false;

    if (this.emit) this.emit(methods.remove, this._plugin.splice(i, 1));
    return true;
  };

  /**
   * Iterate and execute all middleware layers with the given set of arguments.
   *
   * @param {String} what Before or plugin we're executing.
   * @Argument {Mixed} .. Arguments that need to be supplied to the layers.
   * @param {Function} fn Completion callback.
   * @returns {Supply}
   * @api public
   */
  Supply.prototype[methods.run] = function each(a, b, c, d) {
    if (!this._before || !this._before.length) {
      return arguments[arguments.length - 1](), this;
    }

    //
    // Create a copy of the arguments to prevent argument leaking in the loop
    // closure.
    //
    for (var i = 0, l = arguments.length - 1, args = new Array(l); i < l; i++) {
      args[i] = arguments[i];
    }

    var callback = arguments.length
      , layers = this._before
      , fn = arguments[l]
      , supply = this;

    (function loop(i) {
      if (i === layers.length) return fn();

      var layer = layers[i]
        , async = layer.length === callback;

      function next(err) {
        if (err) return fn(err);
        loop(++i);
      }

      //
      // Optimize 1, 2 and 3 arguments. All others will get a bigger performance
      // hit.
      //
      switch (l) {
        case 0:
          if (async) return layer.fn.call(layer.context, next);
          return layer.fn.call(layer.context) !== true && loop(++i);

        case 1:
          if (async) return layer.fn.call(layer.context, a, next);
          return layer.fn.call(layer.context, a) !== true && loop(++i);

        case 2:
          if (async) return layer.fn.call(layer.context, a, b, next);
          return layer.fn.call(layer.context, a, b) !== true && loop(++i);

        case 3:
          if (async) return layer.fn.call(layer.context, a, b, c, next);
          return layer.fn.call(layer.context, a, b, c) !== true && loop(++i);
      }

      //
      // This is a much slower layer invocation as we have to use function.apply
      // to get the correct argument set and with an async function we need to
      // concat the arguments so we can correctly add the next callback.
      //
      if (async) return layer.fn.apply(layer.context, args.concat(next));
      return layer.fn.apply(layer.context, args) !== true && loop(++i);
    })(0);

    return supply;
  };

  //
  // Expose the Layer constructor.
  //
  Supply.Layer = Supply.Layer || Layer;

  return Supply;
};

supply.plugin = function plugin(Supply, methods) {
  methods = methods || {};

  //
  // Allow customization of the API names.
  //
  methods.run = methods.run || 'each';
  methods.add = methods.add || 'plugin';
  methods.remove = methods.remove || 'unplug';

  /**
   *
   * @param {String} name Name of the layer we wish to add.
   * @param {Object} obj Specification of the plugin.
   * @param {Object} options Plugin configuration.
   * @returns {Supply}
   * @api public
   */
  Supply.prototype[methods.add] = function plugin(name, obj, options) {
    if (!this._plugin) this._plugin = [];
    if (!obj) return this._plugin[index(this._plugin, name)];

    options = options || {};

    options.index = 'index' in options ? +options.index : this._before.length;
    options.context = options.context || this;

    if (options.before) options.index = index(this._before, options.before);
    if (options.index > this._before.length) options.index = this._before.length;

    var spec = new Specification(name, obj, options.context);

    if (this.emit) this.emit(methods.add, spec, options);
    this._plugin.splice(options.index, 0, spec);

    return this;
  };

  /**
   * Removes the plugin from the stack.
   *
   * @param {String} name Name of the layer we wish to remove.
   * @returns {Boolean} Indication of successful removal.
   * @api public
   */
  Supply.prototype[methods.remove] = function unplug(name) {
    var i = index(this._plugin, name);
    if (i === -1) return false;

    if (this.emit) this.emit(methods.remove, this._plugin.splice(i, 1));
    return true;
  };

  //
  // Expose the plugin specification.
  //
  Supply.Specification = Supply.Specification || Specification;

  return Supply;
};

/**
 * Find the index an object which has the given name.
 *
 * @param {Array} array Array to search for index.
 * @param {String} name Name we should match.
 * @returns {Number} index.
 * @api private
 */
function index(array, name) {
  for (var i = 0, l = array.length; i < l; i++) {
    if (name === array[i].name) return i;
  }

  return -1;
}

/**
 * Figure out if we're given a path to a file, a pre-read file or a function and
 * return the string or source contents from it.
 *
 * @param {Buffer|String|Function} code Unknown code source.
 * @returns {String}
 * @api private
 */
function toSource(code) {
  if ('string' !== typeof code) return code.toString('utf-8');

  //
  // Now for the hard part, we need to determine if we've been given an absolute
  // path to a file or pre-read file. We can assume that `//` and `/*` are
  // indications for code starting with comments and that absolute paths start
  // with / or (require(path).sep).
  //
  var comment = [47, 42];

  if (code.charCodeAt(0) !== 47 || !~comment.indexOf(code.charCodeAt(1))) {
    return require('fs').readFileSync(code, 'utf-8');
  }

  return code;
}

/**
 * Representation of a single middleware layer.
 *
 * @constructor
 * @param {String} name Identification of the middleware.
 * @param {Function} fn Middleware function.
 * @param {Mixed} context Execution context of the function.
 * @api private
 */
function Layer(name, fn, context) {
  this.length = fn.length;
  this.context = context;
  this.name = name;
  this.fn = fn;
}

/**
 * Representation of a plugin specification.
 *
 * @param {String} name Identification of the plugin.
 * @param {Object} obj Plugin representation.
 * @param {Mixed} context Execution context of the server.
 * @api private
 */
function Specification(name, obj, context) {
  this.library = toSource(obj.library);
  this.client = toSource(obj.client);
  this.length = obj.server.length;
  this.context = context;
  this.fn = obj.server;
  this.name = name;
}
