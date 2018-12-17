"use strict";

tf.GTFS.XHR = function (settings) {
    var uri = settings.transitServerURL + settings.urlVerb;
    var xhr = new XMLHttpRequest({ mozSystem: true });
    try {
        var hasFormData = !!settings.formData;
        var formObject = hasFormData ? settings.formData : (!!settings.formObject ? JSON.stringify(settings.formObject) : undefined);
        var contentType = !hasFormData ? "application/json" : undefined;
        if (!!settings.urlParamObject) { uri += '?' + tf.js.ObjectToURLParams(settings.urlParamObject); }
        xhr.open(settings.xhrVerb, uri, true);
        xhr.withCredentials = true;
        if (!!contentType) { xhr.setRequestHeader("Content-type", contentType); }
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (!!tf.js.GetFunctionOrNull(settings.cb)) {
                    var ok = xhr.status >= 200 && xhr.status < 300;
                    var JSONContent;
                    if (xhr.responseText) {
                        JSONContent = tf.js.JSONParse(xhr.responseText);
                        if (!JSONContent) { JSONContent = { ok: ok, message: "connection unsuccessful" }; }
                    }
                    if (!JSONContent) { JSONContent = { ok: ok, message: "" }; }
                    xhr.responseJSON = JSONContent;
                    settings.cb(xhr, settings);
                }
            }
        };
        xhr.send(formObject);
    } catch (e) { console.log(e); }
    return { xhr: xhr };
};

tf.GTFS.CancelXHR = function (xhr) { if (!!xhr && !!xhr.xhr) { try { xhr.abort(); } catch (e) {  } xhr.xhr = undefined; } };

tf.GTFS.GetStatusFromXHR = function(xhr) { var message = "connection failed"; if (!!xhr && !!xhr.responseJSON) { message = tf.js.GetNonEmptyString(xhr.responseJSON.message, message); } return message; };

