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
        
        // for resizing after closing
        videoGridHeight =  $("#video-grid").height();
        videoGridWidth =  $("#video-grid").width(); 
      
        video.remove();
        resizeVideoStreams(videoGridHeight, videoGridWidth);


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

function resizeVideoStreams(){

  $('#video-grid').children('video').each(function () {
    this.style.display = 'none';
  });  

  // for resizing after closing
  videoGridHeight =  $("#video-grid").height();
  videoGridWidth =  $("#video-grid").width(); 

  console.log(videoGridWidth,videoGridHeight);
  //resizing the window
  let totalVideoElements =0 ;
  // Iterating through all the children in the div
  $('#video-grid').children('video').each(function () {
    totalVideoElements += 1;
    // alert(this.value); // "this" is the current element in the loop
  });  
  console.log(totalVideoElements);

  let videoDimensions = [videoGridHeight,videoGridWidth/(totalVideoElements)];

  // Resizing all the video elements to fit the requiremenets
  $('#video-grid').children('video').each(function () {
    totalVideoElements += 1;
    this.setAttribute("height",`${videoDimensions[0]}`);
    this.setAttribute("width",`${videoDimensions[1]}`);
    // alert(this.value); // "this" is the current element in the loop
  });  

  $('#video-grid').children('video').each(function () {
    this.style.display = 'flex';
  });  



}

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
    // for resizing after closing
    videoGridHeight =  $("#video-grid").height();
    videoGridWidth =  $("#video-grid").width(); 
  
    video.remove();
    resizeVideoStreams();
  })
  
  
}


// Add's the video stream to the 
function addVideoStream(video, stream) {
  video.srcObject = stream 
  video.addEventListener('loadedmetadata', () => { // wait until the metadata for the video and audio has been loaded
    video.play()
  })
  // add the video to the grid of videos that we have

  // these 2 variables will help us in resizing the videos
  videoGridHeight =  $("#video-grid").height();
  videoGridWidth =  $("#video-grid").width(); 

  console.log(videoGridWidth);
  console.log(videoGridWidth);
 
  videoGrid.append(video)
  
  resizeVideoStreams();
  // reference commands to find heights

  // $("#myDiv").height();
  // $("#myDiv").innerHeight();
  // $("#myDiv").outerHeight();

  


}

window.onresize = resizeVideoStreams;

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


// TOGGLE Chat
const toggleChat = () => {
  let chatBox = document.getElementsByClassName('chatbox')[0]
  if(chatBox.style.display == 'none'){
    chatBox.style.display = 'flex';
  }else {
    chatBox.style.display = 'none';
  }
  resizeVideoStreams();
}

// SEND CHAT MESSAGE
function sendMessage(event){
  console.log(event.keycode);
  if(event.keyCode == 13){
    
    let messageContent = document.querySelector('#chatbox-input-text').value;
    document.querySelector('#chatbox-input-text').value = '';
    socket.emit('message-sent',messageContent);
  }
  
}

// APPEND CHAT MESSAGE
socket.on('append-message',message => {
  let messageInstance = document.createElement('li')
  messageInstance.innerHTML = message;
  document.getElementById('messages').append(messageInstance);
  // scrollToBottom()
});

// const scrollToBottom = () => {
//   var d = $('.chatbox-text');
//   d.scrollTop(d.prop("scrollHeight"));
// }
