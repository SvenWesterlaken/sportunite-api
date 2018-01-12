const chai = require('chai');
const chai_http = require('chai-http');
const server = require('../../index');
const expect = chai.expect;
const assert = chai.assert;
const bcrypt = require('bcryptjs');
const session = require('../../db/neo4j');
const auth = require('../../auth/token');
const User = require('../../models/user');

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
											session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH(e:Event{id: ${sportEventId}}) MATCH(u)-[:ATTENDS]->(e) RETURN u,e;`)
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
									session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH(e:Event{id: ${sportEventId}}) MERGE(u)-[:ATTENDS]->(e) RETURN u,e;`)
										.then((neoresult3) => {
											chai.request(server)
												.post(`/api/v1/sportevents/${sportEventId}/leave`)
												.send({email: testUser2.email, eventId: sportEventId})
												.set({Authorization: `Bearer ${accessToken}`})
												.end((err, res) => {
													session.run(`MATCH (u:User{id:"${userDb._id}"}) MATCH(e:Event{id: ${sportEventId}}) MATCH(u)-[r:ATTENDS]->(e) DELETE r;`)
														.then((neoresult4) => {
															expect(err).to.be.null;
															expect(res).to.have.status(200);
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

describe('Delete Sportevent', () => {
    it.only('delete a sportevent', (done) => {
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
                                                    // expect(err).to.be.null;
                                                    // expect(res).to.have.status(200);
                                                    // expect(res.body).to.include({msg: "Sport event successfully deleted"});
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