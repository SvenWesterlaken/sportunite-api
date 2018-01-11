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
router.post('/sportevents/:id/attend', sportevent.attend);


//User profile endpoints
router.get('/users', user.read);
router.put('/users', user.update);
router.delete('/users', user.delete);
router.put('/changePassword', user.changePassword);

module.exports = router;
