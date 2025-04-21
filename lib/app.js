"use strict";

const CTX = require('./ctx');
const core = require('@lumjs/core');
const WC = require('@lumjs/web-core');
const WS = require('@lumjs/web-service');
const {makeObservable} = require('./util');
const {def,F,S,B,isObj} = core.types;
const DEFAULT_OPTIONS = {};

/**
 * A simple base class for Web apps.
 * 
 * Supports a modular codebase where multiple entry files
 * may be used to load extensions which provide additional features.
 * 
 * An example app using this will be added in a separate repo.
 * 
 * NOTE: Currently for all the `trigger*` methods have corresponding
 * `emit*` aliases. In the next major release the latter will become
 * the primary method names and the former will become aliases.
 * 
 * @exports module:@lumjs/web-app/app
 * @implements {module:@lumjs/web-app.observable}
 * 
 * @prop {object} ws - Storage for Webservice instances.
 * @prop {object} ext - Storage for Extension instances. 
 * @prop {object} options - Options passed to the constructor.
 *
 */
class WebApp 
{
  /**
   * Build a new WebApp instance.
   * 
   * The default constructor is pretty simplistic:
   * 
   * - Initialize internal data structures.
   * - Call `@lumjs/core.observable(this)` to add the _observable_ methods.
   * - Run the `init()` instance method, passing all arguments to it.
   * - Register an event to run `start()` when the DOM is ready (optional).
   *
   * @param {object} [options] Options (all optional, obviously)
   * 
   * Will be assigned to the `options` instance property.
   * 
   * @param {object} [options.observable={}] Options for `core.observable()`;
   *
   * The defaults are usually just fine, so you probably don't need this.
   * 
   * @param {boolean} [options.autoStart=true] Run `start()` when DOM ready?
   * 
   * The default is `true`, but if for whatever reason you want to disable
   * the auto-start feature, just set this to `false`.
   * 
   * @param {boolean} [options.allExtFirst=false] See `triggerAll()`
   */
  constructor(options)
  {
    def(this, CTX.EXTS_LIST,          []);
    def(this, CTX.INITED,          false);
    def(this, CTX.STARTED,         false);
    def(this, CTX.DATA_MAPS,   new Map());

    // Internal options object
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    // Save the options for future reference.
    def(this, 'options', {value: opts});

    // A public container for Webservice instances.
    def(this, 'ws', {});

    // And a public container for Extension instances.
    def(this, 'ext', {});

    // A container for general app 'state'
    def(this, 'state', 
    {
      autoStart: opts.autoStart ?? true
    });

    makeObservable(this, opts);

    this.init(...arguments);

    if (this.state.autoStart)
    {
      WC.whenReady(() => this.start());
    }
  }

  /**
   * Perform initialization tasks.
   * 
   * This will trigger the `init` event on this App instance
   * when this is called the first time (by the constructor.)
   * 
   * If you call this method again manually *after construction*,
   * it will trigger a `reinit` event (via `triggerAll()` so the
   * event will be propagated to all loaded extensions as well.)
   * 
   * Any arguments passed this this method will be used as
   * arguments for the events being triggered.
   * 
   */
  init()
  {
    if (this[CTX.INITED])
    {
      this.triggerAll('reinit', ...arguments);
    }
    else
    {
      this.trigger('init', ...arguments);
      def(this, CTX.INITED, true);
    }
  }

  // part of add()
  _invalid(type, added)
  {
    console.error({added, app: this});
    throw new TypeError("Invalid "+type);
  }

  // part of add()
  _buildWebservice(id)
  {
    const wsb = WS.make({id});
    wsb.on('build', (ws) =>
    {
      this.add(ws);
    });
    return wsb;
  }

  // part of add()
  _addExt(ext)
  {
    const id = ext.id;

    if (this.ext[id])
    {
      if (this.ext[id] !== ext)
      { 
        console.error("Duplicate extension", {ext, app: this});
      }
      return;
    }

    this[CTX.EXTS_LIST].push(ext);
    this.ext[id] = ext;
  }

