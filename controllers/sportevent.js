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
		
		if (eventId != '') {
			neo4j.run("MATCH (u:User {id: {idParam}}) " +
				"MATCH (e:Event {id: {eventParam}}) " +
				"MERGE (u)-[:ATTENDS]->(e)" +
				"RETURN e, u;", {
					idParam: req.user._id.toString(),
					eventParam: eventId
				}
			).catch(err => next(err)).then(result => {
				res.status(200).json({msg: "User successfully added to event"});
				neo4j.close();
			});
		}
	},
	
	leave(req, res, next) {
		let eventId = req.body.eventId || '';
		
		if (eventId != '') {
			neo4j.run("MATCH (u:User {id: {idParam}}) " +
				"MATCH (e:Event {id: {eventParam}}) " +
				"MATCH (u)-[r:ATTENDS]->(e)" +
				"DELETE r", {
					idParam: req.user._id.toString(),
					eventParam: eventId
				}
			).catch(err => next(err)).then(result => {
				res.status(200).json({msg: "User succesfully removed from event"});
				neo4j.close();
			});
		}
	},
	
	remove(req, res, next) {
        let eventId = req.body.eventId || '';
        let userId = req.user._id || '';
        if (objectId.isValid(userId)) {
        	if (eventId != '')
        		neo4j.run("MATCH (u:User{id:{idParam}}) " +
					"MATCH (e:Event{id:{eventParam}}) " +
					"MERGE (e)-[:CREATED_BY]->(u) " +
					"DETACH DELETE e " +
			        "RETURN u", {
        			idParam: req.user._id.toString(),
					eventParam: eventId
        		}).catch(err => next(err)).then(result => {
        			//console.log(result);
					if(result.records.length == 0) {
        				res.status(401).json({msg: "User did not create of the event"})
					}
					res.status(200).json({msg: "Sport event successfully deleted"});
        			neo4j.close();
        		})
        }else {
            res.status(422).json({error: "Invalid user id"});
		}
	}
}
