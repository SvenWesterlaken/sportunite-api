/**
 * Created by twanv on 21-12-2017.
 */
const NodeGeocoder = require('node-geocoder');

const options = {
    provider: 'google',

    httpAdapter: 'https',
    apiKey: 'AIzaSyBmjTbTi0rGZeXgTZ3njyCHgLwtMoOU1_s',
    formatter: null
};

module.exports = NodeGeocoder(options);