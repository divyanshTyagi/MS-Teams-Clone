function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

const signup_pt2 = () => {

    // perform email check
    let email = document.querySelector('#signup_email').value;

    if(validateEmail(email) == false) {
        document.querySelector('.alert').innerHTML = "Invalid Email";
        return;
    }

    // perform password check
    let password1 =  document.querySelector('#signup_password').value;
    let password2 =  document.querySelector('#signup_confirm_password').value;
    
    if(password1== "" || password2 == "") {
        document.querySelector('.alert').innerHTML = "Empty password";
        return ;
    }
    console.log(password1, password2);
    if(password1 != password2) {
        // SHOW ERROR
        document.querySelector('.alert').innerHTML = "Passwords do not match";
        return;
    }


    document.querySelector('.alert').innerHTML = "";

    document.querySelector('.signup_email').style.display = 'none';
    document.querySelector('.signup_names').style.display = 'block';

};

const signup_pt1 = () => {
    document.querySelector('.signup_names').style.display = 'none';
    document.querySelector('.signup_email').style.display = 'block';
    
};


const submitForm = () => {
    document.querySelector('form').submit;
}

$(document).ready(function() {
    $(window).keydown(function(event){
      if(event.keyCode == 13) {
        event.preventDefault();
        return false;
      }
    });
  });