tf.GTFS.APIClient = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.APIClient)) { return new tf.GTFS.APIClient(settings); }
    var transitServerURL, allEventDispatchers, authEventName;
    var idSignedIn, emailSignedIn, isAdminSignedIn;
    var counters, apiCalls;

    this.GetAuth = function () { return { id: idSignedIn, email: emailSignedIn, isAdmin: isAdminSignedIn }; }
    this.AddAuthListener = function (callBack) { allEventDispatchers.AddListener(authEventName, callBack); }
    this.RefreshUser = function (cb) { return refreshUser(cb); }

    this.AuthDelete = function (cb, urlParamObject) { return callAPI(function (result) { passResult(cb, result); refreshUser(); }, 'auth', 'delete', urlParamObject, undefined); };
    this.AuthPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); refreshUser(); }, 'auth', 'post', undefined, formObject); };

    this.AdminUserPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'admin/user', 'post', undefined, formObject); };
    this.AdminUserGet = function (cb) { return callAPI(function (result) { passResult(cb, result); }, 'admin/user', 'get', undefined, undefined); };
    this.AdminUserDelete = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'admin/user', 'delete', undefined, formObject); };
    this.AdminUserPut = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'admin/user', 'put', undefined, formObject); };

    this.AdminSessionDelete = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'admin/session', 'delete', undefined, formObject); };

    this.AdminAgencyGet = function (cb) { return callAPI(function (result) { passResult(cb, result); }, 'admin/agency', 'get', undefined, undefined); };
    this.AdminAgencyPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'admin/agency', 'post', undefined, formObject); };
    this.AdminAgencyPut = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'admin/agency', 'put', undefined, formObject); };
    this.AdminAgencyDelete = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'admin/agency', 'delete', undefined, formObject); };

    this.AdminAgencyUserPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'admin/agency/user', 'post', undefined, formObject); };
    this.AdminAgencyUserDelete = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'admin/agency/user', 'delete', undefined, formObject); };

    this.UserGet = function (cb) { return userGet(cb); }
    this.UserPut = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'user', 'put', undefined, formObject); }

    this.UserUsersGet = function (cb) { return callAPI(function (result) { passResult(cb, result); }, 'user/users', 'get', undefined, undefined); };

    this.UserAgenciesGet = function (cb) { return callAPI(function (result) { passResult(cb, result); }, 'user/agencies', 'get', undefined, undefined); }

    this.AgencyMessagePost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'agency/message', 'post', undefined, formObject); };
    this.AgencyUploadPost = function (cb, formData) { return callAPI(function (result) { passResult(cb, result); }, 'agency/upload', 'post', undefined, undefined, formData); };
    this.AgencyFetchPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'agency/fetch', 'post', undefined, formObject, undefined); };
    this.AgencyPublishPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'agency/publish', 'post', undefined, formObject, undefined); };

    this.DesignAgenciesPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'design/agencies', 'post', undefined, formObject); };
    this.DesignCalendarPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'design/calendar', 'post', undefined, formObject); };
    this.DesignCalendarDatesPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'design/calendar_dates', 'post', undefined, formObject); };
    this.DesignServicesPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'design/services', 'post', undefined, formObject); };
    this.DesignStopsPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'design/stops', 'post', undefined, formObject); };
    this.DesignShapesPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'design/shapes', 'post', undefined, formObject); };
    this.DesignRoutesPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'design/routes', 'post', undefined, formObject); };
    this.DesignStopSequencesPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'design/stop_sequences', 'post', undefined, formObject); };
    this.DesignTripsPost = function (cb, formObject) { return callAPI(function (result) { passResult(cb, result); }, 'design/trips', 'post', undefined, formObject); };

    function passResult(cb, result) { if (!!tf.js.GetFunctionOrNull(cb)) { cb(result); }; };

    function userGet(cb) { return callAPI(function (result) { if (!!tf.js.GetFunctionOrNull(cb)) { cb(result); } }, 'user', 'get', undefined, undefined); }

    function refreshUser(cb) {
        userGet(function (result, settings) {
            if (!!result && !!result.responseJSON) {
                var newIdSignedIn = result.responseJSON.id;
                var newEmailSignedIn = result.responseJSON.email;
                var newIsAdminSignedIn = result.responseJSON.isAdmin;
                if (newEmailSignedIn != emailSignedIn || newIsAdminSignedIn != isAdminSignedIn || idSignedIn != newIdSignedIn) {
                    emailSignedIn = newEmailSignedIn;
                    isAdminSignedIn = newIsAdminSignedIn;
                    idSignedIn = newIdSignedIn;
                    notify(authEventName, theThis.GetAuth());
                }
            }
            if (!!cb) { cb(); }
        });
    };

    function getNextCounter(currentCounter) { return currentCounter < 10000000 ? ++currentCounter : 1; }

    function cancelAPICall(apiCode) {
        if (apiCalls[apiCode]) {
            //console.log('cancelling: ' + apiCode);
            var saved = apiCalls[apiCode];
            delete apiCalls[apiCode];
            tf.GTFS.CancelXHR(saved);
        }
    };

    function callAPI(cb, urlVerb, xhrVerb, urlParamObject, formObject, formData) {
        if (counters == undefined) { counters = {}; apiCalls = {}; }
        var apiCode = urlVerb + "|" + xhrVerb;
        if (counters[apiCode] == undefined) { counters[apiCode] = 0; }
        else { cancelAPICall(apiCalls[apiCode]); }
        return apiCalls[apiCode] = tf.GTFS.XHR({
            transitServerURL: transitServerURL, cb: function (result, settings) {
                delete apiCalls[apiCode];
                if (!!settings && settings.gen == counters[apiCode]) { if (!!tf.js.GetFunctionOrNull(cb)) { cb(result); } }
            },
            urlVerb: urlVerb, xhrVerb: xhrVerb, urlParamObject: urlParamObject, formObject: formObject, formData: formData,
            gen: counters[apiCode] = getNextCounter(counters[apiCode])
        });
    };

    function notify(eventName, props) { allEventDispatchers.Notify(eventName, tf.js.ShallowMerge(props, { sender: theThis, eventName: eventName })); };

    function initialize() {
        transitServerURL = tf.js.GetNonEmptyString(settings.transitServerURL, 'http://192.168.0.121:1337/');
        allEventDispatchers = new tf.events.MultiEventNotifier({ eventNames: [authEventName = "auth"] });
        refreshUser();
    };

    initialize();
};
