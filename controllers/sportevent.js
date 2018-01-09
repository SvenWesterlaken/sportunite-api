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
