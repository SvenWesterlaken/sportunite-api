const neo4j = require('../db/neo4j');
const objectId = require('mongodb').ObjectID;
const mongoose = require('mongoose');

const User = require('../models/user');

module.exports = {

  add(req, res, next)  {
    let eventId = req.body.eventId || '';

    if (eventId != '') {
      neo4j.run("MERGE (u:User {id: {idParam}}) " +
                "MERGE (e:Event {id: {eventParam}}) " +
                "MERGE (e)-[:CREATED_BY]->(u) " +
                "RETURN u, e;", {
                  idParam: req.user._id.toString(),
                  eventParam: eventId
      }).catch(err => next(err)).then(result => {
        res.status(201).json({msg: "Event successfully created"});
        neo4j.close();
      })
    }
  }
};
