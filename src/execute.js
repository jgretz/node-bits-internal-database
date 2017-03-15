import _ from 'lodash';
import {BEFORE, AFTER} from 'node-bits';

export default (schema, hooks, model) => {
  // this will call the hooks with the situation, allowing it to change the args or result
  // based on the stage
  const callHooks = (stage, args, meta) =>
    _.reduce(hooks || [], (inbound, hook) => {
      const result = hook({...meta, stage, ...inbound});
      return result ? result : inbound;
    }, args);

  return (name, action, args, logic) => {
    // validate that the model requested exists
    const dbModel = model(name);
    if (!dbModel) {
      throw new Error(`No model named '${name}' has been defined.`);
    }

    // It goes logically :) - BEFORE hooks, call, AFTER hooks
    const meta = {name, action, schema: schema[name]};
    return new Promise((resolve, reject) => {
      try {
        const resolvedArgs = callHooks(BEFORE, args, meta);

        logic(dbModel, resolvedArgs)
          .then(result => {
            const resolvedResponse = callHooks(AFTER, {result}, meta);

            resolve(resolvedResponse.result);
          })
          .catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  };
};
