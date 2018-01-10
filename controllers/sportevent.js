const neo4j = require('../db/neo4j');
const objectId = require('mongodb').ObjectID;
const mongoose = require('mongoose');
const axios = require('axios');
const config = require('../config/env');

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
  },

  get(req, res, next) {
    const eventId = parseInt(req.params.id) || '';

    axios.get(config.sportunite_asp_api.url + `/sportevents/${eventId}`).catch(err => next(err)).then(response => {
      let sportevent = response.data || '';

      if (sportevent !== '') {
        neo4j.run(
          "MATCH (e:Event {id: {eventParam}})" +
          "MATCH (e)<-[:IS_ATTENDING]-(u:User)" +
          "MATCH (e)-[:CREATED_BY]->(o:User)" +
          "RETURN u AS attendee, o AS organisator",
          {eventParam: eventId}
        ).catch(err => next(err)).then(result => {
          console.log(JSON.stringify(result));
          let attendees = [];
          result.records.forEach(record => {
            console.log('attendees ids: ' + record._fields[0].properties.id);
            attendees.push(record.attendee);
          });

          sportevent.attendees = attendees;

          res.status(200).send(sportevent);
          neo4j.close();
        });
      } else {
        res.status(200).json({});
      }
    });
  }
};
