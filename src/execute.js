import _ from 'lodash';
import { BEFORE, AFTER } from 'node-bits';

export default (schema, hooks, model) => {
  // this will call the hooks with the situation, allowing it to change the args or result
  // based on the stage
  const callHooks = (stage, args, meta) => {
    return _.reduce(hooks || [], (inbound, hook) => {
      const result = hook({ ...meta, stage, ...inbound });
      return result ? result : inbound;
    }, args);
  };

  return (name, action, args, logic) => {
    const meta = { name, action, schema: schema[name] };

    // It goes logically :) - BEFORE hooks, call, AFTER hooks
    return new Promise((resolve, reject) => {
      try {
        const resolvedArgs = callHooks(BEFORE, args, meta);

        logic(model(name), resolvedArgs)
          .then((result) => {
            const resolvedResponse = callHooks(AFTER, { result }, meta);

            resolve(resolvedResponse.result);
          })
          .catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  };
};
