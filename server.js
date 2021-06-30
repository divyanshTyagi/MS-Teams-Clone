// for development
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
const {RoomDetails} = require('./models/roomDetails.js');
const {PeerId} = require('./models/peerId.js');
// Setting up rendering method of rooms
app.set('view engine', 'ejs')

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

dbname = "ms-teams";
url = 'mongodb://localhost:27017/' + dbname;
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);
  

app.get('/', checkAuthenticated, (req, res) => {
  res.render('home', { first_name: req.user.first_name,last_name : req.user.last_name ,email : req.user.email,image : req.user.img})
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


app.get('/join-room', (req, res) => {
  res.render('join-room')
})

app.post('/video-chat', (req, res) => {
  // Create a brand new room and redirect the user there
  res.redirect(`/video-chat?roomId=${uuidV4()}`);
})




app.get('/video-chat', checkAuthenticated, (req, res) => {
  // add the user to the list of users
  // RoomDetails.findOne({roomId: req.query.roomId}, function(err, room){
  //   if(err){
  //     console.log(err);
  //     return res.render('home',{first_name : req.user.first_name,last_name : req.user.last_name, email : req.user.email});
  //   }else{
  //     if(room == null){
  //         // we will find that user
  //         User.findOne({email : req.user.email}, function(err, user){
  //             console.log(user);
  //             currRoomDetails = {
  //               "roomId" : req.query.roomId,
  //               "participants" : [user]
  //             }
  //             newRoomDetails = new RoomDetails(currRoomDetails);
  //             console.log(newRoomDetails);
  //             newRoomDetails.save(function(err2){
  //                 if(err2){
  //                   console.log("Error at saving room details");
  //                   console.log(err2);
  //                   return res.render('home',{first_name : req.user.first_name,last_name : req.user.last_name, email : req.user.email});
  //                 }
  //                 return res.render('room', { roomId: req.query.roomId ,userName : req.user.first_name});
  //             })
  //         })
  //       }else{
  //         User.findOne({email : req.user.email}, function(err, user){
  //           console.log(user);
  //           RoomDetails.findOneAndUpdate({roomId: req.query.roomId},{ $addToSet: { participants: [user] } },function(err,roomDetails){
  //             if(err){
  //               console.log("Error on adding new user to already existing room")
  //               return res.render('home',{first_name : req.user.first_name,last_name : req.user.last_name, email : req.user.email});
  //             }else{
  //               return res.render('room', { roomId: req.query.roomId ,userName : req.user.first_name});
  //             }
  //           })
  //         })
  //       }
  //   }
  // })

  res.render('room', { roomId: req.query.roomId ,userName : req.user.first_name});


})

// Everytime someone connects to the server
io.on('connection', socket => {
  console.log("connected");
  // When someone joins the room
  socket.on('join-room', (roomId, userId,userName) => {
    console.log("User joined " + roomId)
    console.log("With user id " + userId)
    // Joining the room with the current user
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId,userName );

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

    socket.on('add-calling-user',(res)=>{
      console.log("heeloo");
      io.emit('add-calling-user', res);
    })    
    

    socket.on('hand-raise',(userId) => {
      io.to(roomId).emit('hand-raise', userId);
      
    })


  }); 



  // find friends functionality
  socket.on('find_friend', (res) => {
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

  // USERNAMES 

  socket.on('store_peer_id',(id,userName)=>{
    console.log("STORING")
    console.log(id, userName);
    peerInfo = {
      "userName" : userName,
      "peerId" : id
    }
    peerInfoObj = new PeerId(peerInfo);
    peerInfoObj.save(function(err2){
      if(err2){
        console.log(err2);
      }
    })
  })

  socket.on('get-user-name',(id) => {
    console.log("get user name called for ", id );
    PeerId.findOne({peerId : id}).then(userDetails=>{
      console.log(userDetails);
      socket.emit('take-user-name',userDetails.userName);

    })

  })

})

server.listen(process.env.PORT||3030)
