const neo4j = require('./neo4j');
const mongodb = require('./mongodb');

function start() {

  mongodb.connect()
    .once('open', () => console.log('Connected to Mongo'))
    .on('error', err => console.warn('Warning', err.message));

}

module.exports = {
  start
}
