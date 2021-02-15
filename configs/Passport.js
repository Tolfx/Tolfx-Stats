const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const log = require("../lib/Loggers");

// Load User model
const User = require('../models/User');

module.exports = function (passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      User.findOne({
        email: email,
      }).then((user) => {

        if (!user) {
          log.warning(`Someone tried to login with email: ${email}`)
          return done(null, false, { message: 'That email is not registered' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            log.verbos(`User ${user.username} logged in.`)
            return done(null, user);
          } else {
            log.warning(`User ${user.usernamed} failed to login with password attempt: ${password}`)
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      });
    })
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });
};