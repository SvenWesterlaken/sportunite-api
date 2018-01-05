/**
 * Created by twanv on 22-12-2017.
 */
const geocoder = require('../config/geocoder');

module.exports = {

    geocode(req, res, next) {
        let address = req.query.address || '';

        geocoder.geocode(address)
            .then((res) => res.status(200).json({coordinates: [res.latitude, res.longitude]}))
            .catch((err) => next(err));
    }
};