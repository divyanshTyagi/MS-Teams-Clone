const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myVideo = document.createElement('video')
let myVideoStream;  // for mute unmute and all those functionalities
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3031'
})


VIDEO_BOOL =  (VIDEO_BOOL === "true");
AUDIO_BOOL = (AUDIO_BOOL === "true");

myVideo.muted = true

const peers = {}
const peerUsernameMap = {}
// When the peer server returns an ID, or the client connects to the peer server
myPeer.on('open', id => { 
  console.log("Conneection open, sending " , id , USER_NAME)
  console.log("User Connected with peer network", id)
  socket.emit('join-room', ROOM_ID, id,USER_NAME)
  addParticipants(USER_NAME); // add ourselved to the participants
  peerUsernameMap[id] = USER_NAME;
})

navigator.mediaDevices.getUserMedia({ // This is a promise
  video: true,
  audio: true
}).then(stream => { // our stream  - (video + audio)

  

  addVideoStream(myVideo, stream)


  myVideoStream = stream

  if(VIDEO_BOOL == false){
    playStop()
  }
  if(AUDIO_BOOL == false){
    muteUnmute()
  }


  socket.on('user-connected', (userId,CONNECTED_USER_NAME) => {
    //  The client will connect to the new user that has joined
    // We will send to the  userID our video stream, with whom we wish to connect
    connectToNewUser(userId, stream);
    addParticipants(CONNECTED_USER_NAME);
    peerUsernameMap[userId] = CONNECTED_USER_NAME
    socket.emit("add-calling-user",{from : myPeer.id,to : userId,userName : USER_NAME}); 
    
  })

  myPeer.on('call', call => { // listen to when someone tries to call us
    console.log("Call recieved");
    console.log(call);
    call.answer(stream) // answer the call, give the calling user our stream
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {   // recieve the stream from the calling user
      addVideoStream(video, userVideoStream)
      peers[call.peer] = call;
      // Add the user to tha participants listen
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
    console.log("NEED TO REMOVE ", peerUsernameMap[userId]);
    removeParticipants(peerUsernameMap[userId]);
    delete  peerUsernameMap[userId];
   
   
    
  }
})


socket.on('add-calling-user',(res)=>{
  if(res.to == myPeer.id ){
    addParticipants(res.userName);
    peerUsernameMap[res.from] = res.userName
    
  }
})

function resizeVideoStreams(){

  $('#video-grid').children('video').each(function () {
    this.style.display = 'none';
  });  

  // for resizing after closing
  videoGridHeight =  $("#video-grid").height();
  videoGridWidth =  $("#video-grid").width(); 

  //resizing the window
  let totalVideoElements =0 ;
  // Iterating through all the children in the div
  $('#video-grid').children('video').each(function () {
    totalVideoElements += 1;
    // alert(this.value); // "this" is the current element in the loop
  });  

  let videoDimensions = [videoGridHeight,videoGridWidth/(totalVideoElements)];

  // Resizing all the video elements to fit the requiremenets
  $('#video-grid').children('video').each(function () {
    totalVideoElements += 1;
    this.setAttribute("height",`${videoDimensions[0]}`);
    this.setAttribute("width",`${videoDimensions[1]}`);
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


 
  videoGrid.append(video)
  
  resizeVideoStreams();
  


}

window.onresize = resizeVideoStreams;

//  PLAY STOP VIDEO

const playStop = () => {
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
  socket.emit('user-disconnected');
}


// right side bar 
const toggleOffAll = ()=> {
  const children = document.querySelector('.right_side_bar').children;
  for (var i = 0; i < children.length; i++) {
      children[i].style.display = 'none';
    }
    document.querySelector('.right_side_bar').style.display = 'none';
}


// TOGGLE Chat
const toggleChat = () => {

  let chatBox = document.getElementsByClassName('chatbox')[0]
  if(chatBox.style.display == 'none'){
    toggleOffAll();
    document.querySelector('.right_side_bar').style.display = 'flex';
    chatBox.style.display = 'flex';
  }else {
    toggleOffAll();
    chatBox.style.display = 'none';
  }
  resizeVideoStreams();
}

// SEND CHAT MESSAGE
function sendMessage(event){
  if(event.keyCode == 13){
    
    let messageContent = document.querySelector('#chatbox-input-text').value.trim();
    if(messageContent.length == 0) {
        return;
    }
    document.querySelector('#chatbox-input-text').value = '';
    socket.emit('message-sent',{'userName' : USER_NAME,'messageContent' : messageContent});
  }
  
}

// APPEND CHAT MESSAGE
socket.on('append-message',(res) => {
  let messageInstance = document.createElement('li')
  let userNamePart = document.createElement('p');
  userNamePart.className = 'userNamePartChat'
  userNamePart.innerHTML = res.userName;
  let userTextPart = document.createElement('p');
  userTextPart.className = 'userTextPartChat';
  userTextPart.innerHTML = ': ' + res.message;
  messageInstance.append(userNamePart);
  messageInstance.append(userTextPart);
  document.getElementById('messages').append(messageInstance);
  scrollToBottom()
});

const scrollToBottom = () => {
  var d = $('.chatbox-text');
  d.scrollTop(d.prop("scrollHeight"));
}


// Participants

// TOGGLE Participants

// getting the usernames of the Participants

const toggleParticipants = () => {
  
  
  let participant = document.getElementsByClassName('participant')[0]
  if(participant.style.display == 'none'){
    toggleOffAll();
    document.querySelector('.right_side_bar').style.display = 'flex';
    participant.style.display = 'flex';
  }else {
    toggleOffAll();
    participant.style.display = 'none';
  }
  resizeVideoStreams();
}
// add to list
const addParticipants = (id) => {
  id = id.trim();
  participant = document.createElement('li')
  participant.innerHTML = `<p>${id}</p>`;
  console.log(id);
  document.getElementById('participant-text').append(participant);
  $("#success-alert").hide();
    document.getElementById("success-alert").innerHTML = `${id} Joined`;
      $("#success-alert").fadeTo(2000, 500).slideUp(500, function() {
        $("#success-alert").slideUp(500);
    });
}

// remove participant
const removeParticipants = (id) => {
  id = id.trim();
  const allParticipant = document.getElementById('participant-text').children;
  for(var i =0 ; i < allParticipant.length ; i++){
    console.log("for " , i , " ", allParticipant[i].innerHTML )
    if(allParticipant[i].innerHTML == `<p>${id}</p>`) {
      allParticipant[i].remove();
      break;
    }
  }
  
  $("#success-alert").hide();
    document.getElementById("success-alert").innerHTML = `${id} left`;
      $("#success-alert").fadeTo(2000, 500).slideUp(500, function() {
        $("#success-alert").slideUp(500);
    });
}


// HAND RAISE

const raiseHand = () =>{
  socket.emit('hand-raise',myPeer.id);
  socket.on("hand-raise",userId=>{
    console.log("here");
    $("#success-alert").hide();
      document.getElementById("success-alert").innerHTML = `${peerUsernameMap[userId]} raised hand`;
        $("#success-alert").fadeTo(2000, 500).slideUp(500, function() {
          $("#success-alert").slideUp(500);
      });
  })
}



