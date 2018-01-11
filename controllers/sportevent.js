const neo4j = require('../db/neo4j');
const objectId = require('mongodb').ObjectID;
const mongoose = require('mongoose');
const axios = require('axios');
const config = require('../config/env');
const parser = require('parse-neo4j');
const _ = require('lodash');

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
    const eventId = req.params.id || '';

    axios.get(config.sportunite_asp_api.url + `/sportevents/${eventId}`).catch(err => next(err)).then(response => {
      let sportevent = response.data || '';

      if (sportevent !== '') {
        if (sportevent.isArray) {

        } else {
          neo4j.run(
            "MATCH (u:User)-[rel2:IS_ATTENDING]->(e:Event {id: {eventParam}})-[rel1:CREATED_BY]->(o:User)" +
            "RETURN collect(u) AS attendees, o AS organiser",
            {eventParam: eventId}
          ).catch(err => next(err)).then(
            parser.parse
          ).then(
            (parsed) => {
              console.log('parsed: ' + JSON.stringify(parsed));

              const organisatorId = parsed[0].organiser.id;
              let userIds = [];
              let attendees = [];
              let organisator;

              userIds = parsed[0].attendees.map((attendee) => mongoose.mongo.ObjectId(attendee.id));

              User.find({'_id': {$in: userIds}}).catch(err => next(err)).then(
                (users) => {
                  // attendees.push(... users);
                  sportevent.attendees = users;
                  sportevent.organisor = _.find(users, (user) => {
                    return user._id.toString() === organisatorId ? user : undefined;
                  });

                  neo4j.close();
                  console.log("sportevent: " + JSON.stringify(sportevent));
                  res.status(200).send(sportevent);
                }
              )
            }
          )
            .then((attendees) => {
              console.log('returned attendees ' + JSON.stringify(attendees));
            });
        }
      } else {
        res.status(200).json({});
      }
    });
  },
	
	attend(req, res, next) {
		let eventId = req.body.eventId || '';
		
		console.log(eventId);
		
		if (eventId != '') {
			console.log(req.user._id.toString());
			neo4j.run("MATCH (u:User {id: {idParam}}) " +
				"MATCH (e:Event {id: \"2007\"}) " +
				"MERGE (u)-[:ATTENDS]->(e)" +
				"RETURN e, u;", {
					idParam: req.user._id.toString(),
					eventParam: eventId.toString()
				}
			).catch(err => next(err)).then(result => {
				console.log(result);
				res.status(200).json({msg: "User successfully added to event"});
				neo4j.close();
			});
		}
	}
};
