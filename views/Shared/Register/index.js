$(document).ready(function () {
    // Handle Registration Button Click
    $("#register").click(function () {
        const firstName = $('#firstName').val();
        const lastName = $('#lastName').val();
        const email = $('#email').val();
        const password = $('#password').val();

        const data = {
            firstName,
            lastName,
            email,
            password,
        };

        $.ajax({
            type: "POST",
            url: '/api/v1/user',
            data,
            success: function (serverResponse) {
                if (serverResponse) {
                    alert('Successfully Registered User');
                    location.href = '/';
                }
            },
            error: function (errorResponse) {
                if (errorResponse) {
                    alert(`Error Register User: ${errorResponse.responseText}`);
                }
            }
        });
    });
});