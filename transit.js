"use strict";

tf.Transit = {};

tf.Transit.BusLineDirectionsCount = 0;
tf.Transit.BusLineDirections = {
    "eastbound": { ab: "EB", order: ++tf.Transit.BusLineDirectionsCount },
    "westbound": { ab: "WB", order: ++tf.Transit.BusLineDirectionsCount },
    "northbound": { ab: "NB", order: ++tf.Transit.BusLineDirectionsCount },
    "southbound": { ab: "SB", order: ++tf.Transit.BusLineDirectionsCount },
    "clockwise": { ab: "CW", order: ++tf.Transit.BusLineDirectionsCount },
    "cntrclockwise": { ab: "CC", order: ++tf.Transit.BusLineDirectionsCount },
    "loop": { ab: "LP", order: ++tf.Transit.BusLineDirectionsCount }
};
tf.Transit.BusLineDirectionUnknown = { ab: "??", order: ++tf.Transit.BusLineDirectionsCount };

tf.Transit.GetLineDirection = function (lineDirectionStr) {
    var direction;
    if (tf.js.GetIsNonEmptyString(lineDirectionStr)) { direction = tf.Transit.BusLineDirections[lineDirectionStr.toLowerCase()]; }
    if (direction == undefined) { direction = tf.Transit.BusLineDirectionUnknown; }
    return direction;
};

tf.Transit.BackendService = function (settings) {
    var theThis, autoRefreshes, jsonGet, refreshCounter, refreshTimeout;
    var transitServerURL, controllerStr, agencyPrefix, serviceName;

    this.GetSettings = function () { return settings; }
    this.SetServiceURL = function (serviceURL) { settings.serviceURL = serviceURL; }
    this.SetAutoRefreshes = function (autoRefreshSet) { return setAutoRefreshes(autoRefreshSet); }
    this.GetAutoRefreshes = function () { return autoRefreshes; }
    this.GetIsRefreshing = function () { return jsonGet != undefined; }
    this.RefreshNow = function (urlParams) { return unscheduledRefreshNow(urlParams); }
    this.Cancel = function () { cancelFutureRefreshCall(); cancelOngoingRefreshCall(); }

    function setAutoRefreshes(autoRefreshSet) {
        if (autoRefreshes != (autoRefreshSet = !!autoRefreshSet)) {
            if (!(autoRefreshes = autoRefreshSet)) { theThis.Cancel(); } else { refreshNow(); }
        }
    }

    function onRefreshed(data) {
        refreshTimeout = undefined;
        if (tf.js.GetFunctionOrNull(settings.preProcessServiceData)) { data = settings.preProcessServiceData(data); }
        if (!!settings.KL) { if (tf.js.GetIsArray(data)) { settings.KL.UpdateFromNewData(data); } }
        if (autoRefreshes) { if (!!settings.refreshTimeoutMillis) { refreshTimeout = setTimeout(refreshNow, settings.refreshTimeoutMillis); } else { refreshNow(); } }
    }

    function cancelFutureRefreshCall() { if (refreshTimeout != undefined) { clearTimeout(refreshTimeout); refreshTimeout = undefined; /*console.log('future refresh cancelled');*/ } }
    function cancelOngoingRefreshCall() { if (jsonGet != undefined) { jsonGet.Cancel(); jsonGet = undefined; /*console.log('ongoing refresh cancelled');*/ } }
    function unscheduledRefreshNow(urlParams) { cancelFutureRefreshCall(); refreshNow(urlParams); }

    function onJSONGot(notification) {
        jsonGet = undefined;
        var data;
        if (tf.js.GetIsValidObject(notification) && tf.js.GetIsValidObject(notification.requestProps)) { if (notification.requestProps.refreshCounter == refreshCounter) { data = notification.data; } }
        onRefreshed(data);
        if (tf.js.GetFunctionOrNull(settings.onPostRefresh)) { settings.onPostRefresh({ sender: theThis }); }
    }

    function refreshNow(urlParams) {
        refreshTimeout = undefined;
        cancelOngoingRefreshCall();
        if (settings.clearBeforeRefresh) { settings.KL.UpdateFromNewData([]); }
        jsonGet = new tf.ajax.JSONGet();
        if (tf.js.GetFunctionOrNull(settings.onPreRefresh)) { settings.onPreRefresh({ sender: theThis }); }
        var serviceURL = makeServiceURL(urlParams);
        jsonGet.Request(serviceURL, onJSONGot, theThis, { refreshCounter: ++refreshCounter }, false, undefined, undefined, undefined);
    }

    function makeServiceURL(urlParams) {
        if (settings.skipAgency) {
            var paramStr = '';
            if (!tf.js.GetIsString(urlParams) && tf.js.GetIsValidObject(urlParams)) { urlParams = tf.js.ObjectToURLParams(urlParams); }
            if (tf.js.GetIsNonEmptyString(urlParams)) { paramStr += "?" + urlParams; }
            return transitServerURL + controllerStr + serviceName + paramStr;
        }
        else {
            var paramStr = '?agency=' + agencyPrefix;
            if (!tf.js.GetIsString(urlParams) && tf.js.GetIsValidObject(urlParams)) { urlParams = tf.js.ObjectToURLParams(urlParams); }
            if (tf.js.GetIsNonEmptyString(urlParams)) { paramStr += "&" + urlParams; }
            return transitServerURL + controllerStr + serviceName + paramStr;
        }
    }

    function initialize() {
        var defaultServerURL = "http://transit.cs.fiu.edu/api/v1/";
        //var defaultServerURL = "http://192.168.0.81/api/v1/";
        transitServerURL = tf.js.GetNonEmptyString(settings.transitServerURL, defaultServerURL);
        agencyPrefix = tf.js.GetNonEmptyString(settings.agencyPrefix, "MDT");
        //agencyPrefix = tf.js.GetNonEmptyString(settings.agencyPrefix, "MARTA");
        //agencyPrefix = tf.js.GetNonEmptyString(settings.agencyPrefix, "FIU");
        serviceName = settings.serviceName;
        controllerStr = 'transit/';
        refreshCounter = 0;
        setAutoRefreshes(settings.autoRefreshes);
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};


/*


http://localhost/map/debug.html?fmap=m2&directionsbus=1&type=map&dlayerextent=20&perspectivemap=&Lat=25.757765&Lon=-80.367935&res=&Legendh=$$http://n00.cs.fiu.edu/defaultmapWMFL$$&&DLayerSelect1=false&dlayerfield1=L&DLayerColor1=&DLayerLegend1=Sights&DLayerData1=http%3A//acorn.cs.fiu.edu/cgi-bin/arquery.cgi%3Fcategory%3Dgeoimages%26visualvalue%3E%3D4%26vid=itpa%26tfaction=shortdisplayflash%26filetype=.json&Panels=type+zoom+nav+overview+measure+download+legend+fullscreen&address=1225+SW+107+AVE,++MIAMI,+FLORIDA+33174&vid=itpa&tf_passtrough=%26tfaction%3Ddispense%26sreq%3Dgnisstr

*/