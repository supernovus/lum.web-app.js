"use strict";

const core = require('@lumjs/core');
const {def,F,B} = core;

module.exports =
{
  makeObservable(obj, options)
  {
    const evtOpts 
      = (typeof options.observableRedefine === B)
      ? options.observableRedefine
      : Object.assign({}, options.eventRegistry);
    const obsOpts = Object.assign({}, options.observable);

    core.observable(obj, obsOpts, evtOpts);

    if (typeof obj.trigger === F)
    { // Make an alias
      def(obj, 'emit', obj.trigger);
    }
    else if (typeof this.emit === F)
    { // Reverse alias
      def(obj, 'trigger', obj.emit);
    }
    else
    { // Neither?
      console.error({obj, options});
      throw new RangeError("Neither trigger() or emit() found");
    }
  },
}
