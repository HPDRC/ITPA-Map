"use strict";

tf.TFMap.MapMeasureTool = function (settings) {
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
        var lineVisibleWidth = tf.TFMap.LayoutSettings.measureToolEdgeWidthInt;
        var lineInvisibleWidthInc = isHover ? 6 : 4;
        var lineColor = getIsShowingHybrid() ? colorTicNormalHybrid : colorTicNormalMap;
        var style = [
            { line: true, line_width: lineVisibleWidth + lineInvisibleWidthInc, line_color: "#000", line_opacity: 5, zindex: minZIndex++ },
            { line: true, line_width: lineVisibleWidth, line_color: lineColor, zindex: minZIndex++ }
        ];
        return style;
    }

    function getClosePolyEdgeStyle(notification) {
        var minZIndex = notification.minZIndex;
        var lineVisibleWidth = 3;
        var lineColor = getIsShowingHybrid() ? "#ddd" : "#777";
        var dashGap = 5;
        var style = { line: true, line_width: lineVisibleWidth, line_color: lineColor, zindex: minZIndex++, line_dash: [dashGap, dashGap], line_opacity: 70 };
        return style;
    }

    function getAreaStyle(notification) {
        var isHover = notification.isHover;
        var minZIndex = notification.minZIndex;
        var fillColor, fillOpacity = isHover ? 35 : 25;
        if (getIsShowingHybrid()) { fillColor = "#bebebe"; }
        else { fillColor = "#fff"; }
        var style = { zindex: minZIndex++, fill: true, fill_color: fillColor, fill_opacity: fillOpacity };
        return style;
    }

    function onPostCompose(notification) {
        //var vertexInfos = lsEdI.getVertexInfos(), nPoints = vertexInfos.length;
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
        if (!!onClearCB) { onClearCB({ sender: theThis } ) }
        //console.log('cleared');
    }

    function onLSEdInited(notification) {
        var myInterface = {
            sender: theThis,
            updateForMapType: updateForMapType
        };
        settings.setInterface(tf.js.ShallowMerge(lsEdI = notification, myInterface));
    }

    function onDoubleClickFeature(notification) {
        if (notification.isEditorFeature) {
            var lineStringGeom = lsEdI.getLineStringGeom();
            if (lineStringGeom != undefined) {
                var info = lsEdI.getInfo();
                var lengthOpen = info.lengthOpen != undefined ? info.lengthOpen : 0;
                var geoJSON = {
                    type: "FeatureCollection",
                    features: []
                };
                var lineStringFeature = {
                    type: "Feature",
                    geometry: lineStringGeom,
                    properties: {
                        name: "measure distance linestring",
                        lengthInMeters: lengthOpen
                    }
                };
                geoJSON.features.push(lineStringFeature);
                var polyGeom = lsEdI.getPolygonGeom();
                if (polyGeom != undefined) {
                    var lengthClosed = info.lengthClosed != undefined ? info.lengthClosed : 0;
                    var area = info.area != undefined ? info.area : 0;
                    var polyStringFeature = {
                        type: "Feature",
                        geometry: polyGeom,
                        properties: {
                            name: "measure area polygon",
                            lengthInMeters: lengthClosed,
                            areaInSqMeters: area
                        }
                    };
                    geoJSON.features.push(polyStringFeature);
                }
                var geoJSONWindow = window.open(null, "_blank");
                if (!!geoJSONWindow) {
                    var geoJSONDoc = geoJSONWindow.document;
                    geoJSONDoc.write(JSON.stringify(geoJSON));
                    geoJSONDoc.title = "Measure Tool GeoJSON";
                    geoJSONWindow.focus();
                }
            }
        }
    }

    function initialize() {
        if (tf.js.GetFunctionOrNull(settings.setInterface)) {
            onClearCB = tf.js.GetFunctionOrNull(settings.onClear);
            colorTicNormalMap = "#1E90FF";
            colorTicNormalHybrid = "#fff";
            var textShowSettingsHybrid = { fontFamily: "Roboto", lineWidth: 4, textFill: "#fff", textLine: "rgba(0, 0, 0, 0.7)", fontSize: "12px", fontWeight: "400" };
            var textShowSettingsMap = { fontFamily: "Roboto", lineWidth: 1, textFill: "rgba(30, 144, 255, 1)", textLine: "rgba(0, 0, 0, 0.7)", fontSize: "11px", fontWeight: "300" };
            var commonSettings = tf.js.ShallowMerge(settings, {
                //scaleExtent: 0.7,
                onDoubleClickFeature: onDoubleClickFeature,
                optionalMapTextStyle: textShowSettingsMap,
                optionalHybridTextStyle: textShowSettingsHybrid,
                colorTicNormalMap: colorTicNormalMap,
                colorTicNormalHybrid: colorTicNormalHybrid,
                showMeasures: true,
                requestCloseSender: theThis,
                onClear: onClear,
                onPostCompose: onPostCompose,
                useNativeMapFeatureStyles: false,
                showArea: true,
                getVertexStyle: getVertexStyle,
                getLineStringStyle: getLineStringStyle,
                getAreaStyle: getAreaStyle,
                getClosePolyEdgeStyle: getClosePolyEdgeStyle,
                setInterface: onLSEdInited
            });
            new tf.TFMap.LSEd(commonSettings);
        }
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

