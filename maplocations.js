"use strict";

tf.TFMap.MapRevGeoCodedLocation = function(settings) {
    var theThis, lastRevGeoCoder, mapFeature, isInLayer, isGeoCoding, isRevGeoCoding

    this.PanToMapFeature = function() { if (!!mapFeature) { settings.appContent.AnimatedSetCenterIfDestVisible(mapFeature.GetPointCoords()); } }
    this.GetMapFeature = function() { return mapFeature; }
    this.GetIsGeoCoding = function() { return isGeoCoding; }
    this.GetIsRevGeoCoding = function() { return isRevGeoCoding; }
    this.GetIsShowing = function() { return isInLayer; }
    this.Show = function(coords) { return show(coords); }

    function notifyShown() { if (tf.js.GetFunctionOrNull(settings.onShown)) { settings.onShown({ sender: theThis, isShowing: isInLayer }); } }

    function hide() { if (!!mapFeature && isInLayer) { isInLayer = false; settings.layer.DelMapFeature(mapFeature); notifyShown(); } }

    function onClick(notification) {
        var button = notification.sender;
        if (!tf.js.GetFunctionOrNull(notification.sender.GetSettings)) {
            button = notification.toolTipSender;
        }
        if (tf.js.GetFunctionOrNull(button.GetSettings)) {
            var notificationSettings = button.GetSettings();
            var buttonSettings = notificationSettings.buttonSettings;
            switch (buttonSettings.clickVerb) {
                case 'hide':
                    hide();
                    settings.appContent.ShowMapFeatureProps(undefined);
                    break;
                case 'godb':
                    settings.appContent.GoDB(mapFeature.GetPointCoords());
                    break;
            }
        }
    }

    function getDisplayProps(mapFeatureParam) {
        var appContent = settings.appContent;
        var propsDisplayer = appContent.GetMapFeaturePropsDisplayer();
        var props = mapFeature.GetSettings(), innerHTML = "", notification = props.notification;
        var buttonClasses = propsDisplayer.GetMapFeaturePropsTextButtonClass();
        var addButtons = [];

        addButtons.push({ buttonClass: buttonClasses, toolTipText: "Get Local Reports for this location", clickVerb: "godb", buttonText: "Reports" });
        addButtons.push({ buttonClass: buttonClasses, toolTipText: "Remove location marker from map", clickVerb: "hide", buttonText: "Remove" });

        props.onClick = onClick;
        props.addButtons = addButtons;

        innerHTML = propsDisplayer.CreateMapFeatureTitleSpan(settings.locationName, "#fff");
        if (!!notification) {
            if (!!notification.HTML) {
                var HTMLUse= notification.HTML;
                HTMLUse = HTMLUse.replace(/<font color="#0000FF">/g, "");
                HTMLUse = HTMLUse.replace(/<\/font>/g, "");
                innerHTML += HTMLUse;
            } else { innerHTML += "Information not found"; }
        }
        else {
            innerHTML += '<div style="width=100%;text-align: center;">Retrieving...</div>';
        }
        return { innerHTML: innerHTML };
    }

    function onCloseDisplayProps(notification) {
        if (!settings.dontHideWhenPropsClose) {
            hide();
        }
    }

    function onTFReverseGeocoded(notification) {
        if (!!notification && tf.js.GetIsNonEmptyString(notification.HTML)) {
            var mapFeatureSettings = mapFeature.GetSettings();
            mapFeatureSettings.notification = notification;
            settings.appContent.ShowMapFeatureProps(mapFeature);
        }
        isRevGeoCoding = false;
    }

    function onRevGeoCodeCoordsKnown(coords) {
        if (!!coords) {
            isRevGeoCoding = true;
            var appContent = settings.appContent;
            var map = appContent.GetMap();
            var appStyles = appContent.GetAppStyles();
            var coordsToFlash;
            if (!mapFeature) {
                var toolTipProps = { toolTipText: settings.locationName, keepOnHoverOutTarget: false, offsetX: 24 };
                var mapFeatureStyle = settings.getMapFeatureStyle({ sender: theThis, coords: coords });
                mapFeature = new tf.map.Feature(tf.js.ShallowMerge(mapFeatureStyle, {
                    getDisplayProps: getDisplayProps, onClose: onCloseDisplayProps, notification: undefined
                }));
                tf.TFMap.SetMapFeatureToolTipProps(mapFeature, toolTipProps);
                settings.layer.AddMapFeature(mapFeature);
                isInLayer = true;
                coordsToFlash = [coords];
            }
            else {
                var mapFeatureSettings = mapFeature.GetSettings();
                mapFeatureSettings.notification = undefined;
                if (!isInLayer) { settings.layer.AddMapFeature(mapFeature); isInLayer = true; }
                var nowCoords = mapFeature.GetPointCoords();
                if (nowCoords[0] != coords[0] || nowCoords[1] != coords[1]) { mapFeature.SetPointCoords(coords); coordsToFlash = [coords]; }
                //else if (!!forceFlash) { coordsToFlash = [coords]; }
            }
            if (coordsToFlash != undefined) { appStyles.FlashCoords(appContent.GetMap(), coordsToFlash, "#00f"); notifyShown(); }
            var vidPassThrough = appContent.GetVidPassThrough();
            lastRevGeoCoder = new tf.services.TFReverseGeocoder({ callBack: onTFReverseGeocoded, pointCoords: coords, resolution: map.GetResolution(), vidParam: vidPassThrough.passThrough.vid, passThrough: vidPassThrough.passThrough });
        }
    }

    function doGeoLocate() {
        if (!!navigator.geolocation) {
            isGeoCoding = true;
            navigator.geolocation.getCurrentPosition(
                function geoSuccess(position) {
                    var coords = [position.coords.longitude, position.coords.latitude];
                    onRevGeoCodeCoordsKnown(coords);
                    //setTimeout(doGeoLocate, 3000);
                },
                function geoFailure(error) {
                    isGeoCoding = false;
                }
            );
        }
    }

    function show(coords) {
        isGeoCoding = isRevGeoCoding = false;
        if (!!coords) { hide(); onRevGeoCodeCoordsKnown(coords); }
        else if (!settings.dontGeoLocate) { hide(); doGeoLocate(); }
        else { onRevGeoCodeCoordsKnown(coords); }
    }

    function initialize() { isGeoCoding = isInLayer = false; }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.TFMap.MapClickedLocation = function(settings) {
    var theThis;

    function onShown(notification) {
        var appContent = settings.appContent;
        appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_clickLocation, notification.isShowing ? theThis.GetMapFeature() : undefined);
        if (notification.isShowing) { appContent.ShowMapFeatureProps(theThis.GetMapFeature()); }
    }

    function getMapFeatureStyle(notification) {
        var appStyles = settings.appContent.GetAppStyles(); return appStyles.GetSVGMapMarkerWithFrameGeom(notification.coords, appStyles.GetTapImage(), [24, 24], 32);
    }

    function initialize() {
        var geoCodedLocationSettings = tf.js.ShallowMerge(settings, {
            onShown: onShown, locationName: "Clicked Location", getMapFeatureStyle: getMapFeatureStyle,
            dontHideWhenPropsClose: true
        });
        tf.TFMap.MapRevGeoCodedLocation.call(theThis, geoCodedLocationSettings);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.TFMap.MapClickedLocation, tf.TFMap.MapRevGeoCodedLocation);

tf.TFMap.MapUserLocation = function(settings) {
    var theThis;

    function onShown(notification) {
        var appContent = settings.appContent;
        appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_userLocation, notification.isShowing ? theThis.GetMapFeature() : undefined);
        if (notification.isShowing) {
            theThis.PanToMapFeature();
        }
    }

    function getMapFeatureStyle(notification) { var appStyles = settings.appContent.GetAppStyles(); return appStyles.GetSVGMapMarkerWithFrameGeom(notification.coords, appStyles.GetGeolocationImage(), [20, 20], 32); }

    function initialize() {
        tf.TFMap.MapRevGeoCodedLocation.call(theThis, tf.js.ShallowMerge(settings,
            { onShown: onShown, locationName: "Your Location", getMapFeatureStyle: getMapFeatureStyle, dontHideWhenPropsClose: true }));
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.TFMap.MapClickedLocation, tf.TFMap.MapRevGeoCodedLocation);

tf.TFMap.MapSearchLocation = function(settings) {
    var theThis, lastGeoCoder, lastSearchText, toast;;

    this.SetAddress = function(searchText, coordinates) {
        closeLastToast();
        if (!!lastGeoCoder) { lastGeoCoder.Cancel(); }
        lastSearchText = searchText;
        theThis.Show(coordinates);
        //theThis.PanToMapFeature();
    }

    this.SearchAddress = function(searchText) {
        closeLastToast();
        if (searchText != lastSearchText) {
            if (!!lastGeoCoder) { lastGeoCoder.Cancel(); }
            theThis.Show(undefined);
            changeContext(true);
            lastSearchText = searchText;
            lastGeoCoder = new tf.services.Geocoder({ callBack: onGeocoded, address: searchText });
        }
        else if (lastGeoCoder == undefined || !lastGeoCoder.GetIsInProgress()) {
            var mapFeature = theThis.GetMapFeature();
            //theThis.Show(undefined);
            theThis.Show(mapFeature.GetPointCoords());
            theThis.PanToMapFeature();
        }
    }

    function closeLastToast() { if (!!toast) { toast.Close(); toast = undefined; } }

    function showToast(str, timeout) {
        closeLastToast();
        var toaster = settings.appContent.GetToaster();
        if (!!toaster) {
            if (timeout == undefined) { timeout = 0; }
            toast = toaster.Toast({ text: str, timeout: timeout });
        }
    }

    function onShown(notification) {
        var appContent = settings.appContent;
        appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_searchAddressLocation, notification.isShowing ? theThis.GetMapFeature() : undefined);
        if (notification.isShowing) {
            theThis.PanToMapFeature();
        }
    }

    function changeContext(isSearchingAddress) {
        var appContent = settings.appContent;
        appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_isSearchingAddress, isSearchingAddress);
        appContent.ShowMapFeatureProps(theThis.GetMapFeature());
    }

    function onGeocoded(notification) {
        var geoCodedOK;
        if (!!notification && notification.geocoderAccuracy > 0 && tf.js.GetIsArrayWithMinLength(notification.pointCoords, 2)) {
            geoCodedOK = true;
            theThis.Show(notification.pointCoords);
        }
        else {
            theThis.Show(undefined);
            var toastStr = "<span>Sorry! We can't find map coordinates for this address, please try a different one</span>";
            lastSearchText = undefined;
            showToast(toastStr, 5000);
        }
        changeContext(false);
    }

    function getMapFeatureStyle(notification) { var appStyles = settings.appContent.GetAppStyles(); return appStyles.GetSVGMapMarkerWithFrameGeom(notification.coords, appStyles.GetMapMarkerSearchImage(), [20, 20], 32); }

    function initialize() {
        tf.TFMap.MapRevGeoCodedLocation.call(theThis, tf.js.ShallowMerge(settings,
            { onShown: onShown, locationName: "Searched Location", getMapFeatureStyle: getMapFeatureStyle, dontHideWhenPropsClose: true, dontGeoLocate: true }));
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.TFMap.MapSearchLocation, tf.TFMap.MapRevGeoCodedLocation);

