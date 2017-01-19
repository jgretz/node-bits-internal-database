import _ from 'lodash';
import { QUERY, INSERT, UPDATE, DELETE } from 'node-bits';
import autobind from 'class-autobind';

import execute from './execute';

export class Database {
  constructor(config, implementation) {
    autobind(this);

    this.config = config;
    this.implementation = implementation;
  }

  // connect / disconnect
  connect() {
    this.implementation.connect(this.config.connection);
  }

  // schema management
  synchronizeSchema(schema, relationships) {
    this.schema = schema;
    this.relationships = relationships;

    // class scope variables
    this.models = {};
    this.execute = execute(this.schema, this.config.hooks, this.getModel);

    // update the objects
    const keys = _.keys(this.schema);
    _.forEach(keys, (key) => {
      this.updateSchema(key, this.schema[key]);
    });

    this.implementation.afterSynchronizeSchema(this.config.forceSync);
  }

  updateSchema(name, schema) {
    this.removeSchema(name);

    this.models[name] = this.implementation.updateSchema(name, schema);
  }

  removeSchema(name) {
    const model = this.getModel(name);
    if (!model) {
      return;
    }

    this.implementation.removeSchema(name, model);

    this.models = _.omit(this.models, name);
  }

  getModel(name) {
    return this.models[name];
  }

  // CRUD
  findById(name, id) {
    return this.execute(name, QUERY, { id }, this.implementation.findById);
  }

  find(name, query) {
    return this.execute(name, QUERY, { query }, this.implementation.find);
  }

  create(name, data) {
    return this.execute(name, INSERT, { data }, this.implementation.create);
  }

  update(name, id, data) {
    return this.execute(name, UPDATE, { id, data }, this.implementation.update);
  }

  delete(name, id) {
    return this.execute(name, DELETE, { id }, this.implementation.delete);
  }
}
