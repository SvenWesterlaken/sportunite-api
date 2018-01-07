const chai = require('chai');
const chai_http = require('chai-http');
const server = require('../../index');
const expect = chai.expect;
const assert = chai.assert;
const bcrypt = require('bcryptjs');
const session = require('../../db/neo4j');

const User = require('../../models/user');

chai.use(chai_http);

describe('User registration', () => {
    let credentials = {
        email: 'test@test11.com',
        password: 'test1234',
        firstname: '22131tester1,',
        lastname: 'testing' ,
        birth: 1993-6-24,
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
    };

    it('Valid registration', (done) => {
        chai.request(server)
            .post('/api/v1/register')
            .send(credentials)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                expect(res.body).to.include({ "msg": "User successfully created"});

                User.findOne({ email: 'test@test11.com' })
                    .then((user) => {
                        assert(user.firstname === '22131tester1,');

                        session
                            .run(
                                "MATCH (user:User) RETURN user"
                            )
                            .then((result) => {
                               assert(result.records.length === 1);
                               session.close();
                               done();
                            });
                    });


            });
    });

    it('User already exists', (done) => {
        User.create(credentials).then(() => {

            chai.request(server)
                .post('/api/v1/register')
                .send(credentials)
                .end((err, res) => {
                    expect(err).to.not.be.null;
                    expect(res).to.have.status(409);
                    expect(res.body).to.include({ error: "User already exists"});
                    done();
                });
        });
    });

    it('No information given', (done) => {
        chai.request(server)
            .post('/api/v1/register')
            .end((err, res) => {
                expect(err).to.not.be.null;
                expect(res).to.have.status(400);
                expect(res.body).to.include({error: "Invalid Registration Credentials"});
                done();
            });
    })
});

describe('User login', () => {

    const credentials = {
        email: 'test@test11.com',
        password: 'test1234',
        firstname: '22131tester1,',
        lastname: 'testing' ,
        birth: 1993-6-24,
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
    };

    const user = {
        email: credentials.email,
        password: credentials.password
    };

    const userWithInvalidEmail = {
        email: 'invalidemail@hotmail.com',
        password: credentials.password
    };

    const userWithInvalidPassword = {
        email: credentials.email,
        password: 'InvalidPassword'
    };

    it('Successful login', (done) => {
        chai.request(server)
            .post('/api/v1/register')
            .send(credentials)
            .end((err, res) => {
                chai.request(server)
                    .post('/api/v1/login')
                    .send(user)
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body).to.have.property('token');
                        done();
                    })

            });

    });

    it('Login fails due to invalid email', (done) => {
        chai.request(server)
            .post('/api/v1/register')
            .send(credentials)
            .end((err, res) => {
                chai.request(server)
                    .post('/api/v1/login')
                    .send(userWithInvalidEmail)
                    .end((err, res) => {
                        expect(res).to.have.status(404);
                        expect(res.body).to.include({error: "User not found"});
                        done();
                    })

            });
    });

    it('Login fails due to invalid password', (done) => {
        chai.request(server)
            .post('/api/v1/register')
            .send(credentials)
            .end((err, res) => {
                chai.request(server)
                    .post('/api/v1/login')
                    .send(userWithInvalidPassword)
                    .end((err, res) => {
                        expect(res).to.have.status(401);
                        expect(res.body).to.include({error: "Invalid password"});
                        done();
                    })

            });
    });
});

describe('Read, Update and Delete on user', () => {
    let credentials1 = {
        email: 'test1@test11.com',
        password: 'test1234',
        firstname: 'tester1',
        lastname: 'testing' ,
        birth: 1993-6-24,
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
    };

    let credentials2 = {
        email: 'test2@test11.com',
        password: 'test1234',
        firstname: 'tester2',
        lastname: 'testing' ,
        birth: 1993-6-24,
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
    };

    let user = {
        email: credentials1.email,
        password: credentials1.password
    };

    it('Get to /api/v1/users/:id? returns all users', (done) => {
        chai.request(server)
            .post('/api/v1/register')
            .send(credentials1)
            .end((err, res) => {
                chai.request(server)
                    .post('/api/v1/register')
                    .send(credentials2)
                    .end((err, res) => {
                        chai.request(server)
                            .post('/api/v1/login')
                            .send(user)
                            .end((err, res) => {
                                chai.request(server)
                                    .get('/api/v1/users')
                                    .set('Authorization', 'Bearer ' + res.body.token)
                                    .end((err, res) => {
                                        expect(err).to.be.null;
                                        expect(res).to.have.status(200);
                                        expect(res.body).to.be.an('array');
                                        expect(res.body[0]).to.deep.include({email: 'test1@test11.com'});
                                        expect(res.body[1]).to.deep.include({email: 'test2@test11.com'});
                                        done();
                                    })
                            });


                    })
            })
    });

    it('Get to /api/v1/users/:id? returns one user with specific a specific id', (done) => {
        chai.request(server)
            .post('/api/v1/register')
            .send(credentials1)
            .end((err, res) => {
                chai.request(server)
                    .post('/api/v1/login')
                    .send(user)
                    .end((err, res) => {
                        User.findOne({email: 'test1@test11.com'})
                            .then((user) => {
                                chai.request(server)
                                    .get(`/api/v1/users/${user._id}`)
                                    .set('Authorization', 'Bearer ' + res.body.token)
                                    .end((err, res) => {
                                        expect(err).to.be.null;
                                        expect(res).to.have.status(200);
                                        expect(res.body).to.deep.include({email: 'test1@test11.com'});
                                        done();
                                    })
                            })

                    });

            })
    });

    it('Put to /api/v1/users/:id updates a user', (done) => {
        chai.request(server)
            .post('/api/v1/register')
            .send(credentials1)
            .end((err, res) => {
                chai.request(server)
                    .post('/api/v1/login')
                    .send(user)
                    .end((err, res) => {
                        User.findOne({email: 'test1@test11.com'})
                            .then((user) => {
                                chai.request(server)
                                    .put(`/api/v1/users/${user._id}`)
                                    .send({gender: 'female'})
                                    .set('Authorization', 'Bearer ' + res.body.token)
                                    .end((err, res) => {
                                        expect(err).to.be.null;
                                        expect(res).to.have.status(202);
                                        expect(res.body).to.deep.include({email: 'test1@test11.com'});
                                        expect(res.body).to.deep.include({gender: 'female'});
                                        done();
                                    })
                            })

                    });

            })
    });

    it.only('Delete to /api/v1/users/:id deletes a user', (done) => {
        chai.request(server)
            .post('/api/v1/register')
            .send(credentials1)
            .end((err, res) => {
                chai.request(server)
                    .post('/api/v1/login')
                    .send(user)
                    .end((err, res) => {
                        User.findOne({email: 'test1@test11.com'})
                            .then((user) => {
                                chai.request(server)
                                    .delete(`/api/v1/users/${user._id}`)
                                    .set('Authorization', 'Bearer ' + res.body.token)
                                    .end((err, res) => {
                                        expect(err).to.be.null;
                                        expect(res).to.have.status(200);

                                        const userId = res.body._id;

                                        User.findOne({email: 'test1@test11.com'})
                                            .then((user) => {
                                                assert(user === null);
                                                session
                                                    .run(
                                                        "MATCH (user:User) RETURN user"
                                                    )
                                                    .then((result) => {
                                                        console.log('result: ' + JSON.stringify(result.records.length));
                                                        assert(result.records.length === 0);
                                                        session.close();
                                                        done();
                                                    });
                                            });

                                    })
                            })

                    });

            })
    });

});
