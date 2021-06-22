// for development
require('dotenv').config()
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
var random_name = require('random-name') // used for generating random names
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mongoose = require('mongoose');
// Database
const {User} = require('./models/userModel.js');



// Setting up rendering method of rooms
app.set('view engine', 'ejs')

const initializePassport = require("./passport-config.js");

initializePassport(passport);


// Setting the static folder
app.use(express.static('public'))


// Authentication 




app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized : false
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'))

dbname = "ms-teams";
url = 'mongodb://localhost:27017/' + dbname;
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);


app.get('/', checkAuthenticated, (req, res) => {
  console.log(req);
  res.render('home', { first_name: req.user.first_name,last_name : req.user.last_name ,email : req.user.email})
})



app.get('/login', checkNotAuthenticated,(req, res) => {
  res.render('login')
})

app.post('/login', checkNotAuthenticated,passport.authenticate('users', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/signup', checkNotAuthenticated, (req, res) => {
  res.render('signup')
})

app.post('/signup', checkNotAuthenticated, async (req, res) => {
  console.log(req.body);
  
  user = {
    "first_name": req.body.first_name,
    "last_name": req.body.last_name,
    "email": req.body.email,
    "password": req.body.password1
}
  
  User.findOne({email: req.email}, function(err, userFound){
    if (err)
    {
        error = "Error Occured In The Database";
        console.log(err);
        return res.render("signup", {error});
    }
    else if (userFound)
    {
        error = "Email Already Used, Please Use Another Email";
        return res.render("signup", {error});
    }
    else
    {
        bcrypt.hash(req.body.password1, 12, function(err1, hash){
            if (err1)
            {
                error = "Error Occured In The Database";
                console.log(err1);
                return res.render("signup");
            }
            else
            {
                newUser = new User(user);
                newUser.password = hash;
                newUser.save(function(err2){
                    if (err2)
                    {
                        
                        error = "Error Occured In The Database";
                        console.log(err2);
                        return res.render("signup");
                    }
                    else
                    {
                        success = "Signed In Successful Please Login To Continue";
                        return res.render("login");
                    }
                });
            }
        });
    }
});
})


app.post('/edit_details',(req,res) => {
  // we need to find the hashed password
  console.log(req);
  bcrypt.hash(req.body.password1, 12, function(err1, hash){
    if (err1)
    {
        error = "Error Occured In The Database";
        console.log(err1);
        return res.render("/");
    }
    else
    {
      User.findOneAndUpdate({ email: req.user.email }, { first_name :  req.body.first_name,last_name : req.body.last_name,password : hash}).then((err, result) => {
        req.logOut();
        res.redirect("/");
    });
    }
  });
})

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})


function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}


app.post('/video-chat', (req, res) => {
  // Create a brand new room and redirect the user there
  res.redirect(`/video-chat?roomId=${uuidV4()}`);
})




app.get('/video-chat', checkAuthenticated, (req, res) => {
  console.log(req);
  res.render('room', { roomId: req.query.roomId ,userName : req.user.first_name});
})

// Everytime someone connects to the server
io.on('connection', socket => {
  console.log("connected");
  // When someone joins the room
  socket.on('join-room', (roomId, userId) => {
    console.log("User joined " + roomId)
    console.log("With user id " + userId)
    // Joining the room with the current user
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId);

    // Messagin functionality
    socket.on('message-sent', (res) => {
      console.log(res.userName);
      //send message to the same room
      io.to(roomId).emit('append-message', {'userName' : res.userName, 'message' : res.messageContent});
    }); 


    socket.on('disconnect', () => {
      console.log("Disconnected");
      socket.to(roomId).emit('user-disconnected', userId)
    })

    
    

  }); 

  // find friends functionality
  socket.on('find_friend', (res) => {
    console.log("oeoeoeoe");
    console.log(res.friend_email);
    User.findOne({email :  res.friend_email}).then((user) => {
      
      if(user== null){
         socket.emit('found_friend',{status:false});
      }else socket.emit('found_friend',{status:true});


    });
    
  })

  // Create new meeting url
  socket.on('create-meeting-url',()=>{
    console.log("here");
    socket.emit('new-meeting-url-created',uuidV4());
  })

    
})

server.listen(process.env.PORT||3030)
