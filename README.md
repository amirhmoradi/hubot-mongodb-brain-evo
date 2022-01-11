# hubot-mongodb-brain-evo
MongoDB brain evo for Hubot. Supports multiple configuration options. Works with latest Mongo, Rocket.Chat, Hubot.
Supports MongoLab and MongoHQ on heroku for Mongo URLs.
Supports custom collection and db name from env vars.

## Configuration:
( VAR || VAR2 ... || default_value_if_not_set # More info)

`MONGODB_URL` || `MONGOLAB_URI` || `MONGOHQ_URL` || `'mongodb://localhost:27017/hubot'`
`MONGODB_SAVE_INTERVAL` || `10` # save interval, in seconds
`MONGODB_BRAIN_COLLECTION` || `brain`
`MONGODB_DB_NAME` || `<VAL_EXTRACTED_FROM_MONGODB_URL_PATH>` || `hubot`

## Doc
### difference betweet `redis-brain`

Hubot's default `redis-brain` saves all data into one large blob (It's not using Redis as KVS) and write it every 20 seconds. So it exceeds `maxmemory` of Redis.


## Requirements

- mongodb

## Install

### env var:
Add `hubot-mongodb-brain-evo` to your `EXTERNAL_SCRIPTS` variable

OR
### edit `external-script.json`

```json
[ "hubot-mongodb-brain-evo" ]
```

### enable mongolab on heroku

    % heroku addons:create mongolab