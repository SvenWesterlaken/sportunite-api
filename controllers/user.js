const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const auth = require('../auth/token');
const neo4j = require('../db/neo4j');

const User = require('../models/user');

module.exports = {

  register(req, res, next) {

    let body = req.body;

    User.findOne({ email: body.email }).catch(err => next(err)).then(user => {

      if(!user) {

        bcrypt.hash(body.password, 8).catch(err => next(err)).then(hash => {
          let user = body;
          user.password = hash;
          return new User(user);
        }).then(user => {
          user.save().catch(err => next(err)).then(user => {

            neo4j.run('CREATE (u:User {id: {id}}) RETURN u', { id: user._id.toString() }).catch(err => next(err)).then(result => {
              res.status(201).json({ msg: "User successfully created"});
              neo4j.close();
            })
          });
        });
      } else {
        res.status(409).json({ error: "User already exists"});
      }

    });

  },

  login(req, res, next) {
    let email = req.body.email || '';
    let password = req.body.password || '';

    if(email != '' || password != '') {

      User.findOne({ email: email }).catch((err) => next(err)).then((user) => {

        if(user) {
          bcrypt.compare(password, user.password).catch((err) => next(err)).then((valid) => {

            if(valid) {
              var token = auth.encodeToken(user).catch((err) => next(err)).then((token) => {
                res.status(200).json({ token: token });
              });
            } else {
                res.status(401).json({ error: "Invalid password"});
            }

          });

        } else {
          res.status(404).json({error: "User not found"});
        }

      });

    } else {
      res.status(400).json({error: "Invalid Login Credentials"});
    } 
  }

}
