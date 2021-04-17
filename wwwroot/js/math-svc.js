(function (window, document, $, undefined) {
    let $input = $("#addition-input"),
        $alertDanger = $("#alert-danger"),
        $alertSuccess = $("#alert-success"),
        mathServiceUrl = window.mathServiceUrl;

    if (!mathServiceUrl) {
        console.log("This app can't execute without a math service URL - was it not bootstrapped to the page correctly?");
        return;
    }

    function hideAlerts() {
        $alertDanger.hide();
        $alertSuccess.hide();
    }

    function submitInput(input) {
        hideAlerts();

        if (!input) {
            $alertDanger.text("Please enter some comma-delimited numbers to sum them up").show();
            $input.focus();
            return false;
        }

        $.ajax({
            url: mathServiceUrl + "/api/v1/math/add",
            crossDomain: true,
            method: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            headers: {
                "Access-Control-Allow-Origin": '*',
                "Api-key": "foo"
            },
            data: "[" + input + "]",
            processData: false,
            success: function (data) {
                $alertSuccess.text("Sum of " + input + ": " + data).show();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                let msg = jqXHR.responseText ? jqXHR.responseText : "Unknown error";
                $alertDanger.text("Got the following error: " + msg).show();
            }
        });
    }

    $("#submit-button").click(function (e) {
        submitInput($input.val());
    });

    $input.keyup(function (e) {
        if (e.keyCode === 13) // enter key code
            submitInput(e.target.value);
        else
            hideAlerts();
    });
})(window, document, $);
