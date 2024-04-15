"use strict";

const core = require('@lumjs/core');
const {def,F,isNil} = core.types;

/**
 * A simple base class for web-app Extensions.
 * 
 * @exports module:@lumjs/web-app/extension
 * @implements {module:@lumjs/web-app.observable}
 */
class WebExtension 
{
  /**
   * Build a new extension.
   * 
   * @param {?@lumjs/web-app/app} [app] Parent App instance.
   * 
   * While it is highly recommended to specify the app during
   * construction, it may also be assigned to the `app` property 
   * after construction. Just make sure it is assigned before 
   * the `id` property is requested, or there will be errors thrown.
   * 
   * This sets up hooks for `init`, `reinit`, `start`, and `restart`.
   * See {@link module:@lumjs/web-app/extension#setupHook} for details.
   * 
   * This will trigger the `init` event, passing any arguments to it.
   * 
   */
  constructor(app=null)
  {
    core.observable(this);

    this.setupHook('init')
        .setupHook('reinit')
        .setupHook('start')
        .setupHook('restart');
    
    this.trigger('init', ...arguments);
    this.setApp(app);
  }

  /**
   * Get the parent App instance.
   * 
   * This is meant for internal use only.
   * It's preferred to use the `app` getter instead of this.
   * 
   * @private
   * @param {boolean} [validate=false] Ensure a valid app is set?
   * @returns {@lumjs/web-app/app}
   * @throws {RangeError} If `validate` is `true` and `this.app` is not set.
   */
  getApp(validate=false)
  {
    if (validate && !(this.$app instanceof App))
    {
      throw new RangeError("App instance not set");
    }

    return this.$app;
  }

  /**
   * Set the parent App instance.
   * 
   * This is meant for internal use only.
   * It's preferred to use the `app` setter instead of this.
   * 
   * @private
   * @param {@lumjs/web-app/app} app - The app instance to set.
   * @param {boolean} [validate=false] Ensure that `app` is valid?
   * @returns {@lumjs/web-app/extension} `this`
   * @throws {TypeError} If `validate` is `true` and `app` is not valid.
   */
  setApp(app, validate=false)
  {
    if (app instanceof App)
    {
      if (app.$started)
      { // The app has already been started.
        if (isNil(this.$app))
        { // No app had been set yet.
          this.trigger('start');
        }
        else
        { // An app had been set.
          this.trigger('restart');
        }
      }
    }
    else if (validate)
    {
      console.error({app, extension: this});
      throw new TypeError("Invalid App instance");
    }

    def(this, '$app', app);

    return this;
  }

  /**
   * A getter for the parent App instance.
   * @returns {module:@lumjs/web-app/app}
   * @throws {RangeError} If `this.app` is not set.
   */
  get app()
  {
    return this.getApp(true);
  }

  /**
   * A setter for the parent App instance.
   * 
   * @param {module:@lumjs/web-app/app} app The app instance.
   * @throws {TypeError} If `app` is not valid.
   */
  set app(app)
  {
    return this.setApp(app, true);
  }

  /**
   * Set up a _hook_ so that if a specific event is triggered,
   * and a certain method exists on this instance, that method
   * will be called, and will be passed all the arguments from the
   * triggered event.
   * 
   * @param {string} ename - The name of the event we'll listen for.
   * 
   * Some known events that might be triggered:
   * 
   * - `init`    : Instance has been constructed.
   * - `reinit`  : The `app.init()` method was called manually.
   * - `start`   : The `app.start()` method was called automatically.
   * - `restart` : The `app.start()` method was called manually.
   * 
   * Note that `start` and `restart` may also be called if the `app`
   * property is set to an instance that has already been started.
   * In this case, `start` will be called if this extension did not
   * have a previous `app` assigned, and `restart` will be called if 
   * it did.
   * 
   * @param {string} [mname=ename] The name of the method to look for.
   * 
   * If the `mname` method exists, then it will be called any time the
   * `ename` event is triggered. 
   * 
   * If not specified, `mname` defaults to `ename`.
   *  
   * @returns {object} `this`
   */
  setupHook(ename, mname=ename)
  {
    if (typeof this[mname] === F)
    {
      this.on(ename, () => this[mname](...arguments));
    }
    return this;
  }

  /**
   * A special getter to get a unique id for this extension.
   * 
   * The default implementation uses `this.app.idRegistry` to
   * get a unique `id` that will persist for the lifetime of
   * the app and extension.
   * 
   * This may be overridden in sub-classes to customize the id.
   * 
   * @returns {string}
   */
  get id()
  {
    return this.app.idRegistry.id(this);
  }

}

module.exports = WebExtension;

// A base class for apps.
const App = require('./app');
