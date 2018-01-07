const config = require('../config/env');
const axios = require('axios');
const _ = require('lodash');

function findAddress(postalcode, number, suffix, res, next, url) {

  const api_config = { headers: { "X-Api-Key": config.postcodeApiKey } };
  api_config.params = url ? null : { postcode: postalcode, number: number };

  const api_url = url || "https://api.postcodeapi.nu/v2/addresses/";

  axios.get(api_url, api_config).catch(err => next(err)).then(response => {
    let addresses = response.data._embedded.addresses;
    let nextpage = response.data._links.next || '';
    let address;

    if(addresses.length < 1) {
      res.status(404).send({error: "No address found"});
    } else {

      if(suffix != '') {
        address = _.filter(addresses, ['addition', suffix.toUpperCase()])[0];
      } else if (addresses.length > 1){
        address = _.filter(addresses, ['addition', null])[0];
      } else {
        address = addresses[0];
      }

      if(!address && nextpage != '') {
        findAddress(postalcode, number, suffix, res, next, nextpage.href);
      } else if (!address) {
        res.status(404).send({error: "No address with this suffix"});
      } else {

        const returnObject = {
          street: address.street,
          number: address.number,
          suffix: address.addition,
          postal_code: address.postcode,
          city: address.city.label,
          state: address.province.label,
          coordinates: address.geo.center.wgs84.coordinates
        }

        res.status(200).send(returnObject);
      }
    }
  });
}


module.exports = {
  addressMatch(req, res, next) {

    const postalCode = req.query.postal_code || '';
    const number = req.query.number || '';
    const suffix = req.query.suffix || '';

    if(postalCode != '' || number != '') {
      findAddress(postalCode, number, suffix, res, next);
    } else {
      res.status(400).json({error: "Invalid body"});
    }
  }
}
