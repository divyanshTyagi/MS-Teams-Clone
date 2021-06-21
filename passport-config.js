var passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const {User} = require('./models/userModel.js');
const bcrypt = require("bcrypt");

function initialize(passport) {
  console.log("Initialized");

  const authenticateUser = (email, password, done) => {
        console.log(email);
        User.findOne({email: email}, function(err, userFound){
            if (err)
            {
                return done(null, false, {
                    message: "Error Occured In The Database"
                });
            }
            else if (userFound)
            {
                bcrypt.compare(password, userFound.password, function(err1, result){
                    if (err1)
                    {
                        return done(null, false, {
                            message: "Error Occured In The Database"
                        });
                    }
                   
                    if (result) {
                        return done(null, userFound);
                    } else {
                        return done(null, false, { message: "Password is incorrect" });
                    }
                });
            }
            else
            {
                return done(null, false, {
                    message: "No user with that email address."
                });
            }
        });
  };

  

  passport.use(
    'users',
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      authenticateUser
    )
  );


  passport.serializeUser((user, done) => done(null, { email: user.email}));

  passport.deserializeUser((obj, done) => {
    User.findOne({email: obj.email}, function(err, userFound){
        if (err) {
            return done(err);
        } else {

            return done(null, userFound);
        }
    });
        
  });

}

module.exports = initialize;