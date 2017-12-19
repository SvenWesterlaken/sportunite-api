const express = require('express');
const router = express.Router();
const passport = require('../auth/passport');

const user = require('../controllers/user');

router.post('/register', user.register);
router.post('/login', user.login);

router.all('*', passport.authenticate('jwt', { session: false }));

//Rest van de api endpoints met authentication


module.exports = router;
