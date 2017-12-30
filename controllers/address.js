const config = require('../config/env');
const axios = require('axios');
const _ = require('lodash');

module.exports = {

  addressMatch(req, res, next) {
    const postalCode = req.body.postal_code || '';
    const number = req.body.number || '';
    const suffix = req.body.suffix || '';

    if(postalCode != '' || number != '') {

      axios.get("https://api.postcodeapi.nu/v2/addresses/", {
        params: {
          postcode: postalCode,
          number: number
        },
        headers: {
          "X-Api-Key": config.postcodeApiKey
        }
      }).catch(err => next(err)).then(response => {
        let addresses = response.data._embedded.addresses;
        let address;

        if(addresses.length < 1) {
          res.status(404).send({error: "No address found"});
        } else {

          if(suffix != '') {
            address = _.filter(addresses, ['letter', suffix])[0];
          } else if (addresses.length > 1){
            address = _.filter(addresses, ['letter', null])[0];
          } else {
            address = addresses[0];
          }

          if(!address) {
            res.status(404).send({error: "No address with this suffix"});
          } else {
            
            const returnObject = {
              street: address.street,
              number: address.number,
              suffix: address.letter,
              postal_code: address.postcode,
              city: address.city.label,
              state: address.province.label,
              coordinates: address.geo.center.wgs84.coordinates
            }

            res.send(returnObject);
          }
        }
      });
    } else {
      res.status(400).json({error: "Invalid body"});
    }

  }

}