  /**
   * Add an Extension or Webservice to this App instance.
   * 
   * @param {(object|function|string|array)} ext - Item to add
   * 
   * If it is an `Array`, then it is assumed to be multiple items to add,
   * and will call `this.add()` for each of the items.
   * 
   * If it is a `function`, it **MUST** be a sub-class constructor of the
   * `Extension` class. An instance will be created with this App
   * instance passed to the constructor to be set as the parent `app`.
   * This is likely the easiest way to specify extensions.
   * 
   * If it is an Extension `object`, then we will see if its `app` is this
   * instance, and if not, we will reset the `app` to be this instance.
   * 
   * Extensions are stored in a private array in the order they were added in.
   * They are also assigned as `this.ext[ext.id]` for named lookups.
   * 
   * If it is a `@lumjs/web-service/webservice` instance, it will be
   * assigned as `this.ws[ext._id]` for future reference.
   * 
   * If it is a `@lumjs/web-service/builder` instance, it will be built,
   * then treated the same as a `webservice` instance.
   * 
   * If it is a `string` then we will create a new Webservice Builder
   * instance using that as the `id`, and return it. The builder will be
   * set up so that when the `build()` method is called, the new
   * Webservice instance will be passed back to `add()` to have it added.
   * 
   * You can make custom versions of this in your sub-classes that check for
   * your own specific types first, and then fall back on `super.add()`
   * for standard types.
   * 
   * @returns {object} Normally `this`, except if `ext` was a `string`.
   * @throws {TypeError} If `ext` was not a valid value.
   * 
   * @see {@link module:@lumjs/web-app/extension}
   */
  add(ext)
  {
    if (Array.isArray(ext))
    { // A bunch of items to add.
      for (const sex of ext)
      {
        this.add(sex);
      }
      return this;
    }

    if (this.options.debug)
      console.debug("WebApp#add", {ext, app: this});

    if (typeof ext === S)
    { // Build a new webservice instance dynamically.
      return this._buildWebservice(ext);
    }

    if (typeof ext === F)
    {
      if (!Extension.isPrototypeOf(ext))
      {
        this._invalid('Extension class', ext);
      }
      this._addExt(new ext(this));
    }
    else if (ext instanceof Extension)
    {
      if (ext.getApp() !== this)
      { // Extension does not have this as its app.
        ext.setApp(this);
      }
      this._addExt(ext);
    }
    else if (ext instanceof WS.Webservice)
    {
      this.ws[ext._id] = ext;
    }
    else if (ext instanceof WS.Builder)
    {
      const ws = ext.build();
      this.ws[ws._id] = ws;
    }
    else
    {
      this._invalid('Extension or Webservice instance', ext);
    }

    return this;
  }

  /**
   * Trigger an event on all loaded extensions.
   * @param {...any} [args] Arguments for `trigger()`
   * @returns {object} `this`
   */
  triggerExt()
  {
    for (const ext of this[CTX.EXTS_LIST])
    {
      ext.trigger(...arguments);
    }
    return this;
  }

  /**
   * Calls either `triggerThisExt()` or `triggerExtThis()`
   * depending on the `this.options.allExtFirst` value.
   * @param {...any} [args]
   * @returns {object} `this`
   */
  triggerAll()
  {
    if (this.options.allExtFirst)
    {
      return this.triggerExtThis(...arguments);
    }
    else
    {
      return this.triggerThisExt(...arguments);
    }
  }

  /**
   * Calls `this.trigger(...args)` then `this.triggerExt(...args)` to 
   * trigger an event on this App instance, then all loaded extensions.
   * @param {...any} [args]
   * @returns {object} `this`
   */
  triggerThisExt()
  {
    this.trigger(...arguments);
    this.triggerExt(...arguments);
    return this;
  }

  /**
   * Calls `this.triggerExt(...args)` then `this.trigger(...args)` to 
   * trigger an event on all loaded extensions, then this App instance.
   * @param {...any} [args]
   * @returns {object} `this`
   */
  triggerExtThis()
  {
    this.triggerExt(...arguments);
    this.trigger(...arguments);
    return this;
  }

