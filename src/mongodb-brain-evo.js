// Description:
//   hubot-mongodb-brain
//   support MongoLab and MongoHQ on heroku.
//
// Dependencies:
//   "mongodb": "*"
//
// Configuration:
//   MONGODB_URL or MONGOLAB_URI or MONGOHQ_URL or 'mongodb://localhost:27017/hubot'
//
// Author:
//   Sho Hashimoto <hashimoto@shokai.org>
//   mohemohe
//   amirhmoradi

//@ts-check

const { MongoClient } = require('mongodb');
const Url = require('url');

class MongoDB {
  constructor(robot) {
    this.robot = robot;

    this.resetSaveInterval = process.env.MONGODB_SAVE_INTERVAL || 10
    this.url = process.env.MONGODB_URL ||
      process.env.MONGOLAB_URI ||
      process.env.MONGOHQ_URL ||
      'mongodb://localhost:27017/hubot';

    this.brainCollection = process.env.MONGODB_BRAIN_COLLECTION || 'brain'

    const urlInfo = Url.parse(this.url);
    this.dbName = urlInfo.pathname ? urlInfo.pathname.replace('/', '') : 'hubot';
  }

  async _connect() {
    this.client = await MongoClient.connect(this.url);
    this.db = this.client.db(this.dbName);
    try {
      this.db.createCollection(this.brainCollection)
              .then(collection => {
                this.collection = collection;
              })
              .catch(reason => {
                this.robot.logger.error('MongoDB Create Collection Error:' + reason);
              });
    } catch (e) {
      this.robot.logger.error('MongoDB Create Collection Error:' + e);
    }
    this.robot.logger.info('MongoDB connected');
  }

  async load() {
    await this._connect();

    this.robot.brain.setAutoSave(false);

    this.collection.find().toArray((err, docs) => {
      if (err) {
        throw err;
      }
      this.robot.brain.mergeData(
        docs.reduce((obj, doc) => {
          obj[doc.key] = doc.value;
          return obj;
        }, {})
      );
      this.robot.logger.info('MongoDB loaded');
      this.robot.brain.resetSaveInterval(this.resetSaveInterval);
      this.robot.brain.setAutoSave(true);
    });
  }

  async save(data) {
    const dataKeys = Object.keys(data || {});
    this.robot.logger.info('MongoDB save caught:' + dataKeys, data);
    if (dataKeys.length > 0) {
      this.robot.brain.setAutoSave(false);

      const bulkWriteOperations = [];
      dataKeys.forEach((key) => {
        bulkWriteOperations.push({updateOne: { filter: {key}, update: {$set: data[key]}, upsert: true}});
      });
      this.robot.logger.info('MongoDB Operations:', bulkWriteOperations);
      await this.collection.bulkWrite(bulkWriteOperations)
                            .then( updateResults => {
                              this.robot.logger.info('MongoDB updated records:' + updateResults);
                            })
                            .catch (reason => {
                              this.robot.logger.error('MongoDB update error:' + reason);
                            });
      
      
      this.robot.brain.setAutoSave(true);
    }
  }

  close() {
    this.client.close();
  }
}

module.exports = (robot) => {
  const mongodb = new MongoDB(robot);
  robot.brain.on('close', () => mongodb.close());
  robot.brain.on('save', data => mongodb.save(data));
  mongodb.load();
  robot.logger.info('Decorating robot with mongodb: use robot.db'); 
  robot.db = mongodb;
};
