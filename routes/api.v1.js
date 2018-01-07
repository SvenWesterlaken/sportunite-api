const express = require('express');
const router = express.Router();
const passport = require('../auth/passport');

const user = require('../controllers/user');

router.post('/register', user.register);
router.post('/login', user.login);

router.all('*', passport.authenticate('jwt', {session: false}));

//User profile endpoints
router.get('/users/:id?', user.read);
router.put('/users/:id', user.update);
router.delete('/users/:id', user.delete);

module.exports = router;
