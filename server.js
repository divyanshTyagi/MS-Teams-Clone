const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
var random_name = require('random-name') // used for generating random names


// Setting up rendering method of rooms
app.set('view engine', 'ejs')
// Setting the static folder
app.use(express.static('public'))


app.get('/', (req, res) => {
  // Create a brand new room and redirect the user there
  res.redirect(`/video-chat?roomId=${uuidV4()}`);
})

app.get('/video-chat', (req, res) => {
  console.log(req.query);
  res.render('room', { roomId: req.query.roomId ,userName : random_name.first()});
})

// Everytime someone connects to the server
io.on('connection', socket => {
  
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


    
})

server.listen(process.env.PORT||3030)
