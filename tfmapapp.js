"use strict";

tf.TFMap.App = function (settings) {
    var theThis, dlayerParams, mapSettings, params, onCreatedCB;

    this.GetContent = function () { return settings.appContent; }

    function onContentCreated() { if (!!onCreatedCB) { onCreatedCB({ sender: theThis }); } }

    function onCreated(notification) {
        //testLegend(notification.mapSettings.legendH);
        settings.appContent = new tf.TFMap.Content(tf.js.ShallowMerge({
            mapSettings: notification.mapSettings,
            dlayerParams: dlayerParams,
            params: params,
            onCreated: onContentCreated
        }, settings));
    }

    function getMapSettings (settings) {

        if (tf.js.GetIsValidObject(settings)) {
            var onCreatedCallBack = tf.js.GetFunctionOrNull(settings.onCreated);

            if (!!onCreatedCallBack) {

                var parameters = settings.parameters;

                if (!tf.js.GetIsValidObject(parameters)) { if (tf.js.GetIsString(parameters)) { parameters = tf.urlapi.ParseURLAPIParameters(parameters); } else { parameters = {}; } }

                var dlayerPreClick = parameters[tf.consts.paramNameDLPreClick] != undefined;
                var nDLayerExtent = tf.js.GetIntNumberInRange(parameters[tf.consts.paramNameDLExtent], 0, 999, 0);

                if (dlayerPreClick || nDLayerExtent == 0) { nDLayerExtent = undefined; }

                var viewCenterLat = tf.js.GetLatitudeFrom(parameters[tf.consts.paramNameLat]);
                var viewCenterLon = tf.js.GetLongitudeFrom(parameters[tf.consts.paramNameLon]);

                if (!parameters[tf.consts.paramNamePanels]) { parameters[tf.consts.paramNamePanels] = tf.consts.defaultPanels; }
                if (parameters[tf.consts.paramNameTFLogo] === tf.consts.tfLogoOffStr) { parameters[tf.consts.paramNameTFLogo] = false; } else { parameters[tf.consts.paramNameTFLogo] = true; }

                var panelParams = tf.js.GetNonEmptyString(parameters[tf.consts.paramNamePanels], '');
                var mapEngine = tf.map.GetMapEngineFrom(parameters[tf.consts.paramNameFMap]);

                if (parameters[tf.consts.paramNameTFLogo]) { panelParams += tf.consts.charSplitStrings + tf.consts.paramNameTFLogo; }

                var useMapNik2 = mapEngine == tf.consts.mapnik2Engine;

                if (useMapNik2) { delete parameters[tf.consts.paramNameLegend]; } else { delete parameters[tf.consts.paramNameLegendH]; }

                var linkTargetStr = parameters[tf.consts.paramLinkTargetStr];

                tf.urlapi.LoadRemoteParameters(parameters, createMapSettings);
            }
        }
        function createMapSettings() {

            var mapLegendStr = useMapNik2 ? tf.urlapi.RemovePlugInPhotoFromLegend(parameters[tf.consts.paramNameLegendM]).legendStr : null;
            var hybridLegendStr = useMapNik2 ? parameters[tf.consts.paramNameLegendH] : parameters[tf.consts.paramNameLegend];
            var legendAndPlugInPhoto = tf.urlapi.RemovePlugInPhotoFromLegend(hybridLegendStr);

            hybridLegendStr = legendAndPlugInPhoto.legendStr;

            var messageTimeout = tf.js.GetFloatNumberInRange(parameters[tf.consts.paramNameMessageTimeout], tf.consts.minMessageTimeout, tf.consts.maxMessageTimeout, tf.consts.defaultMessageTimeout);

            var mapSettings = {
                dlayerPreClick: dlayerPreClick,
                nDLayerExtent: nDLayerExtent,
                center: [viewCenterLon, viewCenterLat],
                mapType: parameters[tf.consts.paramNameType],
                mapAerialSource: parameters[tf.consts.paramNameSource],
                mapLayerSourceURL: parameters[tf.consts.mapLayerSourceName],
                mapEngine: mapEngine,
                panels: panelParams,
                addressBarText: parameters[tf.consts.paramNameAddress],
                addressBarHelp: parameters[tf.consts.paramNameHelp],
                panOnClick: true,
                goDBOnDoubleClick: true,
                legendH: hybridLegendStr,
                legendM: mapLegendStr,
                messageTimeout: messageTimeout,
                vidParam: parameters[tf.consts.paramNameVid],
                passThroughString: parameters[tf.consts.paramNamePassThrough],
                level: parameters[tf.consts.paramNameLevel],
                resolution: parameters[tf.consts.paramNameRes],
                linkTargetStr: linkTargetStr
            };
            //setTimeout(function () { onCreatedCallBack.call(settings.optionalScope, { mapSettings: mapSettings } ); }, 0);
            onCreatedCallBack.call(settings.optionalScope, { mapSettings: mapSettings });
        }
    };

    function initialize() {

        onCreatedCB = tf.js.GetFunctionOrNull(settings.onCreated);

        document.addEventListener("keydown", function (e) {
            var keycode1 = (e.keyCode ? e.keyCode : e.which);
            if (keycode1 == 0 || keycode1 == 9) {
                try {
                    e.preventDefault();
                    //e.stopPropagation();
                } catch (exception) { }
            }
        }, false);

        var defaultServerURL = "http://transit.cs.fiu.edu/api/v1/";
        //var defaultServerURL = "http://192.168.0.81/api/v1/";
        settings.app = theThis;
        settings.documentTitle = tf.js.GetNonEmptyString(settings.appTitle, "TerraFly Maps");
        settings.transitServerURL = tf.js.GetNonEmptyString(settings.transitServerURL, defaultServerURL);

        params = tf.urlapi.ParseURLAPIParameters(settings.fullURL);

        dlayerParams = tf.urlapi.GetDLayersInfoFromURLParameters(params);
        getMapSettings({ onCreated: onCreated, parameters: params });
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

