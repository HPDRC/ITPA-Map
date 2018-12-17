"use strict";

tf.GTFS.Notify = function (settings) {
    var theThis, socket;
    var allEventDispatchers, eventNames;

    this.GetEventNames = function () { return eventNames; }

    this.AddUserAddedListener = function (callBack) { return theThis.AddListener(callBack, eventNames.userAdded); }
    this.AddUserChangedListener = function (callBack) { return theThis.AddListener(callBack, eventNames.userChanged); }
    this.AddUserDeletedListener = function (callBack) { return theThis.AddListener(callBack, eventNames.userDeleted); }

    this.AddUserAddedToAgencyListener = function (callBack) { return theThis.AddListener(callBack, eventNames.userAddedToAgency); }
    this.AddUserRemovedFromAgencyListener = function (callBack) { return theThis.AddListener(callBack, eventNames.userRemovedFromAgency); }

    this.AddUserMessageListener = function (callBack) { return theThis.AddListener(callBack, eventNames.userMessage); }

    this.AddAgencyAddedListener = function (callBack) { return theThis.AddListener(callBack, eventNames.agencyAdded); }
    this.AddAgencyChangedListener = function (callBack) { return theThis.AddListener(callBack, eventNames.agencyChanged); }
    this.AddAgencyDeletedListener = function (callBack) { return theThis.AddListener(callBack, eventNames.agencyDeleted); }

    this.AddAgencyProgressListener = function (callBack) { return theThis.AddListener(callBack, eventNames.agencyProgress); }
    this.AddAgencyMessageListener = function (callBack) { return theThis.AddListener(callBack, eventNames.agencyMessage); }

    this.AddListener = function (callBack, eventName) { return allEventDispatchers.AddListener(eventName, callBack); }

    function notifyListeners(eventName, params) {
        allEventDispatchers.Notify(eventName, tf.js.ShallowMerge(params, { sender: theThis, eventName: eventName }));
    }

    function openSocket() {
        //socket = io('http://192.168.0.121:1337');
        socket = io(settings.transitServerURL);
        socket.on('ev_messagein', function (email, msg) {
            //console.log(email + ' ' + msg);
            //if (msg.length > 0 && msg[0] != 'e') { socket.emit('ev_messageout', 'e - ' + msg); }
            //refreshState();
        });
        socket.on('ev_connected', function () {
            console.log('CONNECTED');
            //socket.emit('ev_getlist');
        });
        socket.on('ev_disconnect', function () {
            console.log('DISCONNECTED');
            settings.apiClient.RefreshUser();
        });
        socket.on('ev_refresh', function () {
            console.log('REFRESHED');
            settings.apiClient.RefreshUser();
        });

        socket.on('ev_notification', function (eventName, evObj) {
            notifyListeners(eventName, { evObj: evObj });
        });

        /*socket.on('ev_setlist', function (list) {
            console.log(list);
        });*/

        socket.on('ping', function () {
            //console.log('ping');
        });

        socket.on('pong', function (latency) {
            //console.log('pong: ' + latency);
        });
    }

    function closeSocket() {
        if (!!socket) {
            socket.disconnect();
            socket = undefined;
        }
    }

    function onAuthChange() {
        refreshState();
    }

    function refreshState() {
        var auth = settings.apiClient.GetAuth();
        var isSignedIn = auth.email != undefined;
        if (isSignedIn && socket == undefined) {
            openSocket();
        }
        else if (!isSignedIn && socket != undefined) {
            closeSocket();
        }
    }

    function initialize() {
        eventNames = {
            userAdded: 'ev_user_added',
            userChanged: 'ev_user_changed',
            userDeleted: 'ev_user_deleted',

            userAddedToAgency: 'ev_user_into_agency',
            userRemovedFromAgency: 'ev_user_outof_agency',

            userMessage: 'ev_user_message',

            agencyAdded: 'ev_agency_added',
            agencyChanged: 'ev_agency_changed',
            agencyDeleted: 'ev_agency_deleted',

            agencyProgress: 'ev_agency_progress',

            agencyMessage: 'ev_agency_message'
        };

        allEventDispatchers = new tf.events.MultiEventNotifier({
            eventNames: tf.js.ObjectToArray(eventNames)
        });
        settings.apiClient.AddAuthListener(onAuthChange);
        refreshState();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

