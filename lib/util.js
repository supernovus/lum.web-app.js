"use strict";

const core = require('@lumjs/core');
const {def,F,B} = core.types;

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
    {
      def(obj, 'emit', obj.trigger);
    }
    else if (typeof obj.emit === F)
    {
      def(obj, 'trigger', obj.emit);
    }
    else
    {
      console.error({obj, options});
      throw new RangeError("Neither trigger() or emit() found");
    }
  },
}
