// Description:
//   hubot-mongodb-brain-evo
//   supports MongoLab and MongoHQ on heroku for Mongo URLs.
//   supports custom collection and db name.
//
// Dependencies:
//   "mongodb": "*"
//
// Configuration:
// ( VAR || VAR2 ... || default_value_if_not_set # More info)
//   MONGODB_URL || MONGOLAB_URI || MONGOHQ_URL || 'mongodb://localhost:27017/hubot'
//   MONGODB_SAVE_INTERVAL || 10
//   MONGODB_BRAIN_COLLECTION || brain
//   MONGODB_DB_NAME || <VAL_EXTRACTED_FROM_MONGODB_URL_PATH> || hubot
//
// Author:
//   Sho Hashimoto <hashimoto@shokai.org>
//   mohemohe
//   amirhmoradi

//@ts-check

const { MongoClient } = require('mongodb');
const Url = require('url');

const getCircularReplacer = (key, value) => {
    const seen = new WeakSet();
    return (key, value) => {
    if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
        return;
        }
        seen.add(value);
    }
    return value;
    };
};

class MongoDB {
  constructor(robot) {
    this.robot = robot;

    this.resetSaveInterval = process.env.MONGODB_SAVE_INTERVAL || 10
    this.url = process.env.MONGODB_URL ||
      process.env.MONGOLAB_URI ||
      process.env.MONGOHQ_URL ||
      'mongodb://localhost:27017/hubot';

    this.brainCollection = process.env.MONGODB_BRAIN_COLLECTION || 'brain';
    
    const urlInfo = Url.parse(this.url);
    this.dbName = process.env.MONGODB_DB_NAME || (urlInfo.pathname ? urlInfo.pathname.replace('/', '') : 'hubot');
  }

  async _connect() {
    this.client = await MongoClient.connect(this.url);
    this.db = this.client.db(this.dbName);
    try {
        this.collection = this.db.collection(this.brainCollection);
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
      
      const brainDbDocs = docs.reduce((obj, doc) => {
        obj[doc.key] = doc.value;
        return obj;
      }, {});
      this.robot.brain.mergeData(brainDbDocs);

      this.robot.brain.resetSaveInterval(this.resetSaveInterval);
      this.robot.brain.setAutoSave(true);
    });
  }

  async save(data) {
    this.robot.logger.info('MongoDB save caught');

    const dataKeys = Object.keys(data || {});
    if (dataKeys.length > 0) {
      this.robot.brain.setAutoSave(false);

      const bulkWriteOperations = [];
      dataKeys.forEach((key) => {
          if( typeof data[key] !== "undefined" ){
            // data[key] = JSON.stringify(data[key], getCircularReplacer(),2); // Use this if your data is not standard JSON.
            bulkWriteOperations.push({updateOne: { filter: {key}, update: {$set: {"key": key, "value": data[key]}}, upsert: true}});
          }
      });
      this.collection.bulkWrite(bulkWriteOperations)
                            .then( updateResults => {
                              this.robot.logger.info('MongoDB updated records: ' + updateResults.modifiedCount);
                            })
                            .catch (reason => {
                              this.robot.logger.error('MongoDB update error: ' + reason);
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
