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
                "MERGE (u)-[:IS_ATTENDING]->(e) " +
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
    let sportevent;
    var result = [];
    let sportId;
    let organisatorId;
    let hallId;
    let reservationId;
    let buildingId;
    let sportevents;
    let promises = [];

    axios.get(config.sportunite_asp_api.url + `/sportevents/${eventId}`)
      .catch(err => next(err))
      .then(response => {
        console.log(config.sportunite_asp_api.url);

        if (eventId === '') { // if eventid == '' it means a get request has been send for all sportevents
          sportevents = response.data._embedded.sportevents || '';


          _.forEach(sportevents, (sportevent) => { // push a promise chain for every sportevent.
            promises.push(getSporteventPromise(sportevent));
          });
          return Promise.all(promises); // this makes sure all promises for al events will be fired at once
        } else { // a get request had been send for just one particular sportevent
          sportevent = response.data || '';
          console.log("eventid is known");
          return getSporteventPromise(sportevent);
        }
      })
      .catch(err => next(err))
      .then((sportevent) => {
        if (sportevent === undefined) {
          console.log("sportevent is undefined");
          res.status(200).send(sportevents);
        } else {
          console.log("sportevent is NOT undefined");
          res.status(200).send(sportevent);
        }
      });

    function getSporteventPromise(sportevent) {
          sportId = sportevent.sportId;
          reservationId = sportevent.reservationId;
          sportevent = _.pick(sportevent, ['sportEventId', 'name', 'minAttendees', 'maxAttendees',
            'description', 'eventStartTime', 'eventEndTime']);
          // get the sport connected to sportevent
          return axios.get(config.sportunite_asp_api.url + `/sports/${sportId}`)
        .catch(err => next(err))
        .then((response) => {
          console.log('response sport: ' + JSON.stringify(response.data));
          const sport = response.data || '';
          sportevent.sport = _.pick(sport, ['sportId', 'name']);

          if (reservationId !== null) { // get the reservation connected to sportevent if there is a reservation id
            return axios.get(config.sportunite_asp_api.url + `/reservations/${reservationId}`)
              .then(response => {
                const reservation = response.data || '';
                hallId = reservation.hallId;
                sportevent.reservation = _.pick(reservation, ['reservationId', 'startTime', 'timeFinish', 'definite']);
                // get the hall connected to the reservation
                return axios.get(config.sportunite_asp_api.url + `/halls/${hallId}`);
              })
              .catch(err => next(err))
              .then((response) => {
                const hall = response.data || '';
                buildingId = hall.buildingId;
                sportevent.reservation.hall = _.pick(hall, ['hallId', 'name', 'size', 'price']);
                // get the building connected to the hall
                return axios.get(config.sportunite_asp_api.url + `/buildings/${buildingId}`);
              })
              .catch(err => next(err))
              .then(response => {
                const building = response.data || '';
                sportevent.reservation.hall.building = _.pick(building, ['buildingId', 'name', 'address']);

              })
              .catch(err => next(err));
          }
        })
        .catch(err => next(err))
        .then(() => {
          // now get the attendees and organisor from neo4j
          console.log("eventId: " + sportevent.sportEventId);

          return neo4j
            .run(
              "MATCH (u:User)-[rel2:IS_ATTENDING]->(e:Event {id: {eventParam}})-[rel1:CREATED_BY]->(o:User)" +
              "RETURN collect(u) AS attendees, o AS organiser",
              {eventParam: sportevent.sportEventId}
              /////
            );
        })
        .catch(err => next(err))
        .then(parser.parse)
        .then((parsed) => {
          console.log("parsed result: " + JSON.stringify(parsed));
          organisatorId = parsed[0].organiser.id;
          let userIds;
          userIds = parsed[0].attendees.map((attendee) => mongoose.mongo.ObjectId(attendee.id));
          neo4j.close();
          // now get the user information for the attendees and organisor
          return User.find({'_id': {$in: userIds}});
        })
        .catch(err => next(err))
        .then((users) => {
          console.log("mongodb result: " + JSON.stringify(users));
          sportevent.attendees = users;
          sportevent.organisor = _.find(users, (user) => {
            return user._id.toString() === organisatorId ? user : undefined;
          });

          console.log("sportevent: " + JSON.stringify(sportevent));

          if (eventId === '') {
            sportevents.push(... sportevent);
          } else {
            result.push(sportevent);
            return result;
          }

        });
    }
  },
	
	attend(req, res, next) {
		let eventId = req.body.eventId || '';
		
		console.log(eventId);
		
		if (eventId != '') {
			console.log(req.user._id.toString());
			neo4j.run("MATCH (u:User {id: {idParam}}) " +
				"MATCH (e:Event {id:{eventParam}) " +
				"MERGE (u)-[:IS_ATTENDING]->(e)" +
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
