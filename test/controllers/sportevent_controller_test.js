const chai = require('chai');
const chai_http = require('chai-http');
const server = require('../../index');
const expect = chai.expect;
const assert = chai.assert;
const bcrypt = require('bcryptjs');
const session = require('../../db/neo4j');
const auth = require('../../auth/token');
const User = require('../../models/user');
const neo4j = require('../../db/neo4j');
const parser = require('parse-neo4j');
const nock = require('nock');
const config = require('../../config/env');

chai.use(chai_http);

describe('Add Sportevent', () => {
	it('add a Sportevent', (done) => {
		const userTest = new User({
			email: 'test@test.com',
			password: bcrypt.hashSync('test1234'),
			firstname: '22131tester1,',
			lastname: 'testing',
			birth: 1993 - 6 - 24,
			gender: 'male',
			address: {
				street: 'Hinderstraat',
				number: 1,
				postal_code: '3077DA',
				city: 'Rotterdam',
				state: 'Zuid-Holland',
				country: 'Nederland',
				geometry: {
					coordinates: [4.567827, 51.886838]
				}
			}
		});
		const sportEventId = 12;
		
		User.create(userTest)
			.then((userDb) => {
				auth.encodeToken(userDb).catch((err) => next(err)).then((accessToken) => {
					session.run(`CREATE (e:Event{id: ${sportEventId}}) RETURN e;`)
						.then((result1) => {
							session.run(`CREATE (u:User {id: "${userDb._id}"}) RETURN u;`)
								.then((result2) => {
									chai.request(server)
										.post(`/api/v1/sportevents/`)
										.send({email: userTest.email, eventId: sportEventId})
										.set({Authorization: `Bearer ${accessToken}`})
										.end((err, res) => {
											session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH(e:Event{id: ${sportEventId}}) MATCH(u)<-[:CREATED_BY]-(e) RETURN u,e;`)
												.then((result3) => {
													console.log(result3)
													expect(err).to.be.null;
													expect(res).to.have.status(201);
													expect(res.body).to.include({msg: "Event successfully created"});
													expect(result3.records[0]._fields[0].labels[0]).to.be.equal('User');
													expect(result3.records[0]._fields[1].labels[0]).to.be.equal('Event');
													done();
												});
										});
								});
						})
				})
			})
	})
});

describe('Attend Sportevent', () => {
	it('attends a sportevent', (done) => {
		const testUser = new User({
			email: 'test@test.com',
			password: bcrypt.hashSync('test1234'),
			firstname: '22131tester1,',
			lastname: 'testing',
			birth: 1993 - 6 - 24,
			gender: 'male',
			address: {
				street: 'Hinderstraat',
				number: 1,
				postal_code: '3077DA',
				city: 'Rotterdam',
				state: 'Zuid-Holland',
				country: 'Nederland',
				geometry: {
					coordinates: [4.567827, 51.886838]
				}
			}
		});
		
		const sportEventId = 1111;
		
		User.create(testUser)
			.then((userDb) => {
				auth.encodeToken(userDb).catch((err) => next(err)).then((accessToken) => {
					session.run(`CREATE (e:Event{id: ${sportEventId}}) RETURN e;`)
						.then((neoresult1) => {
							session.run(`CREATE (u:User {id: "${userDb._id}"}) RETURN u;`)
								.then((neoresult2) => {
									chai.request(server)
										.post(`/api/v1/sportevents/${sportEventId}/attend`)
										.send({email: testUser.email, eventId: sportEventId})
										.set({Authorization: `Bearer ${accessToken}`})
										.end((err, res) => {
											session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH(e:Event{id: ${sportEventId}}) MATCH(u)-[:IS_ATTENDING]->(e) RETURN u,e;`)
												.then((neoresult3) => {
													expect(err).to.be.null;
													expect(res).to.have.status(200);
													expect(res.body).to.include({msg: "User successfully added to event"});
													expect(neoresult3.records[0]._fields[0].labels[0]).to.be.equal('User');
													expect(neoresult3.records[0]._fields[1].labels[0]).to.be.equal('Event');
													done();
												});
										});
								});
						});
				});
			});
	});
});

