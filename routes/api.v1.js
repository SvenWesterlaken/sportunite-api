const express = require('express');
const router = express.Router();
const passport = require('../auth/passport');

const user = require('../controllers/user');
const address = require('../controllers/address');
const sportevent = require('../controllers/sportevent');

router.post('/register', user.register);
router.post('/login', user.login);
router.get('/address', address.addressMatch);

router.all('*', passport.authenticate('jwt', { session: false }));

router.post('/sportevents', sportevent.add);


//User profile endpoints
router.get('/users/:id?', user.read);
router.put('/users/:id', user.update);
router.delete('/users/:id', user.delete);

module.exports = router;
