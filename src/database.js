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
    this.implementation.connect(this.config);
  }

  // schema management
  synchronizeSchema(db) {
    this.db = db;

    // class scope variables
    this.models = {};
    this.execute = execute(this.db.schema, this.config.hooks, this.getModel);

    // give the implementation its first crack at the schema definition
    const adjDb = this.implementation.beforeSynchronizeSchema(this.config, this.db);
    if (adjDb) {
      this.db = adjDb;
    }

    // update the individual objects
    const keys = _.keys(this.db.schema);
    _.forEach(keys, (key) => {
      this.updateSchema(key, this.db.schema[key]);
    });

    this.implementation.defineRelationships(this.config, this.models, this.db);

    // allow the implementation to do any final calls / clean up
    this.implementation.afterSynchronizeSchema(this.config, this.models, this.db);
  }

  updateSchema(name, schema) {
    this.removeSchema(name);

    this.models[name] = this.implementation.updateSchema(name, schema, this.db);
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