  /**
   * Make a function call on every loaded extension.
   * 
   * This is similar to `triggerExt` except instead of triggering
   * events, it calls specified callback functions or extension methods.
   * 
   * @param {(Map|object|bool)} [opts] Options modifying behaviours.
   * 
   * If you want to use the default behaviours, simply omit this argument
   * and pass the `fn` as the first argument.
   * 
   * If this is a `Map` or `bool`, it is used as the `opts.rv` option.
   * 
   * @param {(Map|bool)} [opts.rv] Use a map of return values.
   * 
   * If used, each of the _keys_ in the Map will be an Extension, 
   * and the corresponding _value_ will be the return value of the `fn`.
   * 
   * If a `Map` is passed, it will be used directly, and no changes to the
   * return value of this function will be made.
   * 
   * If this is the boolean value `true`, then a new Map instance will be
   * created, and will be used as the return value from this function.
   * 
   * @param {(function|string)} [opts.fn] Explicitly assigned `fn` value.
   * 
   * If this is used, then the `fn` _positional argument_ will not be used,
   * and all arguments after `opts` will be `args` instead.
   * 
   * @param {(function|string)} fn - Call to make on each Extension.
   * 
   * If this is a callback `function`, then it will be passed the 
   * Extension as the first argument, followed by the rest of the `args`.
   * 
   * If this is a `string`, then if a method of that name exists on
   * an extension, it will be called using the passed `args`.
   * There is no error if the method does not exist on an extension,
   * it simply means that extension won't have anything called on it.
   * 
   * @param  {...any} args - Arguments to pass with each call.
   * 
   * @returns {object} Normally `this` instance;
   * Unless `opts.rv` was `true`, then will be the Map of return values.
   * 
   * @throws {TypeError} If `fn` is not a `string` or `function`.
   * 
   */
  extCall(fn, ...args)
  {
    let retVals = null, retMap = false;

    if (fn instanceof Map || typeof fn === B)
    { // A map to add return values to was found.
      fn = {rv: fn};
    }

    if (isObj(fn))
    { // Options were specified.
      if (fn.rv instanceof Map)
      {
        retVals = fn.rv;
      }
      else if (fn.rv === true)
      {
        retVals = new Map();
        retMap = true;
      }

      if (typeof fn.fn === F || typeof fn.fn === S)
      { // Assigning the function via a named option.
        fn = fn.fn;
      }
      else
      { // Assume the function is the next argument.
        fn = args.shift();
      }
    }

    if (typeof fn === S)
    {
      const meth = fn;
      fn = function(ext, ...args)
      {
        if (typeof ext[meth] === F)
        {
          return ext[meth](...args);
        }
      }
    }
    else if (typeof fn !== F)
    {
      throw new TypeError("'fn' argument must be a function or string");
    }

    for (const ext of this[CTX.EXTS_LIST])
    {
      const retVal = fn(ext, ...args);
      if (retVals)
      {
        retVals.set(ext, retVal);
      }
    }

    return retMap ? retVals : this;

  } // extCall()

  /**
   * Start the App (once the DOM is ready).
   * 
   * This is usually called ***automatically*** by the `DOMContentLoaded` 
   * event when the DOM is _ready_. See the constructor for details.
   * 
   * The first time it is called, it triggers an event called `start` 
   * which can be used to do any setup of your UI.
   * 
   * If you call this method again manually _after construction_,
   * it will trigger a `restart` event that you may use to refresh the
   * state of the app.
   * 
   * Both of the possible events will use `triggerAll()` so they will be
   * triggered on this App instance as well as all loaded extensions.
   * 
   * Neither this method, nor either of the events have any arguments.
   * 
   * @returns {object} `this`
   */
  start()
  {
    if (this[CTX.STARTED])
    { 
      this.triggerAll('restart');
    }
    else
    {
      this.triggerAll('start');
      def(this, CTX.STARTED, true);
    }

    return this;
  }

  /**
   * Get a Map of data for a specific key value.
   * 
   * @param {*} key - The key value, may be _any_ Javascript type.
   * 
   * @returns {Map} A Map of data for the target.
   * 
   * The first time a `target` is passed, a new `Map` will be created for it.
   * Each subsequent call to this method with the same `target` will return
   * the same `Map` instance.
   * 
   * Try `app.dataFor(app)` for some real meta magic; brain hurt yet?
   * 
   */
  dataFor(key)
  {
    const maps = this[SYM_DATA_MAPS];
    if (maps.has(key))
    {
      return maps.get(key);
    }
    else
    {
      const newMap = new Map();
      maps.set(key, newMap);
      return newMap;
    }
  }

