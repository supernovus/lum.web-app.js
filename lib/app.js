"use strict";

const core = require('@lumjs/core');
const WC = require('@lumjs/web-core');
const WS = require('@lumjs/web-service');

const {def,F,S} = core.types;

const AUTO_ID_STRIP = /Ext(ension)?$/i;

/**
 * A simple base class for Web apps.
 * 
 * Supports a modular codebase where multiple entry files
 * may be used to load extensions which provide additional features.
 * 
 * An example app using this will be added in a separate repo.
 * 
 * @exports module:@lumjs/web-app/app
 * @implements {module:@lumjs/web-app.observable}
 * 
 * @prop {object} ws - Storage for Webservice instances.
 *
 */
class WebApp 
{
  /**
   * Build a new WebApp instance.
   * 
   * The default constructor initializes internal data structures,
   * adds the _observable_ trait, runs the `init()` method passing
   * any arguments to it, then registers a DOM event to run `start()`
   * when the DOM is ready.
   *
   * The default constructor has no pre-defined arguments/options.
   * 
   */
  constructor()
  {
    def(this, '$extensions', []);
    def(this, '$inited',  false);
    def(this, '$started', false);

    // A public container for Webservice instances.
    def(this, 'ws', {});

    // And a public container for Extension instances.
    def(this, 'ext', {});

    core.observable(this);
    this.init(...arguments);
    WC.whenReady(() => this.start());
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
    if (this.$inited)
    {
      this.triggerAll('reinit', ...arguments);
    }
    else
    {
      this.trigger('init', ...arguments);
      def(this, '$inited', true);
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
    this.$extensions.push(ext);
    this.ext[ext.id] = ext;
  }

  /**
   * Add an Extension or Webservice to this App instance.
   * 
   * @param {(object|function|string)} ext - Extension or Webservice to add.
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
   * @returns {object} Normally `this`, except if `ext` was a `string`.
   * @throws {TypeError} If `ext` was not a valid value.
   * 
   * @see {@link module:@lumjs/web-app/extension}
   */
  add(ext)
  {
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
   * 
   * @param {...any} [args] Arguments for `trigger()`
   * @returns {object} `this`
   */
  triggerExt()
  {
    for (const ext of this.$extensions)
    {
      ext.trigger(...arguments);
    }
    return this;
  }

  /**
   * Calls `this.trigger(...args).triggerExt(...args)` to trigger
   * an event both on this App instance, and all loaded extensions.
   * 
   * @param {...any} [args] Arguments for `trigger()` and `triggerExt()`
   * @returns {object} `this`
   */
  triggerAll()
  {
    return this.trigger(...arguments).triggerExt(...arguments);
  }

  /**
   * Make a function call on every loaded extension.
   * 
   * This is similar to `triggerExt` except instead of triggering
   * events, it calls specified callback functions or extension methods.
   * 
   * @param {Map} [retVals] An optional Map to put return values into.
   * 
   * If used, each of the _keys_ will be an Extension, and the
   * corresponding _value_ will be the return value of the `fn`.
   * 
   * This only works if a `Map` is passed as the very first argument.
   * Simply omit this and pass `fn` as the first argument if you don't
   * need the return values.
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
   * @returns {object} `this`
   * 
   * @throws {TypeError} If `fn` is not a `string` or `function`.
   * 
   */
  extCall(fn, ...args)
  {
    let retVals = null;

    if (fn instanceof Map)
    { // A map to add return values to was found.
      retVals = fn;
      fn = args.shift();
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

    for (const ext of this.$extensions)
    {
      const retVal = fn(ext, ...args);
      if (retVals)
      {
        retVals.set(ext, retVal);
      }
    }

    return this;
  }

  /**
   * Start the App once the DOM is loaded.
   * 
   * This is called ***automatically*** by the `DOMContentLoaded` event
   * when the DOM is _ready_. The first time it is called, it triggers an 
   * event called `start` which should be used to do any setup of your UI.
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
    if (this.$started)
    { 
      this.triggerAll('restart');
    }
    else
    {
      this.triggerAll('start');
      def(this, '$started', true);
    }

    return this;
  }

  /**
   * Has this app been started?
   */
  get isStarted()
  {
    return this.$started;
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
    if (!this.__idRegistryInstance)
    {
      this.__idRegistryInstance = new core.UniqueObjectIds(
      {
        className(name)
        {
          return name.replace(AUTO_ID_STRIP, '').toLowerCase();
        },
      });
    }

    return this.__idRegistryInstance;
  }

  static new()
  {
    return new this(...arguments);
  }

}

module.exports = WebApp;

// A base class for extensions.
const Extension = require('./extension');
