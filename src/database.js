import _ from 'lodash';
import {QUERY, INSERT, UPDATE, DELETE} from 'node-bits';
import autobind from 'class-autobind';

import execute from './execute';

const FIND_OPTIONS = ['includeMetaData', 'start', 'max', 'where', 'select', 'orderby', 'skip', 'limit'];

const cleanOptions = options => {
  if (!options) {
    return {};
  }

  if (options && !_.some(_.keys(options), x => FIND_OPTIONS.includes(x))) {
    // this is here for backwards compatibility when find just accepted a query
    return {backwardsQuery: options};
  }

  if (options.skip) {
    options.start = options.skip;
    delete options.skip;
  }

  if (options.limit) {
    options.max = options.limit;
    delete options.limit;
  }

  return options;
};

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

  rawConnection() {
    return this.implementation.rawConnection();
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
    _.forEach(keys, key => {
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
    return this.execute(name, QUERY, {id}, this.implementation.findById);
  }

  find(name, options) {
    return this.execute(name, QUERY, cleanOptions(options), this.implementation.find);
  }

  create(name, data, options) {
    return this.execute(name, INSERT, {data, options: cleanOptions(options)}, this.implementation.create);
  }

  update(name, id, data, options) {
    return this.execute(name, UPDATE, {id, data, options: cleanOptions(options)}, this.implementation.update);
  }

  delete(name, id) {
    return this.execute(name, DELETE, {id}, this.implementation.delete);
  }
}
