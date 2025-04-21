"use strict";

const core = require('@lumjs/core');
const {S,F,isObj,isComplex} = core.types;
const {getObjectPath,setObjectPath} = core.obj;
const App = require('./app');
const Ext = require('./extension');

/**
 * @module module:@lumjs/web-app/modules
 */

/**
 * A registry of *modules* in use by the current web app.
 * 
 * The definition of a module may differ from app to app,
 * but I use this for any optional JS files that may be loaded
 * into a browser (usually via a <script> tag).
 * 
 * @prop {Map} mods - Keys are string ids, values are module objects.
 * Also available as the `used` alias property.
 * @prop {Map} modIds - Keys are module objects, values are string ids;
 * literally a reverse lookup of the `mods` map. Also available as the
 * `idsFor` alias property.
 * @prop {object} opts - Options passed to the constructor.
 * @prop {string[]} paths - An array of possible property paths for the
 * `registration.defaultTarget` getter.
 * 
 * @exports module:@lumjs/web-app/modules.Registry
 */
class ModuleRegistry
{
  /**
   * Create a module registry instance.
   * @param {object} [opts] Assigned to `this.opts`
   * @param {(string|symbol)} [opts.ikey='instance'] See getInstanceFor()
   * @param {string[]} [opts.paths] Assigned to `this.paths`;
   * if not specified, `['reg.app.util','reg.opts']` will be used.
   */
  constructor(opts={})
  {
    this.mods   = this.used   = new Map();
    this.modIds = this.idsFor = new Map();
    this.opts   = opts;
    this.paths  = Array.isArray(opts.paths)
      ? opts.paths 
      : ['reg.app.util', 'reg.opts'];
  }

  /**
   * Start the registration process for a module.
   * @param {(object|function)} mod - Module definition
   * @returns {module:@lumjs/web-app/modules.Registry} `this`
   */
  for(mod)
  {
    if (isComplex(mod))
    {
      if (mod instanceof App)
      { // Keep a reference to the app in the registry
        this.app = mod;
      }

      return new ModuleRegistration(mod, this);
    }
    else
    {
      throw new TypeError("Invalid module object");
    }
  }

  /**
   * Look for an instance object for the specified module id.
   * 
   * If the stored module definition is a class constructor,
   * then we will check if a copy of the instance was saved
   * to the `module[this.opts.instanceKey]` property.
   * 
   * @param {string} id - The id of the module we want
   * 
   * @returns {(object|undefined)} Module instance if found
   */
  getInstanceFor(id)
  {
    const mod = this.mods.get(id);
    if (isObj(mod)) return mod;
    else if (typeof mod === F)
    {
      const ikey = this.opts.instanceKey ?? 'instance';
      return mod[ikey];
    }
  }

  /**
   * A shortcut for really simple modules that don't
   * have any need for methods other than for() and use(),
   * this calls both of those back to back.
   * 
   * @param {string} id
   * @param {object} mod
   * @return {module:@lumjs/web-app/modules.Registry} `this`
   */
  make(id, mod)
  {
    return this.for(mod).use(id);
  }

}

/**
 * A transitory class used during module registration.
 * 
 * The instances of this class are used during the registration
 * process when you call `registry.for()`, and are sent off for
 * garbage collection once you call the `use()` method.
 * 
 * @prop {(object|function)} mod - The module definition passed to `for()`;
 * 
 * It may be the App itself, an Extension constructor, an Extension instance,
 * or any kind of object specific to your requirements.
 * 
 * @prop {module:@lumjs/web-app/modules.Registry} reg - The registry instance.
 * 
 * @alias module:@lumjs/web-app/modules~Registration
 */
class ModuleRegistration
{
  constructor(mod, reg)
  {
    this.mod = mod;
    this.reg = reg;
  }

  /**
   * The default target for the `set()` method.
   * 
   * For each of `this.reg.paths`, check `this` for an object at that
   * property path, The first object found will be the default target.
   * Will be undefined if no paths resolved to an object (or function).
   */
  get defaultTarget()
  {
    for (const path of this.reg.paths)
    {
      const res = getObjectPath(this, path);
      if (isComplex(res))
      {
        return res;
      }
    }
  }

