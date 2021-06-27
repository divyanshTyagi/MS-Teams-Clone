const socket = io('/');

const submitEditDetailsForm = () => {
    const password1 = document.querySelector('#password1').value;
    const password2 = document.querySelector('#password2').value; 
    if( password1.length != 0 && (password1 != password2)){
        console.log(password1,password2);
        document.querySelector('#edit_details_form_error').innerHTML = "Passwords are empty or dont match !"
        return;
    }
    document.querySelector('#edit_details_form_error').innerHTML = ""
    document.querySelector('#edit_details_form').submit();
}


const addFriend = () => {
    const friend_email = document.querySelector('#friend_email_input').value;
    socket.emit('find_friend', {friend_email : friend_email});
    socket.on('found_friend',(res) => {
        if(res.status == true){
            console.log("friend  found");
        }else{
            console.log("no friend found");
        }
    })

}


// For profile image upadtions
$("#profileImage").click(function(e) {
    $("#imageUpload").click();
});

function previewProfileImage( uploader ) {   
    //ensure a file was selected 
    if (uploader.files && uploader.files[0]) {
        var imageFile = uploader.files[0];
        var reader = new FileReader();    
        reader.onload = function (e) {
            //set the image data as source
            $('#profileImage').attr('src', e.target.result);
        }    
        reader.readAsDataURL( imageFile );
    }
}

$("#imageUpload").change(function(){
    previewProfileImage( this );
});