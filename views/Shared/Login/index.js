$(document).ready(function () {
    $("#submit").click(function () {
        const email = $('#email').val();
        const password = $('#password').val();

        const data = {
            email,
            password,
        };

        $.ajax({
            type: "POST",
            url: '/api/v1/user/login',
            data,
            success: function (serverResponse) {
                if (serverResponse) {
                    location.href = '/dashboard';
                }
            },
            error: function (errorResponse) {
                if (errorResponse) {
                    alert(`User login error: ${errorResponse.responseText}`);
                }
            }
        });
    });
});