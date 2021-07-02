const videoGrid = document.getElementById('video-grid')
const myVideo = document.createElement('video')
let audio_bool = true;
let video_bool = true;
let myVideoStream;
navigator.mediaDevices.getUserMedia({ // This is a promise
    video: true,
    audio: true
  }).then(stream => { // our stream  - (video + audio)
    addVideoStream(myVideo, stream)
    myVideoStream = stream
   
})

function addVideoStream(video, stream) {
    video.srcObject = stream 
    video.addEventListener('loadedmetadata', () => { // wait until the metadata for the video and audio has been loaded
        video.play()
    })
    videoGrid.append(video)
    
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
    audio_bool = !audio_bool;
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
    video_bool = !video_bool;
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
  

  const submitForm = () => {
    document.querySelector('form').submit
  }