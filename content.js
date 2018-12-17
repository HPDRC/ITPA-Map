"use strict";

tf.TFMap.Content = function (settings) {
    var customAppMinZIndex;
    var theThis, appStyles, appCtx, appSizer, map, mapTypeAuxMap, lastCtx, clusterZIndex;
    var toaster, scaleElem;
    var multiMenus, toolTipDisplayer, appDiv, rootDiv, mapDiv, mapMapDiv;
    var sidePane, bottomPane, searchBar, mapFeaturePropsDisplayer, directionsPanel;
    var mapToolBar, mapCompass, mapMoreTools, dataSetSearches, dataSetsBar, overMapCanvas, mapTypeAuxMapWrapper;
    var mapClickedLocation, mapUserLocation, mapSearchLocation, pinMapFeature;
    var photoList, photoListDisplayer, photoDisplayer;
    var mapClickedLocationLayer, mapUserLocationLayer, mapPinsLayer, mapDirectionsLayer, mapDirectionsPinsLayer, mapDirectionItemsLayer, mapDirectionWayPointsLayer;
    var measureToolLayer, downloadToolLayer, bottomCustomAppLayer, bottomFillLayerMeasureLayer, bottomFillLayerDownloadLayer;
    var additionalFeaturesLayer, searchLayerHybridB, searchLayerMapB;
    var showingAerial, isUsingClusters, isBottomPaneUp, skipFirstMapFeatureProps, diffLevelMapTypeAux;
    var lastClusterFeatures, centerMapOnToolTipOpen;
    var baseLayersPanel, baseLayersToolBar;
    var decodedLegendH, decodedLegendM;
    var mapFeatureWayPointCache, coordsDirectionRouteHover, mapFeatureAddWayPoint;
    var perspectiveMap;
    var mapListeners;
    var photoDisplayerParentDiv;
    var mapFeatureDragI;
    var lsEdI;
    var mapMeasureToolI, mapDownloadToolI;
    var currentEditorI;
    var hasSidePanelFullContent;
    var customAppContent;
    var inLayoutChange;
    var mapCenterDiv, mapLogoDiv;
    var usePerspectiveMap, perspectiveMapIsInitiallyVisible;
    var useBusDirections, useStageBusDirections;
    var processMapClickedLocation;

    this.GetDirectionsPanel = function () { return directionsPanel; }

    this.GetPerspectiveMap = function () { return perspectiveMap; }

    this.GetBottomCustomAppLayer = function () { return bottomCustomAppLayer; }

    this.StartLayoutChange = function() {
        if (!inLayoutChange) {
            inLayoutChange = true;
            appDiv.GetHTMLElement().style.display = 'none';
            //document.body.removeChild(appDiv.GetHTMLElement());
        }
    }

    this.EndLayoutChange = function () {
        if (inLayoutChange) {
            inLayoutChange = false;
            appDiv.GetHTMLElement().style.display = 'block';
            //document.body.appendChild(appDiv.GetHTMLElement());
            appSizer.OnResize();
        }
    }

    this.CreateCustomMapLayer = function (layerSettings, usePerspective) {
        var zIndex = tf.js.GetIntNumberInRange(layerSettings.zIndex, 0, 99999999, 0);
        layerSettings.zIndex = zIndex + customAppMinZIndex;
        var layer;
        //usePerspective = false;
        if (usePerspective && usePerspectiveMap) {
            layerSettings.overrideClass = tf.webgl.PerspectiveLayer;
            layerSettings.appContent = theThis;
        }
        return map.AddFeatureLayer(layerSettings);
    }
    this.GetCustomAppMinMapLayerZIndex = function() { return customAppMinZIndex; }

    this.CreateCustomAppContent = function (customAppContentSettings) {
        if (customAppContent == undefined) {
            customAppContent = new tf.TFMap.CustomAppContent(tf.js.ShallowMerge(customAppContentSettings, { appContent: theThis }));
        }
    }

    this.SetHasSidePanelFullContent = function (hasSidePanelFullContentSet) {
        if (hasSidePanelFullContent != (hasSidePanelFullContentSet = !!hasSidePanelFullContentSet)) {
            hasSidePanelFullContent = hasSidePanelFullContentSet;
            setBottomPaneWidth();
        }
    }

    this.GetHasSidePanelFullContent = function () { return hasSidePanelFullContent; }

    this.GetHasEffectiveSidePanelFullContent = function() {
        return lastCtx[tf.TFMap.CAN_sidePanelVisible] ? (theThis.GetHasSidePanelFullContent() || lastCtx[tf.TFMap.CAN_showingDirections]) : false;
    }

    this.GetBaseLayersPanel = function () { return baseLayersPanel; }

    this.GetMeasureToolInterface = function () { return mapMeasureToolI; }
    this.GetDownloadToolInterface = function () { return mapDownloadToolI; }

    this.IsMeasureToolOn = function () { return mapMeasureToolI != undefined && currentEditorI == mapMeasureToolI; }
    this.ToggleMeasureTool = function () { if (theThis.IsMeasureToolOn()) { deActivateCurrentEditor(); } else { activateEditor(mapMeasureToolI); } }

    this.IsDownloadToolOn = function () { return mapDownloadToolI != undefined && currentEditorI == mapDownloadToolI; }
    this.ToggleDownloadTool = function () { if (theThis.IsDownloadToolOn()) { deActivateCurrentEditor(); } else { activateEditor(mapDownloadToolI); } }

    this.OnDirectionWayPointsDiscarded = function () { mapDirectionWayPointsLayer.RemoveAllFeatures(); mapFeatureWayPointCache.Reset(); mapFeatureAddWayPoint = getNextFeatureWayPoint(); }

    function initWayPoints() {
        mapFeatureWayPointCache = new tf.js.ObjectCache({ createNew: createMapFeatureAddWayPoint, onDelete: deleteMapFeatureAddWayPoint });
        mapFeatureAddWayPoint = getNextFeatureWayPoint();
    }

    function getMapFeatureWayPointStyle(keyedFeature, mapFeature) {
        var isHover = mapFeature.GetIsDisplayingInHover();
        var radius = 10 * tf.TFMap.DirectionsFeatureDimMult;
        var zindex = isHover ? 40 : 20;
        var snaptopixel = false;
        var style = [{
            snaptopixel: snaptopixel,
            zindex: zindex++,
            circle: true, circle_radius: radius, line: true, fill: true, fill_color: "#fdfdff", line_color: "#026", line_width: 2, line_opacity: 70, fill_opacity: 100
        }];
        var mapFeatureSettings = mapFeature.GetSettings();
        if (mapFeatureSettings.wayPointIndex != undefined) {
            var textStyle = {
                snaptopixel: snaptopixel,
                font: "600 " + (radius) + "px Roboto",
                zindex: zindex++, text: true, fill: true, fill_color: "#026", line: true, line_opacity: 30, line_color: "#bfbfbf", line_width: 1,
                label: '#' + (1 + mapFeatureSettings.wayPointIndex)
            }
            style.push(textStyle);
        }
        else {
            var plusStyle = {
                snaptopixel: snaptopixel,
                font: "400 " + (2 * radius) + "px Roboto",
                zindex: zindex++, text: true, fill: true, fill_color: "#026", line: true, line_opacity: 30, line_color: "#bfbfbf", line_width: 1,
                label: '+'
            }
            style.push(plusStyle);
        }
        return style;
    }

    function createMapFeatureAddWayPoint() {
        var mapFeature = new tf.map.Feature({ type: 'point', coordinates: [0, 0], style: getMapFeatureWayPointStyle, hoverStyle: getMapFeatureWayPointStyle });
        var toolTipText = tf.TFMap.MapTwoLineSpan("Add via location", "click or drag");
        tf.TFMap.SetMapFeatureToolTipProps(mapFeature, { toolTipText: toolTipText, offsetX: 20, delayMillis: tf.TFMap.AddWayPointToolTipDelayMillis });
        var mapFeatureSettings = mapFeature.GetSettings();
        mapFeatureSettings.wayPointIsInLayer = false;
        mapFeatureSettings.wayPointIndex = undefined;
        return mapFeature;
    }

    function deleteMapFeatureAddWayPoint(notification) { }

    function getNextFeatureWayPoint() {
        var mapFeature = mapFeatureWayPointCache.GetNext();
        var mapFeatureSettings = mapFeature.GetSettings();
        mapFeatureSettings.wayPointIsInLayer = false;
        mapFeatureSettings.wayPointIndex = undefined;
        return mapFeature;
    }

    function addWayPoint(notification, isDrag) {
        //console.log('adding waypoint from ' + (isDrag ? 'drag' : 'click'));
        var toolTipText = tf.TFMap.MapTwoLineSpan("drag to move", "click to delete");
        tf.TFMap.GetMapFeatureToolTipProps(mapFeatureAddWayPoint).toolTipText = toolTipText;
        directionsPanel.AddWayPoint(mapFeatureAddWayPoint);
        mapDirectionWayPointsLayer.AddMapFeature(mapFeatureAddWayPoint);
        mapFeatureAddWayPoint.GetSettings().wayPointIsInLayer = true;
        coordsDirectionRouteHover = undefined;
        if (isDrag && !!mapFeatureDragI) { mapFeatureDragI.startDrag(mapFeatureAddWayPoint, notification.eventCoords, {}, true); }
        mapFeatureAddWayPoint = getNextFeatureWayPoint();
        deselectToolTipSender();
        map.Render();
    }

    function showMapFeatureToolTip(mapFeature, atCoords) {
        deselectToolTipSender();
        if (!!mapFeature) {
            if (atCoords == undefined) { atCoords = mapFeature.GetPointCoords(); }
            var toolTipProps = getMapFeatureToolTipProps(mapFeature, atCoords);
            appCtx.SetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender, toolTipProps);
        }
    }

    function checkUpdateDirectionsHover(notification) {
        var updatedDirectionsHover = false;
        if (coordsDirectionRouteHover != undefined) {
            updatedDirectionsHover = true;
            if (notification.eventCoords != undefined) {
                coordsDirectionRouteHover = notification.eventCoords;
                var hitTestAddWayPoint = tf.helpers.HitTestMapCoordinatesArray(directionsPanel.GetRouteCoordinates(), coordsDirectionRouteHover, undefined, undefined, undefined);
                if (hitTestAddWayPoint.closestPoint != undefined) {
                    var newCoords = hitTestAddWayPoint.closestPoint;
                    mapFeatureAddWayPoint.SetPointCoords(newCoords);
                    var toolTipProps = getMapFeatureToolTipProps(mapFeatureAddWayPoint, newCoords);
                    deselectToolTipSender();
                    appCtx.SetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender, toolTipProps);
                }
            }
            //map.Render();
        }
        return updatedDirectionsHover;
    }

    function onMapPostCompose(notification) {
        updatePinMapFeature();
        if (checkUpdateDirectionsHover(notification)) { notification.showFeatureImmediately(mapFeatureAddWayPoint); }
        mapFeaturePropsDisplayer.OnPostCompose(notification);
        if (!!customAppContent) { customAppContent.OnMapPostCompose(notification); }
        if (!!currentEditorI) { if (!!tf.js.GetFunctionOrNull(currentEditorI.onPostCompose)) { currentEditorI.onPostCompose(notification); } }
        if (overMapCanvas.GetIsModified()) { overMapCanvas.Draw(); }
    }

    function onMapFeatureMouseMove(notification) {
        if (!!mapFeatureDragI && mapFeatureDragI.getIsDragging()) { return; }
        if (!!currentEditorI) { if (!!tf.js.GetFunctionOrNull(currentEditorI.onMouseMoveFeature)) { currentEditorI.onMouseMoveFeature(notification); } }
        if (checkUpdateDirectionsHover(notification)) { map.Render(); }
    }

    function onMapFeatureHover(notification) {

        if (!!mapFeatureDragI && mapFeatureDragI.getIsDragging()) { return; }

        if (!!currentEditorI && !!tf.js.GetFunctionOrNull(currentEditorI.onHoverFeature) && currentEditorI.onHoverFeature(notification)) { return; }

        var notificationMapFeature = notification.mapFeature;
        var notificationMapFeatureSettings = notificationMapFeature.GetSettings();

        if (notificationMapFeatureSettings.isDirectionRoute) {
            if (notification.isInHover) { if (directionsPanel.GetCanAddWayPoint()) { coordsDirectionRouteHover = notification.eventCoords; } }
            else { coordsDirectionRouteHover = undefined; deselectToolTipSender(); }
            return;
        }

        //return;

        if (!!tf.TFMap.GetMapFeatureToolTipProps(notificationMapFeature)) {
            var toolTipProps;
            var needChange = true;
            if (notification.isInHover) {
                lastClusterFeatures = [];
                if (tf.js.GetIsValidObject(notification.featureCluster) && tf.js.GetIsNonEmptyArray(notification.featureCluster.clusterFeatures)) {
                    var clusterFeatures = notification.featureCluster.clusterFeatures;
                    var clusterCoords = notification.featureCluster.clusterCoords;
                    var mapFeature = clusterFeatures[0];
                    toolTipProps = getMapFeatureToolTipProps(mapFeature, clusterCoords);
                    toolTipProps.offsetX = 8;
                    if (!!toolTipProps) {
                        //lastClusterFeatures = clusterFeatures;
                        var nFeatures = clusterFeatures.length;
                        toolTipProps.toolTipText = [];
                        var toolTipInfos = [];
                        for (var i = 0; i < nFeatures; ++i) {
                            var thisMapFeature = clusterFeatures[i];
                            var thisMapFeatureTTP = getMapFeatureToolTipProps(thisMapFeature, clusterCoords);
                            var thisToolTip = /*(i + 1) + ": " + */(tf.js.GetFunctionOrNull(thisMapFeatureTTP.toolTipText) ? thisMapFeatureTTP.toolTipText(thisMapFeatureTTP) : thisMapFeatureTTP.toolTipText);
                            toolTipInfos.push({ toolTipText: thisToolTip, mapFeature: thisMapFeature });
                        }

                        toolTipInfos.sort(function(a, b) { return a.toolTipText < b.toolTipText ? -1 : a.toolTipText > b.toolTipText ? 1 : -1; });

                        for (var i = 0; i < toolTipInfos.length; ++i) { toolTipProps.toolTipText.push(toolTipInfos[i].toolTipText); }

                        lastClusterFeatures = toolTipInfos;

                        toolTipProps.onClick = onClickMapFeatureToolTip;
                    }
                }
                else {
                    var willShow = true;
                    var notificationMapFeatureSettings = notificationMapFeature.GetSettings();
                    var searchProps = tf.TFMap.GetSearchProps(notificationMapFeature);
                    if (!!searchProps) { willShow = notificationMapFeatureSettings.showToolTip; }
                    if (willShow) {
                        var notificationMapFeatureSettingsToolTipCoords = notificationMapFeatureSettings.toolTipCoords;
                        var coordsUseHere = notificationMapFeatureSettingsToolTipCoords != undefined ?
                            notificationMapFeatureSettingsToolTipCoords : (notificationMapFeature.GetIsPoint() ? notificationMapFeature.GetPointCoords() : notification.eventCoords);
                        toolTipProps = getMapFeatureToolTipProps(notificationMapFeature, coordsUseHere);
                    }
                }
            }
            else {
                var curToolTipSender = appCtx.GetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender);
                if (!!curToolTipSender) {
                    if (curToolTipSender.keepOnHoverOutTarget) {
                        needChange = !toolTipDisplayer.GetIsInHover();
                    }
                }
            }
            if (needChange) {
                appCtx.SetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender, toolTipProps);
            }
        }
    }

    function onMapMouseDrag(notification) { if (!!mapFeatureDragI && mapFeatureDragI.getIsDragging()) { if (mapFeatureDragI.onDragMove(notification)) { return; } } }

    function onMapDragEnd(notification) { if (!!mapFeatureDragI && mapFeatureDragI.getIsDragging()) { if (mapFeatureDragI.onEndDrag()) { return; } } }

    function onMapFeatureMouseDrag(notification) {
        if (!!mapFeatureDragI) {
            if (mapFeatureDragI.getIsDragging()) { if (mapFeatureDragI.onDragMove(notification)) { return; } }
            else {
                if (mapFeatureDragI.onDrag(notification)) { return; }
            }
        }

        if (!!currentEditorI && !!tf.js.GetFunctionOrNull(currentEditorI.onDragFeature) && currentEditorI.onDragFeature(notification)) { return; }

        if (coordsDirectionRouteHover != undefined) { addWayPoint(notification, true); return; }
    }

    function onMapFeatureDoubleClick(notification) {
        if (!!currentEditorI && !!tf.js.GetFunctionOrNull(currentEditorI.onDoubleClickFeature) && currentEditorI.onDoubleClickFeature(notification)) { return; }
    }

    function onMapFeatureClick(notification) {

        if (!!currentEditorI && !!tf.js.GetFunctionOrNull(currentEditorI.onClickFeature) &&  currentEditorI.onClickFeature(notification)) { return; }

        if (coordsDirectionRouteHover != undefined) { addWayPoint(notification, false); return; }

        var mapFeature = notification.mapFeature;
        var searchFeature = !!tf.TFMap.GetSearchFeature(mapFeature) ? mapFeature : undefined;
        appCtx.SetCtxAttribute(tf.TFMap.CAN_selectedSearch, searchFeature);
        if (!!searchFeature) {
            theThis.ShowMapFeatureProps(searchFeature);
        }
        if (mapFeature == mapUserLocation.GetMapFeature() || mapFeature == mapClickedLocation.GetMapFeature() || mapFeature == mapSearchLocation.GetMapFeature()) {
            mapFeaturePropsDisplayer.ShowProps(mapFeature);
        }
        else if (mapFeature == pinMapFeature.GetMapFeature()) {
            theThis.SetDirectionsTargetToMapFeature(pinMapFeature.GetLastToMapFeature(), true);
        }
        else {
            var settings = mapFeature.GetSettings();
            if (settings.directionsAddressItem != undefined) {
                directionsPanel.SelectAddressItem(settings.directionsAddressItem);
            }
            else if (settings.directionsResultsItem != undefined) {
                directionsPanel.SelectResultItem(settings.directionsResultsItem);
            }
            else if (settings.wayPointIsInLayer) {
                directionsPanel.DeleteWayPoint(mapFeature);
                mapDirectionWayPointsLayer.DelMapFeature(mapFeature);
            }
            else if (tf.js.GetFunctionOrNull(settings.onCustomAppClick)) {
                settings.onCustomAppClick(notification);
            }
        }
    }

    function onMapClick(notification) {
        if (!!currentEditorI && !!tf.js.GetFunctionOrNull(currentEditorI.onClickMap) && currentEditorI.onClickMap(notification)) { return; }
        if (processMapClickedLocation) {
            mapClickedLocation.Show(notification.eventCoords);
        }
    }

    this.GetMapFeaturePropsDisplayer = function () { return mapFeaturePropsDisplayer; }

    this.GetOverMapCanvas = function () { return overMapCanvas; }

    this.SetBottomContent = function (bottomContentType, bottomContent) {
        var underBottomWrapper = bottomPane.GetUnderBottomWrapper();
        underBottomWrapper.ClearContent();
        switch (bottomContentType) {
            case tf.TFMap.BottomContentTypes.photos:
                photoList.SetContent(bottomContent);
                photoListDisplayer.Update(photoList);
                underBottomWrapper.AddContent(photoListDisplayer.GetWrapper());
                break;
        }
        theThis.SetBottomPaneUp(true);
    }

    this.GetIsBottomPaneUp = function() { return isBottomPaneUp; }

    this.SetBottomPaneUp = function(isUp) { if (isBottomPaneUp != (isUp = !!isUp)) { isBottomPaneUp = isUp; setBottomPaneUpDownStyle(); } }

    this.ToggleBottomPaneUp = function () { theThis.SetBottomPaneUp(!theThis.GetIsBottomPaneUp()); }

    this.ShowPhoto = function (photoSettings, setFocusElement) {
        if (!photoDisplayer.GetIsShowing()) {
            var photoListWrapper = photoListDisplayer.GetWrapper();
            theThis.SetBottomPaneUp(false);
            var underBottomWrapper = bottomPane.GetUnderBottomWrapper();
            underBottomWrapper.RemoveContent(photoListWrapper);
            photoDisplayer.GetWrapper().AddContent(photoListWrapper);
        }
        photoDisplayer.Show(photoDisplayerParentDiv, photoSettings);
        if (!!setFocusElement) { setTimeout(function () { setFocusElement.focus(); }, 500); }
    }

    this.GetIsShowingPhoto = function () { return photoDisplayer.GetIsShowing(); }

    this.GetPhotoDisplayer = function () { return photoDisplayer; }

    this.OnPhotoDisplayHidden = function () {
        var photoListWrapper = photoListDisplayer.GetWrapper();
        var underBottomWrapper = bottomPane.GetUnderBottomWrapper();
        photoDisplayer.GetWrapper().RemoveContent(photoListWrapper);
        underBottomWrapper.AddContent(photoListWrapper);
        theThis.SetBottomPaneUp(true);
    }

    this.RefreshDataSetFeatures = function () {
        for (var i in dataSetSearches) {
            var tfs = dataSetSearches[i], tfss = tfs.GetSettings(), smf = tfss.searchMapFeatures;
            smf.RefreshStyles();
        }
    }

    this.GetUsesClusters = function () { return isUsingClusters; }

    this.ToggleClusters = function () { isUsingClusters = !isUsingClusters; searchLayerHybridB.SetUseClusters(isUsingClusters); searchLayerMapB.SetUseClusters(isUsingClusters); }

    function getCoordsExtent() {
        var mapDims = map.GetPixelSize(), w = mapDims[0], h = mapDims[1];
        var lt = [0, 0], rt = [w, 0], rb = [w, h], lb = [0, h];
        var pixCoords = [lt, rt, rb, lb];
        var mapCoords = [];
        for (var i = 0; i < pixCoords.length; ++i) {
            mapCoords.push(map.PixelToMapCoords(pixCoords[i]));
        }
        var wt = tf.units.GetHaversineDistance(mapCoords[0], mapCoords[1]);
        var wb = tf.units.GetHaversineDistance(mapCoords[2], mapCoords[3]);
        //console.log('wt ' + wt + ' wb ' + wb);
    }

    this.MakeSureMapCoordsAreVisible = function (coords, marginPxInt, useSetCenter) {
        if (!useSetCenter) { return theThis.AnimatedSetCenterIfDestVisible(coords); }

        //getCoordsExtent();

        if (marginPxInt == undefined) { marginPxInt = 50; }

        var mapDims = map.GetPixelSize();
        var marginPxHorInt = marginPxInt;
        var marginPxVerInt = marginPxInt;

        if (marginPxHorInt > mapDims[0] / 2) { marginPxHorInt = mapDims[0] / 2; }
        if (marginPxVerInt > mapDims[1] / 2) { marginPxVerInt = mapDims[1] / 2; }

        var pixelCoords = map.MapToPixelCoords(coords);

        var marginLeft = pixelCoords[0] - marginPxHorInt;
        var marginRight = pixelCoords[0] + marginPxHorInt;

        var marginTop = pixelCoords[1] - marginPxVerInt;
        var marginBot = pixelCoords[1] + marginPxVerInt;

        var diffPixelX = 0, diffPixelY = 0;
        var minLeft = 0, minTop = 0, maxRight = mapDims[0], maxBottom = mapDims[1];
        var layoutSettings = tf.TFMap.LayoutSettings;
        var underBottomPaneHeightInt = layoutSettings.underBottomPaneHeightInt;

        if (theThis.GetHasEffectiveSidePanelFullContent()) {
            //if (lastCtx[tf.TFMap.CAN_showingDirections] && lastCtx[tf.TFMap.CAN_sidePanelVisible]) {
            minLeft = layoutSettings.sidePanelWidthInt;
        }

        if (isBottomPaneUp) { maxBottom -= underBottomPaneHeightInt; }

        if (marginLeft < minLeft) { diffPixelX = marginLeft - minLeft; }
        else if (marginRight > maxRight) { diffPixelX = marginRight - maxRight; }

        if (marginTop < minTop) { diffPixelY = marginTop - minTop; }
        else if (marginBot > maxBottom) { diffPixelY = marginBot - maxBottom; }

        if (diffPixelX != 0 || diffPixelY != 0) {
            var mapCenter = map.GetCenter();
            var mapCenterPixel = map.ActualMapToPixelCoords(mapCenter);
            //var mapCenterPixel = map.MapToPixelCoords(mapCenter);
            var newCoordsPixel = [mapCenterPixel[0] + diffPixelX, mapCenterPixel[1] + diffPixelY];
            var newCoords = map.ActualPixelToMapCoords(newCoordsPixel);
            //var newCoords = map.PixelToMapCoords(newCoordsPixel);
            if (!!useSetCenter) {
                map.SetCenter(newCoords);
            }
            else {
                map.SetCenter(newCoords);
                //map.AnimatedSetCenterIfDestVisible(newCoords, undefined, undefined, undefined, tf.units.EaseLinear);
            }
        }
    };

    this.IsPerspectiveMapShowing = function () { return !!perspectiveMap && perspectiveMap.GetIsVisible(); }

    this.SetMapExtent = function (extent, keepDirectionsOpen) {
        var extentScale = theThis.IsPerspectiveMapShowing() ? 2 : 1.5;
        extent = tf.js.ScaleMapExtent(extent, extentScale);
        /*if (theThis.GetHasEffectiveSidePanelFullContent()) {
            var layoutSettings = tf.TFMap.LayoutSettings;
            var minLeft = layoutSettings.sidePanelWidthInt;
            var res = map.GetResolution();
            var off = - res / minLeft;
            extent[0] += off;
            extent[2] += off;
        }*/
        if (!keepDirectionsOpen) {
            if (appCtx.GetCtxAttribute(tf.TFMap.CAN_showingDirections)) { appCtx.SetCtxAttribute(tf.TFMap.CAN_showingDirections, false) }
        }
        map.SetVisibleExtent(extent);
        //theThis.AnimatedSetCenterIfDestVisible([extent[0] + (extent[2] - extent[0]) / 2, extent[1] + (extent[3] - extent[1]) / 2]);
    }

    this.EnsureDirectionsVisible = function () {
        if (!appCtx.GetCtxAttribute(tf.TFMap.CAN_sidePanelVisible) || !appCtx.GetCtxAttribute(tf.TFMap.CAN_showingDirections)) {
            //if (!!currentEditorI) { deActivateCurrentEditor(); }
            var ctx = appCtx.GetCtx();
            ctx[tf.TFMap.CAN_sidePanelVisible] = ctx[tf.TFMap.CAN_showingDirections] = true;
            appCtx.SetCtx(ctx);
        }
    }

    this.AnimatedSetCenterIfDestVisible = function (coords) {
        if (theThis.GetHasEffectiveSidePanelFullContent()){
            //if (lastCtx[tf.TFMap.CAN_showingDirections] && lastCtx[tf.TFMap.CAN_sidePanelVisible]) {
            var pixelCoords = map.ActualMapToPixelCoords(coords);
            pixelCoords[0] -= tf.TFMap.LayoutSettings.sidePanelWidthInt / 2;
            coords = map.ActualPixelToMapCoords(pixelCoords);
        }
        map.AnimatedSetCenterIfDestVisible(coords, undefined, undefined, undefined, tf.units.EaseLinear);
    }

    this.SetDirectionsAddress = function (addressStr, isStart) {
        directionsPanel.SetDirectionsAddress(addressStr, isStart);
    };

    this.SetDirectionsTargetToCoords = function (pointCoords, forceEnd, skipEnsureVisible) { directionsPanel.SetDirectionsTargetToCoords(pointCoords, forceEnd, skipEnsureVisible); }

    this.SetDirectionsTargetToMapFeature = function (mapFeature, forceEnd, skipEnsureVisible) { theThis.SetDirectionsTargetToCoords(mapFeature.GetPointCoords(), forceEnd, skipEnsureVisible); }

    this.OnCloseMapFeatureProps = function () { updatePinMapFeature(); }

    this.GetVidPassThrough = function () { var urlMapSettings = settings.mapSettings; return { vid: urlMapSettings.vidParam, passThrough: urlMapSettings.passThroughString }; }

    this.GoDB = function (pointCoords) {
        //console.log('went DB on ' + JSON.stringify(pointCoords));
        var longitude = tf.js.GetLongitudeFrom(pointCoords[0]);
        var latitude = tf.js.GetLatitudeFrom(pointCoords[1]);

        if (latitude != 0 && longitude != 0) {
            var res = map.GetResolution();
            var strURL = "http://vn4.cs.fiu.edu/cgi-bin/gnis.cgi?Res=" + res + "&Lat=" + latitude + "&Long=" + longitude;
            var vidParam = map.GetVIDParamStr();
            var passthroughParam = map.GetTFPassThroughString();
            if (vidParam) { strURL += "&vid=" + vidParam; }
            if (passthroughParam) { if (passthroughParam.charAt(0) == "&") { strURL += passthroughParam; } else { strURL += "&" + passthroughParam; } }
            window.open(strURL, '_top');
        }
    }

    this.GetToaster = function () { return toaster; }

    this.GetAppCtx = function () { return appCtx; }
    this.GetAppStyles = function () { return appStyles; }
    this.GetMap = function () { return map; }
    this.GetMultiMenus = function () { return multiMenus; }
    this.OnLayoutChange = function () { return onLayoutChange(); }

    this.GetLastCtx = function () { return lastCtx; }

    this.GetAppDiv = function () { return appDiv; }
    this.GetRootDiv = function () { return rootDiv; }
    this.GetMapDiv = function () { return mapDiv; }
    this.GetMapMapDiv = function () { return mapMapDiv; }
    this.GetSidePane = function () { return sidePane; }
    this.GetBottomPane = function () { return bottomPane; }

    this.GetToolTipDisplayer = function () { return toolTipDisplayer; }

    this.ShowUserLocation = function () { mapUserLocation.Show(); mapUserLocation.PanToMapFeature(); }

    this.RefreshProps = function (mapFeature) { mapFeaturePropsDisplayer.RefreshProps(mapFeature); checkSendPropsMapFeatureToDirections(mapFeature); }

    this.ShowMapFeatureProps = function (mapFeature) {
        if (skipFirstMapFeatureProps) { skipFirstMapFeatureProps = false; }
        else { mapFeaturePropsDisplayer.ShowProps(mapFeature); }
        skipFirstMapFeatureProps = false;
        checkSendPropsMapFeatureToDirections(mapFeature);
    }

    this.SearchAddress = function (searchText) { mapSearchLocation.SearchAddress(searchText); }

    this.Search = function () {
        for (var i in dataSetSearches) {
            var tfs = dataSetSearches[i]; if (!tfs.GetIsSearching()) { var tfss = tfs.GetSettings(), smf = tfss.searchMapFeatures; if (smf.GetIsVisible()) { tfs.Search(); } }
        }
    }

    this.CreateDataSetListButton = function (insertWrapper, wrapper, buttonClasses, tfs) {
        var buttonSettings = {
            buttonClass: buttonClasses, wrapper: wrapper, insertWrapper: insertWrapper, keepOnHoverOutTarget: true, offsetX: -8, offsetY: 0,
            delayMillis: tf.TFMap.dataSetListButtonToolTipDelayMillis
        };
        var button = theThis.CreateButton(tf.js.ShallowMerge(buttonSettings, getDataSetToolTip(wrapper, tfs)));
        return button;
    }

    this.CreateButton = function (buttonSettings) {
        var button = new tf.TFMap.IconButton({ onClick: onButtonClicked, cssClass: buttonSettings.buttonClass, onHover: onHoverButton, buttonSettings: buttonSettings, svgHTML: buttonSettings.svgHTML });
        button.onClick = buttonSettings.onClick;
        button.onHover = buttonSettings.onHover;
        tf.TFMap.SetButtonToolTipInfo(button, buttonSettings.toolTipText, buttonSettings.wrapper, buttonSettings.delayMillis, buttonSettings.toolTipClass,
            buttonSettings.toolTipArrowClass, buttonSettings.toolTipStyle, buttonSettings.keepOnHoverOutTarget,
            buttonSettings.toolTipFunction, buttonSettings.insertWrapper,
            buttonSettings.offsetX, buttonSettings.offsetY);
        return button;
    }

    this.CreateToggleButton = function (buttonSettings) {
        var button = new tf.TFMap.ToggleButton({
            svgHTML: buttonSettings.svgHTML,
            onClick: onButtonClicked, onHover: onHoverButton,
            buttonClassName: buttonSettings.buttonClass, classToggled: buttonSettings.classToggled, classNotToggled: buttonSettings.classNotToggled,
            isToggled: buttonSettings.isToggled,
            autoToggle: buttonSettings.autoToggle != undefined ? buttonSettings.autoToggle : true
        });
        button.onClick = buttonSettings.onClick;
        button.onHover = buttonSettings.onHover;
        tf.TFMap.SetButtonToolTipInfo(button, buttonSettings.toolTipText, buttonSettings.wrapper, buttonSettings.delayMillis, buttonSettings.toolTipClass,
            buttonSettings.toolTipArrowClass, buttonSettings.toolTipStyle, buttonSettings.keepOnHoverOutTarget,
            buttonSettings.toolTipFunction, buttonSettings.insertWrapper,
            buttonSettings.offsetX, buttonSettings.offsetY);
        return button;
    }

    this.OnMapLevelChange = function () { return onMapLevelChange(); }

    this.GetIsShowingAerial = function () { return showingAerial; }

    this.GetSwitchToMapTypeName = function () { return showingAerial ? "Map" : "Aerial"; }

    this.SwitchMapType = function () {
        var mapType, auxMapType;
        if (showingAerial = !showingAerial) { mapType = tf.consts.typeNameHybrid; auxMapType = tf.consts.typeNameMap; }
        else { mapType = tf.consts.typeNameMap; auxMapType = tf.consts.typeNameAerial; }
        updateAppDivForMapType();
        updateScaleElemForMapType();
        if (!!baseLayersPanel) { baseLayersPanel.UpdateForMapType(); }
        map.SetMapType(mapType);
        if (!!mapTypeAuxMap) { mapTypeAuxMap.SetMapType(auxMapType); }
        appStyles.SetIsShowingAerial(showingAerial);
        updateSearchLayersVisibility();
        if (!!currentEditorI && tf.js.GetFunctionOrNull(currentEditorI.updateForMapType)) { currentEditorI.updateForMapType(); }
        if (!!customAppContent) { customAppContent.UpdateForMapType(); }
        //map.Render();
    }

    function updateAppDivForMapType() {
        var ls = tf.TFMap.LayoutSettings;
        var isShowingAerial = theThis.GetIsShowingAerial();
        tf.dom.ReplaceCSSClassCondition(appDiv, isShowingAerial, ls.showingAerialClassName, ls.showingMapClassName);
    }

    function updateSearchLayersVisibility() {
        searchLayerHybridB.SetVisible(showingAerial);
        searchLayerMapB.SetVisible(!showingAerial);
    }

    function updateScaleElemForMapType() {
        var ls = tf.TFMap.LayoutSettings;
        var isShowingAerial = theThis.GetIsShowingAerial();
        if (!!scaleElem) {
            tf.dom.ReplaceCSSClassCondition(scaleElem.element.firstChild, isShowingAerial, ls.wrapperAerialModeClassName, ls.wrapperMapModeClassName);
        }
    }

    function checkSendPropsMapFeatureToDirections(mapFeature) {
        if (!!mapFeature && mapFeature != pinMapFeature) {
            if (lastCtx[tf.TFMap.CAN_showingDirections]) {
                if (directionsPanel.GetNeedsAddress()) {
                    theThis.SetDirectionsTargetToMapFeature(mapFeature, false);
                }
            }
        }
        //else { console.log('here'); }
    }

    function onButtonClicked(notification) {
        var button = notification.sender;
        if (tf.js.GetFunctionOrNull(button.onClick)) { button.onClick(notification); }
        toolTipDisplayer.RefreshToolTip();
    }

    function onHoverButton(notification) {
        var hoverNotification = notification.notification, button = notification.sender;
        var nextToolTipSender = hoverNotification.isInHover ? button : button.keepOnHoverOutTarget ? button : undefined;
        var needChange = true;
        var curToolTipSender = appCtx.GetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender);
        if (!!curToolTipSender) { if (curToolTipSender.keepOnHoverOutTarget) { needChange = !toolTipDisplayer.GetIsInHover(); } }
        if (needChange) { appCtx.SetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender, nextToolTipSender); }
        if (tf.js.GetFunctionOrNull(button.onHover)) { button.onHover(notification); }
    }

    function getDataSetToolTipContent(tfs) {
        var searchMapFeatures = tfs.GetSettings().searchMapFeatures;
        var searchFeatures = searchMapFeatures.GetSearchFeaturesForToolTip();
        var toolTipInfos = [];
        var toolTipText = [];
        lastClusterFeatures = [];

        for (var i in searchFeatures) {
            var thisMapFeature = searchFeatures[i];
            var thisMapFeatureTTP = getMapFeatureToolTipProps(thisMapFeature, thisMapFeature.GetPointCoords());
            var thisToolTip = /*(i + 1) + ": " + */(tf.js.GetFunctionOrNull(thisMapFeatureTTP.toolTipText) ? thisMapFeatureTTP.toolTipText(thisMapFeatureTTP) : thisMapFeatureTTP.toolTipText);
            toolTipInfos.push({ toolTipText: thisToolTip, mapFeature: thisMapFeature });
        }

        if (toolTipInfos.length > 0) {
            toolTipInfos.sort(function (a, b) { return a.toolTipText < b.toolTipText ? -1 : a.toolTipText > b.toolTipText ? 1 : -1; });

            for (var i = 0; i < toolTipInfos.length; ++i) {
                toolTipText.push(toolTipInfos[i].toolTipText);
            }

            lastClusterFeatures = toolTipInfos;
        }
        else {
            toolTipText = "'" + tfs.GetDataSetTitle() + "' dataset";
        }

        return toolTipText;
    }

    function getDataSetToolTip(wrapper, tfs) {
        var toolTipProps = {
            wrapper: wrapper, onClick: onClickMapFeatureToolTip,
            toolTipFunction: function (sender) { return getDataSetToolTipContent(tfs) },
            toolTipClass: "*start", toolTipArrowClass: "left"
        };
        return toolTipProps;
    };

    function getMapFeatureToolTipProps(mapFeature, coords) {
        var sidePanelWidthInt = theThis.GetHasEffectiveSidePanelFullContent() ? tf.TFMap.LayoutSettings.sidePanelWidthInt : 0;
        //var sidePanelWidthInt = lastCtx[tf.TFMap.CAN_showingDirections] && lastCtx[tf.TFMap.CAN_sidePanelVisible] ? tf.TFMap.LayoutSettings.sidePanelWidthInt : 0;
        var toolTipProps = tf.TFMap.GetDynamicMapFeatureToolTipProps(map, mapFeature, coords, sidePanelWidthInt);
        if (!!toolTipProps) {
            var toolTipParentDiv = theThis.GetMapDiv();
            //var toolTipParentDiv = rootDiv;   // root div would be better to overlap floating panels, but there's an issue with hover out
            toolTipProps = tf.TFMap.GetMapFeatureToolTipInfo(mapFeature, map, toolTipProps.toolTipText, toolTipParentDiv, toolTipProps.delayMillis,
                toolTipProps.toolTipClass, toolTipProps.toolTipArrowClass, toolTipProps.toolTipStyle, coords, toolTipProps.offsetX, toolTipProps.offsetY, toolTipProps.onClick,
                toolTipProps.keepOnHoverOutTarget);
        }
        return toolTipProps;
    }

    function onClickMapFeatureToolTip(notification) {
        //console.log('clicked tool tip button ' + notification.order);
        if (notification.toolTipSender != undefined) {
            if (notification.order != undefined) {
                if (lastClusterFeatures != undefined) {
                    if (notification.order < lastClusterFeatures.length) {
                        var mapFeature = lastClusterFeatures[notification.order].mapFeature;
                        var settings = mapFeature.GetSettings();
                        if (tf.js.GetFunctionOrNull(settings.onCustomAppClick)) {
                            settings.onCustomAppClick({ mapFeature: mapFeature });
                        }
                        else if (tf.TFMap.GetSearchFeature(mapFeature)) {
                            appCtx.SetCtxAttribute(tf.TFMap.CAN_selectedSearch, mapFeature);
                            theThis.ShowMapFeatureProps(mapFeature);
                        }
                    }
                }
            }
        }
    }

    //var testPMapFeatureActualPixelCoords, testPMapFeaturePixelCoords;

    function onMapMouseMove(notification) {
        if (notification.nMapFeatures == 0) { deselectToolTipSender(); }
        /*testPMapFeatureActualPixelCoords = notification.actualPixelCoords;
        testPMapFeaturePixelCoords = notification.pixelCoords;
        testPMapFeature.SetPointCoords(notification.eventCoords);*/
    }

    function reCenterMapTypeAux() { if (!!mapTypeAuxMap) { mapTypeAuxMap.SetCenter(map.GetCenter()); } }

    function onMapMoveEnd(notification) {
        theThis.Search();
    }

    function onMapMoveStart(notification) {
        //console.log('move start');
    }

    function updatePinMapFeature() { pinMapFeature.Update(mapFeaturePropsDisplayer.GetLastMapFeature()); }

    function onMapPreCompose(notification) {
        var mapCenter = map.GetCenter();
        if (appCtx.GetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender) != undefined) {
            if (mapCenter[0] != centerMapOnToolTipOpen[0] || mapCenter[1] != centerMapOnToolTipOpen[1]) { deselectToolTipSender(); }
        }
        if (!!mapTypeAuxMap) {
            var mapTypeCenter = mapTypeAuxMap.GetCenter();
            if (mapCenter[0] != mapTypeCenter[0] || mapCenter[1] != mapTypeCenter[1]) { reCenterMapTypeAux(); }
            var mapRotationRad = map.GetRotationRad();
            if (mapRotationRad != mapTypeAuxMap.GetRotationRad()) { mapTypeAuxMap.SetRotationRad(mapRotationRad); }
        }
    }

    function onMapScaleUnit(notification) {
        directionsPanel.UpdateDistances();
        if (!!currentEditorI && tf.js.GetFunctionOrNull(currentEditorI.onMapScaleUnit)) { currentEditorI.onMapScaleUnit(notification); }
        map.Render();
    }

    function notifyBaseLayersResChange() { if (!!baseLayersPanel) { baseLayersPanel.OnMapResolutionChange(); } }

    function onMapResolutionChange(notification) {
        notifyBaseLayersResChange();
    }

    function onMapLevelChange(notification) {
        if (!!mapTypeAuxMap) { mapTypeAuxMap.SetLevel(map.GetLevel() - diffLevelMapTypeAux); }
        notifyBaseLayersResChange();
    }

    function onLayoutChange() { appSizer.OnResize(); }

    var hadAppResized;

    function onAppResize() {
        /*var winDims = tf.dom.GetWindowDims();
        rootDiv.GetHTMLElement().style.width = winDims[0] + "px";
        rootDiv.GetHTMLElement().style.height = winDims[1] + "px";*/
        if (appStyles == undefined) {
            if (!hadAppResized) {
                hadAppResized = true;
                appStyles = new tf.TFMap.Styles({ appContent: theThis, onLoaded: onStylesLoaded, sidePanelWidthInt: settings.sidePanelWidthInt });
                appStyles.AddOnLayoutChangeListener(onLayoutChangeFromStyles);
            }
        }
        if (appStyles != undefined) {
            appStyles.CheckLayoutChange();
            if (!!map) {
                map.OnResize();
                if (!!mapTypeAuxMap) { mapTypeAuxMap.OnResize(); }
                updateMenuPositions();
                if (!!directionsPanel) { directionsPanel.OnResize(); }
                deselectToolTipSender();
            }
        }
        //console.log('app resize');
    }
    function onFullResize() { updateMenuPositions(); }

    function updateMenuPositions() { multiMenus.UpdateMenuPositions(); }

    function onContextChange(notification) {
        var newCtx = notification.ctx;

        var lastDirectionsMode = lastCtx[tf.TFMap.CAN_directionsMode];
        var newDirectionsMode = newCtx[tf.TFMap.CAN_directionsMode];
        var changedDirectionsMode = lastDirectionsMode != newDirectionsMode;

        var lastInDirectionsMode = lastCtx[tf.TFMap.CAN_showingDirections];
        var newInDirectionsMode = newCtx[tf.TFMap.CAN_showingDirections];
        var changedInDirectionsMode = lastInDirectionsMode != newInDirectionsMode;

        var lastToolTipSender = lastCtx[tf.TFMap.CAN_selectedToolTipSender];
        var newToolTipSender = newCtx[tf.TFMap.CAN_selectedToolTipSender];
        var changedToolTipSender = lastToolTipSender != newToolTipSender;

        var lastSidePaneVisible = lastCtx[tf.TFMap.CAN_sidePanelVisible];
        var newSidePaneVisible = newCtx[tf.TFMap.CAN_sidePanelVisible];
        var changedSidePaneVisible = lastSidePaneVisible != newSidePaneVisible;

        var lastSearchingAddress = lastCtx[tf.TFMap.CAN_isSearchingAddress];
        var newSearchingAddress = newCtx[tf.TFMap.CAN_isSearchingAddress];
        var changedSearchingAddress = lastSearchingAddress != newSearchingAddress;

        var lastDataSetsPaneVisible = lastCtx[tf.TFMap.CAN_dataSetsPanelVisible];
        var newDataSetsPaneVisible = newCtx[tf.TFMap.CAN_dataSetsPanelVisible];
        var changedDataSetsPaneVisible = lastDataSetsPaneVisible != newDataSetsPaneVisible;

        var updatedSearches = [], changedStateSearches = [], changedVisibilitySearches = [];

        for (var i in dataSetSearches) {
            var tfs = dataSetSearches[i], tfsSettings = tfs.GetSettings(), updateVerb = tfsSettings.updateVerb, visibilityVerb = tfsSettings.visibilityVerb,
                autoRefreshVerb = tfsSettings.autoRefreshVerb;

            var lastIsSearching = lastCtx[updateVerb];
            var newIsSearching = newCtx[updateVerb];
            var changedIsSearching = lastIsSearching != newIsSearching;

            var lastIsVisible = lastCtx[visibilityVerb];
            var newIsVisible = newCtx[visibilityVerb];
            var changedIsVisible = lastIsVisible != newIsVisible;

            var lastAutoRefresh = lastCtx[autoRefreshVerb];
            var newAutoRefresh = newCtx[autoRefreshVerb];
            var changedAutoRefresh = lastAutoRefresh != newAutoRefresh;

            if (changedIsSearching) { if (!newIsSearching) { updatedSearches.push(tfs); } changedStateSearches.push(tfs); }
            if (changedIsVisible || changedAutoRefresh) { if (!changedIsSearching) { changedStateSearches.push(tfs); } if (changedIsVisible) { changedVisibilitySearches.push(tfs); } }
        }

        lastCtx = tf.js.ShallowMerge(newCtx);

        if (changedToolTipSender) { centerMapOnToolTipOpen = map.GetCenter(); toolTipDisplayer.Show(newToolTipSender); }

        if (updatedSearches.length > 0) { for (var i in updatedSearches) { var tfs = updatedSearches[i]; tfs.GetSettings().searchMapFeatures.UpdateSearchFeatures(tfs.GetAddedAndDeletedSearchResults()); } }

        if (changedStateSearches.length > 0) { for (var i in changedStateSearches) { var tfs = changedStateSearches[i]; dataSetsBar.Update(tfs.GetTitle()); } }

        if (changedVisibilitySearches.length > 0) {
            for (var i in changedVisibilitySearches) {
                var tfs = changedVisibilitySearches[i], tfss = tfs.GetSettings(), smf = tfss.searchMapFeatures;
                smf.UpdateVisibility();
                if (smf.GetIsVisible() && !tfs.GetIsSearching()) { tfs.Search(); }
            }
        }

        if (changedSidePaneVisible) { toolTipDisplayer.Show(undefined); sidePane.CheckIsVisible(); }

        if (changedDataSetsPaneVisible) { toolTipDisplayer.Show(undefined); dataSetsBar.CheckIsVisible(); }

        if (changedSearchingAddress) { searchBar.CheckSearchActive(); }

        if (changedInDirectionsMode || changedSidePaneVisible) { setBottomPaneWidth(); if (changedInDirectionsMode) { setDirectionsMode(); } }

        if (changedDirectionsMode) { directionsPanel.UpdateMode(); }
    }

    function setBottomPaneWidth() {
        var bottomPanePositionClasses = bottomPane.GetPositionClasses();
        //var inDirectionsMode = lastCtx[tf.TFMap.CAN_showingDirections];
        //var sidePaneVisible = lastCtx[tf.TFMap.CAN_sidePanelVisible];
        //tf.dom.ReplaceCSSClassCondition(rootDiv, inDirectionsMode && sidePaneVisible, bottomPanePositionClasses.widthWithSidePanelClassName, bottomPanePositionClasses.fullWidthClassName);
        tf.dom.ReplaceCSSClassCondition(rootDiv, theThis.GetHasEffectiveSidePanelFullContent(),
            bottomPanePositionClasses.widthWithSidePanelClassName, bottomPanePositionClasses.fullWidthClassName);
    }

    function deselectToolTipSender() {
        if (lastCtx[tf.TFMap.CAN_selectedToolTipSender] != undefined) {
            appCtx.SetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender, undefined);
        }
        toolTipDisplayer.Show(undefined); 
    }

    function setDirectionsMode() {
        deselectToolTipSender(); directionsPanel.UpdateVisibility();
    }

    function getMapSettings(mapContainer, mapType, useScale) {
        var urlMapSettings = settings.mapSettings;

        var mapSettings = {
            vidParam: urlMapSettings.vidParam,
            passThroughString: urlMapSettings.passThroughString,
            container: mapContainer,
            mapEngine: urlMapSettings.mapEngine,
            legendH: urlMapSettings.legendH,
            legendM: urlMapSettings.legendM,
            decodedLegendH: decodedLegendH,
            decodedLegendM: decodedLegendM,
            fullScreenContainer: rootDiv,
            center: urlMapSettings.center,
            mapType: mapType,
            panels: undefined,
            noScaleLine: !useScale,
            panOnClick: false,
            goDBOnDoubleClick: false,
            level: urlMapSettings.level,
            resolution: urlMapSettings.resolution
        };
        return mapSettings;
    }

    function createMap(mapDiv, mapType, useScale, useInteractions, enableRotation) {
        var ls = tf.TFMap.LayoutSettings;
        var mapSettings = getMapSettings(mapDiv, mapType, useScale);
        mapSettings.noNativePopups = true;
        mapSettings.noNativeControls = true;
        mapSettings.showMapCenter = false;
        if (useScale) { mapSettings.scaleElemTarget = bottomPane.GetContentPane().GetHTMLElement(); }
        mapSettings.mapCenterSVG = appStyles.GetMapCenterSVG();
        var createdMap = new tf.map.Map(mapSettings);
        if (!!useInteractions) { createdMap.SetView({ minLevel: tf.TFMap.MinMapLevel, maxLevel: tf.TFMap.MaxMapLevel, enableRotation: enableRotation }); }
        else { createdMap.SetView({ minLevel: tf.TFMap.MinMapLevel, maxLevel: tf.TFMap.MaxMapLevel }); }
        createdMap.SetFractionalZoomInteraction(true);
        createdMap.SetGoDBOnDoubleClick(false);
        createdMap.SetHasInteractions(useInteractions);
        createdMap.SetIsUSScaleUnits(true);

        if (useScale) {
            scaleElem = createdMap.GetPanelElement(tf.consts.panelNameMapScale);
            calcScaleElemLayout();
            updateScaleElemForMapType();
        }
        return createdMap;
    }

    /*function calcLogoElemLayout() {
        if (!!logoElem) {
            var isSmallScreen = appStyles.GetIsSmallScreen();
            var logoHTMLElem = logoElem.GetHTMLElement(), logoS = logoHTMLElem.style;
            logoS.left = "initial";
            if (isSmallScreen) {
                logoS.top = logoS.right = "0.5rem";
                logoS.width = logoS.height = "3rem";
            }
            else {
                logoS.top = logoS.right = "3rem";
                logoS.width = logoS.height = "5rem";
            }
        }
    }*/

    function calcScaleElemLayout() {
        if (!!scaleElem) {
            var isSmallScreen = appStyles.GetIsSmallScreen();
            var scaleButton = scaleElem.element.firstChild;
            tf.dom.AddCSSClass(scaleButton, "ripple");
            var scaleElemStyle = scaleElem.element.style, buttonStyle = scaleButton.style;
            scaleElemStyle.pointerEvents = "all";
            scaleElemStyle.left = "initial";
            if (isSmallScreen) {
                scaleElemStyle.fontSize = "10px";
                scaleElemStyle.height = "12px";
                buttonStyle.height = "12px";
                buttonStyle.marginTop = "0px";
                scaleElemStyle.bottom = (2 - tf.TFMap.LayoutSettings.marginBottomBottomPaneWrapperInt) + "px";
            }
            else {
                scaleElemStyle.fontSize = "11px";
                scaleElemStyle.bottom = (4 - tf.TFMap.LayoutSettings.marginBottomBottomPaneWrapperInt) + "px";
            }
            //scaleElemStyle.right = (ls.widthMapToolBarInt + ls.leftMarginInt + ls.toolBarToToolBarHorSpacingInt + 2) + "px";
            scaleElemStyle.left = "2px";
            scaleElemStyle.zIndex = "0";
        }
    }

    function adjustMapFeatureClustersForLayout() {
        var ls = tf.TFMap.LayoutSettings;
        var clusterStyle = getClusterStyle();
        if (!!searchLayerHybridB) {
            searchLayerHybridB.SetClusterFeatureDistance(ls.clusterFeatureDistance);
            searchLayerHybridB.SetClusterStyle(clusterStyle);
        }
        if (!!searchLayerMapB) {
            searchLayerMapB.SetClusterFeatureDistance(ls.clusterFeatureDistance);
            searchLayerMapB.SetClusterStyle(clusterStyle);
        }
    }

    function getClusterStyle() {
        var ls = tf.TFMap.LayoutSettings;
        return {
            zindex: clusterZIndex, circle: true, circle_radius: ls.clusterCircleRadius, fill: true, fill_color: "#037",
            line: true, line_color: "#fff", line_width: 2, line_opacity: 30
        }
    }

    function createMapLayers(onMap, searchSettings, startZIndex) {
        var ls = tf.TFMap.LayoutSettings;
        var layerSettings = { name: "", isVisible: true, isHidden: true, useClusters: false, zIndex: startZIndex };

        layerSettings.name = "bottomCustomAppLayer";
        bottomCustomAppLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        layerSettings.name = "bfme";
        bottomFillLayerMeasureLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        layerSettings.name = "bfdl";
        bottomFillLayerDownloadLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        layerSettings.name = "additionalFeatures";
        additionalFeaturesLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        var clusterSearchLayers = isUsingClusters;

        var searchLayerSettings = {
            useClusters: clusterSearchLayers,
            clusterFeatureDistance: ls.clusterFeatureDistance,
            clusterStyle: getClusterStyle(),
            clusterLabelStyle: {
                font: "600 12px Roboto",
                zindex: clusterZIndex + 1, text: true, fill: true, fill_color: "#fff", line: true, line_opacity: 70, line_color: "#000", line_width: 2
            }
        };

        searchLayerHybridB = map.AddFeatureLayer(tf.js.ShallowMerge(layerSettings, searchLayerSettings, { name: "slHB", isVisible: showingAerial }));
        ++layerSettings.zIndex;

        searchLayerMapB = map.AddFeatureLayer(tf.js.ShallowMerge(layerSettings, searchLayerSettings, { name: "slMB", isVisible: !showingAerial }));
        ++layerSettings.zIndex;

        layerSettings.name = "clickedLocation";
        mapClickedLocationLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        layerSettings.zIndex = 2000;

        layerSettings.name = "userLocation";
        mapUserLocationLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        layerSettings.name = "directions";
        mapDirectionsLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        layerSettings.name = "pins";
        mapPinsLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        layerSettings.name = "directionItems";
        mapDirectionItemsLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        layerSettings.name = "directionWaypoints";
        mapDirectionWayPointsLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        layerSettings.name = "directionPins";
        mapDirectionsPinsLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        layerSettings.name = "measureToolLayer";
        measureToolLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;

        layerSettings.name = "downloadToolLayer";
        downloadToolLayer = onMap.AddFeatureLayer(layerSettings);
        ++layerSettings.zIndex;
    }

    function createSearches(searchSettings, nDLayerExtent) {
        var searches = {};
        var nSearchSettings = searchSettings.length;
        var preClick = settings.mapSettings.dlayerPreClick;
        //for (var i = nSearchSettings - 1; i >= 0; --i) {
        for (var i = 0; i < nSearchSettings ; ++i) {
            var searchSetting = searchSettings[i];
            var zIndex = (nSearchSettings - i - 1) * 10 + 1;
            var searchTitle = searchSetting.title;
            var nDLayerExtentUse = i == 0 ? nDLayerExtent : undefined;
            var preClickUse = i == 0 ? preClick : false;
            if (searches[searchTitle] == undefined) {
                searches[searchTitle] = new tf.TFMap.DataSetSearch({
                    appContent: theThis,
                    title: searchTitle,
                    updateVerb: searchSetting.updateVerb,
                    visibilityVerb: searchSetting.visibilityVerb,
                    markerNameField: searchSetting.markerNameField,
                    autoRefreshVerb: searchSetting.autoRefreshVerb,
                    maxRecords: searchSetting.maxRecords,
                    nDLayerExtent: nDLayerExtentUse,
                    urlStart: searchSetting.urlStart,
                    searchMapFeatures: new tf.TFMap.SearchMapFeatures({
                        appContent: theThis,
                        minZIndex: zIndex,
                        visibilityVerb: searchSetting.visibilityVerb,
                        addStyles: appStyles.AddSearchFeatureStyles,
                        color: searchSetting.color,
                        nDLayerExtent: nDLayerExtentUse,
                        dlayerPreClick: preClickUse,
                        layerMapB: searchLayerMapB,
                        layerHybridB: searchLayerHybridB
                    })
                });
            }
            else {
                console.log('duplicate search title: ' + searchTitle);
            }
        }
        return searches;
    }

    function createSearchSettings(useFake) {
        var maxRecords = 100;
        var searchSettings;
        if (tf.js.GetIsNonEmptyArray(settings.dlayerParams)) {
            var nDLayers = settings.dlayerParams.length;
            var defaultColors = ["#f00", "#44f", "#0a0", "#d3d", "#3dd", "#b63", "#f80", "#08f", "#80f", "#8f0", "#0f8", "#f08"];

            for (var i in defaultColors) { defaultColors[i] = appStyles.GetLighterColor(defaultColors[i]); }

            searchSettings = [];

            for (var i = 0; i < nDLayers; ++i) {
                var dlayerSetting = settings.dlayerParams[i];
                var searchSetting = {
                    title: dlayerSetting.dLayerLegend,
                    urlStart: dlayerSetting.dLayerData,// + "&numfind=20",
                    isVisible: dlayerSetting.dLayerSelect,
                    markerNameField: dlayerSetting.dLayerField,
                    color: defaultColors[i % defaultColors.length],
                    maxRecords: maxRecords
                };
                searchSettings.push(searchSetting);
            }
        }
        else if (useFake) {
            var ITPASearchSetting = {
                title: "Businesses2",
                //urlStart: "http://acorn.cs.fiu.edu/cgi-bin/arquery.cgi?category=itpall&vid=itpa&numfind=20&tfaction=shortdisplayflash",
                urlStart: "http://n00.cs.fiu.edu/cgi-bin/arquery1.cgi?vid=ramb&y1=25.787794538070614&x1=-80.362932146016&category=callreal",
                isVisible: true,
                markerNameField: "L",
                color: "#f00",
                maxRecords: maxRecords
            };
            var restaurantsSearchSetting = {
                title: "Restaurants",
                urlStart: "http://n00.cs.fiu.edu/cgi-bin/arquery.cgi?category=us_companies_2013&tfaction=shortdisplayflash&arcriteria=1&Industry=Eating&numfind=20",
                isVisible: true,
                markerNameField: "L",
                color: "#00f",
                maxRecords: maxRecords
            };
            var storesSearchSetting = {
                title: "Stores",
                urlStart: "http://n00.cs.fiu.edu/cgi-bin/arquery.cgi?category=us_companies_2013&tfaction=shortdisplayflash&numfind=20&arcriteria=1&SIC_CODE_Description|=store+stores",
                isVisible: true,
                markerNameField: "L",
                color: "#0c0",
                maxRecords: maxRecords
            };
            var sideViewSearchSetting = {
                title: "SideView",
                urlStart: "http://acorn.cs.fiu.edu/cgi-bin/arquery.cgi?tester=&category=alta&vid=&tfaction=shortdisplayflash&numfind=20",
                isVisible: true,
                markerNameField: "L",
                color: "#0cf",
                maxRecords: maxRecords
            };

            searchSettings = [ITPASearchSetting, restaurantsSearchSetting, storesSearchSetting/*, sideViewSearchSetting*/];
        }
        else {
            searchSettings = [];
        }

        var nSearches = searchSettings.length;

        for (var i = 0; i < nSearches; ++i) {
            var searchSetting = searchSettings[i];
            searchSetting.updateVerb = "sIsSearching" + i;
            searchSetting.visibilityVerb = "sIsVisible" + i;
            searchSetting.autoRefreshVerb = "sAutoRefreshes" + i;
        }

        return searchSettings;
    }

    function createInitialContext(searchSettings, dataSetsPaneVisible, initialDirectionsMode) {
        var initialContext = {};
        var contextAttributeNames = [
            tf.TFMap.CAN_directionsMode,
            tf.TFMap.CAN_showingDirections,
            tf.TFMap.CAN_isSearchingAddress,
            tf.TFMap.CAN_sidePanelVisible,
            tf.TFMap.CAN_dataSetsPanelVisible,
            tf.TFMap.CAN_selectedSearch,
            tf.TFMap.CAN_selectedToolTipSender,
            tf.TFMap.CAN_userLocation,
            tf.TFMap.CAN_clickLocation,
            tf.TFMap.CAN_searchAddressLocation
        ];
        for (var i in contextAttributeNames) { initialContext[contextAttributeNames[i]] = undefined; }
        initialContext[tf.TFMap.CAN_sidePanelVisible] = true;
        initialContext[tf.TFMap.CAN_dataSetsPanelVisible] = dataSetsPaneVisible != undefined ? !!dataSetsPaneVisible : true;
        initialContext[tf.TFMap.CAN_showingDirections] = false;
        initialContext[tf.TFMap.CAN_directionsMode] = initialDirectionsMode;//tf.TFMap.directionModeDrive;
        for (var i in searchSettings) {
            var searchSetting = searchSettings[i];
            initialContext[searchSetting.updateVerb] = false;
            initialContext[searchSetting.visibilityVerb] = searchSetting.isVisible;
            initialContext[searchSetting.autoRefreshVerb] = true;
        }

        return initialContext;
    }

    function setBottomPaneUpDownStyle() {
        var bottomPanePositionClasses = bottomPane.GetPositionClasses();
        tf.dom.ReplaceCSSClassCondition(rootDiv, isBottomPaneUp, bottomPanePositionClasses.upClassName, bottomPanePositionClasses.downClassName);
        if (!isBottomPaneUp) {
            var underBottomWrapper = bottomPane.GetUnderBottomWrapper();
            underBottomWrapper.ClearContent();
        }
    }

    function createToaster(container) {
        var toasterStyle = { zIndex: 20, position: "absolute", right: "0px", top: "0px" };
        var toaster = new tf.ui.Toaster({
            container: container, timeout: 2000, className: "", style: toasterStyle, toastClassName: toastClassName, toastStyle: {
                display: "inline-block", margin: "6px", boxShadow: "3px 3px 6px rgba(0,0,0,0.5)"
            }, addBefore: true
        });
        return toaster;
    }

    function requestEditorClose(notification) { if (!!currentEditorI && notification.sender == currentEditorI.sender) { deActivateCurrentEditor(); } }

    function deActivateCurrentEditor() {
        if (!!currentEditorI) {
            var isMoreToolsTool = (theThis.IsMeasureToolOn() || theThis.IsDownloadToolOn());
            if (!!tf.js.GetFunctionOrNull(currentEditorI.deActivate)) { currentEditorI.deActivate(); }
            currentEditorI = undefined;
            if (isMoreToolsTool && !!mapMoreTools) { mapMoreTools.UpdateToolsVisibility(); }
            map.Render();
        }
    }

    function activateEditor(editorI) {
        deActivateCurrentEditor();
        if (!!editorI) {
            currentEditorI = editorI;
            if (!!tf.js.GetFunctionOrNull(currentEditorI.activate)) { currentEditorI.activate(); }
            if ((theThis.IsMeasureToolOn() || theThis.IsDownloadToolOn()) && !!mapMoreTools) { mapMoreTools.UpdateToolsVisibility(); }
            map.Render();
        }
    }

    function initMapLegend() {
        var urlMapSettings = settings.mapSettings;
        var isM2 = urlMapSettings.mapEngine != tf.consts.mapnikEngine;

        decodedLegendH = tf.js.DecodeLegend(urlMapSettings.legendH);
        decodedLegendM = isM2 ? tf.js.DecodeLegend(urlMapSettings.legendM) : decodedLegendH
    }

    function createControl() {

        initMapLegend();

        //var customizedScrollBarClassName = tf.TFMap.LayoutSettings.customizedScrollBarClassName;

        tf.TFMap.LayoutSettings.distances3Units = tf.js.CalcDistances3Units();

        photoList = new tf.TFMap.PhotoList({ appContent: theThis });
        photoListDisplayer = new tf.TFMap.PhotoListDisplayer({ appContent: theThis });
        photoDisplayer = new tf.TFMap.PhotoDisplayer({ appContent: theThis });
        overMapCanvas = new tf.TFMap.OverMapCanvas({ appContent: theThis });

        //underBottomWrapper = new tf.dom.Div({ cssClass: "underBottomPaneWrapper" });

        var urlMapSettings = settings.mapSettings;
        var strPanels = urlMapSettings.panels;
        var useMeasureTool = false, useDownloadTool = false;
        var createAuxTypeMap = false, createBaseLayers = false;
        var dataSetsPaneVisible = true;
        var userLocationButton = true;
        var zoomButtons = false;
        var compassButtons = true;
        var useMapCenter = true;
        var useMapLogo = false;

        usePerspectiveMap = perspectiveMapIsInitiallyVisible = false;

        useBusDirections = settings.params[tf.consts.paramNameDirectionsUseBus] != undefined;

        useStageBusDirections = settings.params[tf.consts.paramNameDirectionsUseBusStage] != undefined;

        var webGL = tf.webgl.GetWebGL();
        if (webGL.GetHasWebGL()) {
            if((usePerspectiveMap = settings.params[tf.consts.paramNamePerspectiveMap]) != undefined) {
                perspectiveMapIsInitiallyVisible = tf.js.GetBoolFromValue(usePerspectiveMap);
                usePerspectiveMap = true;
            }
        }

        if (tf.js.GetIsNonEmptyString(strPanels)) {
            strPanels = strPanels.split(tf.consts.charSplitStrings);
            var nPanels = strPanels.length;
            for (var i = 0; i < nPanels; ++i) {
                var panelStr = strPanels[i].toLowerCase();
                switch (panelStr) {
                    case tf.consts.panelNameTFLogo:
                        useMapLogo = true;
                        break;
                    case tf.consts.panelNameNoMapCenter:
                        useMapCenter = false;
                        break;
                    case tf.consts.panelNameNoMapRotate:
                        compassButtons = false;
                        break;
                    case tf.consts.panelNameZoom:
                        zoomButtons = true;
                        break;
                    case tf.consts.panelNameNoUserLocation:
                        userLocationButton = false;
                        break;
                    case tf.consts.panelNameLayers:
                        createBaseLayers = true;
                        break;
                    case tf.consts.panelNameType:
                        createAuxTypeMap = true;
                        break;
                    case tf.consts.panelNameMeasure:
                        useMeasureTool = true;
                        break;
                    case tf.consts.panelNameDownload:
                        useDownloadTool = true;
                        break;
                    case tf.consts.markersPanelCollapsed:
                        dataSetsPaneVisible = false;
                        break;
                }
            }
        }

        tf.TFMap.LayoutSettings.createAuxTypeMap = createAuxTypeMap;

        isUsingClusters = true;

        initWayPoints();

        settings.appContent = theThis;

        showingAerial = urlMapSettings.mapType != tf.consts.typeNameMap;

        appStyles.SetIsShowingAerial(showingAerial);

        var searchSettings = createSearchSettings(false);
        var initialDirectionsMode = tf.services.GetDirectionModeFrom(settings.params[tf.consts.paramNameDirectionsMode], tf.consts.routingServiceModeCar, useBusDirections);

        lastCtx = createInitialContext(searchSettings, dataSetsPaneVisible, initialDirectionsMode);
        appCtx = new tf.js.Context({ appContent: theThis, ctx: lastCtx });
        appCtx.AddListener(onContextChange);

        settings.multiMenus = multiMenus = new tf.ui.MultiMenus();

        toolTipDisplayer = new tf.TFMap.ToolTipDisplayer({ appContent: theThis });

        mapDiv = new tf.dom.Div({ cssClass: mapClassName });
        mapMapDiv = new tf.dom.Div({ cssClass: mapMapClassName });

        mapDiv.AddContent(mapMapDiv);

        bottomPane = new tf.TFMap.BottomPane({ appContent: theThis });

        map = createMap(mapMapDiv, showingAerial ? tf.consts.typeNameHybrid : tf.consts.typeNameMap, true, true, compassButtons);
        createMapLayers(map, searchSettings, 1);

        mapDiv.AddContent(overMapCanvas.GetWrapper());

        diffLevelMapTypeAux = 3;
        if (createAuxTypeMap) {
            mapTypeAuxMapWrapper = new tf.TFMap.AuxMapWrapper({ appContent: theThis });
            mapTypeAuxMap = createMap(mapTypeAuxMapWrapper.GetMapWrapper(), showingAerial ? tf.consts.typeNameMap : tf.consts.typeNameAerial, false, false, false);
            onMapLevelChange();
        }

        mapListeners = {};

        mapListeners[tf.consts.mapFeatureHoverInOutEvent] = map.AddListener(tf.consts.mapFeatureHoverInOutEvent, onMapFeatureHover);
        mapListeners[tf.consts.mapFeatureClickEvent] = map.AddListener(tf.consts.mapFeatureClickEvent, onMapFeatureClick);
        mapListeners[tf.consts.mapFeatureDblClickEvent] = map.AddListener(tf.consts.mapFeatureDblClickEvent, onMapFeatureDoubleClick);
        mapListeners[tf.consts.mapFeatureMouseMoveEvent] = map.AddListener(tf.consts.mapFeatureMouseMoveEvent, onMapFeatureMouseMove);
        mapListeners[tf.consts.mapFeatureMouseDragEvent] = map.AddListener(tf.consts.mapFeatureMouseDragEvent, onMapFeatureMouseDrag);
        mapListeners[tf.consts.mapEndDragEvent] = map.AddListener(tf.consts.mapEndDragEvent, onMapDragEnd);
        mapListeners[tf.consts.mapClickEvent] = map.AddListener(tf.consts.mapClickEvent, onMapClick);
        mapListeners[tf.consts.mapMouseMoveEvent] = map.AddListener(tf.consts.mapMouseMoveEvent, onMapMouseMove);
        mapListeners[tf.consts.mapMouseDragEvent] = map.AddListener(tf.consts.mapMouseDragEvent, onMapMouseDrag);
        mapListeners[tf.consts.mapMoveEndEvent] = map.AddListener(tf.consts.mapMoveEndEvent, onMapMoveEnd);
        mapListeners[tf.consts.mapMoveStartEvent] = map.AddListener(tf.consts.mapMoveStartEvent, onMapMoveStart);
        mapListeners[tf.consts.mapLevelChangeEvent] = map.AddListener(tf.consts.mapLevelChangeEvent, onMapLevelChange);
        mapListeners[tf.consts.mapResolutionChangeEvent] = map.AddListener(tf.consts.mapResolutionChangeEvent, onMapResolutionChange);
        mapListeners[tf.consts.mapPostComposeEvent] = map.AddListener(tf.consts.mapPostComposeEvent, onMapPostCompose);
        mapListeners[tf.consts.mapPreComposeEvent] = map.AddListener(tf.consts.mapPreComposeEvent, onMapPreCompose);
        mapListeners[tf.consts.mapToggleScaleUnitEvent] = map.AddListener(tf.consts.mapToggleScaleUnitEvent, onMapScaleUnit);

        mapClickedLocation = new tf.TFMap.MapClickedLocation({ appContent: theThis, layer: mapClickedLocationLayer });
        mapUserLocation = new tf.TFMap.MapUserLocation({ appContent: theThis, layer: mapUserLocationLayer });
        mapSearchLocation = new tf.TFMap.MapSearchLocation({ appContent: theThis, layer: mapClickedLocationLayer });

        mapFeaturePropsDisplayer = new tf.TFMap.MapFeaturePropsDisplayer({ appContent: theThis, additionalFeaturesLayer: additionalFeaturesLayer });
        var mapFeaturePropsDisplayerCSSClassNames = mapFeaturePropsDisplayer.GetCSSClasseNames();

        var nDLayerExtent = settings.mapSettings.nDLayerExtent;
        var directionsDest = tf.js.GetNonEmptyString(settings.params[tf.consts.paramNameDirectionsDest], undefined);

        if (directionsDest != undefined) {
            var dd = directionsDest;
            directionsDest = undefined;
            try {
                dd = tf.js.JSONParse("[" + dd + "]");
                if (tf.js.GetIsArrayWithMinLength(dd, 2)) {
                    directionsDest = tf.js.GetMapCoordsFrom(dd);
                }
            }
            catch (e) {
                directionsDest = undefined;
            }
        }

        if (directionsDest != undefined) { nDLayerExtent = 0; }

        dataSetSearches = createSearches(searchSettings, nDLayerExtent);

        appDiv = new tf.dom.Div({ cssClass: appClassName });
        updateAppDivForMapType();
        rootDiv = new tf.dom.Div({ cssClass: rootClassName + " " + mapFeaturePropsDisplayerCSSClassNames.hiddenClassName });

        toaster = createToaster(rootDiv);

        sidePane = new tf.TFMap.SidePane({ appContent: theThis });

        if (searchSettings.length > 0) {
            dataSetsBar = new tf.TFMap.DataSetsBar({ appContent: theThis, searchSettings: searchSettings, getDataSet: function getDataSet(name) { return dataSetSearches[name] } });
        }

        var initialAddress = settings.mapSettings.addressBarText;
        //var initialAddress = appStyles.GetIsSmallScreen() ? "SMALL" : "LARGE";

        searchBar = new tf.TFMap.SearchBar({
            appContent: theThis, placeHolder: /*"Search " + settings.documentTitle*/ "Type an address or a place",
            initialText: initialAddress
        });

        sidePane.GetContentPane().AddContent(searchBar.GetWrapper()/*, mapFeaturePropsDisplayer.GetWrapper()*/);

        var bottomContentPane = bottomPane.GetContentPane();

        //photoDisplayerParentDiv = rootDiv;
        photoDisplayerParentDiv = appDiv;

        photoDisplayerParentDiv.AddContent(photoDisplayer.GetWrapper());
        photoDisplayer.Hide(photoDisplayerParentDiv);

        rootDiv.AddContent(mapFeaturePropsDisplayer.GetWrapper());

        if (!!dataSetsBar) {
            sidePane.GetContentPane().AddContent(dataSetsBar.GetWrapper());
        }

        mapToolBar = new tf.TFMap.MapToolBar({ appContent: theThis, userLocation: userLocationButton, zoom: zoomButtons });

        mapCompass = new tf.TFMap.Compass({ appContent: theThis, compassButtons: compassButtons });
        mapToolBar.GetWrapper().AddContent(mapCompass.GetWrapper());

        if (useMeasureTool || useDownloadTool) {
            mapMoreTools = new tf.TFMap.MoreMapTools({ appContent: theThis, measure: useMeasureTool, download: useDownloadTool });
            //mapToolBar.GetWrapper().AddContent(mapMoreTools.GetWrapper());
            mapCompass.GetWrapper().AddContent(mapMoreTools.GetWrapper());
        }

        bottomContentPane.AddContent(mapToolBar.GetWrapper());

        if (createBaseLayers) {
            baseLayersPanel = new tf.TFMap.BaseLayersPanel({
                appContent: theThis, mapEngine: settings.mapSettings.mapEngine, legendH: settings.mapSettings.legendH, legendM: settings.mapSettings.legendM, allowChangeType: createAuxTypeMap
            });
        }

        if (createAuxTypeMap) {
            bottomContentPane.AddContent(mapTypeAuxMapWrapper.GetWrapper());
        }

        setBottomPaneUpDownStyle();

        rootDiv.AddContent(mapDiv, sidePane.GetWrapper(), bottomPane.GetWrapper());

        setBottomPaneWidth();

        pinMapFeature = new tf.TFMap.PinMapFeature({ appContent: theThis, layer: mapPinsLayer, addStyles: appStyles.AddMapMarker1Style });

        directionsPanel = new tf.TFMap.DirectionsPanel({
            transitServerURL: settings.transitServerURL,
            useBusDirections: useBusDirections,
            useStageBusDirections: useStageBusDirections,
            appContent: theThis, layer: mapDirectionsLayer,
            pinLayer: mapDirectionsPinsLayer, itemsLayer: mapDirectionItemsLayer, wayPointsLayer: mapDirectionWayPointsLayer
        });

        sidePane.GetContentPane().AddContent(directionsPanel.GetWrapper());

        if (createBaseLayers) { sidePane.GetContentPane().AddContent(baseLayersPanel.GetWrapper()); }

        new tf.TFMap.MapFeatureDrag({
            map: map, checkCanStartDrag: checkCanStartDrag, checkCanDragTo: checkCanDragTo, onStartDrag: onStartDrag, onDrag: onDrag, onEndDrag: onEndDrag,
            setInterface: function(notification) { mapFeatureDragI = notification; }
        });

        var edSettings = { map: map, showMapFeatureToolTip: showMapFeatureToolTip, requestClose: requestEditorClose };

        new tf.TFMap.MapMeasureTool(tf.js.ShallowMerge(edSettings, {
            fillLayer: bottomFillLayerMeasureLayer,
            layer: measureToolLayer,
            setInterface: function (notification) { mapMeasureToolI = notification; }, distances3Units: tf.TFMap.LayoutSettings.distances3Units
        }));

        new tf.TFMap.MapDownloadTool(tf.js.ShallowMerge(edSettings, {
            fillLayer: bottomFillLayerDownloadLayer,
            layer: downloadToolLayer,
            setInterface: function (notification) { mapDownloadToolI = notification; }, distances3Units: tf.TFMap.LayoutSettings.distances3Units
        }));

        var overRootDiv = new tf.dom.Div({ cssClass: overRootClassName });

        appDiv.AddContent(rootDiv);

        if (tf.js.GetFunctionOrNull(settings.onAddComponents)) { settings.onAddComponents({ sender: theThis }); }

        if (usePerspectiveMap) { perspectiveMap = new tf.webgl.PerspectiveMap({ map: map, isVisible: perspectiveMapIsInitiallyVisible, appContent: theThis }); }

        if (createBaseLayers || usePerspectiveMap) {
            baseLayersToolBar = new tf.TFMap.BaseLayersToolBar({ appContent: theThis, useBaseLayers: createBaseLayers, usePerspectiveMap: usePerspectiveMap });
            bottomContentPane.AddContent(baseLayersToolBar.GetWrapper());
        }

        if (useMapCenter) {
            mapCenterDiv = new tf.dom.Div({ cssClass: mapCenterClassName });
            mapCenterDiv.GetHTMLElement().innerHTML = appStyles.GetMapCenterSVG();
            mapDiv.AddContent(mapCenterDiv);
        }

        if (useMapLogo) {
            mapLogoDiv = new tf.dom.Div({ cssClass: mapLogoClassName });
            mapLogoDiv.GetHTMLElement().innerHTML = appStyles.GetPoweredByTerraFlySVGForMap();
            mapDiv.AddContent(mapLogoDiv);
        }

        document.body.appendChild(overRootDiv.GetHTMLElement());
        document.body.appendChild(appDiv.GetHTMLElement());

        appSizer.OnResize();

        document.addEventListener("contextmenu", function onContextMenu(e) {
            deselectToolTipSender();
            if (!!mapFeatureDragI && mapFeatureDragI.getIsDragging()) {
                mapFeatureDragI.onEndDrag();
                //console.log('ended drag');
            }
            if (!!e.preventDefault) { e.preventDefault(); }
            e.cancelBubble = true;
            return false;
        });

        if (skipFirstMapFeatureProps = tf.js.GetIsNonEmptyString(initialAddress)) {
            mapSearchLocation.SetAddress(initialAddress, map.GetCenter());
            theThis.SetDirectionsTargetToCoords(map.GetCenter(), false, true);
        }

        if (directionsDest != undefined) {
            theThis.SetDirectionsTargetToCoords(directionsDest, true, true);
            directionsPanel.SetAutoSetNextExtent();
            theThis.EnsureDirectionsVisible();
        }

        if (!!settings.splashScreen) {
            setTimeout(function () {
                var splashStyle = settings.splashScreen.GetHTMLElement().style;
                splashStyle.opacity = "0";
                //splashStyle.left = "100%";
                splashStyle.pointerEvents = "none";
                setTimeout(function () {
                    document.body.removeChild(settings.splashScreen.GetHTMLElement());
                }, 1000);
            }, 1000);
        }

        setTimeout(function() {
            document.body.removeChild(overRootDiv.GetHTMLElement());
            if (tf.js.GetFunctionOrNull(settings.onCreated)) { settings.onCreated({ sender: theThis }); }
            //console.log('removed');
        }, 2500);

        //console.log(tf.TFMap.CompressClassNames);
    }

    var cssTag, bodyClassName, overRootClassName, appClassName, rootClassName, mapClassName, mapMapClassName, toastClassName, customizedScrollBarClassName, defaultHorMarginsClassName,
        smallerTextClassName, hrDivClassName, redFontColorShadowClassName, wrapperAerialModeClassName, wrapperMapModeClassName,
        arrowLeftBackgroundClassName, arrowRightBackgroundClassName, mapCenterClassName, mapLogoClassName;

    function createCSSClassNames() {
        bodyClassName = tf.TFMap.CreateClassName(cssTag, "Body");
        overRootClassName = tf.TFMap.CreateClassName(cssTag, "OverRoot");
        rootClassName = tf.TFMap.CreateClassName(cssTag, "Root");
        mapClassName = tf.TFMap.CreateClassName(cssTag, "Map");
        mapMapClassName = tf.TFMap.CreateClassName(cssTag, "MapMap");
        appClassName = tf.TFMap.CreateClassName(cssTag, "App");
        toastClassName = tf.TFMap.CreateClassName(cssTag, "Toast");
        customizedScrollBarClassName = tf.TFMap.CreateClassName(cssTag, "CustScroll");

        defaultHorMarginsClassName = tf.TFMap.CreateClassName(cssTag, "HorMargins");
        smallerTextClassName = tf.TFMap.CreateClassName(cssTag, "SmallerText");
        hrDivClassName = tf.TFMap.CreateClassName(cssTag, "hrDiv");
        redFontColorShadowClassName = tf.TFMap.CreateClassName(cssTag, "redFontCS");
        
        wrapperMapModeClassName = tf.TFMap.CreateClassName(cssTag, "MapMode");
        wrapperAerialModeClassName = tf.TFMap.CreateClassName(cssTag, "AerialMode");
        arrowLeftBackgroundClassName = tf.TFMap.CreateClassName(cssTag, "alb");
        arrowRightBackgroundClassName = tf.TFMap.CreateClassName(cssTag, "arb");

        mapCenterClassName = tf.TFMap.CreateClassName(cssTag, "mccn");
        mapLogoClassName = tf.TFMap.CreateClassName(cssTag, "mlcn");

        var ls = tf.TFMap.LayoutSettings;

        ls.sidePanelWrapperClassName = tf.TFMap.CreateClassName(cssTag, "SidePanelWrapper");
        ls.sidePanelWrapperCollapsedClassName = tf.TFMap.CreateClassName(cssTag, "SidePanelWrapperCollapsed");
        ls.sidePanelWrapperVisibleClassName = tf.TFMap.CreateClassName(cssTag, "SidePanelWrapperVisible");
        ls.sidePanelContentWrapperClassName = tf.TFMap.CreateClassName(cssTag, "SidePanelContentWrapper");
        ls.sidePaneFullHeightContentWrapperClassName = tf.TFMap.CreateClassName(cssTag, "SidePaneFullHeightContentWrapper");
        ls.sidePanelCloseButtonClassName = tf.TFMap.CreateClassName(cssTag, "SidePanelCloseButton");
        ls.sidePaneContentFixedHeightClassName = tf.TFMap.CreateClassName(cssTag, "SidePaneContentFixedHeight");
        ls.sidePaneContentVariableHeightClassName = tf.TFMap.CreateClassName(cssTag, "SidePaneContentVariableHeight");

        ls.aerialOrMapColorScheme = tf.TFMap.CreateClassName(cssTag, "AerialOrMapColorScheme");
        ls.showingAerialClassName = tf.TFMap.CreateClassName(cssTag, "ShowingAerial");
        ls.showingMapClassName = tf.TFMap.CreateClassName(cssTag, "ShowingMap");
    }

    function createCSSClasses() {
        var appContent = theThis, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var darkTextColor = ls.darkTextColor;

        cssClasses[ls.showingAerialClassName] = {};
        cssClasses[ls.showingMapClassName] = {};

        var commonStyles1 = {
            inherits: [CSSClasses.robotoFontFamily, CSSClasses.fontSize16px, CSSClasses.overflowHidden, CSSClasses.backgroundColorTransparent, CSSClasses.noMarginNoBorderNoPadding]
        };

        var commonStyles2 = {
            inherits: [commonStyles1, CSSClasses.WHOneHundred, CSSClasses.displayBlock, CSSClasses.cursorDefault, CSSClasses.positionAbsolute,
                CSSClasses.leftTopZero, CSSClasses.zIndex1],
            color: darkTextColor
        };

        var nonSelectStyles = {
            "-webkit-touch-callout": "none", "-webkit-user-select": "none", "-khtml-user-select": "none", "-moz-user-select": "none",
            "-ms-user-select": "none", "user-select": "none", "-webkit-tap-highlight-color": "transparent"
        };

        cssClasses[bodyClassName] = { inherits: [commonStyles1] };
        cssClasses[overRootClassName] = {
            inherits: [commonStyles2, nonSelectStyles],
            zIndex: '' + (ls.rootDivZIndex + ls.overRootZIndexAdd)
            /*, background: "rgba(0,0,255,0.5)"*/
        };
        cssClasses[rootClassName] = { inherits: [commonStyles2, nonSelectStyles] };
        cssClasses[mapClassName] = { inherits: [commonStyles2, CSSClasses.transitionPoint2s] };

        cssClasses[mapMapClassName] = { inherits: [commonStyles2] };

        cssClasses[appClassName] = { inherits: [commonStyles2, nonSelectStyles] };

        cssClasses[toastClassName] = {
            inherits: [CSSClasses.lightBackground, CSSClasses.darkTextColor],
            maxWidth: "16rem", textAlign: "center", border: "2px solid red", borderRadius: "6px", padding: "8px",
            fontSize: "1rem", lineHeight: "1rem", textShadow: "2px 2px 3px white", cursor: "default",
            zIndex: '' + (ls.rootDivZIndex + ls.toastZIndexAdd)
        };

        cssClasses[customizedScrollBarClassName + "::-webkit-scrollbar"] = { width: "8px", height: "8px", backgroundColor: "#aaa" };
        cssClasses[customizedScrollBarClassName + "::-webkit-scrollbar-thumb"] = { background: "#000" };

        cssClasses[defaultHorMarginsClassName] = { marginLeft: "4px", marginRight: "4px" };

        cssClasses[smallerTextClassName] = { fontSize: "90%" };

        cssClasses[hrDivClassName] = {
            inherits: [CSSClasses.overflowHidden, CSSClasses.displayBlock],
            border: 'none !important', padding: '0 !important', marginTop: "0.5em !important",
            marginBottom: "0.5em !important", width: "100% !important", height: "2px !important",
            backgroundColor: "navajowhite !important"
        };

        cssClasses[redFontColorShadowClassName] = { inherits: [CSSClasses.lightTextShadow], color: "red" };

        cssClasses[ls.aerialOrMapColorScheme] = {};

        cssClasses[wrapperMapModeClassName] = {
            inherits: [CSSClasses.lightBackground, CSSClasses.darkTextShadow, CSSClasses.fillActiveSVGColor, CSSClasses.darkTextColor],
            borderColor: darkTextColor
        };
        cssClasses[wrapperAerialModeClassName] = {
            inherits: [CSSClasses.toolTipBackground, CSSClasses.lightTextShadow], fill: "white", color: "white",
            borderColor: "white"
        };

        cssClasses[ls.showingMapClassName + " ." + ls.aerialOrMapColorScheme] = { inherits: [cssClasses[wrapperMapModeClassName]] };
        cssClasses[ls.showingAerialClassName + " ." + ls.aerialOrMapColorScheme] = { inherits: [cssClasses[wrapperAerialModeClassName]] };

        cssClasses[arrowLeftBackgroundClassName] = { inherits: [CSSClasses.arrowLeftBackground] };
        cssClasses[arrowRightBackgroundClassName] = { inherits: [CSSClasses.arrowRightBackground] };

        cssClasses[ls.sidePanelWrapperClassName] = {
            inherits: [CSSClasses.transitionPoint2s, CSSClasses.positionAbsolute, CSSClasses.overflowVisible, CSSClasses.pointerEventsAll, CSSClasses.robotoFontFamily,
            CSSClasses.boxShadow002003, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.leftTopZero, CSSClasses.WHOneHundred, CSSClasses.backgroundColorWhite],
            zIndex: '' + (ls.rootDivZIndex + ls.sidePanelWrapperZIndexAdd)
        };

        cssClasses[ls.sidePanelWrapperCollapsedClassName] = {
            //width: "0px",
            //display: "none",
            inherits: [CSSClasses.visibilityHidden], transform: "translateX(-100%)", "-webkit-transform": "translateX(-100%)"
        };

        cssClasses[ls.sidePanelWrapperVisibleClassName] = {
            //width: "initial",
            inherits: [CSSClasses.visibilityVisible],
            transform: "translateX(0px)", "-webkit-transform": "translateX(0px)"
        };

        cssClasses[ls.sidePanelContentWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible, CSSClasses.displayFlex, CSSClasses.positionRelative, CSSClasses.flexFlowColumnNoWrap],
            background: 'white'
        };

        cssClasses[ls.sidePaneFullHeightContentWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible, CSSClasses.displayFlex, CSSClasses.positionRelative, CSSClasses.flexFlowColumnNoWrap],
            minHeight: "0px",
            height: "100%"
        };

        var sidePanelCloseButtonDimInt = ls.sidePanelCloseButtonDimInt;
        var sidePanelCloseButtonDimPx = sidePanelCloseButtonDimInt + 'px';

        cssClasses[ls.sidePanelCloseButtonClassName] = {
            inherits: [CSSClasses.transparentImageButton, CSSClasses.overflowHidden, CSSClasses.positionAbsolute, CSSClasses.displayBlock, CSSClasses.flexGrowZero,
            CSSClasses.backgroundColorTransparent],
            top: ls.sidePanelCloseButtonTopInt + "px", right: "12px", width: sidePanelCloseButtonDimPx, height: sidePanelCloseButtonDimPx,
            zIndex: '' + (ls.rootDivZIndex + ls.sidePanelCloseButtonZIndexAdd)
        };

        cssClasses[ls.sidePanelCloseButtonClassName + " svg"] = {
            //stroke: "white", fill: "transparent", strokeWidth: "6px",
            fill: "white", stroke: "none",
            width: "calc(100% - 1px)", height: "calc(100% - 1px)", margin: "auto"
        };

        //cssClasses[ls.sidePanelCloseButtonClassName + " svg:hover"] = { stroke: "black" };

        var sidePanelWidthInt = ls.sidePanelWidthInt, sidePaneWidthPx = sidePanelWidthInt + 'px';

        cssClasses[ls.sidePaneContentFixedHeightClassName] = {
            //inherits: [CSSClasses.positionRelative, CSSClasses.displayFlex, CSSClasses.flexFlowColumnNoWrap, CSSClasses.flexGrowZero, CSSClasses.flexShrinkZero], width: sidePaneWidthPx
            inherits: [CSSClasses.positionRelative, CSSClasses.displayBlock], width: sidePaneWidthPx
        };

        cssClasses[ls.sidePaneContentVariableHeightClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.displayBlock, CSSClasses.flexGrowOne],
            overflowY: "auto", overflowX: "hidden", background: 'transparent', width: sidePaneWidthPx
        };

        cssClasses[mapCenterClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.displayBlock, CSSClasses.pointerEventsNone, CSSClasses.absoluteCenter],
            width: ls.mapCenterDimStr, height: ls.mapCenterDimStr,
            zIndex: '' + (ls.rootDivZIndex + ls.mapLogoAndCenterZIndexAdd)
        };

        cssClasses[ls.showingAerialClassName + " ." + mapCenterClassName] = {
            fill: "rgba(255, 255, 255, 0.22)", stroke: "rgba(0, 0, 0, 0.4)"
        };
        cssClasses[ls.showingMapClassName + " ." + mapCenterClassName] = {
            fill: "rgba(50, 100, 200, 0.075)", stroke: "rgba(100, 149, 237, 0.4)"
        };

        cssClasses[mapLogoClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.displayBlock, CSSClasses.positionAbsolute, CSSClasses.pointerEventsNone],
            right: ls.mapLogoRightStr,
            top: ls.mapLogoTopStr,
            width: ls.mapLogoDimStr,
            height: ls.mapLogoDimStr,
            borderRadius: "50%",
            paddingLeft: ls.mapLogoPaddingLeftStr,
            paddingTop: ls.mapLogoPaddingTopStr,
            paddingRight: ls.mapLogoPaddingRightStr,
            paddingBottom: ls.mapLogoPaddingBottomStr,
            backgroundColor: "rgba(255,255,255,0.5)",
            zIndex: '' + (ls.rootDivZIndex + ls.mapLogoAndCenterZIndexAdd),
            strokeWidth: "0.3px"
        };

        cssClasses[ls.showingAerialClassName + " ." + mapLogoClassName] = {
            //border: "1px solid rgba(255, 255, 255, 0.5)",
            opacity: "0.8",
            border: "1px solid rgba(0, 0, 0, 0.3)",
            //stroke: "rgba(240, 255, 255, 0.8)"
            stroke: "white"
        };
        cssClasses[ls.showingMapClassName + " ." + mapLogoClassName] = {
            //border: "1px solid rgba(0, 0, 0, 0.1)",
            opacity: "0.6",
            border: "1px solid rgba(100, 149, 237, 0.3)",
            stroke: "darkgoldenrod"
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }

    function recalcMapElems() {
        calcScaleElemLayout();
        adjustMapFeatureClustersForLayout();
    }

    function onLayoutChangeFromStyles(notification) {
        //console.log('content: onLayoutChangeFromStyles');
        registerCSSClasses();
        recalcMapElems();
        if (!!currentEditorI && tf.js.GetFunctionOrNull(currentEditorI.onLayoutChange)) { currentEditorI.onLayoutChange(notification); }
    }

    function onStylesLoaded() {
        cssTag = 'content';
        createCSSClassNames();
        registerCSSClasses();
        document.body.className = bodyClassName;
        var layoutSettings = tf.TFMap.LayoutSettings;
        layoutSettings.arrowLeftBackgroundClassName = arrowLeftBackgroundClassName;
        layoutSettings.arrowRightBackgroundClassName = arrowRightBackgroundClassName;
        layoutSettings.customizedScrollBarClassName = customizedScrollBarClassName;
        layoutSettings.defaultHorMarginsClassName = defaultHorMarginsClassName;
        layoutSettings.smallerTextClassName = smallerTextClassName;
        layoutSettings.hrDivClassName = hrDivClassName;
        layoutSettings.redFontColorShadowClassName = redFontColorShadowClassName;
        layoutSettings.wrapperAerialModeClassName = wrapperAerialModeClassName;
        layoutSettings.wrapperMapModeClassName = wrapperMapModeClassName;
        createControl();
    }

    function onStartDrag(notification) {
        deselectToolTipSender();
    }

    function onDrag(notification) {
        var mapFeatureToDrag = notification.mapFeatureToDrag;
        var pointCoords = mapFeatureToDrag.GetPointCoords();
        theThis.MakeSureMapCoordsAreVisible(pointCoords, undefined, true);
        if (!!notification.dragProps.editorProps) {
            if (!!currentEditorI && !!tf.js.GetFunctionOrNull(currentEditorI.onDrag)) { currentEditorI.onDrag(notification); }
        }
        else {
            var settings = mapFeatureToDrag.GetSettings();
            if (tf.js.GetFunctionOrNull(settings.onDragged)) { settings.onDragged(notification); }
            else if (settings.directionsAddressItem != undefined) { directionsPanel.OnAddressMapFeatureChangedCoords(settings.directionsAddressItem, pointCoords); }
            else if (settings.wayPointIsInLayer) { directionsPanel.OnWayPointChangedCoords(mapFeatureToDrag); }
        }
    }

    function onEndDrag(notification) {
        if (!!notification.dragProps.editorProps) {
            if (!!currentEditorI && !!tf.js.GetFunctionOrNull(currentEditorI.onEndDrag)) {
                currentEditorI.onEndDrag(notification);
            }
        }
        else if (notification.dragProps.onDragged) {
            notification.dragProps.onDragged(undefined);
        }
    }

    function checkCanStartDrag(notification) {
        var dragFeatureProps;
        var editorDragFeatureProps = !!currentEditorI && tf.js.GetFunctionOrNull(currentEditorI.checkCanStartDrag) ? currentEditorI.checkCanStartDrag(notification) : undefined;
        if (!editorDragFeatureProps) {
            var mapFeature = notification.mapFeature, mapFeatureSettings = mapFeature.GetSettings();
            var hasFunction = tf.js.GetFunctionOrNull(mapFeatureSettings.onDragged) && tf.js.GetFunctionOrNull(mapFeatureSettings.canDrag) && mapFeatureSettings.canDrag({ sender: theThis, mapFeature: mapFeature });
            var canDragFeature = hasFunction || mapFeatureSettings.directionsAddressItem != undefined || !!mapFeatureSettings.wayPointIsInLayer;
            if (canDragFeature) {
                dragFeatureProps = {
                    onDragged: hasFunction ? mapFeatureSettings.onDragged : undefined
                };
            }
        }
        else {
            dragFeatureProps = { editorProps: editorDragFeatureProps };
        }
        return dragFeatureProps;
    }

    function checkCanDragTo(notification) {
        return !!notification.editorProps ? (!!currentEditorI && tf.js.GetFunctionOrNull(currentEditorI.checkCanDragTo) ? currentEditorI.checkCanDragTo(notification) : true) : true;
    }

    this.SetProcessMapClickedLocation = function (set) { processMapClickedLocation = !!set; return theThis.GetProcessMapClickedLocation(); };
    this.GetProcessMapClickedLocation = function () { return processMapClickedLocation; };

    function initialize() {

        processMapClickedLocation = true;

        customAppMinZIndex = 500;
        clusterZIndex = 100;

        if (tf.TFMap.CompressClassNames == -1) {
            console.log('*** full css class names');
        }

        document.title = settings.documentTitle;
        isBottomPaneUp = false;
        if (tf.js.GetFunctionOrNull(settings.onParametersParsed)) {
            settings.onParametersParsed({
                sender: theThis, params: settings.params, mapSettings: settings.mapSettings, dlayerParams: settings.dlayerParams
            });
        }
        appSizer = new tf.TFMap.AppSizer({ onResize: onAppResize });
        appSizer.OnResize();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
