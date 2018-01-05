/**
 * Created by twanv on 22-12-2017.
 */
const assert = require('assert');
const request = require('supertest');
const app = require('../../index');

describe('Geocoder controller test', () => {

    it.only('get to /api/v1/geocode test', (done) => {
        request(app)
            .get('/api/v1/geocode')
            .query({address: 'Sydney Opera House'})
            .then((result) => {
                console.log('coordinates: ' + JSON.stringify(result.coordinates));
                assert(result.coordinates === [23232, 23323]);
            });
    })
});