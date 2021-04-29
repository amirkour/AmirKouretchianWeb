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
        $modalText = $loadingModal.find("#modal-text");

    /*
     * Helper that hides all alerts on the page
     */
    function hideAlerts() {
        $alerts.hide();
    }

    /*
     * Display a 'success' alert w/ the given msg
     */
    function showSuccess(msg) {
        hideAlerts();
        if (typeof msg !== 'string') return;

        $alertSuccess.text(msg).show();
    }

    /*
     * Display an 'error' alert w/ the given msg
     */
    function showDanger(msg) {
        hideAlerts();

        $alertDanger.text(msg).show();
    }

    /*
     * Helper function that parses messages/responses out of the given
     * jquery XHR object, and returns what it finds as a string, or
     * a generic error if no such message could be found.
     */
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

    /*
     * Helper function that shows/hides a loading dialog,
     * as well as other pieces of stateful messages related
     * to the behavior of this page (such as a loading bar,
     * and/or a status message elaborating on long loads.)
     */
    function loading(state, longLoad, showProgress) {

        // css transitions (defined elsewhere in a css file)
        // will make some of the css changes in this helper
        // more gradual/nice/fluid
        let paddingTop = '30px';
        if (state === true) {
            $loadingModal.modal('show');
        } else {
            $loadingModal.modal('hide');
            $additionInput.focus();
        }

        if (longLoad === true){
            paddingTop = "20px";
            $modalText.find("p").show().css("opacity","1");
        }else{
            $modalText.find("p").css("opacity", "0").hide();
        }

        if(showProgress === true){
            paddingTop = "10px";
            $loadingModal.find('#progress-bar').show().css("opacity","1");
        }else{
            $loadingModal.find('#progress-bar').css("opacity","0").hide();
        }

        $modalText.css("padding-top",paddingTop);
    }

    /*
     * When my app is deployed out to azure, it often goes to sleep (because
     * I have the cheapy tier.)  Consequently, service calls made by this
     * app/page can sometimes be really long.  In order to have a smooth UX
     * on the page,I wrote a state machine (below) to handle various states
     * while waiting for the math service to respond, as well as displaying
     * helpful status and error messages while waiting.  That way, the user
     * isn't greeted with a lame-o loading/progress indicator while twiddling
     * their thumbs, waiting for Azure to punch my web service in the face.
     */

    // define some default variables for my state machine, defined below
    let defaultStateOptions = {
        name: "Unknown state",
        longIntervalSeconds: 2,
        veryLongIntervalSeconds: 3
    };

    /*
     * Default State object for the state machine - mostly just
     * provides some code hints on the various actions that can
     * occur.  Sub-classes below will override the appropriate actions/methods.
     */
    function State(options) {
        options = options || {};
        this.options = $.extend(defaultStateOptions, options);
    }
    $.extend(State.prototype, {

        // when the user initiates a call to the math service
        serviceCall: function (stateMachine) {
            console.log("Nothing to do for serviceCall action of state " + this.options.name);
        },

        // when the service responds
        ajaxComplete: function (stateMachine, jqXHR) {
            console.log("Nothing to do for ajaxComplete action of state " + this.options.name);
        },

        // when a long time has elapsed, and the service still has responded
        longTimeElapsed: function (stateMachine) {
            console.log("Nothing to do for longTimeElapsed action of state " + this.options.name);
        },

        // when a VERY long time has elapsed, and the service STILL hasn't responded
        veryLongTimeElapsed: function (stateMachine) {
            console.log("Nothing for very long time elapsed action of state " + this.options.name);
        },

        // a 'waiting' state, intended to run repeatedly until the service responds (finally)
        pollNotify: function (stateMachine) {
            console.log("Nothing for poll notify action of state " + this.options.name);
        }
    });

    // A lot of the various states of the state machine handle the ajaxComplete
    // action exactly the same, so this base/abstract class will define that.
    function AjaxResponseState(){
        this.options.name = "Base Ajax Response State";

        // store jquery's XHR object when the math service finally responds
        this.jqXHR = null;
    }
    $.extend(AjaxResponseState.prototype, new State(), {
        ajaxComplete: function(stateMachine, jqXHR){
            this.jqXHR = jqXHR;
        }
    });

    // The page enters the following "loading" state when a service
    // call has been made, and we're waiting for a response (but a long
    // amount of time has NOT yet transpired.)
    function LoadingState() {
        this.options.name = "Loading state";
    }
    $.extend(LoadingState.prototype, new AjaxResponseState(), {

        // if a long time elapses while waiting for a response from the math
        // service, this action handler will advance the state machine to
        // a new state if no response has been detected.
        longTimeElapsed: function (stateMachine) {

            // If a service response has been stored, we can show
            // the result and move to the 'done' state.
            if (this.jqXHR) {
                if(this.jqXHR.status === 200){
                    showSuccess(parseResponse(this.jqXHR));
                }else{
                    showDanger(parseResponse(this.jqXHR));
                }

                loading(false);
                stateMachine.setState(new DoneState());

            // on the other hand, if no response has arrived yet, I wanna
            // adbvance to a new, LONG wait state
            } else {
                loading(true,true);
                stateMachine.setState(new LongLoadState());
                setTimeout(function(){
                    stateMachine.veryLongTimeElapsed();
                }, this.options.veryLongIntervalSeconds * 1000);
            }
        }
    });

    // If we've been waiting a relatively long time for the math service
    // to respond, the page will enter into the following "long load" state.
    function LongLoadState() {
        this.options.name = "Long Load State";
    }
    $.extend(LongLoadState.prototype, new AjaxResponseState(), {

        // If a relatively "very long" time has elapsed w/o a response from
        // the math service, we'll advance the state to a new "polling" or
        // "waiting" state.  If there's a service response, we can be "done"
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

                // now just wait, and 'notify' the state machine every
                // so often until the state machine tells us to stop
                // (presumably because the server finally responded, OR
                // because the state machine decided to give up.)
                let interval = setInterval(function(){
                    if(false === stateMachine.pollNotify())
                        clearInterval(interval);
                }, 1000);
            }
        }
    });

    // When we've been waiting so long for the service to respond and have gotten
    // NOTHING back, we'll enter into the following waiting state and just keep checking for
    // a service response, or decide to quit after a certain number of checks.
    function PollingState(){
        this.options.name = "Polling state";
        this.numPolls = 0;
    }
    $.extend(PollingState.prototype, new AjaxResponseState(), {

        // this function is called from elsewhere, presumably at regular intervals,
        // to poke the state machine and check if the math service has finally responded.
        // this function returns TRUE if waiting should continue, or FALSE if
        // the app should give up.
        pollNotify:function(stateMachine){

            // if a jquery XHR is present, the service finally responded,
            // and we can be 'done'
            if (this.jqXHR) {
                if (this.jqXHR.status === 200) {
                    showSuccess(parseResponse(this.jqXHR));
                } else {
                    showDanger(parseResponse(this.jqXHR));
                }

                loading(false);
                stateMachine.setState(new DoneState());
                return false;

            // after some (arbitrary) amount of notifications, the state
            // machine is gonna give up
            }else if(this.numPolls >= 7){
                loading(false);
                stateMachine.setState(new DoneState());
                showDanger("The math service failed to respond ... it's probably just taking a long time to wake up, give it another try!")

                return false; // TODO - set state to an error of some kind ... this is catastrophic
                              // TODO - need to reject the ajax call at this point

            // keep waiting, but increment the counter so we can decide
            // to stop later, eventually
            }else{
                loading(true,true,true);
                this.numPolls++;
                return true;
            }
        }
    });

    // The following "done" state is the default, resting state of the state machine,
    // when no service calls are active and we're waiting for the user to intitiate
    // a new service request.
    function DoneState() {
        this.options.name = "DONE";
    }
    $.extend(DoneState.prototype, new State(), {

        // The user has requested a service call!  Advance the state of this
        // page to 'loading'
        serviceCall: function (stateMachine) {
            hideAlerts();
            loading(true,false);
            stateMachine.setState(new LoadingState());

            // after a 'long' time has elapsed, let the state machine know
            setTimeout(function () {
                stateMachine.longTimeElapsed();
            }, this.options.longIntervalSeconds * 1000);

            // likewise, when this ajax call returns, let the state machine know
            $.post("/Home/MathServiceSubmit", {
                additionInput: $additionInput.val()
            }).done(function (data, text, jqXHR) {
                stateMachine.ajaxComplete(jqXHR);
            }).fail(function (jqXHR) {
                stateMachine.ajaxComplete(jqXHR);
            });
        }
    });

    // Finally, here's the actual state machine definition.  It simply
    // delegates actions to the current state of the app/page.
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

    // Helper that gets called any time the user initiates an event
    // that should make a request from the math service (such as clicking
    // the 'submit' button on the page.)
    function submit() {
        stateMachine.serviceCall();
    }

    $("#submit-button").click(submit);
    $additionInput.keyup(function (e) {
        if (e.keyCode === 13) // the 'enter' key
            submit();
    }).focus();
})($, window, document);
