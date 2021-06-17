const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myVideo = document.createElement('video')
let myVideoStream;  // for mute unmute and all those functionalities
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3031'
})


myVideo.muted = true

const peers = {}

// When the peer server returns an ID, or the client connects to the peer server
myPeer.on('open', id => { 
  console.log("User Connected with peer network", id)
  socket.emit('join-room', ROOM_ID, id)
})

navigator.mediaDevices.getUserMedia({ // This is a promise
  video: true,
  audio: true
}).then(stream => { // our stream  - (video + audio)
  addVideoStream(myVideo, stream)
  myVideoStream = stream
  socket.on('user-connected', userId => {
    //  The client will connect to the new user that has joined
    // We will send to the  userID our video stream, with whom we wish to connect
    // console.log("user connected "  + userId)  
    // setTimeout(function(){
    //   connectToNewUser(userId, stream)}
    //   , 100);
    // one issue is that call does not get accepted if the reciving tab is not active
    connectToNewUser(userId, stream);
    console.log("user connected "  + userId)  
  })

  myPeer.on('call', call => { // listen to when someone tries to call us
    console.log("Call recieved");
    console.log(call);
    call.answer(stream) // answer the call, give the calling user our stream
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {   // recieve the stream from the calling user
      addVideoStream(video, userVideoStream)
      peers[call.peer] = call;
    })

    call.on('close', () => { // when someone leaves the video call
        video.remove();
    })

  })

  
})

socket.on('user-disconnected', userId => { // whenever a user disconnect forcefully 
  console.log("User " + userId + " left");
  if (peers[userId]){
    console.log("Removing user  " + userId );
    peers[userId].close() // this will either call the myPeer.on('call' ) -> call.on('close), or connectToNewUser -> call.on('close');
    delete peers[userId]
    console.log( peers);
  }
})



function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream) // call that user ( userID generated by the peer server), send him our stream as well
  console.log("Called user " + userId);
  const video = document.createElement('video')
  call.on('stream', userVideoStream => { // when we recieve the stream from the calling user
    console.log("User has answered the call with his video stream");
    addVideoStream(video, userVideoStream)
    peers[userId] = call 
  })
  call.on('close', () => { // when someone leaves the video call
    console.log("HERE");
    video.remove()
  })
  
  
}


// Add's the video stream to the 
function addVideoStream(video, stream) {
  video.srcObject = stream 
  video.addEventListener('loadedmetadata', () => { // wait until the metadata for the video and audio has been loaded
    video.play()
  })
  // add the video to the grid of videos that we have
  videoGrid.append(video)
}



//  PLAY STOP VIDEO

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}


// MUTE UNMUTE

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}



const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}


// LEAVE CALL
const leaveCall = () => {
  console.log('here');
  socket.emit('user-disconnected');
}