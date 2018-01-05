const express = require('express');
const router = express.Router();
const passport = require('../auth/passport');

const user = require('../controllers/user');
const address = require('../controllers/address');

router.post('/register', user.register);
router.post('/login', user.login);

router.post('/address', address.addressMatch);

router.all('*', passport.authenticate('jwt', { session: false }));




module.exports = router;
