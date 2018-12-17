"use strict";

tf.TFMap.SearchMapFeatures = function(settings) {
    var theThis, isVisible, dataSet;
    var searchFeaturesByKeyHB, searchFeaturesByKeyMB;
    var nDLayerExtent, dlayerPreClick;
    var lineWidthForPlaceBoundaryMeasures;

    this.SetDataSet = function(newDataSet) { dataSet = newDataSet; }

    this.GetSearchFeaturesForToolTip = function() { return searchFeaturesByKeyHB; }

    this.GetIsVisible = function() { return isVisible; }

    this.UpdateVisibility = function() {
        var wasVisible = isVisible;
        updateIsVisibleFromContext();
        if (wasVisible != isVisible) { addDelFeatures(); }
    }

    this.UpdateSearchFeatures = function(updateNotification) {
        if (tf.js.GetIsValidObject(updateNotification)) {
            updateIsVisibleFromContext();
            var layerHB = settings.layerHybridB, layerMB = settings.layerMapB;
            var toolTipProps = { toolTipText: getSearchMapFeatureToolTipText, onClick: onClickSearchFeature, keepOnHoverOutTarget: true, offsetX: 12 };
            var additionalToolTipProps = tf.js.ShallowMerge(toolTipProps);
            var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), appCtx = appContent.GetAppCtx();
            var addedResults = updateNotification.addedResults, nAddedResults = addedResults.length;
            var deletedResults = updateNotification.deletedResults, nDeletedResults = deletedResults.length;
            var selectedSearch = appCtx.GetCtxAttribute(tf.TFMap.CAN_selectedSearch);
            var doWithHold = true;
            var minZIndex = settings.minZIndex;

            //additionalToolTipProps.toolTipText = "Image boundaries";
            delete additionalToolTipProps.toolTipText;
            delete additionalToolTipProps.onClick;
            additionalToolTipProps.keepOnHoverOutTarget = false;

            if (searchFeaturesByKeyHB == undefined) { searchFeaturesByKeyHB = {}; }
            if (searchFeaturesByKeyMB == undefined) { searchFeaturesByKeyMB = {}; }

            var quadriPolyFeatureStyle = [{ line: true, line_color: "#45f7f7", line_width: 2, zindex: 2 }, { fill: true, fill_color: "#fff", fill_opacity: 25, zindex: 3 }];
            var quadriPolyVertexStyle = [{
                zindex: 5, circle: true, circle_radius: 12, fill: true, fill_color: "#fff", line: true, line_color: "#45f7f7", line_width: 2, line_opacity: 30
            }, { zindex: 6, font: "600 14px Roboto", text: true, fill: true, fill_color: "#037", line: true, line_opacity: 70, line_color: "#fffffc", line_width: 2 }];

            var placeBoundaryFeatureStyle = [{ line: true, line_color: "#000", zindex: 1, line_width: lineWidthForPlaceBoundaryMeasures + 2, line_opacity: 70, line_cap: "round" }];

            var propsDisplayer = appContent.GetMapFeaturePropsDisplayer();

            var firstRecordProcessedLastKey;

            for (var i = nAddedResults - 1; i >= 0; --i) {
                var result = addedResults[i], key = result.key;
                var buttonClasses = propsDisplayer.GetMapFeaturePropsTextButtonClass();
                if (searchFeaturesByKeyHB[key] == undefined) {
                    var onPostCompose = undefined;
                    var resultProps = result.properties;
                    var geom = result.geometry, coords = geom.coordinates;
                    var bottomContent = undefined, bottomContentType;
                    var additionalFeatures = undefined;
                    var addButtons = [];
                    var polyMapFeature = undefined, polyMeasure = undefined, polyArea = undefined;

                    //if (searchFeaturesByKeyMB[key] != undefined) { console.log('search has H but not M feature'); }

                    createAddButton(addButtons, { buttonClass: buttonClasses, toolTipText: "View Detail Report", clickVerb: "detail", buttonText: "Detail" }, resultProps.Display_Link_Detail);
                    createAddButton(addButtons, { buttonClass: buttonClasses, toolTipText: "View Nearby Report", clickVerb: "nearby", buttonText: "Nearby" }, resultProps.Display_Link_Report_Recentered);
                    createAddButton(addButtons, { buttonClass: buttonClasses, toolTipText: "View Location Report", clickVerb: "location", buttonText: "Location" }, resultProps.Display_Link_Location);
                    createAddButton(addButtons, { buttonClass: buttonClasses, toolTipText: "Professional detail report for realtors only", clickVerb: "pro", buttonText: "Pro" }, resultProps.Display_Link_Pro);

                    var photos = tf.js.GetNonEmptyString(resultProps.photo, undefined);

                    if (!!photos) {
                        bottomContentType = tf.TFMap.BottomContentTypes.photos;
                        bottomContent = {
                            photoNamesStr: photos,
                            onClick: onPhotoClicked
                        };
                        result.mapFeatureText = '* ' + result.mapFeatureText;
                    }

                    if (tf.js.GetIsNonEmptyString(resultProps.place_boundary)) {
                        var coordsStr = resultProps.place_boundary.split("coordinates:");
                        if (coordsStr.length == 2) {
                            coordsStr = coordsStr[1];
                            if (coordsStr.length > 2) {
                                coordsStr = coordsStr.substring(0, coordsStr.length - 2);
                                //var thisPlaceStyle = tf.js.ShallowMerge(placeBoundaryFeatureStyle, { line_color: settings.color });
                                var coordinates = tf.js.JSONParse(coordsStr);
                                if (!!coordinates) {
                                    polyMapFeature = new tf.map.Feature({
                                        type: "polygon", coordinates: coordinates, style: placeBoundaryFeatureStyle/*thisPlaceStyle*/,
                                        originalSearchFeature: result, toolTipCoords: coords
                                    });
                                    polyMeasure = coordinates[0].slice(0);
                                    polyMeasure = polyMeasure.slice(0, polyMeasure.length - 1);
                                    polyArea = polyMapFeature.GetGeom().GetArea();
                                    onPostCompose = displayPlaceBoundaryMeasures;
                                    additionalFeatures = [];
                                    additionalFeatures.push(polyMapFeature);
                                }
                            }
                        }
                    }
                    else if (resultProps.UC_X1 !== undefined) {
                        var UC_X1 = tf.js.GetLongitudeFrom(resultProps.UC_X1), UC_X2 = tf.js.GetLongitudeFrom(resultProps.UC_X2);
                        var UC_X3 = tf.js.GetLongitudeFrom(resultProps.UC_X3), UC_X4 = tf.js.GetLongitudeFrom(resultProps.UC_X4);
                        var UC_Y1 = tf.js.GetLatitudeFrom(resultProps.UC_Y1), UC_Y2 = tf.js.GetLatitudeFrom(resultProps.UC_Y2);
                        var UC_Y3 = tf.js.GetLatitudeFrom(resultProps.UC_Y3), UC_Y4 = tf.js.GetLatitudeFrom(resultProps.UC_Y4);
                        var v1 = [UC_X1, UC_Y1], v2 = [UC_X2, UC_Y2], v3 = [UC_X3, UC_Y3], v4 = [UC_X4, UC_Y4];
                        var polyVertices = [v1, v2, v3, v4, v1];
                        polyMapFeature = new tf.map.Feature({
                            type: "polygon", coordinates: [polyVertices], style: quadriPolyFeatureStyle,
                            originalSearchFeature: result, toolTipCoords: coords
                        });

                        additionalFeatures = [];
                        additionalFeatures.push(polyMapFeature);

                        tf.TFMap.SetMapFeatureToolTipProps(polyMapFeature, tf.js.ShallowMerge(additionalToolTipProps, { toolTipText: "Image boundaries" }));

                        for (var iV = 0; iV < polyVertices.length - 1; ++iV) {
                            var indexStr = ' #' + (iV + 1)
                            var vertexStyle = quadriPolyVertexStyle.slice(0);
                            var vertexCoords = polyVertices[iV];
                            vertexStyle[1] = tf.js.ShallowMerge(vertexStyle[1], { label: indexStr });
                            var vertexFeature = new tf.map.Feature({
                                type: "point", coordinates: vertexCoords, style: vertexStyle,
                                originalSearchFeature: result
                            });
                            additionalFeatures.push(vertexFeature);
                            var vertexCoordsStr = vertexCoords[1].toFixed(5) + ", " + vertexCoords[0].toFixed(5)
                            var toolTipText = tf.TFMap.MapTwoLineSpan("Boundary vertex " + indexStr, vertexCoordsStr);
                            tf.TFMap.SetMapFeatureToolTipProps(vertexFeature, tf.js.ShallowMerge(additionalToolTipProps, { toolTipText: toolTipText }));
                        }

                        polyMeasure = [v1, v2, v3, v4];
                        polyArea = polyMapFeature.GetGeom().GetArea();
                        onPostCompose = displayImageBoundaryMeasures;
                    }

                    var commonSettings = {
                        searchFeature: result,
                        onPrepareForPropsDisplay: prepareForPropsDisplay,
                        showToolTip: result.mapFeatureImageSrc != undefined,
                        minZIndex: minZIndex,
                        getDisplayProps: getDisplayProps,
                        additionalFeatures: additionalFeatures,
                        onPostCompose: onPostCompose,
                        polyMapFeature: polyMapFeature,
                        polyMeasure: polyMeasure,
                        polyArea: polyArea,
                        hasStaticBottomContent: bottomContent != undefined,
                        bottomContentType: bottomContentType,
                        bottomContent: bottomContent,
                        onClose: onCloseDisplayProps,
                        isInLayer: true,
                        color: settings.color,
                        text: result.mapFeatureText,
                        imageSrc: result.mapFeatureImageSrc,
                        compassDirectionAngle: result.compassDirectionAngle,
                        onClick: onClickSearchButton,
                        addButtons: addButtons
                    };

                    var searchFeatureHBSettings = tf.js.ShallowMerge(commonSettings, { isForHybrid: true });
                    settings.addStyles(geom, searchFeatureHBSettings);
                    var searchFeatureHB = new tf.map.Feature(tf.js.ShallowMerge(geom, searchFeatureHBSettings));

                    var searchFeatureMBSettings = tf.js.ShallowMerge(commonSettings, { isForHybrid: false });
                    settings.addStyles(geom, searchFeatureMBSettings);
                    var searchFeatureMB = new tf.map.Feature(tf.js.ShallowMerge(geom, searchFeatureMBSettings));

                    tf.TFMap.SetMapFeatureToolTipProps(searchFeatureHB, toolTipProps);
                    tf.TFMap.SetMapFeatureToolTipProps(searchFeatureMB, toolTipProps);

                    result.properties.coords = coords;

                    searchFeatureHB.isVisible = searchFeatureMB.isVisible = isVisible;

                    if (isVisible) {
                        layerHB.AddMapFeature(searchFeatureHB, doWithHold);
                        layerMB.AddMapFeature(searchFeatureMB, doWithHold);
                    }
                    searchFeaturesByKeyHB[key] = searchFeatureHB;
                    searchFeaturesByKeyMB[key] = searchFeatureMB;

                    if (firstRecordProcessedLastKey == undefined) {
                        firstRecordProcessedLastKey = key;
                    }
                }
            }

            var needDeselectSelectedSearch = false;

            for (var i = 0; i < nDeletedResults; ++i) {
                var result = deletedResults[i], key = result.key;
                var existingFeatureHB = searchFeaturesByKeyHB[key];
                var existingFeatureMB = searchFeaturesByKeyMB[key];
                if (!!existingFeatureHB) {
                    delete searchFeaturesByKeyHB[key];
                    if (selectedSearch == existingFeatureHB) { needDeselectSelectedSearch = true; }
                    if (isVisible) { if (existingFeatureHB.isVisible) { layerHB.DelMapFeature(existingFeatureHB, doWithHold); } }
                }
                if (!!existingFeatureMB) {
                    delete searchFeaturesByKeyMB[key];
                    if (selectedSearch == existingFeatureMB) { needDeselectSelectedSearch = true; }
                    if (isVisible) { if (existingFeatureMB.isVisible) { layerMB.DelMapFeature(existingFeatureMB, doWithHold); } }
                }
            }

            if (doWithHold) {
                layerHB.DelWithheldFeatures();
                layerMB.DelWithheldFeatures();
                layerHB.AddWithheldFeatures();
                layerMB.AddWithheldFeatures();
            }

            if (needDeselectSelectedSearch) {
                appCtx.SetCtxAttribute(tf.TFMap.CAN_selectedSearch, undefined);
                appContent.ShowMapFeatureProps(undefined);
            }

            if (dlayerPreClick) {
                dlayerPreClick = false;
                if (firstRecordProcessedLastKey != undefined) {
                    var mapFeature = getIsShowingAerial ? searchFeaturesByKeyHB[firstRecordProcessedLastKey] : searchFeaturesByKeyMB[firstRecordProcessedLastKey];
                    if (!!mapFeature) {
                        appContent.ShowMapFeatureProps(mapFeature);
                    }
                }
            }
            else if (nDLayerExtent != undefined && nDLayerExtent > 0) {
                var extent = dataSet.GetInitialExtent();
                appContent.SetMapExtent(extent);
                nDLayerExtent = undefined;
            }
        }
    }

    function displayMeasureVertices(canvas, polyMeasure, polyArea, drawSettings) {
        if (!!polyMeasure) {
            var vertexInfos = tf.js.CalcVertexInfos(polyMeasure, polyArea);
            var nPoints = vertexInfos.length;
            if (nPoints >= 2) {
                var map = settings.appContent.GetMap();
                var showingHybrid = getIsShowingAerial();
                var ctx = canvas.getContext("2d");
                var extent = map.GetVisibleExtent();
                var requiredDrawSettings = {
                    map: map, ctx: ctx, distances3Units: tf.TFMap.LayoutSettings.distances3Units, vertexInfos: vertexInfos,
                    showingHybrid: showingHybrid, extent: extent
                };
                var defaultDrawSettings = { showArea: true, showIntermediateLenghts: true };
                tf.js.DrawMeasuredVertices(tf.js.ShallowMerge(defaultDrawSettings, drawSettings, requiredDrawSettings));
            }
        }
    }

    function displayImageBoundaryMeasures(notification) {
        var props = notification.props;
        return displayMeasureVertices(notification.pcNotification.canvas, props.polyMeasure, props.polyArea, {});
    }

    function displayPlaceBoundaryMeasures(notification) {
        var props = notification.props;
        var appContent = settings.appContent;
        var level = appContent.GetMap().GetLevel();
        var area = props.polyArea;
        var isSmallScreen = appContent.GetAppStyles().GetIsSmallScreen();
        var minLevel = isSmallScreen ? 15 : 16;
        var bigArea = area >= 100000;
        var medArea = !bigArea && area > 10000;
        var smArea = !bigArea && !medArea;
        var levelForTics = bigArea ? minLevel + 1 : (medArea ? minLevel + 2 : minLevel + 3);
        var levelForScaleText = levelForTics + 0;
        var levelForIntermediateLengths = levelForScaleText + 1;

        displayMeasureVertices(notification.pcNotification.canvas, props.polyMeasure, area, {
            colorSeg: props.color, lineWidth: lineWidthForPlaceBoundaryMeasures, largerFontSize: "18px",
            showIntermediateLenghts: level >= levelForIntermediateLengths,
            skipScaleText: level < levelForScaleText,
            skipTics: level < levelForTics,
            skipMeasures: level < minLevel
        });
    }

    function createAddButton(addButtons, buttonProps, linkStr) {
        if (tf.js.GetIsNonEmptyString(linkStr)) {
            buttonProps.linkStr = linkStr;
            addButtons.push(buttonProps);
        }
    }

    function onClickSearchButton(notification) {
        var toolTipSender = notification.toolTipSender;
        var sender = !!toolTipSender ? toolTipSender : notification.sender;
        var senderSettings = sender.GetSettings();
        var buttonSettings = senderSettings.buttonSettings;
        var clickVerb = buttonSettings.clickVerb;
        var linkStr = buttonSettings.linkStr;
        if (tf.js.GetIsNonEmptyString(linkStr)) { var nextWindow = window.open(linkStr, "_top"); }
    }

    function setSelectedSearchMapFeature(mapFeature) {
        if (!!mapFeature) {
            settings.appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_selectedSearch, mapFeature);
            settings.appContent.ShowMapFeatureProps(mapFeature);
        }
    }

    function onClickSearchFeature(notification) { setSelectedSearchMapFeature(notification.toolTipSender.mapFeature); }

    function getDisplayProps(mapFeature) {
        var props = mapFeature.GetSettings();
        var innerHTML = "";
        var searchProps = tf.TFMap.GetSearchProps(mapFeature);
        var appContent = settings.appContent;
        var propsDisplayer = appContent.GetMapFeaturePropsDisplayer();
        if (!!searchProps) {
            var innerHTML = propsDisplayer.CreateMapFeatureTitleSpan(searchProps.Display_Label, settings.color);
            var nextPropsText;
            var propsImage = tf.js.GetNonEmptyString(searchProps.Display_Thumbnail, undefined);

            if (tf.js.GetIsNonEmptyString(propsImage)) {
                var nextPropsText = tf.js.GetNonEmptyString(searchProps.Display_Summary_Short_Text);
                if (tf.js.GetIsNonEmptyString(nextPropsText)) { innerHTML += propsDisplayer.CreateMapFeatureTextSpan(nextPropsText); }
                innerHTML += propsDisplayer.CreateMapFeatureImageDiv(propsImage);
            }

            nextPropsText = tf.js.GetNonEmptyString(searchProps.Display_Summary_Longer_Text_HTML, tf.js.GetNonEmptyString(searchProps.Display_Summary_Midsize_Text, undefined));

            if (tf.js.GetIsNonEmptyString(nextPropsText)) { innerHTML += propsDisplayer.CreateMapFeatureTextSpan(nextPropsText); }
        }
        return { innerHTML: innerHTML };
    }

    /*function doRefreshStyles(layer, featuresByKey) {
        for (var i in featuresByKey) { var fbk = featuresByKey[i]; if (fbk.isVisible) { layer.DelMapFeature(fbk); featuresByKey[i].RefreshStyle(); } }
        for (var i in featuresByKey) { var fbk = featuresByKey[i]; if (fbk.isVisible) { layer.AddMapFeature(fbk, true); } }
        layer.AddWithheldFeatures();
    }*/

    function addDelFeatures() {
        var layerH = settings.layerHybrid, layerM = settings.layerMap, layerHB = settings.layerHybridB, layerMB = settings.layerMapB;
        addDelLayerFeatures(layerHB, searchFeaturesByKeyHB);
        addDelLayerFeatures(layerMB, searchFeaturesByKeyMB);
    }

    function addDelLayerFeatures(layer, features) {
        var doWithHold = true;
        for (var i in features) {
            var feature = features[i];
            var featureVisible = feature.isVisible;
            if (featureVisible != isVisible) {
                if (isVisible) { layer.AddMapFeature(feature, doWithHold); } else { layer.DelMapFeature(feature, doWithHold); }
                feature.isVisible = isVisible;
            }
            else { console.log('unexpected feature visibility status'); }
        }
        if (doWithHold) { if (isVisible) { layer.AddWithheldFeatures(); } else { layer.DelWithheldFeatures(); } }
    }

    function updateIsVisibleFromContext() {
        isVisible = settings.appContent.GetAppCtx().GetCtxAttribute(settings.visibilityVerb);
    }

    function getSortedNeighborResults(result) {
        var searchItems = dataSet.GetSearchItems(), nSearchItems = dataSet.GetCount();
        var sortedNeighbors = [];
        var resultCoords = result.geometry.coordinates;
        for (var i = 0; i < nSearchItems; ++i) {
            var thisItem = searchItems[i];
            //if (thisItem != result) {
            var thisItemCoords = thisItem.geometry.coordinates;
            var thisDistance = tf.units.GetHaversineDistance(thisItemCoords, resultCoords);
            var thisNeighbor = { result: thisItem, distance: thisDistance };
            sortedNeighbors.push(thisNeighbor);
            //}
        }
        sortedNeighbors.sort(function(a, b) { var da = a.distance, db = b.distance; return da == db ? 0 : (da < db ? -1 : 1); });
        return sortedNeighbors;
    }

    function prepareForPropsDisplay(mapFeature) {
        var mapFeatureSettings = mapFeature.GetSettings();
        if (!mapFeatureSettings.hasStaticBottomContent) {
            var result = tf.TFMap.GetSearchFeature(mapFeature), resultProps = result.properties;
            if (resultProps.Display_Thumbnail != undefined) {
                var sortedNeighbors = getSortedNeighborResults(result), nSortedNeighbors = sortedNeighbors.length;
                var maxNeighbors = 19;
                var photoNames = [];
                var photoTitles = [];
                var photosToMapCoords = [];
                var shownNeighbors = [];
                var addedCount = 0;

                //if (nSortedNeighbors > maxNeighbors) { nSortedNeighbors = maxNeighbors; }

                for (var i = 0; i < nSortedNeighbors && addedCount < maxNeighbors; ++i) {
                    var thisNeighbor = sortedNeighbors[i];
                    var thisNeighborResultProps = thisNeighbor.result.properties;
                    //var thisNeighborFileName = tf.js.GetNonEmptyString(thisNeighborResultProps.mainphoto, thisNeighborResultProps.Display_Thumbnail);
                    var thisNeighborFileName = thisNeighborResultProps.Display_Thumbnail;
                    if (thisNeighborFileName != undefined) {
                        photosToMapCoords.push(thisNeighborResultProps.coords);
                        photoNames.push(thisNeighborFileName);
                        photoTitles.push(thisNeighborResultProps.Display_Label);
                        shownNeighbors.push(thisNeighbor);
                        ++addedCount;
                    }
                }

                if (shownNeighbors.length > 0) {
                    mapFeatureSettings.bottomContentType = tf.TFMap.BottomContentTypes.photos;
                    mapFeatureSettings.bottomContent = {
                        photoTitles: photoTitles,
                        toolTipText: getNeighborToolTipText,
                        photosToMapCoords: photosToMapCoords,
                        photoNames: photoNames,
                        onClick: onPhotoRecordClicked,
                        shownNeighbors: shownNeighbors
                    };
                }
            }
        }
    }

    function getNeighborToolTipText(notification) {
        var photoList = notification.photoList, photoSettings = photoList.GetLastContentSettings();
        var shownNeighbors = photoSettings.shownNeighbors, thisRecord = shownNeighbors[notification.index];
        var thisResultProps = thisRecord.result.properties, recordLabel = thisResultProps.Display_Label;
        return "View " + recordLabel;
    }

    function onCloseDisplayProps(mapFeature) {
        var mapFeatureSettings = mapFeature.GetSettings();
        if (mapFeatureSettings.bottomContent != undefined && !mapFeatureSettings.hasStaticBottomContent) {
            var result = tf.TFMap.GetSearchFeature(mapFeature), resultProps = result.properties;
            if (resultProps.Display_Thumbnail != undefined) { mapFeatureSettings.bottomContent = undefined; }
        }
        var appCtx = settings.appContent.GetAppCtx();
        if (mapFeature == appCtx.GetCtxAttribute(tf.TFMap.CAN_selectedSearch)) { appCtx.SetCtxAttribute(tf.TFMap.CAN_selectedSearch, undefined); }
    }

    function onPhotoClicked(notification) {
        var photoListDisplayer = notification.sender;
        settings.appContent.ShowPhoto({ photoListDisplayer: photoListDisplayer, photoName: notification.photoName }, notification.button.GetButton());
    }

    function onPhotoRecordClicked(notification) {
        var photoListDisplayer = notification.sender;
        var photoList = photoListDisplayer.GetLastPhotoList();
        var photoSettings = photoList.GetLastContentSettings();
        var shownNeighbors = photoSettings.shownNeighbors;
        var thisRecord = shownNeighbors[notification.index];
        var thisRecordResult = thisRecord.result;
        var thisResultProps = thisRecordResult.properties;
        if (notification.isSelect) {
            var appContent = settings.appContent;
            var key = thisRecordResult.key;
            if (appContent.GetIsShowingPhoto()) { appContent.GetPhotoDisplayer().OnClose(); }
            setSelectedSearchMapFeatureAndSetCenter(getMapFeatureByKey(key));
        }
        else {
            var recordLabel = thisResultProps.Display_Label;
            var dataSetName = dataSet.GetDataSetTitle();
            var toolTipText = tf.TFMap.MapTwoLineSpan("Click to select in '" + dataSetName + "'", recordLabel);
            settings.appContent.ShowPhoto({ photoListDisplayer: photoListDisplayer, theRecord: thisRecord, photoName: notification.photoName, onClick: onFullPhotoClick, toolTipText: toolTipText }, notification.button.GetButton());
        }
    }

    function getIsShowingAerial() { return settings.appContent.GetIsShowingAerial(); }

    function getMapFeatureByKey(key) { return getIsShowingAerial() ? searchFeaturesByKeyHB[key] : searchFeaturesByKeyMB[key]; }

    function setSelectedSearchMapFeatureAndSetCenter(mapFeature) {
        if (!!mapFeature) {
            var appContent = settings.appContent;
            setSelectedSearchMapFeature(mapFeature);
            appContent.AnimatedSetCenterIfDestVisible(mapFeature.GetPointCoords());
        }
    }

    function onFullPhotoClick(notification) {
        notification.sender.OnClose();
        setSelectedSearchMapFeatureAndSetCenter(getMapFeatureByKey(notification.photoSettings.theRecord.result.key));
    }

    function getSearchMapFeatureToolTipText(toolTipProps) {
        var mapFeatureSettings = toolTipProps.mapFeature.GetSettings();
        var searchFeatureProps = mapFeatureSettings.searchFeature.properties;
        var title = tf.js.GetNonEmptyString(searchFeatureProps.Display_Label, searchFeatureProps.L);
        if (!tf.js.GetIsNonEmptyString(title)) { title = dataSet.GetDataSetTitle() + " search result"; }
        return title;
    }

    function initialize() {
        lineWidthForPlaceBoundaryMeasures = 3;
        nDLayerExtent = (dlayerPreClick = settings.dlayerPreClick) ? undefined : settings.nDLayerExtent;
        updateIsVisibleFromContext();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
