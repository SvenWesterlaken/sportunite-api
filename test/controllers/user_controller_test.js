const chai = require('chai');
const chai_http = require('chai-http');
const server = require('../../index');
const expect = chai.expect;
const bcrypt = require('bcryptjs');
const auth = require('../../auth/token');

const User = require('../../models/user');

chai.use(chai_http);

describe('User registration', () => {
    let credentials = {
        email: 'test@test11.com',
        password: 'test1234',
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
    }

    it('Valid registration', (done) => {
        chai.request(server)
            .post('/api/v1/register')
            .send(credentials)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                expect(res.body).to.include({"msg": "User successfully created"});
                done();
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
                    expect(res.body).to.include({error: "User already exists"});
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
        email: 'test@test.com',
        password: 'test1234',
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
    }

    beforeEach((done) => {
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

        testUser.save().then(() => done());
    });

    it('Valid login', (done) => {
        chai.request(server)
            .post('/api/v1/login')
            .send(credentials)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Invalid password', function (done) {
        chai.request(server)
            .post('/api/v1/login')
            .send({email: credentials.email, password: 'test'})
            .end((err, res) => {
                expect(err).to.not.be.null;
                expect(res).to.have.status(401);
                expect(res.body).to.include({"error": "Invalid password"});
                done();
            });
    });

    it('Invalid email', function (done) {
        chai.request(server)
            .post('/api/v1/login')
            .send({email: "invalid@hotmail.com", password: credentials.password})
            .end((err, res) => {
                expect(err).to.not.be.null;
                expect(res).to.have.status(404);
                expect(res.body).to.include({"error": "User not found"});
                done();
            });
    });

    it('No email and password', function (done) {
        chai.request(server)
            .post('/api/v1/login')
            .end((err, res) => {
                expect(err).to.not.be.null;
                expect(res).to.have.status(400);
                expect(res.body).to.include({error: "Invalid Login Credentials"});
                done();
            });
    });
});

describe('Retrieving user', () => {

    it('Retrieves a single user', (done) => {
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

        User.create(testUser)
            .then((userDb) => {
                auth.encodeToken(userDb).catch((err) => next(err)).then((accessToken) => {
                    chai.request(server)
                        .get(`/api/v1/users/${userDb._id}`)
                        .set({Authorization: `Bearer ${accessToken}`})
                        .end((err, res) => {
                            expect(err).to.be.null;
                            expect(res).to.have.status(200);
                            expect(res.body).to.be.a('object');
                            expect(res.body).to.include({email: 'test@test.com'});
                            done();
                        });
                });
            });
    });

    it('Retrieving multiple users', (done) => {
        const testUser1 = new User({
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

        const testUser2 = new User({
            email: 'SecondTestEmail@test.com',
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

        User.create(testUser1).then(() => {
            User.create(testUser2)
                .then((userDb) => {
                    auth.encodeToken(userDb).catch((err) => next(err)).then((accessToken) => {
                        chai.request(server)
                            .get(`/api/v1/users/`)
                            .set({Authorization: `Bearer ${accessToken}`})
                            .end((err, res) => {
                                expect(err).to.be.null;
                                expect(res).to.have.status(200);
                                expect(res.body).to.be.a('array').and.have.lengthOf(2);
                                expect(res.body[1]).to.include({email: `${testUser2.email}`});
                                done();
                            });
                    });
                });
        });
    });
});

describe('Modifying user', () => {

    it('Updating existing user', (done) => {
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

        User.create(testUser)
            .then((userDb) => {
                auth.encodeToken(userDb).catch((err) => next(err)).then((accessToken) => {
                    userDb.firstname = "UpdatedName";
                    chai.request(server)
                        .put(`/api/v1/users/${userDb._id}`)
                        .send(userDb)
                        .set({Authorization: `Bearer ${accessToken}`})
                        .end((err, res) => {
                            expect(err).to.be.null;
                            expect(res).to.have.status(202);
                            expect(res.body).to.include({firstname: 'UpdatedName'});
                            done();
                        });
                });
            });
    });

    it('Deleting existing user', (done) => {
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

        User.create(testUser)
            .then((userDb) => {
                auth.encodeToken(userDb).catch((err) => next(err)).then((accessToken) => {
                    chai.request(server)
                        .delete(`/api/v1/users/${userDb._id}`)
                        .send(userDb)
                        .set({Authorization: `Bearer ${accessToken}`})
                        .end((err, res) => {
                            expect(err).to.be.null;
                            expect(res).to.have.status(200);
                            done();
                        });
                });
            });
    });
});