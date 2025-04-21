"use strict";

/**
 * A package of useful libraries for building web apps.
 * @exports module:@lumjs/web-app
 */
exports = module.exports =
{
  /**
   * @see {@link module:@lumjs/web-app/app}
   */
  App: require('./app'),

  /**
   * @see {@link module:@lumjs/web-app/extension}
   */
  Extension: require('./extension'),

  /**
   * @see {@link module:@lumjs/web-app/modules}
   */
  modules: require('./modules'),

  // TODO: document this
  Util: require('./util'),

  /**
   * A convenience structure made up of aliases
   * to various `@lumjs/*` packages. 
   * Mostly for debugging, and code-splitting purposes.
   * 
   * @type {object}
   * @prop {object} core - `@lumjs/core`
   * @prop {object} web
   * @prop {object} web.core - `@lumjs/web-core`
   * @prop {object} web.service - `@lumjs/web-service`
   * @prop {object} web.app - `@lumjs/web-app` (this package)
   * 
   */
  Lum:
  {
    core: require('@lumjs/core'),
    web:
    {
      core: require('@lumjs/web-core'),
      service: require('@lumjs/web-service'),
    },
  },

};

exports.Lum.web.app = exports;

/**
 * Objects using the _observable_ events API (from `@lumjs/core`).
 * 
 * @interface module:@lumjs/web-app.observable
 */

/**
 * Assign an event handler
 * @function module:@lumjs/web-app.observable#on
 * @param {(string|symbol)} type - Event type
 * @param {function} handler - Event handler
 * 
 * The argument(s) passed to the handler depend on the event.
 * 
 * In the _classic_ observable API all the additional arguments passed
 * to the trigger() method will be passed to the handler.
 * 
 * However the events system that powers the _new_ observable API
 * prefers the use of a single event object. That is currently
 * an opt-in, but will eventually become the default behaviour
 * in the next major release.
 * 
 * @returns {object} `this`
 */

/**
 * Remove an event handler
 * @function module:@lumjs/web-app.observable#off
 * @param {(string|symbol)} type - Event type
 * @param {function} handler - Handler to remove
 * @returns {object} `this`
 */

/**
 * Trigger/Emit an event
 * 
 * This is the classic method name used by the observable API.
 * In the next major version it will become an alias to `emit`.
 * 
 * @function module:@lumjs/web-app.observable#trigger
 * @param {(string|symbol)} type - Event type
 * @param {...mixed} args - Data and other arguments for the event
 * @returns {object} `this`
 * @see module:@lumjs/web-app.observable#emit
 */

/**
 * An alias for `trigger`
 * 
 * In the next major version this will become the primary method
 * name and trigger() will become an alias to this.
 * 
 * @function module:@lumjs/web-app.observable#emit
 * @param {(string|symbol)} type - Event type
 * @param {...mixed} args - Data and other arguments for the event
 * @returns {object} `this`
 * @see module:@lumjs/web-app.observable#trigger
 */