describe('Leave Sportevent', () => {
	it('leave a sportevent', (done) => {
		const testUser2 = new User({
			email: 'test@test.com',
			password: bcrypt.hashSync('test1234'),
			firstname: '22131tester1,',
			lastname: 'testing',
			birth: 1993 - 6 - 24,
			gender: 'male',
			address: {
				street: 'Hinderstraat',
				number: 1,
				postal_code: '3077DA',
				city: 'Rotterdam',
				state: 'Zuid-Holland',
				country: 'Nederland',
				geometry: {
					coordinates: [4.567827, 51.886838]
				}
			}
		});
		
		const sportEventId = 1111;
		
		User.create(testUser2)
			.then((userDb) => {
				auth.encodeToken(userDb).catch((err) => next(err)).then((accessToken) => {
					session.run(`CREATE (e:Event{id: ${sportEventId}}) RETURN e;`)
						.then((neoresult1) => {
							session.run(`CREATE (u:User {id: "${userDb._id}"}) RETURN u;`)
								.then((neoresult2) => {
									session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH(e:Event{id: ${sportEventId}}) MERGE(u)-[:IS_ATTENDING]->(e) RETURN u,e;`)
										.then((neoresult3) => {
											chai.request(server)
												.post(`/api/v1/sportevents/${sportEventId}/leave`)
												.send({email: testUser2.email, eventId: sportEventId})
												.set({Authorization: `Bearer ${accessToken}`})
												.end((err, res) => {
													session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH(e:Event{id: ${sportEventId}}) MATCH(u)-[r:IS_ATTENDING]->(e) DELETE r;`)
														.then((neoresult4) => {
															session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH (e:Event{id: ${sportEventId}}) MATCH (u)-[:IS_ATTENDING]->(e) RETURN u, e;`)
																.then((neoresult5) => {
																	expect(err).to.be.null;
																	expect(res).to.have.status(200);
																	expect(neoresult5.records).to.be.lengthOf(0);
																	expect(res.body).to.include({msg: "User succesfully removed from event"});
																	done();
																});
														});
												});
										});
								});
						});
				});
			});
	});
});

describe('Delete Sportevent', () => {
	it('delete a sportevent correct account', (done) => {
		const testingUser = new User({
			email: 'test@test.com',
			password: bcrypt.hashSync('test1234'),
			firstname: '22131tester1,',
			lastname: 'testing',
			birth: 1993 - 6 - 24,
			gender: 'male',
			address: {
				street: 'Hinderstraat',
				number: 1,
				postal_code: '3077DA',
				city: 'Rotterdam',
				state: 'Zuid-Holland',
				country: 'Nederland',
				geometry: {
					coordinates: [4.567827, 51.886838]
				}
			}
		});
		
		const sportEventId = 1111;
		
		User.create(testingUser)
			.then((userDb) => {
				auth.encodeToken(userDb).catch((err) => next(err)).then((accessToken) => {
					session.run(`CREATE (e:Event{id: ${sportEventId}}) CREATE (u:User{id:"${userDb._id}"}) RETURN e,u;`)
						.then((neoresult1) => {
							// console.log(neoresult1.records[0]._fields[1])
							session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH(e:Event{id: ${sportEventId}}) MERGE (e)-[:CREATED_BY]->(u) RETURN e,u;`)
								.then((neoresult2) => {
									// console.log(neoresult2.records[0]._fields[1])
									chai.request(server)
										.delete(`/api/v1/sportevents/${sportEventId}`)
										.send({email: testingUser.email, eventId: sportEventId})
										.set({Authorization: `Bearer ${accessToken}`})
										.end((err, res) => {
											session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH(e:Event{id: ${sportEventId}}) MATCH (e)-[:CREATED_BY]->(u) DETACH DELETE e RETURN u`)
												.then((neoresult3) => {
													console.log(neoresult3);
													expect(err).to.be.null;
													expect(res).to.have.status(200);
													expect(res.body).to.include({msg: "Sport event successfully deleted"});
													session.close();
													done();
												});
										})
									
								});
						});
				});
			});
	});
	
	it('delete a sportevent wrong account', (done) => {
		const user1 = new User({
			email: 'test@test.com',
			password: bcrypt.hashSync('test1234'),
			firstname: '22131tester1,',
			lastname: 'testing',
			birth: 1993 - 6 - 24,
			gender: 'male',
			address: {
				street: 'Hinderstraat',
				number: 1,
				postal_code: '3077DA',
				city: 'Rotterdam',
				state: 'Zuid-Holland',
				country: 'Nederland',
				geometry: {
					coordinates: [4.567827, 51.886838]
				}
			}
		});
		
		const user2 = new User({
			email: 'test2@test.com',
			password: bcrypt.hashSync('test12345'),
			firstname: '22131tester1,',
			lastname: 'testing',
			birth: 1993 - 6 - 24,
			gender: 'male',
			address: {
				street: 'Hinderstraat',
				number: 1,
				postal_code: '3077DA',
				city: 'Rotterdam',
				state: 'Zuid-Holland',
				country: 'Nederland',
				geometry: {
					coordinates: [4.567827, 51.886838]
				}
			}
		});
		
		const sportEventId = 1111;
		
		User.create(user1)
			.then((userDb) => {
				User.create(user2)
					.then((user2Db) => {
						auth.encodeToken(user2Db).catch((err) => next(err)).then((accessToken) => {
							session.run(`CREATE (e:Event{id: ${sportEventId}}) CREATE (u:User{id:"${userDb._id}"}) RETURN e,u;`)
								.then((neoresult1) => {
									// console.log(neoresult1.records[0]._fields[1])
									session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH(e:Event{id: ${sportEventId}}) MERGE (e)-[:CREATED_BY]->(u) RETURN e,u;`)
										.then((neoresult2) => {
											// console.log(neoresult2.records[0]._fields[1])
											chai.request(server)
												.delete(`/api/v1/sportevents/${sportEventId}`)
												.send({email: user1.email, eventId: sportEventId})
												.set({Authorization: `Bearer ${accessToken}`})
												.end((err, res) => {
													session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH(e:Event{id: ${sportEventId}}) MATCH (e)-[:CREATED_BY]->(u) DETACH DELETE e RETURN u`)
														.then((neoresult3) => {
															expect(res).to.have.status(401);
															expect(res.body).to.include({msg: "User did not create of the event"});
															session.close();
															done();
														});
												})
											
										});
								});
						});
					});
			});
	});
});

describe('Test Sportevent controller', () => {

	const credentialsUser1 = {
		email: 'test@test.com',
		password: 'test1234',
	};
	
	let organisorId;
	
	let authToken = '';

  const sporteventResponse = {
    "sportEventId": 6,
    "name": "GVoetbal",
    "minAttendees": 2,
    "maxAttendees": 20,
    "description": "Alleen mensen met een lichamelijke handicap mogen meedoen",
    "eventStartTime": "2018-01-16T14:00:00",
    "eventEndTime": "2018-01-16T15:00:00",
    "sportId": 1,
    "reservationId": 5,
  };

  const sporteventResponse2 = {
    "sportEventId": 7,
    "name": "GVoetbal",
    "minAttendees": 2,
    "maxAttendees": 20,
    "description": "Alleen mensen met een lichamelijke handicap mogen meedoen",
    "eventStartTime": "2018-01-16T14:00:00",
    "eventEndTime": "2018-01-16T15:00:00",
    "sportId": 2,
    "reservationId": 6,
  };

  const sportResponse = {
    "sportId": 1,
    "name": "Voetbal"
  };

  const sportResponse2 = {
    "sportId": 2,
    "name": "Basketbal"
  };

  const aSportevents = {
    "_embedded": {
      "sportevents": [
        sporteventResponse,
        sporteventResponse2
      ]
    }
  };

  const reservationResponse = {
    "reservationId": 5,
    "startTime": "2018-01-16T14:00:00",
    "timeFinish": "2018-01-16T15:00:00",
    "definite": false,
    "sportEventId": 6,
    "hallId": 1,
  };

  const reservationResponse2 = {
    "reservationId": 6,
    "startTime": "2018-01-16T14:00:00",
    "timeFinish": "2018-01-16T15:00:00",
    "definite": false,
    "sportEventId": 7,
    "hallId": 1,
  };

  const hallResponse = {
    "hallId": 1,
    "name": "Hall 1",
    "size": "Groot",
    "price": 10,
    "available": true,
    "buildingId": 3,
  };

  const buildingResponse = {
    "buildingId": 3,
    "name": "Sport Fit",
    "address": {
      "addressId": 3,
      "streetName": "Dijkweg",
      "houseNumber": 33,
      "suffix": null,
      "zipCode": "4814CC",
      "city": "Breda",
      "state": "Noord-Brabant",
      "country": "Nederland"
    }
  };
	
	beforeEach((done) => {
		const testUser1 = new User({
			email: credentialsUser1.email,
			password: bcrypt.hashSync(credentialsUser1.password),
			firstname: '22131tester1,',
			lastname: 'testing',
			birth: 1993 - 6 - 24,
			gender: 'male',
			address: {
				street: 'Hinderstraat',
				number: 1,
				postal_code: '3077DA',
				city: 'Rotterdam',
				state: 'Zuid-Holland',
				country: 'Nederland',
				geometry: {
					coordinates: [4.567827, 51.886838]
				}
			}
		});
		
		const testUser2 = new User({
			email: 'SecondTestEmail@test.com',
			password: bcrypt.hashSync('test1234'),
			firstname: 'bapbapbap,',
			lastname: 'testing',
			birth: 1993 - 6 - 24,
			gender: 'male',
			address: {
				street: 'Hinderstraat',
				number: 1,
				postal_code: '3077DA',
				city: 'Rotterdam',
				state: 'Zuid-Holland',
				country: 'Nederland',
				geometry: {
					coordinates: [4.567827, 51.886838]
				}
			}
		});
		
		const testUser3 = new User({
			email: 'thirdtestemail@test.com',
			password: bcrypt.hashSync('test1234'),
			firstname: 'testerbeepboop,',
			lastname: 'testingagain',
			birth: 1993 - 6 - 24,
			gender: 'male',
			address: {
				street: 'Hinderstraat',
				number: 1,
				postal_code: '3077DA',
				city: 'Rotterdam',
				state: 'Zuid-Holland',
				country: 'Nederland',
				geometry: {
					coordinates: [4.567827, 51.886838]
				}
			}
		});

    // Mock the http requests send by axios to the ASP.NET API for SportUnite
    nock(config.sportunite_asp_api.host)
      .get(`/api/sportevents/${sporteventResponse.sportEventId}`)
      .reply(200, sporteventResponse)
      .get(`/api/sportevents/${sporteventResponse2.sportEventId}`)
      .reply(200, sporteventResponse2)
      .get(`/api/sports/${sportResponse.sportId}`)
      .reply(200, sportResponse)
      .get(`/api/sports/${sportResponse2.sportId}`)
      .reply(200, sportResponse2)
      .get(`/api/reservations/${reservationResponse.reservationId}`)
      .reply(200, reservationResponse)
      .get(`/api/reservations/${reservationResponse2.reservationId}`)
      .reply(200, reservationResponse2)
      .get(`/api/halls/${hallResponse.hallId}`)
      .times(2)
      .reply(200, hallResponse)
      .get(`/api/buildings/${buildingResponse.buildingId}`)
      .times(2)
      .reply(200, buildingResponse)
      .get(`/api/sportevents/`)
      .reply(200, aSportevents)
      .log((data) => console.log("NOCK LOG: " + data));

    // create users and make them organise and attend events
		User.create(testUser1).then((result1) => {
			console.log('testuser1: ' + JSON.stringify(result1));
			auth.encodeToken(result1).catch((err) => next(err)).then((accessToken) => {
				authToken = accessToken;
				testUser1._id = result1._id;
					User.create(testUser2).then((result2) => {
						console.log('testuser2: ' + JSON.stringify(result2));
						testUser2._id = result2._id;

						User.create(testUser3).then((result3) => {
							console.log('testuser3: ' + JSON.stringify(result3));
							testUser3._id = result3._id;
						}).then(() => {
							const eventId = '1';
							const evenId2 = '2';
							const attendee1Id = testUser1._id.toString();
							const attendee2Id = testUser2._id.toString();
							const attendee3Id = testUser3._id.toString();
							organisorId = attendee3Id;

							neo4j.run(
								"MERGE (attendee1:User {id: {attendee1Param}})" +
								"MERGE (e:Event {id: {eventParam}})" +
								"MERGE (e2:Event {id: {event2Param}})" +
								"MERGE (attendee1)-[:IS_ATTENDING]->(e)" +
								"MERGE (attendee1)-[:IS_ATTENDING]->(e2)" +
								"MERGE (attendee2:User {id: {attendee2Param}})-[:IS_ATTENDING]->(e)" +
								"MERGE (attendee3:User {id: {attendee3Param}})<-[:CREATED_BY]-(e)" +
								"MERGE (attendee3)<-[:CREATED_BY]-(e2)" +
								"MERGE (attendee3)-[:IS_ATTENDING]->(e)" +
								"MERGE (attendee3)-[:IS_ATTENDING]->(e2)" +
								"RETURN attendee1, attendee2, attendee3, e, e2;",
								{
									attendee1Param: attendee1Id,
									attendee2Param: attendee2Id,
									attendee3Param: attendee3Id,
									eventParam: sporteventResponse.sportEventId,
									event2Param: sporteventResponse2.sportEventId
								}
							).catch((err) => console.log('error: ' + err)).then(
								parser.parse
							).then((parsed) => {
								console.log("parsed test result: " + JSON.stringify(parsed));
								done();
							})
					})
				})
			});
		});
	});

  it('Retrieving a single sportevent should return a sportevent', (done) => {
    chai.request(server)
      .get(`/api/v1/sportevents/${sporteventResponse.sportEventId}`)
      .set({Authorization: `Bearer ${authToken}`})
      .end((err, res) => {
        console.log("Error: " + JSON.stringify(err));

        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.organisor).to.include({_id: `${organisorId}`});
        expect(res.body.attendees).to.be.an('array').and.have.lengthOf(3);
        expect(res.body.sport).to.be.an('object');
        expect(res.body.reservation).to.be.an('object');
        expect(res.body.reservation.hall).to.be.an('object');
        expect(res.body.reservation.hall.building).to.be.an('object');
        done();
      });
  });

  it('GET /sportevents/ Retrieving multiple sportevents should return a sportevent', (done) => {
    chai.request(server)
      .get(`/api/v1/sportevents`)
      .set({Authorization: `Bearer ${authToken}`})
      .end((err, res) => {
        console.log("Error: " + JSON.stringify(err));
        console.log("Response: " + JSON.stringify(res.body));


        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array').and.have.lengthOf(2);
        expect(res.body[1].organisor).to.include({_id: `${organisorId}`});
        expect(res.body[1].attendees).to.be.an('array').and.have.lengthOf(2);
        done();
      });
  });
	

});