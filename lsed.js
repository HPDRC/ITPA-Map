"use strict";

tf.TFMap.LSEd = function (settings) {
    var theThis, map, layer, fillLayer, isActive;
    var allEventDispatchers, geomUpdateEventName, activationEventName;
    var minZIndexVertex, indexZIndexStep, minLineStringZIndex, minCloseAreaZIndex;
    var lineString, lineStringFeature, areaFeature, closePolyEdgeFeature, vertexFeatures, vertexInfos, lsHoverFeature;
    var vertexMapFeatureCache;
    var coordsLSHover;
    var showMapFeatureToolTipCB, onDoubleClickFeatureCB, onLayoutChangeCB;
    var maxPoints;
    var getVertexStyleCB;
    var getLineStringStyleCB;
    var getAreaStyleCB;
    var getClosePolyEdgeStyleCB;
    var showArea, showIntermediateLenghts;
    var featuresInLayer, closeAreaInLayer;
    var onPostComposeCB, onClearCB, requestCloseCB;
    var requestCloseSender;
    var showMeasures, showExtent;
    var colorTicNormalMap, colorTicNormalHybrid;
    var distances3Units;
    var scaleExtent;
    var lastDrawResult;
    var myInterface;
    var geomUpdated;
    var lastExtentDrawResult;

    function canAdd() { return lineString.length < maxPoints; }

    function showMapFeatureToolTip(mapFeature, atCoords) { if (!!showMapFeatureToolTipCB) { showMapFeatureToolTipCB(mapFeature, atCoords); } }

    function hideMapFeatureToolTip() { return showMapFeatureToolTip(undefined, undefined); }

    function getMinZIndexForIndex(index, isHover) {
        var indexUse = index == undefined ? (maxPoints + 1) : (isHover ? (maxPoints + 2) : index);
        return indexUse * indexZIndexStep + minZIndexVertex;
    }

    function getMinZIndexForMapFeature(mapFeature, isHover) {
        var editProps = getEditProps(mapFeature);
        var index = !!editProps ? editProps.index : undefined;
        return getMinZIndexForIndex(index, isHover);
    }

    function getDefaultLineStringStyle(mapFeature) {
        var minZIndex = minLineStringZIndex;
        return [{ line: true, line_width: 12, line_color: "#fff", line_opacity: 1, zindex: minZIndex++ }, { line: true, line_width: 8, line_color: "#aaf", zindex: minZIndex++ }];
    }

    function getLineStringStyle(mapFeature) {
        return !!getLineStringStyleCB ?
            getLineStringStyleCB({ sender: theThis, minZIndex: minLineStringZIndex, mapFeature: mapFeature, isHover: mapFeature.GetIsDisplayingInHover() }) :
            getDefaultLineStringStyle(mapFeature);
    }

    function getClosePolyEdgeStyle(keyedFeature, mapFeature) {
        var style;
        if (!!getClosePolyEdgeStyleCB) {
            style = getClosePolyEdgeStyleCB({ sender: theThis, minZIndex: minCloseAreaZIndex, mapFeature: mapFeature, isHover: mapFeature.GetIsDisplayingInHover() })
        }
        else {
            style = getDefaultLineStringStyle(keyedFeature, mapFeature);
            style[1].line_dash = [10, 20];
            style[1].line_width -= 2;
            style[1].zindex = minCloseAreaZIndex;
            style = style[1];
        }
        return style;
    }

    function getAreaStyle(mapFeature) {
        var style;
        var minZIndex = 1;
        if (!!getAreaStyleCB) {
            style = getAreaStyleCB({ sender: theThis, minZIndex: minZIndex, mapFeature: mapFeature, isHover: mapFeature.GetIsDisplayingInHover() });
        }
        else {
            style = { zindex: minZIndex++, fill: true, fill_color: "#fff", fill_opacity: 35 };
        }
        return style;
    }

    function getVertexStyle(keyedFeature, mapFeature) {
        var editProps = getEditProps(mapFeature);
        var isHover = mapFeature.GetIsDisplayingInHover();
        var index = editProps.index;
        var zindex = getMinZIndexForIndex(index, isHover);
        var style;
        if (!!getVertexStyleCB) {
            style = getVertexStyleCB({ sender: theThis, mapFeature: mapFeature, minZIndex: zindex, index: index, isVertex: index != undefined, isHover: isHover });
        }
        else {
            var radius = 18;
            var snaptopixel = false;
            var fontFamily = "px Roboto";
            style = [{
                snaptopixel: snaptopixel, zindex: zindex++,
                circle: true, circle_radius: radius, line: true, fill: true, fill_color: "#fdfdff", line_color: "#026", line_width: 2, line_opacity: 70, fill_opacity: 100
            }];
            var textStyle = {
                snaptopixel: snaptopixel, font: "400 " + (2 * radius) + fontFamily,
                zindex: zindex++, text: true, fill: true, fill_color: "#026", line: true, line_opacity: 30, line_color: "#bfbfbf", line_width: 1,
                label: '+'
            };
            if (index != undefined) { textStyle.font = "600 " + (radius) + fontFamily; textStyle.label = '#' + (1 + index); }
            style.push(textStyle);
        }
        return style;
    }

    function createVertexMapFeature() {
        var mapFeature = new tf.map.Feature({ type: 'point', coordinates: [0, 0], style: getVertexStyle, hoverStyle: getVertexStyle, LSEdSettings: { isVertex: true, index: undefined }, showToolTip: true });
        return mapFeature;
    }

    function getEditProps(mapFeature) { return mapFeature.GetSettings().LSEdSettings; }

    function deleteVertexMapFeature(notification) { }

    function getNextVertexMapFeature() {
        var mapFeature = vertexMapFeatureCache.GetNext(), editProps = getEditProps(mapFeature);
        editProps.index = undefined;
        var toolTipText = tf.TFMap.MapTwoLineSpan("Add point", "click or drag");
        tf.TFMap.SetMapFeatureToolTipProps(mapFeature, { toolTipText: toolTipText, offsetX: 20, delayMillis: tf.TFMap.AddWayPointToolTipDelayMillis });
        return mapFeature;
    }

    function getLineStringGeom() { return lineString.length >= 2 ? { type: "linestring", coordinates: lineString.slice(0) } : undefined; }
    function getPolygonGeom() {
        if (lineString.length >= 3) {
            var coordsUse = lineString.slice(0);
            coordsUse.push(coordsUse[0]);
            return { type: "polygon", coordinates: [coordsUse] };
        }
    }

    function calcGeom(forArea, forClosePolyEdge) {
        var coordsUse, type, styleFunction;
        if (forArea) {
            type = 'polygon';
            styleFunction = getAreaStyle;
            coordsUse = lineString.slice(0);
            if (coordsUse.length > 0) { coordsUse.push(coordsUse[0]); }
            coordsUse = [coordsUse];
        }
        else {
            type = 'linestring';
            if (forClosePolyEdge) {
                var lineStringLen = lineString.length;
                if (lineStringLen > 0) { coordsUse = [lineString[0]]; coordsUse.push(lineString[lineStringLen - 1]); } else { coordsUse = []; }
                styleFunction = getClosePolyEdgeStyle;
            }
            else { coordsUse = lineString; styleFunction = getLineStringStyle; }
        }
        return { type: type, coordinates: coordsUse, style: styleFunction, hoverStyle: styleFunction, LSEdSettings: { isLineString: !forArea, isArea: forArea } };
    }

    function checkCloseAreaInLayer() {
        if (!!closePolyEdgeFeature) {
            var lineStringLen = lineString.length;
            if (lineStringLen > 2) {
                //tf.TFMap.SetMapFeatureToolTipProps(areaFeature, { toolTipText: "Area", offsetX: 20, delayMillis: tf.TFMap.AddWayPointToolTipDelayMillis });
                var firstCoords = lineString[0], lastCoords = lineString[lineStringLen - 1];
                var midCoords = [firstCoords[0] + (lastCoords[0] - firstCoords[0]) / 2, firstCoords[1] + (lastCoords[1] - firstCoords[1]) / 2];
                areaFeature.GetSettings().toolTipCoords = midCoords;
                if (!closeAreaInLayer) {
                    if (showArea) {
                        closeAreaInLayer = true;
                        layer.AddMapFeature(closePolyEdgeFeature);
                    }
                }
                else {
                    if (!showArea) {
                        closeAreaInLayer = false;
                        layer.DelMapFeature(closePolyEdgeFeature);
                    }
                }
            }
            else { if (closeAreaInLayer) { closeAreaInLayer = false; layer.DelMapFeature(closePolyEdgeFeature); } }
        }
    }

    function removeFaturesFromLayer() {
        if (featuresInLayer) {
            layer.DelMapFeature(lineStringFeature);
            if (showArea) {
                fillLayer.DelMapFeature(areaFeature);
                if (closeAreaInLayer) { layer.DelMapFeature(closePolyEdgeFeature); closeAreaInLayer = false; }
            }
            featuresInLayer = false;
        }
    }

    function addFeaturesToLayer() {
        if (!featuresInLayer) {
            layer.AddMapFeature(lineStringFeature);
            if (showArea) { fillLayer.AddMapFeature(areaFeature); checkCloseAreaInLayer(); }
            featuresInLayer = true;
        }
        else { checkCloseAreaInLayer(); }
    }

    function setShowArea(newShowArea) {
        if (showArea != (newShowArea = !!newShowArea)) {
            showArea = newShowArea;
            geomUpdated = true;
            if (featuresInLayer) {
                if (showArea) {
                    fillLayer.AddMapFeature(areaFeature);
                }
                else {
                    fillLayer.DelMapFeature(areaFeature);
                }
                checkCloseAreaInLayer();
            }
            else {
                checkNotifyGeomUpdated();
            }
        }
    }

    function getShowArea() { return showArea; }

    function checkFeaturesInLayer() { if (lineString.length > 1) { addFeaturesToLayer(); } else { removeFaturesFromLayer(); } }

    function updateGeom() {
        var geom = calcGeom(false, false);
        var areaGeom = calcGeom(true, false);;
        var closePolyEdgeGeom = calcGeom(false, true);
        if (!!lineStringFeature) {
            lineStringFeature.SetGeom(new tf.map.FeatureGeom(geom));
            closePolyEdgeFeature.SetGeom(new tf.map.FeatureGeom(closePolyEdgeGeom))
            areaFeature.SetGeom(new tf.map.FeatureGeom(areaGeom));
        }
        else {
            lineStringFeature = new tf.map.Feature(geom);
            areaFeature = new tf.map.Feature(areaGeom);
            var toolTipText = tf.TFMap.MapTwoLineSpan("Add point", "click or drag");
            closePolyEdgeFeature = new tf.map.Feature(closePolyEdgeGeom);
        }
        calcVertexInfos();
        checkFeaturesInLayer();
        geomUpdated = true;
    }

    function calcVertexInfos() {
        var areaGeom = !!areaFeature ? areaFeature.GetGeom() : undefined;
        var area = !!areaGeom ? areaGeom.GetArea() : undefined;
        //console.log(area);
        vertexInfos = tf.js.CalcVertexInfos(lineString, area);
    }

    function addLineStringPoint(index, pointCoordsToCopyFrom, skipNotifications) {
        var pointCoords = pointCoordsToCopyFrom.slice(0);
        lineString.splice(index, 0, pointCoords);
        setCoordsLSHover(undefined);
        var vertexFeature = getNextVertexMapFeature(), editProps = getEditProps(vertexFeature);
        vertexFeatures.splice(index, 0, vertexFeature);
        editProps.index = lineString.length - 1;
        vertexFeature.SetPointCoords(pointCoords);
        var toolTipText = tf.TFMap.MapTwoLineSpan("drag to move", "click to delete");
        tf.TFMap.GetMapFeatureToolTipProps(vertexFeature).toolTipText = toolTipText;
        layer.AddMapFeature(vertexFeature);
        vertexFeature.RefreshStyle();
        updateGeom();
        if (!skipNotifications) {
            hideMapFeatureToolTip();
            map.Render();
        }
    }

    function renumVertexFeatures() {
        var nf = vertexFeatures.length; for (var i = 0; i < nf; ++i) { var vf = vertexFeatures[i], editProps = getEditProps(vf); editProps.index = i; vf.RefreshStyle(); }
    }

    function onHoverFeature(notification) {
        var handled = false;
        var mapFeature = notification.mapFeature, editProps = getEditProps(mapFeature);
        if (!!editProps) {
            if (editProps.isLineString) {
                var needsRender;
                if (notification.isInHover && mapFeature == lineStringFeature && lineString.length > 1) {
                    needsRender = setCoordsLSHover(notification.eventCoords);
                }
                else { needsRender = setCoordsLSHover(undefined); }
                if (needsRender) { map.Render(); }
            }
            //handled = true;
        }
        return handled;
    }

    function setCoordsLSHover(newCoords) {
        var modified = false;
        if (newCoords != undefined) {
            if (canAdd()) {
                var hitTestAddWayPoint = tf.helpers.HitTestMapCoordinatesArray(lineString, newCoords, undefined, undefined, undefined);
                if (hitTestAddWayPoint.closestPoint != undefined) {
                    var newCoords = hitTestAddWayPoint.closestPoint;
                    if (coordsLSHover == undefined || (newCoords[0] != coordsLSHover[0] || newCoords[1] != coordsLSHover[1])) {
                        lsHoverFeature.SetPointCoords(coordsLSHover = newCoords);
                        showMapFeatureToolTip(lsHoverFeature, undefined);
                        modified = true;
                    }
                }
            }
        }
        else if (coordsLSHover != undefined) {
            coordsLSHover = undefined;
            hideMapFeatureToolTip();
            modified = true;
        }
        return modified;
    }

    function onMouseMoveFeature(notification) {
        var pointCoords = notification.mapFeature == lineStringFeature ? notification.eventCoords : undefined;
        if (setCoordsLSHover(pointCoords)) { map.Render(); }
    }

    function appendPoint(pointCoords, skipNotifications) { addLineStringPoint(lineString.length, pointCoords, skipNotifications); }

    function AddPointAtCoords(isDrag, coordsToAddPoint) {
        if (!!coordsToAddPoint) {
            var hitTestAddWayPoint = tf.helpers.HitTestMapCoordinatesArray(lineString, coordsToAddPoint, undefined, undefined, undefined);
            if (hitTestAddWayPoint.closestPoint != undefined) {
                var indexAdd = hitTestAddWayPoint.minDistanceIndex;
                if (indexAdd < lineString.length - 1) { ++indexAdd; }
                //console.log('adding at: ' + indexAdd + 'isDrag: ' + isDrag);
                addLineStringPoint(indexAdd, coordsToAddPoint);
                renumVertexFeatures();
            }
        }
    }

    function addPointAtCoordsLSHover(isDrag) { AddPointAtCoords(isDrag, coordsLSHover); }

    function delLineStringPoint(index, fromBeginning) {
        if (lineString.length > 1) {
            if (fromBeginning) {
                lineString.splice(0, index);
                for (var i = 0; i < index; ++i) {
                    layer.DelMapFeature(vertexFeatures[i]);
                }
                vertexFeatures.splice(0, index);
            }
            else {
                lineString.splice(index, 1);
                layer.DelMapFeature(vertexFeatures[index]);
                vertexFeatures.splice(index, 1);
            }
            renumVertexFeatures();
            updateGeom();
        }
        else { clear(); }
    }

    function onClickMap(notification) {
        var handled = canAdd();
        if (handled) { appendPoint(notification.eventCoords); }
        return handled;
    }

    function onDragFeature(notification) {
        var handled = false, mapFeature = notification.mapFeature, editProps = getEditProps(mapFeature);
        if (handled = !!editProps) { if (editProps.index == undefined) { addPointAtCoordsLSHover(true); } }
        return handled;
    }

    function onClickFeature(notification) {
        var handled = false, mapFeature = notification.mapFeature, editProps = getEditProps(mapFeature);
        if (handled = !!editProps) {
            if (editProps.index == undefined) {
                if (mapFeature == lineStringFeature) {
                    addPointAtCoordsLSHover(false);
                }
                else {
                    //AddPointAtCoords(false, notification.eventCoords);
                    appendPoint(notification.eventCoords);
                }
            }
            else {
                delLineStringPoint(editProps.index, notification.mapEvent.originalEvent.ctrlKey);
            }
        }
        return handled;
    }

    function onDrag(notification) {
        if (notification.dragProps.editorProps.isVertex) {
            lineString[notification.dragProps.editorProps.index] = notification.mapFeatureToDrag.GetPointCoords();
            updateGeom();
        }
    }

    function checkCanStartDrag(notification) {
        var dragProps, mapFeature = notification.mapFeature, editProps = getEditProps(mapFeature);
        if (!!editProps) { if (editProps.isVertex && editProps.index != undefined) { return { isVertex: true, index: editProps.index }; } }
        return dragProps;
    }

    function getIsShowingHybrid() { return map.GetMapType() != tf.consts.typeNameMap; }

    function drawLineSeg(map, ctx, startPoint, endPoint) {
        var startPointPx = map.MapToPixelCoords(startPoint), endPointPx = map.MapToPixelCoords(endPoint);
        ctx.moveTo(startPointPx[0], startPointPx[1]);
        ctx.lineTo(endPointPx[0], endPointPx[1]);
    }

    function drawLineString(map, ctx, lsPoints, close) {
        var nPoints = lsPoints.length;
        if (nPoints > 1) {
            for (var i = 0; i < nPoints - 1; ++i) { drawLineSeg(map, ctx, lsPoints[i], lsPoints[i + 1]); }
            if (close && nPoints > 2) { drawLineSeg(map, ctx, lsPoints[nPoints - 1], lsPoints[0]); }
        }
    }

    function drawExtent(map, ctx, extent, lineWidth, strokeColor) {
        var topLeft = [extent[0], extent[1]], topRight = [extent[2], extent[1]], bottomRight = [extent[2], extent[3]], bottomLeft = [extent[0], extent[3]];
        ctx.lineWidth = lineWidth != undefined ? lineWidth : 20;
        ctx.strokeStyle = strokeColor != undefined ? strokeColor : "#f00";
        ctx.beginPath();
        drawLineString(map, ctx, [topLeft, topRight, bottomRight, bottomLeft], true);
        ctx.closePath();
        ctx.stroke();
        return extent;
    }

    function drawClippedEdge(map, ctx, startPoint, endPoint, extent) {
        var lineClip = tf.js.ClipMapLineSegment(extent, startPoint, endPoint);
        if (lineClip.intersects) {
            ctx.line_width = 20;
            ctx.strokeStyle = "#fc0";
            ctx.beginPath();
            drawLineSeg(map, ctx, lineClip.startCoord, lineClip.endCoord);
            ctx.closePath(); ctx.stroke();
        }
    }

    function drawClippedEdges(map, ctx, vertexInfos, extent) {
        var nPoints = vertexInfos.length;
        if (nPoints >= 2) {
            for (var i = 0; i < nPoints; ++i) {
                var thisVertex = vertexInfos[i], thisPoint = thisVertex.coords, nextPoint = thisVertex.nextCoords;
                drawClippedEdge(map, ctx, thisPoint, nextPoint, extent);
            }
        }
    }

    function drawMeasuredExtent(map, ctx, extentToCalc, extentToDraw) {
        var left = extentToDraw[0], top = extentToDraw[1], right = extentToDraw[2], bottom = extentToDraw[3];
        var v1 = [left, top], v2 = [right, top], v3 = [right, bottom], v4 = [left, bottom];
        var extentPoly = [v4, v3, v2, v1];
        var extentArea = tf.js.CalcPolyAreaInSquareMeters(extentPoly);
        var polyVertexInfos = tf.js.CalcVertexInfos(extentPoly, extentArea);
        var showingHybrid = getIsShowingHybrid();
        var colorTic = showingHybrid ? colorTicNormalHybrid : colorTicNormalMap;
        var colorSeg = showingHybrid ? settings.optionalExtentColorSegHybrid : settings.optionalExtentColorSegMap;
        var textStyle = showingHybrid ? settings.optionalHybridTextStyle : settings.optionalMapTextStyle;

        lastExtentDrawResult = tf.js.DrawMeasuredVertices({
            map: map, ctx: ctx, distances3Units: distances3Units, vertexInfos: polyVertexInfos, showArea: true, showingHybrid: showingHybrid,
            colorTic: colorTic, colorSeg: colorSeg, extent: extentToDraw, showIntermediateLenghts: true, textStyle: textStyle,
            lineWidth: settings.optionalExtentSegWidth
        });
    }

    function onPostCompose(notification) {
        if (!!coordsLSHover) { notification.showFeatureImmediately(lsHoverFeature); }
        if (!!onPostComposeCB) { onPostComposeCB({ sender: theThis, notification: notification }); }

        if (showMeasures) {
            var canvas = notification.canvas, ctx = canvas.getContext("2d");
            var extent = map.GetVisibleExtent();
            var extentScale = scaleExtent;

            if (extentScale != 1) {
                extent = tf.js.ScaleMapExtent(extent, extentScale);
                drawExtent(map, ctx, extent, 3, "#00f");
                drawClippedEdges(map, ctx, vertexInfos, extent);
            }

            var nPoints = vertexInfos.length;
            if (nPoints >= 2) {
                var showingHybrid = getIsShowingHybrid();
                var colorTic = showingHybrid ? colorTicNormalHybrid : colorTicNormalMap;
                var colorSeg = showingHybrid ? settings.optionalColorSegHybrid : settings.optionalColorSegMap;
                var textStyle = showingHybrid ? settings.optionalHybridTextStyle : settings.optionalMapTextStyle;

                lastDrawResult = tf.js.DrawMeasuredVertices({
                    map: map, ctx: ctx, distances3Units: distances3Units, vertexInfos: vertexInfos, showArea: showArea, showingHybrid: showingHybrid,
                    colorTic: colorTic, colorSeg: colorSeg, extent: extent, showIntermediateLenghts: showIntermediateLenghts, textStyle: textStyle,
                    lineWidth: settings.optionalSegWidth
                });

                if (showExtent && lastDrawResult.vertexExtent != undefined) { drawMeasuredExtent(map, ctx, extent, lastDrawResult.vertexExtent); }

                if (extentScale != 1) { console.log('nTics: ' + lastDrawResult.nTics + ' drawn: ' + lastDrawResult.nTicsDrawn); }
            }
        }
        checkNotifyGeomUpdated();
    }

    function checkNotifyGeomUpdated() { if (geomUpdated) { geomUpdated = false; notify(geomUpdateEventName, {}); } }

    function clear(skipRender) {
        layer.RemoveAllFeatures();
        vertexMapFeatureCache.Reset();
        lsHoverFeature = getNextVertexMapFeature();
        closeAreaInLayer = false;
        lineString = [];
        vertexFeatures = [];
        vertexInfos = [];
        featuresInLayer = false;
        if (!!onClearCB) { onClearCB({ sender: theThis }); }
        geomUpdated = true;
        if (!skipRender) {
            map.Render();
        }
        //if (!!requestCloseCB) { requestCloseCB({ sender: requestCloseSender }); }
    };

    function getLineString() { return lineString; }
    function getVertexInfos() { return vertexInfos; }

    function onMapScaleUnit() { hideMapFeatureToolTip(); geomUpdated = true; map.Render(); }

    function notifyActivation() { notify(activationEventName, {}); }

    function activate() {
        if (isActive) { console.log('double activation') }
        else {
            isActive = true;
            refreshStyles();
            settings.fillLayer.SetVisible(true);
            settings.layer.SetVisible(true);
            geomUpdated = true;
            map.Render();
            notifyActivation();
        }
    }

    function deActivate() {
        if (!isActive) { console.log('double deactivation'); }
        else {
            isActive = false;
            settings.fillLayer.SetVisible(false);
            settings.layer.SetVisible(false);
            notifyActivation();
        }
    }

    function getIsActive() { return isActive; }

    function getShowMeasures() { return showMeasures; }
    function setShowMeasures(newShowMeasures) {
        if (showMeasures != (newShowMeasures = !!newShowMeasures)) {
            showMeasures = newShowMeasures;
            map.Render();
        }
    }

    function getShowExtent() { return showExtent; }
    function setShowExtent(newShowExtent) {
        if (showExtent != (newShowExtent = !!newShowExtent)) {
            showExtent = newShowExtent;
            map.Render();
        }
    }

    function getDistance3Units() { return distances3Units; }

    var notifyTimeout;

    function notify2(eventName, props) {
        if (notifyTimeout != undefined) { clearTimeout(notifyTimeout); }
        notifyTimeout = setTimeout(function () {
            allEventDispatchers.Notify(eventName, tf.js.ShallowMerge(props, { sender: theThis, senderI: myInterface, eventName: eventName }));
        }, 100);
    }

    function notify(eventName, props) {
        //return;
        allEventDispatchers.Notify(eventName, tf.js.ShallowMerge(props, { sender: theThis, senderI: myInterface, eventName: eventName }));
    }

    function addUpdateGeomListener(callBack) { allEventDispatchers.AddListener(geomUpdateEventName, callBack); }
    function addActivationListener(callBack) { allEventDispatchers.AddListener(activationEventName, callBack); }

    function getInfo() {
        var lengthOpen, lengthClosed, area;
        var nPoints = vertexInfos.length;
        if (nPoints >= 2) {
            var lastVertex = vertexInfos[nPoints - 1];
            lengthOpen = lastVertex.totalDistance;
            if (nPoints > 2) {
                lengthClosed = lengthOpen + lastVertex.distanceToNext;
                area = lastVertex.area;
            }
        }
        return {
            lineString: lineString, lastExtentDrawResult: lastExtentDrawResult, lastDrawResult: lastDrawResult, nPoints: nPoints,
            lengthOpen: lengthOpen, lengthClosed: lengthClosed, area: area
        };
    }

    function setShowIntermediateLengths(newShow) {
        if (showIntermediateLenghts != (newShow = !!newShow)) {
            showIntermediateLenghts = newShow;
            map.Render();
        }
    }

    function getShowIntermediateLengths() { return showIntermediateLenghts; }

    function onDoubleClickFeature(notification) {
        if (!!onDoubleClickFeatureCB) {
            var editProps = getEditProps(notification.mapFeature);
            onDoubleClickFeatureCB({ sender: theThis, notification: notification, isEditorFeature: editProps != undefined });
        }
    }

    function refreshStyles() {
        if (!!lineStringFeature) { lineStringFeature.RefreshStyle(); }
        if (!!areaFeature) { areaFeature.RefreshStyle(); }
        if (!!closePolyEdgeFeature) { closePolyEdgeFeature.RefreshStyle(); }
        for (var i in vertexFeatures) { vertexFeatures[i].RefreshStyle(); }
    }

    function onLayoutChange(notification) {
        refreshStyles();
        if (!!onLayoutChangeCB) { onLayoutChangeCB({ sender: theThis, notification: notification }); }
    }

    function setLineString(newLineString) {
        if (tf.js.GetLooksLikeLineStringCoords(newLineString)) {
            clear(true);
            var nPoints = newLineString.length;
            if (nPoints > maxPoints) { nPoints = maxPoints; }
            //console.log('appending ' + nPoints + ' points out of ' + newLineString.length);
            for (var i = 0; i < nPoints ; ++i) { appendPoint(newLineString[i], true); }
            hideMapFeatureToolTip();
            map.Render();
        }
    }

    function initialize() {
        if (tf.js.GetFunctionOrNull(settings.setInterface)) {
            allEventDispatchers = new tf.events.MultiEventNotifier({
                eventNames: [
                    geomUpdateEventName = "geomUpdate",
                    activationEventName = "actvation"
                ]
            });
            var maxMaxPoints = 50000;
            var defMaxPoints = maxMaxPoints;
            minCloseAreaZIndex = 20;
            minLineStringZIndex = 50;
            minZIndexVertex = 100;
            indexZIndexStep = 5;
            maxPoints = tf.js.GetIntNumberInRange(settings.maxPoints, 2, maxMaxPoints, defMaxPoints);
            map = settings.map;
            layer = settings.layer;
            fillLayer = settings.fillLayer;
            lineString = [];
            vertexFeatures = [];
            vertexInfos = [];
            showMapFeatureToolTipCB = tf.js.GetFunctionOrNull(settings.showMapFeatureToolTip);
            onPostComposeCB = tf.js.GetFunctionOrNull(settings.onPostCompose);
            onClearCB = tf.js.GetFunctionOrNull(settings.onClear);
            requestCloseCB = tf.js.GetFunctionOrNull(settings.requestClose);
            onDoubleClickFeatureCB = tf.js.GetFunctionOrNull(settings.onDoubleClickFeature);
            vertexMapFeatureCache = new tf.js.ObjectCache({ createNew: createVertexMapFeature, onDelete: deleteVertexMapFeature });
            colorTicNormalMap = settings.colorTicNormalMap != undefined ? settings.colorTicNormalMap : "#1E90FF";
            colorTicNormalHybrid = settings.colorTicNormalHybrid != undefined ? settings.colorTicNormalHybrid : "#fff";
            distances3Units = tf.js.GetIsValidObject(settings.distances3Units) ? settings.distances3Units : tf.js.CalcDistances3Units();
            if (!settings.useNativeMapFeatureStyles) {
                getVertexStyleCB = tf.js.GetFunctionOrNull(settings.getVertexStyle);
                getLineStringStyleCB = tf.js.GetFunctionOrNull(settings.getLineStringStyle);
                getAreaStyleCB = tf.js.GetFunctionOrNull(settings.getAreaStyle);
                getClosePolyEdgeStyleCB = tf.js.GetFunctionOrNull(settings.getClosePolyEdgeStyle);
            }
            scaleExtent = settings.scaleExtent != undefined ? settings.scaleExtent : 1;
            showMeasures = !!settings.showMeasures;
            showExtent = !!settings.showExtent;
            showArea = !!settings.showArea;
            //showIntermediateLenghts = false;
            showIntermediateLenghts = true;
            featuresInLayer = closeAreaInLayer = false;
            lsHoverFeature = getNextVertexMapFeature();
            requestCloseSender = !!settings.requestCloseSender ? settings.requestCloseSender : theThis;
            settings.layer.SetVisible(false);
            onLayoutChangeCB = tf.js.GetFunctionOrNull(settings.onLayoutChange);
            isActive = false;
            myInterface = {
                sender: theThis,
                onLayoutChange: onLayoutChange,
                activate: activate,
                deActivate: deActivate,
                getIsActive: getIsActive,
                getInfo: getInfo,
                setShowArea: setShowArea,
                getShowArea: getShowArea,
                setShowExtent: setShowExtent,
                getShowExtent: getShowExtent,
                getShowMeasures: getShowMeasures,
                setShowMeasures: setShowMeasures,
                setShowIntermediateLengths: setShowIntermediateLengths,
                getShowIntermediateLengths: getShowIntermediateLengths,
                getDistance3Units: getDistance3Units,
                getAreaFeature: function () { return areaFeature; },
                getLineStringFeature: function () { return lineStringFeature; },
                getClosePolyEdgeFeature: function () { return closePolyEdgeFeature; },
                getLineString: getLineString,
                setLineString: setLineString,
                getVertexInfos: getVertexInfos,
                getLineStringGeom: getLineStringGeom,
                getPolygonGeom: getPolygonGeom,
                addActivationListener: addActivationListener,
                addUpdateGeomListener: addUpdateGeomListener,
                canAdd: canAdd,
                clear: clear,
                onDrag: onDrag,
                onClickMap: onClickMap,
                onHoverFeature: onHoverFeature,
                onMouseMoveFeature: onMouseMoveFeature,
                onDragFeature: onDragFeature,
                onClickFeature: onClickFeature,
                onDoubleClickFeature: onDoubleClickFeature,
                onPostCompose: onPostCompose,
                checkCanStartDrag: checkCanStartDrag,
                getMinZIndexForMapFeature: getMinZIndexForMapFeature,
                onMapScaleUnit: onMapScaleUnit
            };
            settings.setInterface(myInterface);

            /*setTimeout(function () {
                var sc = [-80.28971178737089, 25.70438683086026];
                var ec = [-80.19309489139326, 25.768850196037747];
                appendPoint(sc);
                appendPoint(ec);
            }, 1000);*/
        }
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
