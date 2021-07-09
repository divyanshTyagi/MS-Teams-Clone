
require('dotenv').config()
const path = require('path')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mongoose = require('mongoose');
var fs = require('fs');


// Database
const {User} = require('./models/userModel.js');

dbname = "ms-teams";
url = 'mongodb://localhost:27017/' + dbname;
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

// Setting up rendering method of rooms
app.set('view engine', 'ejs')


// initializing passport for authentication
const initializePassport = require("./passport-config.js");
initializePassport(passport);


// Setting the static folder
app.use(express.static('public'))


// setting up multer for image storage
var multer = require('multer');
 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname,'/public/', '/uploads/'))
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname + '-' + Date.now() + '.png')
    }
});
 
var upload = multer({ 
  storage: storage
});

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



app.get('/', checkAuthenticated, (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
  console.log('here');
  console.log(req.user)
  res.render('home', { first_name: req.user.first_name,last_name : req.user.last_name ,email : req.user.email,image : req.user.img,roomIdGen:function(){ return uuidV4()}})
})


// Login
app.get('/login', checkNotAuthenticated,(req, res) => {
  res.render('login')
})

app.post('/login', checkNotAuthenticated,passport.authenticate('users', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

// Signup

app.get('/signup', checkNotAuthenticated, (req, res) => {
  res.render('signup')
})

app.post('/signup', checkNotAuthenticated, async (req, res) => {
  
  user = {
    "first_name": req.body.first_name,
    "last_name": req.body.last_name,
    "email": req.body.email,
    "password": req.body.password1, 
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
                user["img"] = "default_profile.png";
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


// Routes for profile page

/* Logout */
app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

/* Edit details  */
app.post('/edit_details',upload.single('profile_photo'),(req,res) => {

  // we need to find the hashed password
  bcrypt.hash(req.body.password1, 12, function(err1, hash){
    if (err1)
    {
        error = "Error Occured In The Database";
        console.log(err1);
        return res.render("/");
    }
    else
    {
      new_first_name = req.user.first_name;
      if(req.body.first_name.length != 0) new_first_name = req.body.first_name;
      new_last_name = req.user.last_name;
      if(req.body.last_name.length != 0) new_last_name = req.body.last_name;
      if(req.body.password1.length ==0 ) hash = req.user.password;  
      new_img_path = req.user.img
      if(req.file!=null) new_img_path = req.file.filename;
      console.log(req.file);
      User.findOneAndUpdate({ email: req.user.email }, { first_name :  new_first_name,last_name : new_last_name,password : hash,img : new_img_path}).then((err, result) => {
        req.logOut();
        res.redirect("/");
      });
    }
  });
})




// Routes for Room joining

app.get('/video-chat', checkAuthenticated,(req, res) => {
  console.log(req.query.roomId);
  res.render('join-room',{roomId:req.query.roomId})
})


app.post('/video-chat',checkAuthenticated,(req,res)=>{
  res.render('room', { roomId: req.query.roomId ,userName : req.user.first_name,audio_bool:req.query.audio_bool, video_bool:req.query.video_bool});
})

app.get('*', function(req, res) {
  res.render("bad_route")
});


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

// Socket Functionality

// Everytime someone connects to the server
io.on('connection', socket => {
  console.log("connected bbz");
  // When someone joins the room
  socket.on('join-room', (roomId, userId,userName) => {
    console.log("User joined " + roomId)
    console.log("With user id " + userId)
    // Joining the room with the current user
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId,userName );

    // Messaging functionality
    socket.on('message-sent', (res) => {
      console.log(res.userName);
      //send message to the same room
      io.to(roomId).emit('append-message', {'userName' : res.userName, 'message' : res.messageContent});
    }); 

    socket.on('disconnect', () => {
      console.log("Disconnected");
      socket.to(roomId).emit('user-disconnected', userId)
    })

    socket.on('add-calling-user',(res)=>{
      console.log("heeloo");
      io.emit('add-calling-user', res);
    })    
    

    socket.on('hand-raise',(userId) => {
      io.to(roomId).emit('hand-raise', userId);
      
    })


  }); 

  // Create new meeting url
  socket.on('create-meeting-url',()=>{
    console.log("here");
    socket.emit('new-meeting-url-created',uuidV4());
  })


})

server.listen(process.env.PORT||3030)
