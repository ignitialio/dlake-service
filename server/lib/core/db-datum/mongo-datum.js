const Cursor = require('mongodb').Cursor
const _ = require('lodash')

const Datum = require('../datum')
const getByPath = require('../../utils').getByPath
const utils = require('@ignitial/iio-services').utils

const pino = require('../../utils').pino

class MongoDatum extends Datum {
  constructor(options) {
    super(options)

    this._options.idName = this._options.idName || '_id'

    pino.info('created datum [' + options.name + '] with options', options)
  }

  /* initialize */
  async _init() {
    try {
      // wait for mongo property ready
      this._mongo = await utils.waitForPropertyInit(this.$app, '_dbConnector')

      // wait for db connection in data center conditions
      await utils.waitForPropertyInit(this._mongo, '_ready', 86400000)

      // wait for db connected
      this._db = await this._mongo.waitForDb()

      // get reference to collection as per the db engine
      this._collectionName = this._name.split(':')[1]
      this._rawCollection = this._db.collection(this._collectionName)

      this._api = utils.getMethods(this._rawCollection)

      // updates here HTTP calls since no indication in source code comments
      for (let m of this._api) {
        if (m.toLowerCase().match(/find/)) {
          if (this._httpMethods.get.indexOf(m) === -1) {
            this._httpMethods.get.push(m)
          }
        } else if (m.toLowerCase().match(/insert/)) {
          if (this._httpMethods.put.indexOf(m) === -1) {
            this._httpMethods.put.push(m)
          }
        } else if (m.toLowerCase().match(/remove/)) {
          if (this._httpMethods.delete.indexOf(m) === -1) {
            this._httpMethods.delete.push(m)
          }
        } else {
          // all the other are update by default
          if (this._httpMethods.post.indexOf(m) === -1) {
            this._httpMethods.post.push(m)
          }
        }

        this[m] = (...args) => {
          return new Promise((resolve, reject) => {
            // remove userId and granted info
            args.pop()

            let response = this._rawCollection[m].apply(this._rawCollection, args)

            if (response instanceof Cursor) {
              response.toArray().then(result => {
                resolve(result)
              }).catch(err => reject(err))
            } else {
              response.then(result => {
                if (result.result) {
                  resolve(result.result)
                } else {
                  resolve(result)
                }
              }).catch(err => reject(err))
            }
          })
        }
      }

      await super._init()
      pino.info('initialized datum [' + this._name + ']')
    } catch (err) {
      pino.error(err, 'datum [%s] init failure', this._name)
    }
  }

  /* ------------------------------------------------------------------------
      Common API
     ------------------------------------------------------------------------ */
  /* creates a doc */
  dCreate(obj, grants) {
    /* @_PUT_ */
    return new Promise((resolve, reject) => {
      obj._lastModified = new Date()
      // log
      pino.info(obj._lastModified + ' - ' + this.name + ' -CREATE-', obj)

      this._rawCollection.insertOne(obj, { w: 1 }).then(response => {
        response = (response.ops && response.ops.length !== 0) ? response.ops[0] : null
        resolve(response)
        this.$app._pushEvent(this._name + ':add', response)
          .catch(err => pino.error(err, 'failed to notify add'))
      }).catch(err => {
        reject(err)
      })
    })
  }

  /* alias to create */
  dPut(obj, grants) {
    /* @_PUT_ */
    return this.dCreate(obj, grants)
  }

  /* get document for query (first match) */
  dGet(query, grants) {
    /* @_GET_ */
    // log
    pino.info(new Date() + ' - ' + this.name + ' -GET-', query)

    if (grants.$grantsAny && grants.$grantsAny.granted) {
      let options = { projection: {} }

      for (let attr of grants.$grantsAny.attributes) {
        if (attr[0] === '!') {
          attr = attr.slice(1)

          options.projection[attr] = 0
        } else {
          if (attr !== '*') {
            options.projection[attr] = 1
          }
        }
      }

      return this._rawCollection.findOne(query, options)
    } else {
      // already filtered by service access control, so, if here,
      // $grants.granted for Own operations
      return new Promise((resolve, reject) => {
        let options = { projection: {} }

        for (let attr of grants.$grants.attributes) {
          if (attr[0] === '!') {
            attr = attr.slice(1)

            options.projection[attr] = 0
          } else {
            if (attr !== '*') {
              options.projection[attr] = 1
            }
          }
        }

        this._rawCollection.findOne(query, options).then(doc => {
          if (doc && doc._id === grants.$userId) {
            resolve(doc)
          } else {
            reject(new Error('access not granted'))
          }
        }).catch(err => reject(err))
      })
    }
  }

