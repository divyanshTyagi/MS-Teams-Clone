const socket = io('/')

const createMeeting = () => {
    // Ask the server to create a URL
    socket.emit('create-meeting-url')
    socket.on('new-meeting-url-created',(url) =>{
        console.log("here");
        document.getElementById('meetingUrl').value = window.location.host+ "/video-chat?" + url; 
    });
    
}


const joinMeetings = () => {
    meetingUrl = document.getElementById('meetingUrl').value;
    if(meetingUrl.length == 0) {
        alert("GENERATE URL FIRST")
    }
    window.location.href = "http://www.w3schools.com";
}