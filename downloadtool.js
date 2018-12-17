"use strict";

tf.TFMap.MapDownloadTool = function (settings) {
    var theThis, lsEdI;
    var lastShowingHybrid;
    var colorTicNormalMap, colorTicNormalHybrid;
    var onClearCB;

    function getIsShowingHybrid() { return settings.map.GetMapType() != tf.consts.typeNameMap; }

    function getVertexStyle(notification) {
        var minZIndex = notification.minZIndex;
        var isVertex = notification.isVertex;
        var isHover = notification.isHover;
        var radius = tf.TFMap.LayoutSettings.measureToolVertexRadiusInt;
        if (isHover) { ++radius; }
        var snaptopixel = false;
        var lineColor = isVertex ? "#026" : "#cc4422";
        var style = [{
            snaptopixel: snaptopixel, zindex: minZIndex++,
            circle: true, circle_radius: radius + 8, fill: true, fill_color: "#fff", fill_opacity: 1
        }, {
            snaptopixel: snaptopixel, zindex: minZIndex++,
            circle: true, circle_radius: radius, line: true, fill: true, fill_color: "#fdfdff", line_color: lineColor, line_width: 2, line_opacity: 70, fill_opacity: 100
        }];
        return style;
    }

    function getLineStringStyle(notification) {
        var minZIndex = notification.minZIndex;
        var isHover = notification.isHover;
        var lineVisibleWidth = 7;
        var lineInvisibleWidthInc = isHover ? 6 : 4;
        var lineColor = getIsShowingHybrid() ? colorTicNormalHybrid : colorTicNormalMap;
        var style = [
            { line: true, line_width: lineVisibleWidth + lineInvisibleWidthInc, line_color: "#000", line_opacity: 5, zindex: minZIndex++ },
            { line: true, line_width: lineVisibleWidth, line_color: lineColor, zindex: minZIndex++ }
        ];
        return style;
    }

    function onPostCompose(notification) {
        var vertexInfos = lsEdI.getVertexInfos(), nPoints = vertexInfos.length;
        var showingHybrid = getIsShowingHybrid();

        if (lastShowingHybrid != undefined && showingHybrid != lastShowingHybrid) {
            var areaFeature = lsEdI.getAreaFeature(); if (!!areaFeature) { areaFeature.RefreshStyle(); }
            var lineStringFeature = lsEdI.getLineStringFeature(); if (!!lineStringFeature) { lineStringFeature.RefreshStyle(); }
            var closePolyEdgeFeature = lsEdI.getClosePolyEdgeFeature(); if (!!closePolyEdgeFeature) { closePolyEdgeFeature.RefreshStyle(); }
        }

        lastShowingHybrid = showingHybrid;
    }

    function updateForMapType() { settings.map.Render(); }

    function onClear(notification) {
        if (!!onClearCB) { onClearCB({ sender: theThis }) }
        //console.log('cleared');
    }

    function onLSEdInited(notification) {
        var myInterface = { sender: theThis, updateForMapType: updateForMapType };
        settings.setInterface(tf.js.ShallowMerge(lsEdI = notification, myInterface));
    }

    function initialize() {
        if (tf.js.GetFunctionOrNull(settings.setInterface)) {
            var ls = tf.TFMap.LayoutSettings;
            onClearCB = tf.js.GetFunctionOrNull(settings.onClear);
            colorTicNormalMap = "#1E90FF";
            colorTicNormalHybrid = "#fff";
            var textShowSettingsHybrid = { fontFamily: "Roboto", lineWidth: 4, textFill: "#fff", textLine: "rgba(0, 0, 0, 0.5)", fontSize: "12px", fontWeight: "400" };
            var textShowSettingsMap = { fontFamily: "Roboto", lineWidth: 1, textFill: "rgba(30, 144, 255, 1)", textLine: "rgba(0, 0, 0, 0.7)", fontSize: "11px", fontWeight: "300" };
            var colorSegHybrid = ls.lightTextColor;
            var colorSegMap = ls.darkTextColor;
            var commonSettings = tf.js.ShallowMerge(settings, {
                //scaleExtent: 0.7,
                optionalColorSegMap: ls.backgroundLivelyColor,
                optionalColorSegHybrid: "#fff",
                optionalSegWidth: 3,

                optionalExtentColorSegMap: colorSegMap,
                optionalExtentColorSegHybrid: colorSegHybrid,
                optionalExtentSegWidth: 2,
                optionalMapTextStyle: textShowSettingsMap,
                optionalHybridTextStyle: textShowSettingsHybrid,
                colorTicNormalMap: colorTicNormalMap,
                colorTicNormalHybrid: colorTicNormalHybrid,
                maxPoints: 2,
                showMeasures: true,
                requestCloseSender: theThis,
                onClear: onClear,
                onPostCompose: onPostCompose,
                useNativeMapFeatureStyles: false,
                showArea: false,
                showExtent: true,
                getVertexStyle: getVertexStyle,
                getLineStringStyle: getLineStringStyle,
                setInterface: onLSEdInited
            });
            new tf.TFMap.LSEd(commonSettings);
        }
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
