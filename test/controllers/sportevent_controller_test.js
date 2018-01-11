/**
 * Created by twanv on 9-1-2018.
 */
const chai = require('chai');
const chai_http = require('chai-http');
const server = require('../../index');
const expect = chai.expect;
const neo4j = require('../../db/neo4j');
const bcrypt = require('bcryptjs');
const auth = require('../../auth/token');
const parser = require('parse-neo4j');
const _ = require('lodash');

const User = require('../../models/user');

chai.use(chai_http);

describe('Test Sportevent controller', () => {

  const credentialsUser1 = {
    email: 'test@test.com',
    password: 'test1234',
  };

  let organisorId;

  let authToken = '';

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

    User.create(testUser1).then( (result1) => {
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
            const attendee1Id = testUser1._id.toString();
            const attendee2Id = testUser2._id.toString();
            const attendee3Id = testUser3._id.toString();
            organisorId = attendee3Id;

            neo4j.run(
              "MERGE (attendee1:User {id: {attendee1Param}})" +
              "MERGE (e:Event {id: {eventParam}})" +
              "MERGE (attendee1)-[rel1:IS_ATTENDING]->(e)" +
              "MERGE (attendee2:User {id: {attendee2Param}})-[rel2:IS_ATTENDING]->(e)" +
              "MERGE (attendee3:User {id: {attendee3Param}})<-[rel3:CREATED_BY]-(e)" +
              "MERGE (attendee3)-[rel4:IS_ATTENDING]->(e)" +
              "RETURN attendee1, attendee2, attendee3, e, rel1, rel2, rel3, rel4;",
              {attendee1Param: attendee1Id, attendee2Param: attendee2Id, attendee3Param: attendee3Id,
                eventParam: eventId}
            ).catch((err) => console.log('error: ' + err)).then(
              parser.parse
            ).then(
              (parsed) => {
                parsed.forEach((result) => {
                  console.log('neo4j result: ' + JSON.stringify(result));
                  done();
                })
              })
          })
        })
      });

    });

  });

  it.only('Retrieving a single sportevent should return a sportevent', (done) => {
      chai.request(server)
        .get(`/api/v1/sportevents/1`)
        .set({Authorization: `Bearer ${authToken}`})
        .end((err, res) => {
          console.log("testing organisorId: " + res.body.organisor._id);
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.organisor).to.include({_id: `${organisorId}`});
          expect(res.body.attendees).to.be.an('array').and.have.lengthOf(3);
          // assert(result.records.length === 0);

          done();
      });
  });


});