  /**
   * Call a custom function with this helper object
   * set as `this` and as the sole argument to the function.
   * @param {function} fn - Function to call
   * @return {module:@lumjs/web-app/modules~Registration} `this`
   */
  call(fn)
  {
    if (typeof fn === F)
    {
      fn.call(this, this);
    }
    return this;
  }

  /**
   * Set properties in an object.
   * 
   * @param {(string|object)} arg1 
   * 
   * If this is a `string` it must be the path to a property
   * we want to assign one or more values to, and `arg2` will
   * be used to determine what we are setting.
   * 
   * If this is an `object` then it'll be used as a collection of
   * property values to assign to the `this.defaultTarget` object,
   * and `arg2` won't be used at all.
   * 
   * @param {*} [arg2]
   * 
   * If this is an `object` it will be used as a collection 
   * of property values to assign to the target property. 
   * 
   * If it is anything other than an `object` or `undefined`, 
   * then the target property will be set to this value, 
   * overwriting any existing value.
   * 
   * If it is `undefined` then the target property will be
   * created as an empty object if it does not already exist.
   * 
   * @return {module:@lumjs/web-app/modules~Registration} `this`
   */
  set(arg1, arg2)
  {
    let props = null, target;

    if (typeof arg1 === S)
    { // A path to the desired target
      let ao = {};

      if (isObj(arg2))
      { // Props to add to target
        props = arg2;
      }
      else if (arg2 !== undefined)
      { // A single value to set
        ao.value = arg2;
        ao.overwrite = true;
      }

      target = setObjectPath(this, arg1, ao);
    }
    else if (isObj(arg1))
    { // Props to add to the default target object
      target = this.defaultTarget;
      props = arg1;
    }
    else
    {
      console.error("invalid args", {arg1, arg2});
    }

    if (props && target)
    {
      Object.assign(target, props);
    }

    return this;
  }

  /**
   * Use the current module object.
   * 
   * Will record the module in the registry with the selected id.
   * 
   * Must be the last method called for each module object,
   * as when it completes, it returns the registry.
   * 
   * @prop {string} [id] - The module id to register the object as.
   * 
   * Generally the base filename of the module without any path info
   * file extension.
   * 
   * If you leave this unspecified, then we will try to determine an id
   * automatically using a few simple techniques.
   * 
   * @returns {module:@lumjs/web-app/modules.Registry} `this.reg`
   * @throws {RangeError} If the id is already in use.
   */
  use(id)
  {
    const {mod,reg} = this;

    const app = reg.app instanceof App ? reg.app : null;
    const isFun = typeof mod === F;

    if (typeof id !== S)
    {
      if (mod instanceof Ext)
      {
        id = mod.id;
      }
      else if (mod instanceof App)
      {
        id = mod.idRegistry.id(mod);
      }
      else if (app instanceof App)
      {
        id = app.idRegistry.id(mod);
      }
      else
      { // this is my last resort...
        id = (isFun ? mod : mod.constructor).name;
      }
    }

    if (reg.mods.has(id))
    {
      throw new RangeError(`Module '${id}' already registered`);
    }

    if (typeof mod.use === F)
    { // A custom use method()
      mod.use(this);
    }
    else if (isFun)
    { 
      if (Ext.isPrototypeOf(mod))
      { // An Extension class constructor
        if (app)
        { 
          if (typeof mod.register === F)
          { // Custom register() method
            mod.register(app);
          }
          else
          { 
            app.add(mod);
          }
        }
      }
      else
      { // Any other other kind of function we call directly
        mod.call(this, this);
      }
    }
    else if (app && mod instanceof Ext)
    {
      app.add(mod);
    }

    reg.mods.set(id, mod);
    reg.modIds.set(mod, id);

    return reg;
  }

  for(mod)
  {
    return this.use().for(mod);
  }

}

module.exports = 
{
  Registry: ModuleRegistry,
}
