"use strict";

tf.TFMap.DirectionsResults = function (settings) {
    var theThis, wrapper, isVisible, canSearch, hasAddressErrors, errorsWrapper, errorsContent, searchingWrapper, searchingContent;
    var featurePointCoords, directionSearchCoords;
    var modeOfTransportation;
    var mapFeatures;
    var lastRouting, routingCount;
    var startMapFeature, endMapFeature;
    var routeFeature;
    var totalDistanceMeters, totalTimeSeconds;
    var routingErrorMsg;
    var routeStyles;
    var instructionsAndRoute;
    var directionsResultsContent;
    var startAddress, endAddress, wayPoints;
    var delayedCheckCanSearch;
    var lastCoordinates;
    var currentState;
    var inErrorAddresses;
    var delayedShowSearching;
    var onFoundOutCanSearchCB;
    var transitPlanService;

    this.SetAutoSetNextExtent = function () { directionsResultsContent.SetAutoSetNextExtent(); }

    this.UpdateDistances = function() { return directionsResultsContent.UpdateDistances(); }
    this.SelectResultItem = function(directionsResultsItem) { return directionsResultsContent.SelectResultItem(directionsResultsItem); }
    this.GetModeOfTransportation = function() { return modeOfTransportation; }
    this.SetModeOfTransportation = function(newModeOfTransportation) { modeOfTransportation = newModeOfTransportation; if (canSearch) { doSearch(directionSearchCoords); } }
    this.GetWrapper = function() { return wrapper; }
    this.GetCanSearch = function() { return canSearch; }

    this.OnResize = function() { directionsResultsContent.OnResize(); }

    this.GetRouteCoordinates = function () { return lastCoordinates; }

    this.ChangeBusPlan = function (busPlanIndex) { return changeBusPlan(busPlanIndex); };

    function checkWayPointsLayerVisibility() { settings.wayPointsLayer.SetVisible(modeOfTransportation != tf.TFMap.directionModeBus); }

    function doCheckCanSearch() {
        checkWayPointsLayerVisibility();
        inErrorAddresses = [];
        featurePointCoords = [];
        directionSearchCoords = [];
        hasAddressErrors = canSearch = false;
        routingErrorMsg = undefined;
        instructionsAndRoute = undefined;
        var addresses = [];
        if (startAddress != undefined) { addresses.push(startAddress); }
        if (endAddress != undefined) { addresses.push(endAddress); }
        if (tf.js.GetIsNonEmptyArray(addresses)) {
            var nAddr = addresses.length;
            canSearch = true;
            for (var i = 0; i < nAddr; ++i) {
                var addr = addresses[i];
                if (addr.GetIsValid()) {
                    var isStart = i == 0;
                    var isEnd = i == nAddr - 1;
                    var coords = addr.GetValue().coords;
                    featurePointCoords.push({ coords: coords, isStart: isStart, isEnd: isEnd });
                    directionSearchCoords.push(coords);
                    if (isStart) { if (tf.js.GetIsNonEmptyArray(wayPoints)) { Array.prototype.push.apply(directionSearchCoords, wayPoints); } }
                }
                else {
                    canSearch = false;
                    if (addr.GetIsInError()) { hasAddressErrors = true; inErrorAddresses.push(addr); }
                }
            }
            if (canSearch) { doSearch(directionSearchCoords); }
            //else if (hasAddressErrors) { }
            //else { console.log("can't search but have no errors"); }
        }

        if (hasAddressErrors) { setState("addressError"); } else if (!canSearch) { setState("idle"); }

        addMapFeatures(featurePointCoords);

        if (!!onFoundOutCanSearchCB) { onFoundOutCanSearchCB({ sender: theThis }); }
    }

    function doShowSearching() {
        if (currentState == "searching") {
            showSearchingWrapper(true);
        }
    }

    function setState(newState) {
        var needsToShow = false, needsToShowResults = false, needsToShowErrors = false, needsToShowSearching = false;
        //console.log('state: ' + newState);
        switch (currentState = newState) {
            case "idle":
                break;
            case "addressError":
                routingErrorMsg = undefined;
                needsToShow = needsToShowErrors = true;
                break;
            case "searching":
                needsToShow = needsToShowSearching = true;
                break;
            case "searchError":
                routingErrorMsg = "A route could not be found, please try different locations";
                needsToShow = needsToShowErrors = true;
                break;
            case "searchOK":
                needsToShow = needsToShowResults = true;
                break;
        }
        if (needsToShowSearching) { delayedShowSearching.DelayCallBack(); }
        else { delayedShowSearching.CancelCallBack(); showSearchingWrapper(false); }
        if (needsToShowResults) { showResults(); } else { directionsResultsContent.Show(false); }
        if (needsToShowErrors) { showErrors(inErrorAddresses); } else { showErrorsWrapper(false); }
        showHide(needsToShow);
    }

    this.CheckCanSearch = function(startAddressSet, endAddressSet, wayPointsSet) {
        startAddress = startAddressSet;
        endAddress = endAddressSet;
        wayPoints = wayPointsSet;
        canSearch = false;
        delayedCheckCanSearch.DelayCallBack();
    }

    function getInstructionsAndRoute(notification, startKey) {
        var instructions = [];
        var message = "Routing server not available ";
        var success = false, extent, total_distance = 0, total_time = 0;

        if (notification != undefined) {
            if (notification.status == 0 || notification.status == 200) {
                var key = startKey != undefined ? startKey : 0;
                var len = notification.route_instructions.length, lastIndex = len - 1;
                var mapFeatureGeomSettings = { type: 'linestring', coordinates: notification.route_geometry };
                var mapFeatureGeom = new tf.map.FeatureGeom(mapFeatureGeomSettings);
                var routeSummary = notification.route_summary;

                total_distance = routeSummary.total_distance;
                total_time = routeSummary.total_time;

                lastCoordinates = notification.route_geometry;

                // NEW
                createDefaultLineStringRouteFeature();

                routeFeature.SetGeom(mapFeatureGeom);
                routeFeature.RefreshStyle();

                message = notification.status_message;
                success = true;

                var nInstructions = notification.route_instructions.length;

                for (var i = 0; i < nInstructions; ++i) {
                    var instruction = notification.route_instructions[i];
                    var coord = notification.route_geometry[instruction[3]];
                    var instructionStr = tf.services.TranslateRoutingInstruction(instruction[0]);
                    var streetName;

                    if (key != lastIndex) {
                        streetName = instruction[1];
                        streetName = streetName.replace('{', '');
                        streetName = streetName.replace('}', '');
                        streetName = streetName.replace(':', ' ');
                        streetName = streetName.replace('_', ' ');
                        if (streetName == '') {
                            if (i == 0) { streetName = routeSummary.start_point; }
                            else if (i == nInstructions - 1) { streetName = routeSummary.end_point; }
                            else { streetName = "ahead"; }
                        }
                        if (instructionStr == undefined) { console.log('unknown direction instruction'); instructionStr = "Go"; }
                    }
                    else { streetName = "is ahead"; instructionStr = "Destination"; }
                    var data = {
                        geometry: { type: 'point', coordinates: coord },
                        properties: {
                            //timeInSeconds: instruction[4], lengthMetersStr: instruction[5], postTurnDirectionStr: instruction[6],
                            instructionCode: parseInt(instruction[0], 10), instruction: instructionStr, streetName: streetName, lengthMeters: instruction[2], postTurnDirection: instruction[7]
                        }
                    };
                    extent = tf.js.UpdateMapExtent(extent, coord);
                    ++key;
                    instructions.push(data);
                }
            }
            else { message = notification.status_message; }
        }
        return { total_distance: total_distance, total_time: total_time, instructions: instructions, message: message, routeFeature: routeFeature, success: success, extent: extent };
    }

    function getRouteStyle(keyedFeature, mapFeature) { var routeStyle = routeStyles[modeOfTransportation]; return routeStyle.style; }

    function createRouteStyle(lineWidth, lineCap, lineDash, zIndex) {
        var style = [
            { zindex: zIndex++, line_cap: lineCap, line: true, line_opacity: 1, line_color: "#fff", line_width: lineWidth },
            { zindex: zIndex++, line_cap: lineCap, line: true, line_opacity: 70, line_color: "#ebebeb", line_width: lineWidth + 2, line_dash: lineDash },
            { zindex: zIndex++, line_cap: lineCap, line: true, line_color: "#1fa0ff", line_width: lineWidth, line_dash: lineDash }
        ];
        return style;
    };

    function createFootStyle(lineWidth) { return { style: createRouteStyle(lineWidth, "round", [1, lineWidth + 1], 30) }; };
    function createBusStyle(lineWidth, color) {
        if (color == undefined) {
            color = "#f00";
        }
        var isHover = true;
        var lineWidth = 2;
        var zindex = 8;
        var lineWidthTick = lineWidth * 2 + 1;
        var lineItemColor = color;
        return {
            style:[
            { line: true, line_color: "#000", line_width: lineWidthTick + 2, zindex: 3, line_opacity: 20 },
            { line: true, line_color: lineItemColor, line_width: lineWidthTick, zindex: 4, line_opacity: 70 }, 
            { line: true, line_color: "#fff", line_width: lineWidth + 2, zindex: zindex, line_cap: "butt", line_opacity: 100, line_dash: [16, 10] }]
        };
    };

    function createRouteStyles() {
        var lineWidth = 9;
        routeStyles = {};
        routeStyles[tf.consts.routingServiceModeFoot] = createFootStyle(lineWidth);
        routeStyles[tf.consts.routingServiceModeBicycle] = { style: createRouteStyle(lineWidth, "butt", [lineWidth / 2, lineWidth / 5], 20) };
        routeStyles[tf.consts.routingServiceModeCar] = { style: createRouteStyle(lineWidth - 2, "square", [lineWidth, lineWidth * 1.2, lineWidth / 2, lineWidth * 1.2], 10) };
        routeStyles[tf.consts.routingServiceModeBus] = createBusStyle(lineWidth);
    }

    function showResults() {
        if (instructionsAndRoute != undefined) {
            directionsResultsContent.Update(startAddress, endAddress, instructionsAndRoute);
        }
        directionsResultsContent.Show(true);
    }

    function onInstructionsAndRouteSuccess() {
        routingErrorMsg = undefined;
        totalDistanceMeters = instructionsAndRoute.total_distance;
        totalTimeSeconds = instructionsAndRoute.total_time;
        var routeFeatureUse = tf.js.GetIsArray(routeFeature) ? routeFeature : [routeFeature];
        //console.log('adding route feature');
        for (var i in routeFeatureUse) {
            var rf = routeFeatureUse[i];
            settings.layer.AddMapFeature(rf);
            mapFeatures.push(rf);
        }
        //mapFeatures.push(instructionsAndRoute.routeFeature);
        setState("searchOK");
    }

    function onRouted(notification) {
        if (!!lastRouting) {
            if (lastRouting == notification.sender) {
                lastRouting = undefined;
                if (!notification.sender.WasCancelled()) {
                    var searchedOK = false;
                    if (!!notification && notification.requestProps.routingCount == routingCount) {
                        instructionsAndRoute = getInstructionsAndRoute(notification, 0);
                        if (instructionsAndRoute.success) {
                            lastInstructionsAndRoute = instructionsAndRoute;
                            lastModeOfTransportation = modeOfTransportation;
                            onInstructionsAndRouteSuccess();
                            searchedOK = true;
                        }
                        else {
                            lastInstructionsAndRoute = undefined;
                        }
                    }
                    if (!searchedOK) { setState("searchError"); }
                }
            }
        }
    }

    function getMapFeatureToolTip(toolTipProps) {
        var mapFeature = toolTipProps.mapFeature;
        var toolTipText;
        var dragToChangeStr = "drag to change";
        var ls = tf.TFMap.LayoutSettings;
        var spanStart = "<span class='" + ls.defaultHorMarginsClassName + "'>";
        switch (mapFeature) {
            case startMapFeature:
                toolTipText = tf.TFMap.MapTwoLineSpan(tf.TFMap.StartLocationName, dragToChangeStr);
                break;
            case endMapFeature:
                if (canSearch) {
                    toolTipText = spanStart + tf.TFMap.UserFriendlyModeVerbs[modeOfTransportation] + '</span><br />';
                    toolTipText += spanStart + tf.js.ConvertToHourMinute2(totalTimeSeconds);
                    toolTipText += ' (' + tf.TFMap.GetDirectionsDistanceText(totalDistanceMeters, settings.appContent.GetMap().GetIsUSScaleUnits()) + ')</span>';
                    toolTipText = toolTipText + tf.TFMap.MakeHRDivHTML() + spanStart + "drag to change" + '</span>';
                }
                else {
                    toolTipText = tf.TFMap.MapTwoLineSpan(tf.TFMap.EndLocationName, dragToChangeStr);
                }
                break;
        }
        return toolTipText;
    }

    var lastTransitPlanResult;

    function onTransitPlanPostRefresh() {
        if (!!lastRouting) {
            if (lastRouting == transitPlanService) {
                lastRouting = undefined;
                lastInstructionsAndRoute = undefined;
                lastTransitPlanResult = transitPlanService.GetInstructionsAndRouteGeom();
                if (lastTransitPlanResult.success) {
                    settings.layer.RemoveAllFeatures();
                    lastModeOfTransportation = modeOfTransportation;
                    changeBusPlan(0);
                    /*lastTransitPlanResult.curPlanIndex = 0;
                    lastTransitPlanResult.allPlans[lastTransitPlanResult.curPlanIndex].transitPlans = lastTransitPlanResult;
                    lastInstructionsAndRoute = lastTransitPlanResult.allPlans[lastTransitPlanResult.curPlanIndex];
                    lastInstructionsAndRoute.allPlans = lastTransitPlanResult.allPlans;*/
                    /*routeFeature = [];
                    var lineWidth = 9;
                    for (var i in instructionsAndRoute.routeGeom) {
                        var rg = instructionsAndRoute.routeGeom[i];
                        var routeGeom = { type: 'linestring', coordinates: rg.coords };
                        if (rg.isWalk) { routeGeom = tf.js.ShallowMerge(routeGeom, createFootStyle(lineWidth)); }
                        else { routeGeom.style = routeGeom = tf.js.ShallowMerge(routeGeom, createBusStyle(lineWidth, rg.colorStr)); }
                        var thisRouteFeature = new tf.map.Feature(routeGeom);
                        thisRouteFeature.GetSettings().isDirectionRoute = true;
                        routeFeature.push(thisRouteFeature);
                    }
                    onInstructionsAndRouteSuccess();*/
                    //implementTransitInstructions();
                }
                else {
                    lastTransitPlanResult = undefined;
                    setState("searchError");
                }
            }
        }
    }

    function implementTransitInstructions() {
        settings.layer.RemoveAllFeatures();
        routeFeature = [];
        var lineWidth = 9;
        for (var i in lastInstructionsAndRoute.routeGeom) {
            var rg = lastInstructionsAndRoute.routeGeom[i];
            var routeGeom = { type: 'linestring', coordinates: rg.coords };
            if (rg.isWalk) { routeGeom = tf.js.ShallowMerge(routeGeom, createFootStyle(lineWidth)); }
            else { routeGeom.style = routeGeom = tf.js.ShallowMerge(routeGeom, createBusStyle(lineWidth, rg.colorStr)); }
            var thisRouteFeature = new tf.map.Feature(routeGeom);
            thisRouteFeature.GetSettings().isDirectionRoute = true;
            routeFeature.push(thisRouteFeature);
        }
        onInstructionsAndRouteSuccess();
    };

    function changeBusPlan(busPlanIndex) {
        //console.log('changing bus plan: ' + busPlanIndex);
        if (!!lastTransitPlanResult && lastTransitPlanResult.allPlans != undefined &&
            busPlanIndex >= 0 && busPlanIndex < lastTransitPlanResult.allPlans.length) {
            lastTransitPlanResult.curPlanIndex = busPlanIndex;
            lastInstructionsAndRoute = lastTransitPlanResult.allPlans[lastTransitPlanResult.curPlanIndex];
            lastInstructionsAndRoute.allPlans = lastTransitPlanResult.allPlans;
            lastInstructionsAndRoute.curPlanIndex = busPlanIndex;
            instructionsAndRoute = lastInstructionsAndRoute;
            implementTransitInstructions();
        }
    };

    function callRouting(coords) {
        if (modeOfTransportation == tf.TFMap.directionModeBus) {
            if (!transitPlanService) {
                transitPlanService = new tf.Transit.PlanService({
                    useStageBusDirections: settings.useStageBusDirections,
                    onFullDirectionsLoaded: onTransitPlanPostRefresh, transitServerURL: settings.transitServerURL
                });
            }
            if (!!transitPlanService) { (lastRouting = transitPlanService).GetPlan(coords[0], coords[coords.length - 1]); }
        }
        else {
            lastRouting = new tf.services.Routing({
                findAlternatives: false, level: 14, lineStringCoords: coords,
                mode: modeOfTransportation, optionalScope: theThis, instructions: true,
                callBack: onRouted, requestProps: { routingCount: ++routingCount }
            });
        }
    }

    var lastDirectionsSearchCoords, lastInstructionsAndRoute, lastModeOfTransportation, lastTransitPlanResult;

    function doSearch(directionSearchCoords) {
        checkWayPointsLayerVisibility();
        routingErrorMsg = undefined;
        instructionsAndRoute = undefined;
        var nCoords = directionSearchCoords.length;
        if (nCoords > 0) {
            var newCoords = true;
            if (lastDirectionsSearchCoords != undefined && lastInstructionsAndRoute != undefined && lastModeOfTransportation == modeOfTransportation) {
                if (lastDirectionsSearchCoords.length == nCoords) {
                    newCoords = false;
                    for (var i = 0; i < nCoords && !newCoords; ++i) {
                        var directionSearchCoordCoords = directionSearchCoords[i];
                        var lastCoord = lastDirectionsSearchCoords[i];
                        newCoords = (directionSearchCoordCoords[0] != lastCoord[0] || directionSearchCoordCoords[1] != lastCoord[1]);
                    }
                }
            }
            if (newCoords) {
                //console.log('Decided to search');
                hideRouteFeature();
                if (lastInstructionsAndRoute) {
                    lastInstructionsAndRoute.instructions = [];
                    if (lastInstructionsAndRoute.allPlans) {
                        lastInstructionsAndRoute.allPlans = [];
                    }
                }
                if (!!lastRouting) { lastRouting.Cancel(); }
                var coords = directionSearchCoords.slice(0);
                lastDirectionsSearchCoords = coords.slice(0);
                setState("searching");
                callRouting(coords);
                //setTimeout(function () { callRouting(coords); }, 500000000);
            }
            else {
                //console.log('skipped search');
                instructionsAndRoute = lastInstructionsAndRoute;
                onInstructionsAndRouteSuccess();
            }
        }
    }

    function addMapFeatures(featurePointCoords) {
        hideMapFeatures();
        var nCoords = featurePointCoords.length;
        if (nCoords > 0) {
            var layer = settings.pinLayer;
            //console.log('added map features');
            for (var i = 0; i < nCoords; ++i) {
                var featurePointCoord = featurePointCoords[i];
                var isStart = featurePointCoord.isStart, isEnd = featurePointCoord.isEnd;
                var pointCoords = featurePointCoord.coords.slice(0);
                var mapFeature = isStart ? startMapFeature : endMapFeature;
                mapFeature.GetSettings().directionsAddressItem = isStart ? startAddress : endAddress;
                mapFeature.SetPointCoords(pointCoords);
                mapFeature.RefreshStyle();
                layer.AddMapFeature(mapFeature, true);
                mapFeatures.push(mapFeature);
            }
            layer.AddWithheldFeatures();
        }
    }

    function hideRouteFeature() {
        if (!instructionsAndRoute) {
            settings.layer.RemoveAllFeatures();
            routeFeature = [];
            //console.log('hide route feature (removed all features)');
        }
        else {
            //console.log('FAILED! hide route feature (removed all features)');
        }
    }

    function hideMapFeatures() {
        //console.log('hide layer');
        settings.wayPointsLayer.SetVisible(false);
        hideRouteFeature();
        if (mapFeatures.length > 0) {
            checkWayPointsLayerVisibility();
            settings.pinLayer.RemoveAllFeatures();
            mapFeatures = [];
        }
    }

    function showErrors(inErrorAddresses) {
        showErrorsWrapper(true);
        if (tf.js.GetIsNonEmptyString(routingErrorMsg)) {
            errorsContent.GetHTMLElement().innerHTML = routingErrorMsg;
        }
        else if (tf.js.GetIsNonEmptyArray(inErrorAddresses)) {
            var nErrors = inErrorAddresses.length;

            if (nErrors > 0) {
                var errorStr = "Sorry! We could not find map coordinates for:"
                for (var i = 0; i < nErrors; ++i) {
                    var addr = inErrorAddresses[i];
                    var placeHolder = addr.GetPlaceHolder();
                    var addressStr = addr.GetInputText();
                    errorStr += "<br><b>" + placeHolder + "</b>: <text>" + tf.TFMap.ReplaceHTML(addressStr) + "</text>";
                }
                errorStr += "<br>Please try a different address, or select a location on the map"
                errorsContent.GetHTMLElement().innerHTML = errorStr;
            }
        }
        else {
            console.log('unexpected error');
            errorsContent.GetHTMLElement().innerHTML = "unexpected error";
        }
    }

    function showHide(bool) { return !!bool ? show() : hide(); }

    function show() { if (!isVisible) { isVisible = true; setVisibleStyle(); } }
    function hide() { if (isVisible) { isVisible = false; setVisibleStyle(); } }

    function setVisibleStyle() { setWrapperVisibleClass(wrapper, isVisible); }
    function showSearchingWrapper(bool) { setWrapperVisibleClass(searchingWrapper, bool); }
    function showErrorsWrapper(bool) { setWrapperVisibleClass(errorsWrapper, bool); }

    function setWrapperVisibleClass(theWrapper, isVisibleBool) {
        var classNameVisible = settings.itemVisibleClassName, classNameHidden = settings.itemHiddenClassName;
        tf.dom.ReplaceCSSClassCondition(theWrapper, isVisibleBool, classNameVisible, classNameHidden);
    }

    function getMapFeatureStyle(imageUse, imageSizeUse, radiusMaxUse, colorFillUse) {
        var appStyles = settings.appContent.GetAppStyles();
        return appStyles.GetSVGMapMarkerWithFrameGeom([0, 0], imageUse, imageSizeUse, radiusMaxUse, colorFillUse, [0.5, 1]);
    }

    function setMapFeatureToolTipProps(mapFeature, toolTipText) {
        var toolTipProps = { toolTipText: toolTipText, keepOnHoverOutTarget: false, offsetX: 24 };
        tf.TFMap.SetMapFeatureToolTipProps(mapFeature, toolTipProps);
        return mapFeature;
    }

    function createDefaultLineStringRouteFeature() {
        var routeGeom = { type: 'linestring', coordinates: [[0, 0], [0, 0]], style: getRouteStyle, hoverStyle: getRouteStyle };
        routeFeature = new tf.map.Feature(routeGeom);
        routeFeature.GetSettings().isDirectionRoute = true;
    };

    function createFeatures() {
        var appContent = settings.appContent;
        var appStyles = appContent.GetAppStyles();
        var imgMult = tf.TFMap.DirectionsFeatureDimMult;
        var imageSizeUse = [20 * imgMult, 30 * imgMult], iconAnchor = [0.5, 1], startZIndex = 4;
        startMapFeature = new tf.map.Feature(appStyles.GetSVGMapMarkerGeomAndStyles(undefined, appStyles.GetFromImage(), imageSizeUse, iconAnchor, 0, startZIndex++));
        setMapFeatureToolTipProps(startMapFeature, getMapFeatureToolTip);
        endMapFeature = new tf.map.Feature(appStyles.GetSVGMapMarkerGeomAndStyles(undefined, appStyles.GetToImage(), imageSizeUse, iconAnchor, 0, startZIndex++));
        setMapFeatureToolTipProps(endMapFeature, getMapFeatureToolTip);
        createDefaultLineStringRouteFeature();
    };

    function createControl() {
        wrapper = new tf.dom.Div({ cssClass: wrapperClassName });
        errorsWrapper = new tf.dom.Div({ cssClass: errorsWrapperClassName });
        errorsContent = new tf.dom.Div({ cssClass: errorsContentClassName });
        errorsWrapper.AddContent(errorsContent);
        searchingWrapper = new tf.dom.Div({ cssClass: searchingWrapperClassName });
        searchingContent = new tf.dom.Div({ cssClass: searchingContentClassName });
        searchingContent.GetHTMLElement().innerHTML = "<div class='" + searchingIconClassName + "'></div>Searching...";
        searchingWrapper.AddContent(searchingContent);
        directionsResultsContent = new tf.TFMap.DirectionsResultsContent(tf.js.ShallowMerge(settings, { directionsResults: theThis }));
        wrapper.AddContent(errorsWrapper, searchingWrapper, directionsResultsContent.GetWrapper());
        showErrorsWrapper(false);
        setVisibleStyle();
    }

    var cssTag, wrapperClassName, errorsWrapperClassName, errorsContentClassName, searchingWrapperClassName, searchingContentClassName, searchingIconClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        errorsWrapperClassName = tf.TFMap.CreateClassName(cssTag, "ErrorsWrapper");
        errorsContentClassName = tf.TFMap.CreateClassName(cssTag, "ErrorsContent");
        searchingWrapperClassName = tf.TFMap.CreateClassName(cssTag, "SearchingWrapper");
        searchingContentClassName = tf.TFMap.CreateClassName(cssTag, "SearchingContent");
        searchingIconClassName = tf.TFMap.CreateClassName(cssTag, "SearchingIcon");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var layoutSettings = tf.TFMap.LayoutSettings;
        var backgroundLivelyStyle = { backgroundColor: layoutSettings.backgroundLivelyColor };

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, /*backgroundLivelyStyle, */CSSClasses.overflowVisible], background: 'transparent'
        };

        cssClasses[errorsWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, backgroundLivelyStyle, CSSClasses.overflowVisible, CSSClasses.positionRelative],
            color: 'black', background: 'beige', fontSize: "0.8rem", lineHeight: "1.2rem"
        };

        cssClasses[errorsContentClassName] = { inherits: [CSSClasses.overflowVisible, CSSClasses.positionRelative], padding: "8px" };

        cssClasses[searchingWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, backgroundLivelyStyle, CSSClasses.overflowVisible, CSSClasses.positionRelative],
            color: 'black', background: 'white', fontSize: "14px", lineHeight: "20px"
        };

        cssClasses[searchingContentClassName] = { inherits: [CSSClasses.overflowVisible, CSSClasses.positionRelative], height: "20px", padding: "8px" };

        cssClasses[searchingIconClassName] = { inherits: [CSSClasses.loadingBackgroundTransparent, CSSClasses.displayInlineBlock], verticalAlign: "top", width: "20px", height: "20px", marginRight: "6px" };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    function initialize() {
        onFoundOutCanSearchCB = tf.js.GetFunctionOrNull(settings.onFoundOutCanSearch);
        delayedShowSearching = new tf.events.DelayedCallBack(tf.TFMap.DelayShowSearching, doShowSearching, theThis);
        currentState = "idle";
        delayedCheckCanSearch = new tf.events.DelayedCallBack(tf.TFMap.DelayDirections, doCheckCanSearch, theThis);
        modeOfTransportation = tf.js.GetNonEmptyString(settings.modeOfTransportation, tf.consts.routingServiceModeCar);
        createRouteStyles();
        totalDistanceMeters = totalTimeSeconds = 0;
        routingCount = 0;
        mapFeatures = [];
        featurePointCoords = [];
        canSearch = hasAddressErrors = isVisible = false;
        cssTag = 'directionsResults';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        createFeatures();
        settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

