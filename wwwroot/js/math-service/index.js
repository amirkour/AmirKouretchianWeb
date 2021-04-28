(function ($, window, document, undefined) {

    let $alertSuccess = $("#alert-success"),
        $alertDanger = $("#alert-danger"),
        $alerts = $(".alert"),
        $additionInput = $("#addition-input"),
        $loadingModal = $("#loading-modal").modal({
            backdrop: 'static',
            keyboard: false,
            show: false
        }),
        loadingDeferred = null;

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

    function parseResponse(jqXHR) {
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

    function loading(state, text) {
        text = (typeof text === 'string' && text.length > 0) ? text : "Loading ...";
        $loadingModal.find(".modal-body").text(text);

        if (state) {
            $loadingModal.modal('show');
        } else {
            $loadingModal.modal('hide');
            $additionInput.focus();
        }
    }

    function State() {
        this.name = "Unknown state";
    }
    $.extend(State.prototype, {
        serviceCall: function (stateMachine) {
            console.log("Nothing to do for serviceCall action of state " + this.name);
        },
        ajaxComplete: function (stateMachine, jqXHR) {
            console.log("Nothing to do for ajaxComplete action of state " + this.name);
        },
        longTimeElapsed: function (stateMachine) {
            console.log("Nothing to do for longTimeElapsed action of state " + this.name);
        },
        veryLongTimeElapsed: function (stateMachine) {
            console.log("Nothing for very long time elapsed action of state " + this.name);
        },
        pollNotify: function (stateMachine) {
            console.log("Nothing for poll notify action of state " + this.name);
        }
    });
    function AjaxResponseState(){
        this.name = "Base Ajax Response State";
        this.jqXHR = null;
    }
    $.extend(AjaxResponseState.prototype, new State(), {
        ajaxComplete: function(stateMachine, jqXHR){
            this.jqXHR = jqXHR;
        }
    });

    function LoadingState() {
        this.name = "Loading state";
    }
    $.extend(LoadingState.prototype, new AjaxResponseState(), {
        longTimeElapsed: function (stateMachine) {
            if (this.jqXHR) {
                if(this.jqXHR.status === 200){
                    showSuccess(parseResponse(this.jqXHR));
                }else{
                    showDanger(parseResponse(this.jqXHR));
                }

                loading(false);
                stateMachine.setState(new DoneState());
            } else {
                loading(true, "Sometimes it takes a while ...");
                stateMachine.setState(new LongLoadState());
                setTimeout(function(){
                    stateMachine.veryLongTimeElapsed();
                }, 1500);
            }
        }
    });

    function LongLoadState() {
        this.name = "Long Load State";
    }
    $.extend(LongLoadState.prototype, new AjaxResponseState(), {
        veryLongTimeElapsed:function(stateMachine){
            if (this.jqXHR) {
                if (this.jqXHR.status === 200) {
                    showSuccess(parseResponse(this.jqXHR));
                } else {
                    showDanger(parseResponse(this.jqXHR));
                }

                loading(false);
                stateMachine.setState(new DoneState());
            }else{
                stateMachine.setState(new PollingState());
                let interval = setInterval(function(){
                    if(stateMachine.pollNotify())
                        clearInterval(interval);
                }, 1000);
            }
        }
    });

    function PollingState(){
        this.name = "Polling state";
        this.numPolls = 0;
    }
    $.extend(PollingState.prototype, new AjaxResponseState(), {
        pollNotify:function(stateMachine){
            if (this.jqXHR) {
                if (jqXHR.status === 200) {
                    showSuccess(parseResponse(this.jqXHR));
                } else {
                    showDanger(parseResponse(this.jqXHR));
                }

                loading(false);
                stateMachine.setState(new DoneState());
                return true;
            }else if(this.numPolls >= 5){
                loading(false);
                stateMachine.setState(new DoneState());

                return true; // TODO - set state to an error of some kind ... this is catastrophic
                             // TODO - need to reject the ajax call at this point
            }else{
                loading(true,this.numPolls.toString());
                this.numPolls++;
                return false;
            }
        }
    });

    function DoneState() {
        this.name = "DONE";
    }
    $.extend(DoneState.prototype, new State(), {
        serviceCall: function (stateMachine) {
            hideAlerts();
            loading(true);
            stateMachine.setState(new LoadingState());
            setTimeout(function () {
                stateMachine.longTimeElapsed();
            }, 1500);
        }
    });

    function StateMachine() {
        this.state = new DoneState();
    }
    $.extend(StateMachine.prototype, {
        setState: function (state) {
            this.state = state;
        },
        serviceCall: function () {
            return this.state.serviceCall(this);
        },
        ajaxComplete: function (jqXHR) {
            return this.state.ajaxComplete(this, jqXHR);
        },
        longTimeElapsed: function () {
            return this.state.longTimeElapsed(this);
        },
        veryLongTimeElapsed: function () {
            return this.state.veryLongTimeElapsed(this);
        },
        pollNotify: function () {
            return this.state.pollNotify(this);
        }
    });

    let stateMachine = new StateMachine();

    function submit() {
        stateMachine.serviceCall();
    }

    $("#submit-button").click(submit);
    $additionInput.keyup(function (e) {
        if (e.keyCode === 13)
            submit();
    });
})($, window, document);