  /* get documents for query */
  dFind(query, grants) {
    /* @_GET_ */
    // log
    pino.info(new Date() + ' - ' + this.name + ' -FIND-', query)

    if (grants.$grantsAny && grants.$grantsAny.granted) {
      let options = { projection: {} }

      for (let attr of grants.$grantsAny.attributes) {
        if (attr[0] === '!') {
          attr = attr.slice(1)

          options.projection[attr] = 0
        } else {
          if (attr !== '*') {
            options.projection[attr] = 1
          }
        }
      }

      return this._rawCollection.find(query, options).toArray()
    } else {
      // already filtered by service access control, so, if here,
      // $grants.granted for Own operations
      return new Promise((resolve, reject) => {
        let options = { projection: {} }

        for (let attr of grants.$grants.attributes) {
          if (attr[0] === '!') {
            attr = attr.slice(1)

            options.projection[attr] = 0
          } else {
            if (attr !== '*') {
              options.projection[attr] = 1
            }
          }
        }

        this._rawCollection.find(query, options).toArray().then(docs => {
          docs = _.filter(docs, e => e._id === grants.$userId)

          resolve(docs)
        }).catch(err => reject(err))
      })
    }
  }

  /* updates matching doc (first match) */
  dUpdate(query, obj, grants) {
    /* @_POST_ */
    return new Promise((resolve, reject) => {
      // last modification log
      obj._lastModified = new Date()
      // log
      pino.info(obj._lastModified + ' - ' + this.name + ' -UPDATE-', query, obj)

      if (grants.$grantsAny && grants.$grantsAny.granted) {
        for (let attr of grants.$grantsAny.attributes) {
          if (attr[0] === '!') {
            attr = attr.slice(1)

            if (obj[attr]) delete obj[attr]
          }
        }

        this._rawCollection.updateOne(query, { $set: obj }, { w: 1 })
          .then(async response => {
            if (response.result.n === 0) {
              reject(new Error('update failed'))
              return
            }
            
            try {
              if (query._id) {
                response = { _id: query._id }
              } else {
                let doc = await this._rawCollection.findOne(query)
                if (doc) {
                  response = { _id: doc._id }
                } else {
                  reject(new Error('update failed'))
                  pino.warn(err, 'impossible to fetch id: update failed')
                  return
                }
              }
            } catch (err) {
              reject(new Error('update failed'))
              pino.warn(err, 'impossible to fetch id: update failed')
              return
            }

            resolve(response)

            this.$app._pushEvent(this._name + ':update', response)
              .catch(err => pino.error(err, 'failed to notify update'))
          }).catch(err => {
            reject(err)
          })
      } else {
        // already filtered by service access control, so, if here,
        // $grants.granted for Own operations
        this._rawCollection.findOne(query).then(doc => {
          if (doc && getByPath(doc, this._options.idName) === grants.$userId) {
            for (let attr of grants.$grants.attributes) {
              if (attr[0] === '!') {
                attr = attr.slice(1)

                if (obj[attr]) delete obj[attr]
              }
            }

            this._rawCollection.updateOne(query, { $set: obj }, { w: 1 })
              .then(() => {
                let response = { _id: doc._id }

                resolve(response)

                this.$app._pushEvent(this._name + ':update', response)
                  .catch(err => pino.error(err, 'failed to notify update'))
              }).catch(err => {
                reject(err)
              })
          } else {
            if (doc) {
              reject(new Error('access not granted'))
            } else {
              reject(new Error('document not found'))
            }
          }
        }).catch(err => {
          reject(err)
        })
      }
    })
  }

  /* deletes matching doc (first match) */
  dDelete(query, grants) {
    /* @_DELETE_ */
    // log
    pino.info(new Date() + ' - ' + this.name + ' -DELETE-', query)

    return new Promise(async (resolve, reject) => {
      let doc
      try {
        doc = await this._rawCollection.findOne(query)

        if (!doc) {
          reject(new Error('document not found'))
          return
        }
      } catch (err) {
        reject(err)
        return
      }

      if (grants.$grantsAny && grants.$grantsAny.granted) {
        this._rawCollection.deleteOne(query, { w: 1 }).then(() => {
          let response = { _id: doc._id }
          resolve(response)

          this.$app._pushEvent(this._name + ':delete', response)
            .catch(err => pino.error(err, 'failed to notify delete'))
        }).catch(err => {
          reject(err)
        })
      } else {
        // already filtered by service access control, so, if here,
        // $grants.granted for Own operations
        if (doc && getByPath(doc, this._options.idName) === grants.$userId) {
          this._rawCollection.deleteOne(query, { w: 1 }).then(response => {
            resolve(response.result)
            this.$app._pushEvent(this._name + ':delete', response.result)
              .catch(err => pino.error(err, 'failed to notify delete'))
          }).catch(err => {
            reject(err)
          })
        } else {
          if (doc) {
            reject(new Error('access not granted'))
          } else {
            reject(new Error('document not found'))
          }
        }
      }
    })
  }
}

module.exports = MongoDatum
