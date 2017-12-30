const chai = require('chai');
const chai_http = require('chai-http');
const server = require('../../index');
const expect = chai.expect;
const bcrypt = require('bcryptjs');

const User = require('../../models/user');

chai.use(chai_http);

// describe('User login', () => {
//     let test;
//     let credentials = { email: 'test@test.com', password: 'test1234' };
//
//     beforeEach((done) => {
//         test = new User({email: 'test@test.com', password: bcrypt.hashSync('test1234') });
//         test.save().then(() => done());
//     });
//
//     it('Valid login', (done) => {
//         chai.request(server)
//             .post('/api/v1/login')
//             .send(credentials)
//             .end((err, res) => {
//                 expect(err).to.be.null;
//                 expect(res).to.have.status(200);
//                 expect(res.body).to.include({"token" : auth.encodeToken(credentials.email)});
//                 done();
//             });
//     });
//
//     it('Invalid password', function(done) {
//         chai.request(server)
//             .post('/api/v1/login')
//             .send({email: credentials.email, password: 'test'})
//             .end((err, res) => {
//                 expect(err).to.not.be.null;
//                 expect(res).to.have.status(401);
//                 expect(res.body).to.include({"error" : "Invalid password"});
//                 done();
//             });
//     });
//
//     it('Invalid email', function(done) {
//         chai.request(server)
//             .post('/api/v1/login')
//             .send({email: "invalid@hotmail.com", password: test.password})
//             .end((err, res) => {
//                 expect(err).to.not.be.null;
//                 expect(res).to.have.status(404);
//                 expect(res.body).to.include({"error" : "User not found"});
//                 done();
//             });
//     });
//
//     it('No email and password', function(done) {
//         chai.request(server)
//             .post('/api/v1/login')
//             .end((err, res) => {
//                 expect(err).to.not.be.null;
//                 expect(res).to.have.status(400);
//                 expect(res.body).to.include({error: "Invalid Login Credentials"});
//                 done();
//             });
//
//     });
// });

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
    }

    it('Valid registration', (done) => {
        chai.request(server)
            .post('/api/v1/register')
            .send(credentials)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                expect(res.body).to.include({ "msg": "User successfully created"});
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

describe('Get all Users', () => {
    it('Get to /api/users/:id?')

});

// describe('Token validation', (done) => {
//     const credentials = { email: 'test@test.com', password: 'test1234' };
//     let clock;
//
//     before(() => {
//         clock = sinon.useFakeTimers();
//     });
//
//     after(() => {
//         clock.restore();
//     })
//
//     it('Token expired', (done) => {
//
//         const token = auth.encodeToken(credentials.email);
//
//         expect(token).to.not.be.null;
//         expect(token).to.be.a('string');
//
//         clock.tick(73e5);
//
//         chai.request(server)
//             .get('/api/v1/recipes')
//             .set('W-Access-Token', token)
//             .end((err, res) => {
//                 expect(err).to.not.be.null;
//                 expect(res).to.have.status(401);
//                 done();
//             });
//     });
//
//     it('No token given', (done) => {
//         chai.request(server)
//             .get('/api/v1/recipes')
//             .end((err, res) => {
//                 expect(err).to.not.be.null;
//                 expect(res).to.have.status(401);
//                 done();
//             });
//     })
// });