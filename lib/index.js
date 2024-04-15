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
 * Assign an event handler.
 * 
 * @function module:@lumjs/web-app.observable#on
 * @param {string} name - Event name.
 * @param {function} handler - Event handler.
 * 
 * The argument(s) passed to the handler depend on the event.
 * 
 * @returns {object} `this`
 */

/**
 * Remove an event handler.
 * 
 * @function module:@lumjs/web-app.observable#off
 * @param {string} name - Event name.
 * @param {function} [handler] Handler to remove.
 * 
 * If omitted, _all_ handlers for the `name` will be removed.
 * 
 * @returns {object} `this`
 */