  /**
   * A list of extensions in the order they were added.
   * 
   * This is a _shallow copy_ of the real list.
   */
  get orderedExtensions()
  {
    return this[CTX.EXTS_LIST].slice();
  }

  /**
   * Has the `init()` method ran the first time?
   * 
   * You can use this in a conditional block inside a custom `init()` method,
   * for anything that should only be done on construction and not any
   * subsequent time that `init()` is called.
   * 
   * The conditional block obviously must be placed before the
   * call to `super.init()` otherwise this would never return `false`.
   */
  get isInited()
  {
    return this[CTX.INITED];
  }

  /**
   * Has this app been started? (i.e. has the `start()` method finished).
   * 
   * Like with `isInited`, if you use this in a custom `start()` method,
   * make sure the conditional block is before `super.start()`, otherwise
   * this will never return `false`.
   */
  get isStarted()
  {
    return this[CTX.STARTED];
  }

  /**
   * A getter for an id registry that extensions can use.
   * 
   * The default registry will use automatically generated ids
   * that take the class constructor name, strip off any `Ext`
   * or `Extension` suffixes, then convert the result to lowercase.
   * 
   * If for whatever reason a generated id already exists, a number
   * will be appended to the id to ensure the id is unique.
   * 
   * Assuming three instances of a class named `PageExtension`,
   * the following ids would be generated:
   * 
   * - `page`
   * - `page2`
   * - `page3`
   * 
   * You can override this getter in your sub-class to customize
   * the behaviour of the default registry.
   * 
   * You can also override the `id` getter of your extensions to
   * use an explicitly specified id if you want to skip using
   * auto-generated ids entirely.
   * 
   * @returns {object} A `@lumjs/core.UniqueObjectIds` instance.
   * 
   * The instance will be constructed on first request, and then the
   * same instance will be returned on every subsequent request.
   * 
   */
  get idRegistry()
  {
    if (!this[CTX.REGISTRY])
    {
      this[CTX.REGISTRY] = new core.UniqueObjectIds(
      {
        className(name)
        {
          return name.replace(CTX.AUTO_ID_STRIP, '').toLowerCase();
        },
      });
    }

    return this[CTX.REGISTRY];
  }

  /**
   * A static method to return a new instance.
   * 
   * Any arguments are passed to the constructor.
   * Designed to work in your WebApp sub-classes.
   * 
   * @returns {module:@lumjs/web-app/app}
   */
  static new()
  {
    return new this(...arguments);
  }

  // For debugging and internal use only.
  static callContext(fn, ...args)
  {
    if (typeof fn === F)
    {
      return F.call(CTX, ...args);
    }
  }

}

def(WebApp, 'defaultOptions', {value: DEFAULT_OPTIONS});

module.exports = WebApp;

// A base class for extensions.
const Extension = require('./extension');

// Now we'll create aliases to a few prototype methods

const WAP = WebApp.prototype;
const EV_PROTO_ALIASES =
{
  triggerExt:     'emitExt',
  triggerAll:     'emitAll',
  triggerThisExt: 'emitThisExt',
  triggerExtThis: 'emitExtThis',
}

for (const sname in EV_PROTO_ALIASES)
{
  const tname = EV_PROTO_ALIASES[sname];
  def(WAP, tname, WAP[sname]);
}

/**
 * Alias to `triggerExt`
 * @function module:@lumjs/web-app/app.emitExt
 * @param {...any} [args]
 * @returns {object} `this`
 * @see module:@lumjs/web-app/app.triggerExt
 */

/**
 * Alias to `triggerAll`
 * @function module:@lumjs/web-app/app.emitAll
 * @param {...any} [args]
 * @returns {object} `this`
 * @see module:@lumjs/web-app/app.triggerAll
 */

/**
 * Alias to `triggerThisExt`
 * @function module:@lumjs/web-app/app.emitThisExt
 * @param {...any} [args]
 * @returns {object} `this`
 * @see module:@lumjs/web-app/app.triggerThisExt
 */

/**
 * Alias to `triggerExtThis`
 * @function module:@lumjs/web-app/app.emitExtThis
 * @param {...any} [args]
 * @returns {object} `this`
 * @see module:@lumjs/web-app/app.triggerExtThis
 */
