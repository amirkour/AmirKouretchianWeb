(function ($, window, document, undefined) {

    let $alertSuccess = $("#alert-success"),
        $alertDanger = $("#alert-danger"),
        $alerts = $(".alert"),
        $additionInput = $("#addition-input");

    function hideAlerts() {
        $alerts.hide();
    }

    function showSuccess(msg) {
        hideAlerts();
        if (typeof msg !== 'string') return;

        $alertSuccess.text(msg).show();
    }

    function showDanger(msg) {
        hideAlerts();

        $alertDanger.text(msg).show();
    }

    function parseResponse(jqXHR){
        jqXHR = jqXHR || {};
        if (jqXHR.responseJSON && typeof jqXHR.responseJSON.message === 'string')
            return jqXHR.responseJSON.message;
        else if (typeof jqXHR.responseJSON === 'string')
            return jqXHR.responseJSON;
        else if (typeof jqXHR === 'string')
            return jqXHR;
        else
            return "An unknown error has occurred";
    }

    function submit() {
        hideAlerts();
        $.ajax({
            url: "/Home/MathServiceSubmit",
            method: 'POST',
            data: {
                additionInput: $additionInput.val()
            },
            success: function (data, text, jqXHR) {
                showSuccess(parseResponse(jqXHR));
            },
            error: function (jqXHR, text, error) {
                showDanger(parseResponse(jqXHR));
            },
            complete:function(){
                $additionInput.focus();
            }
        });
    }

    $("#submit-button").click(submit);
    $additionInput.keyup(function(e){
        if(e.keyCode === 13)
            submit();
    });
})($, window, document);
