# hubot-mongodb-brain
MongoDB brain for Hubot. Support MongoLab and MongoHQ on Heroku.

- https://github.com/mohemohe/hubot-mongodb-brain

## difference betweet `redis-brain`

Hubot's default `redis-brain` saves all data into one large blob (It's not using Redis as KVS) and write it every 20 seconds. So it exceeds `maxmemory` of Redis.


## Requirements

- mongodb

## Install

    % yarn add https://github.com/mohemohe/hubot-mongodb-brain.git

### edit `external-script.json`

```json
[ "hubot-mongodb-brain" ]
```

### enable mongolab on heroku

    % heroku addons:create mongolab

## Develop

### Debug

    % export HUBOT_LOG_LEVEL=debug


### Test

    % npm install
    % npm test
