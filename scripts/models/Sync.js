/**
 * @module models/Sync
 */
import _ from 'underscore';
import Db from './Db';

/**
 * Override Backbone sync.
 *
 * @class
 * @constructor
 * @license MPL-2.0
 * @example
 * class MyModel extend Backbone.Model {
 *     get sync() {
 *         return Sync.use();
 *     }
 * }
 */
export default class Sync {

    /**
     * Database instance.
     *
     * @returns {Object}
     */
    get db() {
        return new Db();
    }

    /**
     * Instantiate the class and return sync method
     *
     * @static
     * @returns {Function}
     */
    static use() {
        const sync = new Sync();
        return _.bind(sync.sync, sync);
    }

    /**
     * Override Backbone.sync with this.
     *
     * @param {String} method - read, create, update
     * @param {Object} model - Backbone model/collection
     * @param {String} [model.id] - ID of a model
     * @param {String} model.profileId - the name of a profile
     * @param {String} model.storeName - it can be notes, notebooks, tags, etc
     * @param {Object} options
     * @param {Object} [options.conditions] - conditions by which collection
     * should be filtered
     * @returns {Promise}
     */
    sync(method, model, options = {}) {
        const opt = _.extend({}, _.pick(options, 'conditions'), {
            profileId   : model.profileId,
            storeName   : model.storeName,
        });

        if (model.idAttribute) {
            opt.idAttribute = model.idAttribute,
            opt.id = model.get(model.idAttribute);
        }

        return this[method](model, opt);
    }

    /**
     * Find a model or models.
     *
     * @param {Object} model - Bacbkone model
     * @param {Object} options - options
     * @returns {Promise}
     */
    read(model, options) {
        if (model.idAttribute) {
            return this.findItem(model, options);
        }

        return this.find(model, options);
    }

    /**
     * Find a model.
     *
     * @param {Object} model - Backbone model
     * @param {Object} options
     * @returns {Promise}
     */
    findItem(model, options) {
        return this.db.processRequest('findItem', [options])
        .then(data => {
            if (!data) {
                return Promise.reject('not found');
            }

            model.set(data || {});
            return model;
        });
    }

    /**
     * Find models and add to the collection.
     *
     * @param {Object} collection - Backbone collection
     * @param {Object} options
     * @returns {Promise}
     */
    find(collection, options) {
        return this.db.processRequest('find', [options])
        .then(models => {
            if (models && models.length) {
                collection.add(models);
            }

            return collection;
        });
    }

    /**
     * @see {@link Sync.save}
     */
    create(...args) {
        return this.save.apply(this, args);
    }

    /**
     * @see {@link Sync.save}
     */
    update(...args) {
        return this.save.apply(this, args);
    }

    /**
     * Save a model.
     *
     * @param {Object} model - Backbone model
     * @param {Object} options
     * @returns {Promise}
     */
    save(model, options) {
        const opt = _.extend({
            data: model.getData(),
        }, options);

        return this.db.processRequest('save', [opt])
        .then(data => model.set(data));
    }

    /**
     * Delete a model.
     *
     * @param {Object} model - Backbone model
     * @param {Object} options
     * @returns {Promise}
     */
    delete(model, options) {
        const opt = _.extend({data: model.getData()}, options);
        return this.db.processRequest('removeItem', [opt]);
    }

}
