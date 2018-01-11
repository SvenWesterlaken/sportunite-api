const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const auth = require('../auth/token');
const neo4j = require('../db/neo4j');
const objectId = require('mongodb').ObjectID;

const User = require('../models/user');
const passport = require('../auth/passport');

module.exports = {

  register(req, res, next) {

    let body = req.body;

    if (!_.isEmpty(body)) {
      User.findOne({email: body.email}).catch(err => next(err)).then(user => {

        if (!user) {

          bcrypt.hash(body.password, 8).catch(err => next(err)).then(hash => {
            let user = body;
            user.password = hash;
            return new User(user);
          }).then(user => {
            user.save().catch(err => next(err)).then(user => {
              neo4j.run('CREATE (u:User {id: {id}}) RETURN u', {id: user._id.toString()}).catch(err => next(err)).then(result => {
                res.status(201).json({msg: "User successfully created"});
                neo4j.close();
              })
            });
          })
        } else {
          res.status(409).json({error: "User already exists"});
        }

      });

    } else {
      res.status(400).json({error: "Invalid Registration Credentials"});
    }
  },


  login(req, res, next) {
    let email = req.body.email || '';
    let password = req.body.password || '';

    if (email != '' || password != '') {

      User.findOne({email: email}).catch((err) => next(err)).then((user) => {

        if (user) {
          bcrypt.compare(password, user.password).catch((err) => next(err)).then((valid) => {

            if (valid) {
              var token = auth.encodeToken(user).catch((err) => next(err)).then((token) => {
                res.status(200).json({token: token});
              });
            } else {
              res.status(401).json({error: "Invalid password"});
            }

          });

        } else {
          res.status(404).json({error: "User not found"});
        }

      });

    } else {
      res.status(400).json({error: "Invalid Login Credentials"});
    }
  },

  //Reading a user
  read(req, res, next) {
    const userId = passport.userId;

    if (userId !== '') {
      if (objectId.isValid(userId)) {
        User.findById(userId).then((user) => {
          if (user) {
            res.status(200).send(user)
          } else {
            res.status(204).json({error: "User not found"});
          }
        }).catch((err) => next(err));
      } else {
        res.status(422).json({error: "Invalid user id"});
      }
    } else {
      User.find({}).then((users) => res.status(200).send(users)).catch((err) => next(err));
    }
  },

  //Updating a user
  update(req, res, next) {
    const userId = passport.userId;
    const user = req.body;

    if (objectId.isValid(userId) && (user._id === undefined || user._id === userId)) {
      User.findByIdAndUpdate(userId, user)
        .then((userDb) => {
          if (userDb) {
            User.findById(userId).then(user => res.status(202).send(user)).catch(next);
          } else {
            res.status(204).json({error: "User not found"});
          }
        })
    } else {
      res.status(422).json({error: "Invalid user id"});
    }
  },

  //Deleting a user
  delete(req, res, next) {
    const userId = passport.userId;

    if (objectId.isValid(userId)) {

      neo4j
        .run(
          "MATCH (u:User{id: {idParam}})" +
          "OPTIONAL MATCH (u)-[rel]-(friend:User)" +
          "DELETE rel, u"
        )
        .then(() => {
          User.findByIdAndRemove(userId)
            .then((userDb) => {
              if (userDb) {
                res.status(200).send(userDb);
              } else {
                res.status(204).json({error: "User not found"});
              }
            }).catch((err) => next(err));
        })
        .catch((err) => next(err));

    } else {
      res.status(422).json({error: "Invalid user id"});
    }
  },

  //Changing password
  changePassword(req, res, next) {
    const userId = passport.userId;
    const oldPassword = req.body.oldPassword || '';
    const newPassword = req.body.newPassword || '';

    if (oldPassword != '' || newPassword != '') {
      if (objectId.isValid(userId)) {
        User.findById(userId)
          .then((user) => {
            if (user) {
              bcrypt.compare(oldPassword, user.password).catch((err) => next(err)).then((valid) => {
                  if (valid) {
                    bcrypt.hash(newPassword, 8).catch(err => next(err)).then(hash => {
                      user.password = hash;
                      return new User(user);
                    }).then((user) => {
                      user.save().catch(err => next(err)).then(user => {
                        let token = auth.encodeToken(user).catch((err) => next(err)).then((token) => {
                          res.status(201).json({token: token, oldPass: oldPassword, newPass: newPassword, newHash: user.password});
                        });
                      });
                    });
                  } else {
                    res.status(401).json({error: "Invalid password"});
                  }
                }
              );
            } else {
              res.status(204).json({error: "User not found"});
            }
          });
      } else {
        res.status(422).json({error: "Invalid user id"});
      }
    } else {
      res.status(400).json({error: "Invalid password information"});
    }
  }
};
