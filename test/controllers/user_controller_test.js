const chai = require('chai');
const chai_http = require('chai-http');
const server = require('../../index');
const expect = chai.expect;
const bcrypt = require('bcryptjs');

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

    it('Get to /api/users/:id?', (done) => {
        chai.request(server)
            .post('/api/v1/reqister')
            .send(credentials)
    })

});
