/**
 * Created by twanv on 5-1-2018.
 */
const chai = require('chai');
const chai_http = require('chai-http');
const server = require('../../index');
const expect = chai.expect;

const User = require('../../models/user');

chai.use(chai_http);

describe('Convert address to latitude and longitude coordinates', () => {
    const addressWithoutSuffix = {
        postal_code: '5017EE',
        number: '270'
    };

    // const addressWithSuffix = {
    //     postal_code: '4815AA',
    //     number: '51',
    //     suffix: 'A'
    // };

    const addressWithSuffix = {
        postal_code: '4814AC',
        number: '63',
        suffix: 'D46'
    };

    const invalidAddress = {
        postal_code: '4815AD',
        number: '34',
        suffix: 'C'
    };

    it('Convert valid address without suffix to lat long', (done) => {
        chai.request(server)

            .get('/api/v1/address')
            .query(addressWithoutSuffix)
            .end((err, res) => {
                console.log(JSON.stringify(err));
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.deep.include({ "coordinates": [
                    5.0914176,
                    51.5557933
                ]});
                done();
            });
    });

    it('Convert valid address with suffix to lat long', (done) => {
        chai.request(server)
            .get('/api/v1/address')
            .query(addressWithSuffix)
            .end((err, res) => {
                console.log(JSON.stringify(err));
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.deep.include({ "coordinates": [
                    4.7733834,
                    51.6007238
                ]});
                done();
            });
    });

    it('Convert invalid address expects an error response', (done) => {
        chai.request(server)
            .get('/api/v1/address')
            .query(invalidAddress)
            .end((err, res) => {
                expect(res).to.have.status(404);
                expect(res.body).to.deep.include({ "error": "No address found"});
                done();
            });
    });


});