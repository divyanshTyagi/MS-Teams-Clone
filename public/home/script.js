const socket = io('/');

const submitEditDetailsForm = () => {
    const first_name = document.querySelector('#first_name').value;
    const last_name = document.querySelector('#last_name').value;
    const password1 = document.querySelector('#password1').value;
    const password2 = document.querySelector('#password2').value; 
    if(first_name.length == 0 || last_name.length == 0 || password1.length == 0 || (password1 != password2)){
        document.querySelector('#edit_details_form_error').innerHTML = "Enter Details Properly"
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