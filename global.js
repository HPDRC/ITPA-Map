"use strict";

tf.TFMap = {};

//toolTipClass = 

//tf.TFMap.DontHideToolTipsDebug = true;
tf.TFMap.DontHideToolTipsDebug = false;

tf.TFMap.UseCachedDataSets = false;
//tf.TFMap.UseCachedDataSets = true;

tf.TFMap.CompressClassNames = 0;
//tf.TFMap.CompressClassNames = -1;

tf.TFMap.CreateClassName = function(tag, name) {
    return tf.TFMap.CompressClassNames == -1 ? tag + name : "tf-css" + ++tf.TFMap.CompressClassNames;
};

tf.TFMap.BottomContentTypes = {
    photos: "photos"
};

tf.TFMap.LayoutSettings = {

    rootDivZIndex: 10,
    auxMapWrapperZIndexAdd: 3,
    changeMapTypeButtonAddZIndex: 500,
    baseLayersItemCommonZIndexAdd: 2,
    baseLayersToolBarWrapperZIndexAdd: 3,
    underBottomWrapperZIndexAdd: 2,
    toastZIndexAdd: 1000,
    overRootZIndexAdd: 1001,
    sidePanelWrapperZIndexAdd: 3,
    sidePanelCloseButtonZIndexAdd: 100,
    customAppContentWrapperZIndexAdd: 3,
    listFadeWrapperZIndexAdd: 10,
    directionsInputZIndexAdd: 1,
    directionsInputFadeZIndexAdd: 2,
    diretionsSearchButtonZIndexAdd: 3,
    moreMapToolsInfoContentWrapperZIndexAdd: 2,
    overMapCanvasZIndexAdd: 10,
    mapLogoAndCenterZIndexAdd: 11,
    photoDisplayerWrapperZIndexAdd: 50,
    photoDisplayerContentWrapperZIndexAdd: 1,
    photoDisplayerContentZIndexAdd: 1,
    photoDisplayerButtonZIndexAdd: 2,
    photoListDisplayerWrapperZIndexAdd: 1,
    photoListDisplayerContentZIndexAdd: 1,
    photoListDisplayerSelectRecordButtonZIndexAdd: 2,
    sidePaneWrapperZIndexAdd: 2,
    mapFeaturePropsDisplayerWrapperZIndexAdd: 2,

    propsDisplayerImgHeightPxInt: 186,
    showingAerialClassName: undefined,
    showingMapClassName: undefined,
    distances3Units: undefined,
    arrowLeftBackgroundClassName: undefined,
    arrowRightBackgroundClassName: undefined,
    customizedScrollBarClassName: undefined,
    defaultHorMarginsClassName: undefined,
    smallerTextClassName: undefined,
    hrDivClassName: undefined,
    redFontColorShadowClassName: undefined,
    wrapperAerialModeClassName: undefined,
    wrapperMapModeClassName: undefined,
    lightTextColor: "rgba(245,245,255,1.0)",
    darkTextColor: "#003377",
    inactiveTextColor: "#b0b0b0",
    lightTextShadow: "1px 1px 2px #222",
    darkTextShadow: "1px 1px 2px #fff",
    activeSVGColor: "#003366",
    inactiveSVGColor: "#808080",
    //lightBackground: "rgba(240,245,255,0.98)",
    lightBackground: "rgba(240,245,255,1)",
    lightBackgroundHalfOpaque: "rgba(240,245,255,0.5)",
    backgroundLivelyColor: "rgb(30, 144, 255)", // "#1E90FF" "dodgerblue" 
    backgroundLivelyColorHex: "#1E90FF", // "dodgerblue" 
    toolTipContentBackground: "#696969",
    directionsSelectedColor: "#C6DAFC",
    listBorderColor: "darkgoldenrod"
};

tf.TFMap.SmallLayoutSettings = {

    mapCenterDimStr: "12rem",

    mapLogoPaddingLeftStr: "10px",
    mapLogoPaddingTopStr: "4px",
    mapLogoPaddingRightStr: "2px",
    mapLogoPaddingBottomStr: "1px",

    mapLogoDimStr: "3rem",
    mapLogoTopStr: "0.5rem",
    mapLogoRightStr: "0.5rem",

    itemInListTitletFontSizeInt: 10,
    itemInListTitleLineHeightInt: 12,

    buttonTextFontSizeInt: 14,

    baseLayersPaneTopCaptionFontSizeInt: 15,
    baseLayersPaneTopCaptionLineHeightInt: 18,
    baseLayersPaneTopCaptionVerPaddingInt: 8,
    baseLayersPaneDefaultFontSizeInt: 10,
    baseLayersPaneDefaultLineHeightInt: 12,
    baseLayersPaneTitleLineHeightInt: 14,
    baseLayersPaneTitlePaddingtInt: 4,
    baseLayersPaneDescFontSizeInt: 9,
    baseLayersPaneDescLineHeightInt: 9,
    baseLayersOptionsRowFontSizeInt: 12,
    baseLayersOptionsRowLineHeightInt: 16,
    measureToolEdgeWidthInt: 8,
    measureToolVertexRadiusInt: 10,
    clusterFeatureDistance: 24,
    clusterCircleRadius: 12,
    widthMapToolBarInt: 26,
    sidePanelCloseButtonTopInt: 12,
    sidePanelCloseButtonDimInt: 14,
    dimMapTypeAuxMarginInt: 2,
    directionsSubDirectionsButtonDimPxInt: 20,
    directionsDisclaimerWrapperHeightInt: 36,
    directionsDisclaimerFontSizeInt: 8,
    directionsDisclaimerLineHeightInt: 9,
    directionsItemDistanceFontSizeInt: 9,
    directionsResultsIconDimInt: 30,
    directionsResultsIconMarginLeftInt: 10,
    directionsResultsIconMarginTopInt: 10,
    directionsItemContentPaddingBottomInt: 10,
    directionsContentBotWrapperFadeHeightInt: 12,
    directionsItemContentFontSizeInt: 10,
    directionsItemContentLineHeightInt: 11,
    directionsSummaryPaddingInt: 8,
    directionsSummaryLargeFontSizeInt: 12,
    directionsSummaryLargeLineHeightInt: 12,
    directionsSummarySmallFontSizeInt: 10,
    directionsSummarySmallLineHeightInt: 10,
    directionsSummaryCommonWidthSubInt: 40,
    directionsCaptionPaddingTopInt: 10,
    directionsHeightInputInt: 16,
    directionsFontSizeInputInt: 12,
    directionsHeightWayPointAddressInt: 16,
    directionsCaptionContentHeightInt: 18,
    directionsSwitchStartEndTopInt: 60,
    paddingLeftWayPointAddressInt: 36,
    directionsCaptionMarginBottomInt: -6,
    propsDisplayerTextButtonFontSizeInt: 11,
    propsDisplayerTextButtonLineHeightInt: 12,
    propsDisplayerWrapperFontSizeInt: 11,
    propsDisplayerWrapperLineHeightInt: 12,
    propsDisplayerCoordsButtonFontSizeInt: 11,
    propsDisplayerCoordsButtonLineHeightInt: 12,
    propsDisplayerTextFontSizeInt: 10,
    propsDisplayerTextLineHeightInt: 11,
    propsDisplayerTitleFontSizeInt: 11,
    propsDisplayerTitleLineHeightInt: 12,
    propsDisplayerWrapperMaxWidthInt: 300,
    CSSLiteralMaxHeightMapFeaturePropsDisplayer: "calc(100% - 80px)",
    moreMapToolsRightInt: 140,
    toolBarToToolBarHorSpacingInt: 16,
    toolBarToScaleLineVerSpacingInt: 8,
    scaleLineHeightInt: 14,
    dimMapTypeAuxInt: 40,
    auxMapBorderDimInt: 1,
    searchBarInputWidthInt: 180,
    topMarginInt: 2,
    leftMarginInt: 2,
    sidePanelWidthInt: 292,
    searchBarPaddingHorInt: 4,
    searchBarPaddingVerInt: 4,
    searchBarInputHeightInt: 15,
    searchBarInputFontSizeInt: 12,
    heightSearchBoxInt: 20,
    underBottomPaneHeightInt: 60,
    toggleButtonHeightInt: 28,
    moreMapToolsFontSizeInt: 10,
    moreMapToolsLineHeightInt: 10,
    dataSetsRowHeightInt: 20,
    dataSetsToolBarHeightInt: 16,
    dataSetsWrapperMarginTopInt: 1
};

tf.TFMap.LayoutSettingsNormal = {

    mapCenterDimStr: "20rem",

    mapLogoPaddingLeftStr: "14px",
    mapLogoPaddingTopStr: "8px",
    mapLogoPaddingRightStr: "4px",
    mapLogoPaddingBottomStr: "2px",

    mapLogoDimStr: "5rem",
    mapLogoTopStr: "1.5rem",
    mapLogoRightStr: "2rem",

    itemInListTitletFontSizeInt: 14,
    itemInListTitleLineHeightInt: 16,

    buttonTextFontSizeInt: 18,

    baseLayersPaneTopCaptionFontSizeInt: 20,
    baseLayersPaneTopCaptionLineHeightInt: 30,
    baseLayersPaneTopCaptionVerPaddingInt: 18,
    baseLayersPaneDefaultFontSizeInt: 16,
    baseLayersPaneDefaultLineHeightInt: 30,
    baseLayersPaneTitleLineHeightInt: 16,
    baseLayersPaneTitlePaddingtInt: 10,
    baseLayersPaneDescFontSizeInt: 12,
    baseLayersPaneDescLineHeightInt: 12,
    baseLayersOptionsRowFontSizeInt: 14,
    baseLayersOptionsRowLineHeightInt: 24,
    measureToolEdgeWidthInt: 4,
    measureToolVertexRadiusInt: 8,
    clusterFeatureDistance: 20,
    clusterCircleRadius: 10,
    sidePanelCloseButtonTopInt: 24,
    sidePanelCloseButtonDimInt: 18,
    directionsSubDirectionsButtonDimPxInt: 32,
    directionsDisclaimerWrapperHeightInt: 60,
    directionsDisclaimerFontSizeInt: 11,
    directionsDisclaimerLineHeightInt: 12,
    directionsItemDistanceFontSizeInt: 11,
    directionsResultsIconDimInt: 40,
    directionsResultsIconMarginLeftInt: 16,
    directionsResultsIconMarginTopInt: 12,
    directionsItemContentPaddingBottomInt: 16,
    directionsContentBotWrapperFadeHeightInt: 30,
    directionsItemContentFontSizeInt: 12,
    directionsItemContentLineHeightInt: 14,
    directionsSummaryPaddingInt: 20,
    directionsSummaryLargeFontSizeInt: 14,
    directionsSummaryLargeLineHeightInt: 14,
    directionsSummarySmallFontSizeInt: 12,
    directionsSummarySmallLineHeightInt: 12,
    directionsSummaryCommonWidthSubInt: 58,
    directionsCaptionPaddingTopInt: 16,
    directionsHeightInputInt: 24,
    directionsFontSizeInputInt: 15,
    directionsHeightWayPointAddressInt: 30,
    paddingLeftWayPointAddressInt: 50,
    directionsCaptionContentHeightInt: 18,
    directionsCaptionMarginBottomInt: 0,
    directionsSwitchStartEndTopInt: 86,
    dimMapTypeAuxMarginInt: 8,
    propsDisplayerWrapperFontSizeInt: 14,
    propsDisplayerWrapperLineHeightInt: 16,
    propsDisplayerCoordsButtonFontSizeInt: 14,
    propsDisplayerCoordsButtonLineHeightInt: 16,
    CSSLiteralMaxHeightMapFeaturePropsDisplayer: "50%",
    propsDisplayerTextFontSizeInt: 14,
    propsDisplayerTextLineHeightInt: 16,
    propsDisplayerTitleFontSizeInt: 14,
    propsDisplayerTitleLineHeightInt: 16,
    propsDisplayerWrapperMaxWidthInt: 360,
    propsDisplayerTextButtonFontSizeInt: 14,
    propsDisplayerTextButtonLineHeightInt: 16,
    moreMapToolsRightInt: 160,
    toolBarToToolBarHorSpacingInt: 18,
    toolBarToScaleLineVerSpacingInt: 12,
    scaleLineHeightInt: 16,
    dimMapTypeAuxInt: 80,
    auxMapBorderDimInt: 3,
    zIndexToolTipInt: 1000,
    arrowDimsToolTipInt: 16,
    fontSizeToolTipInt: 12,
    fontWeightToolTip: "600",
    altaSmallCanvasDim: 16,
    altaLargeCanvasDim: 24,
    topMarginInt: 8,
    leftMarginInt: 8,
    sidePanelWidthInt: 400,
    searchBarInputWidthInt: 240,
    searchBarHorizPaddingInt: 4,
    searchBarPaddingHorInt: 8,
    searchBarPaddingVerInt: 4,
    searchBarInputHeightInt: 24,
    searchBarInputFontSizeInt: 15,
    heightSearchBoxInt: 40,
    widthMapToolBarInt: 30,
    marginBottomBottomPaneWrapperInt: 0,
    underBottomPaneHeightInt: 100,
    propsToolBarButtonWidthInt: 24,
    maxFeaturePropsDisplayHeightInt: 300,
    minWidthPropsDisplayerInt: 150,
    toggleButtonHeightInt: 48,
    moreMapToolsFontSizeInt: 12,
    moreMapToolsLineHeightInt: 12,
    dataSetsRowHeightInt: 30,
    dataSetsToolBarHeightInt: 18,
    dataSetsWrapperMarginTopInt: 4
};

tf.TFMap.ImageUnavailableMsg = "Image<br />temporarily<br />unavailable";

tf.TFMap.MakeHRDivHTML = function() { return "<div class='" + tf.TFMap.LayoutSettings.hrDivClassName + "'></div>"; };

tf.TFMap.MapTwoLineSpan = function(topLine, botLine) {
    var ls = tf.TFMap.LayoutSettings;
    var hrDivStr = tf.TFMap.MakeHRDivHTML();
    var classStr = "class='" + ls.defaultHorMarginsClassName + "'";
    var spanStart = "<span " + classStr + ">";
    return spanStart + topLine + "</span>" + hrDivStr + spanStart + botLine + '</span > ';
};

tf.TFMap.DirectionsFeatureDimMult = 1.8;

tf.TFMap.MaxDirectionsWayPoints = 5;

tf.TFMap.maxCharsAddressInput = 80;

tf.TFMap.directionModeWalk = tf.consts.routingServiceModeFoot;
tf.TFMap.directionModeDrive = tf.consts.routingServiceModeCar;
tf.TFMap.directionModeBike = tf.consts.routingServiceModeBicycle;
tf.TFMap.directionModeBus = tf.consts.routingServiceModeBus;

tf.TFMap.CAN_directionsMode = "directionsMode";
tf.TFMap.CAN_showingDirections = "showingDirections";
tf.TFMap.CAN_isSearchingAddress = "searchingAddress";
tf.TFMap.CAN_sidePanelVisible = "sidePaneVisible";
tf.TFMap.CAN_dataSetsPanelVisible = "dataSetsPaneVisible";
tf.TFMap.CAN_selectedSearch = "selectedSearch";
tf.TFMap.CAN_selectedToolTipSender = "selectedToolTipSender";
tf.TFMap.CAN_userLocation = "userLocation";
tf.TFMap.CAN_clickLocation = "clickLocation";
tf.TFMap.CAN_searchAddressLocation = "searchAddressLocation";

tf.TFMap.StartLocationName = "starting point";
tf.TFMap.EndLocationName = "destination";

//tf.TFMap.MinMapLevel = 11;
//tf.TFMap.MaxMapLevel = 18;
tf.TFMap.MinMapLevel = tf.consts.minLevel;
tf.TFMap.MaxMapLevel = tf.consts.maxLevel;
tf.TFMap.toolTipDelayMillis = 800;
tf.TFMap.MapFeatureToolTipDelayMillis = 300;
tf.TFMap.DelayDirections = 150;
tf.TFMap.DelayShowSearching = tf.TFMap.DelayDirections * 2;
tf.TFMap.AddWayPointToolTipDelayMillis = 800;

tf.TFMap.toolTipDataSetDelayMillis = 800;
tf.TFMap.dataSetListButtonToolTipDelayMillis = tf.TFMap.toolTipDataSetDelayMillis;

tf.TFMap.SearchResultsLayerZIndex = 1;
tf.TFMap.UserLocationLayerZIndex = 10;

tf.TFMap.UserFriendlyModeVerbs = {};
tf.TFMap.UserFriendlyModeVerbs[tf.TFMap.directionModeDrive] = "Driving";
tf.TFMap.UserFriendlyModeVerbs[tf.TFMap.directionModeBike] = "Cycling";
tf.TFMap.UserFriendlyModeVerbs[tf.TFMap.directionModeWalk] = "Walking";
tf.TFMap.UserFriendlyModeVerbs[tf.TFMap.directionModeBus] = "By Bus";

tf.TFMap.ValidateImageOrDisplayMessage = function(imageSrc, messageContainer, asyncCallBack, optionalParam) {
    new tf.dom.Img({
        src: imageSrc, onLoad:
        function onImageLoaded(theImage) {
            if (asyncCallBack(imageSrc, messageContainer, optionalParam, theImage)) {
                if (!theImage.GetIsValid()) {
                    //console.log('bum image');
                    tf.dom.GetHTMLElementFrom(messageContainer).innerHTML = tf.TFMap.ImageUnavailableMsg;
                }
            }
        }
    });
};

tf.TFMap.GetDirectionsDistanceText = function(totalDistanceMeters, useUSScaleUnits) {
    var text = "";
    if (useUSScaleUnits) {
        var distanceMiles = totalDistanceMeters * 0.000621371;
        if (distanceMiles > 0.1) { text = distanceMiles.toFixed(1) + ' mi'; }
        else { var distanceFeet = totalDistanceMeters * 3.28084; text = distanceFeet.toFixed(0) + ' ft'; }
    }
    else {
        if (totalDistanceMeters < 250) { text = totalDistanceMeters.toFixed(0) + ' m'; }
        else { text = (totalDistanceMeters / 1000).toFixed(1) + ' km'; }
    }
    return text;
};

tf.TFMap.GetWalkRideDistanceStr = function (walkDistanceKM, rideDistanceKM, useUSScaleUnits) {
    var walkRideDistanceStr = ""
    if (walkDistanceKM > 0) {
        var walkDistanceText = tf.TFMap.GetDirectionsDistanceText(walkDistanceKM * 1000, useUSScaleUnits);
        walkRideDistanceStr += "walk " + walkDistanceText;
    }
    if (rideDistanceKM > 0) {
        var rideDistanceText = tf.TFMap.GetDirectionsDistanceText(rideDistanceKM * 1000, useUSScaleUnits);
        if (walkDistanceKM > 0) { walkRideDistanceStr += ", "; }
        walkRideDistanceStr += "ride " + rideDistanceText;
    }
    return walkRideDistanceStr;
};

tf.TFMap.FindNearestAddress = function(then, coords, props) {
    var routingService;
    if (tf.js.GetFunctionOrNull(then)) {
        routingService = new tf.services.Routing({ callBack: then, nearestOnly: true, coords: coords, requestProps: props });
    }
    return routingService;
};

tf.TFMap.FindLocationAddress = function(then, coords, props) {
    var routingService;
    if (tf.js.GetFunctionOrNull(then)) {
        routingService = new tf.services.Routing({ callBack: then, locateOnly: true, coords: coords, requestProps: props });
    }
    return routingService;
};

tf.TFMap.ReplaceHTML = function(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

tf.TFMap.GetSearchFeature = function(mapFeature) { return !!mapFeature ? mapFeature.GetSettings().searchFeature : undefined; }
tf.TFMap.GetSearchProps = function(mapFeature) { var searchFeature = tf.TFMap.GetSearchFeature(mapFeature); return !!searchFeature ? searchFeature.properties : undefined; }

tf.TFMap.GetMapFeatureToolTipProps = function(mapFeature) { return !!mapFeature ? mapFeature.GetSettings().toolTipProps : undefined; }
tf.TFMap.SetMapFeatureToolTipProps = function(mapFeature, toolTipProps) {
    if (!!mapFeature) {
        if (!!toolTipProps) {
            toolTipProps.mapFeature = mapFeature;
            mapFeature.GetSettings().toolTipProps = toolTipProps;
        }
        else {
            if (!!mapFeature.GetSettings().toolTipProps) {
                delete mapFeature.GetSettings().toolTipProps.mapFeature;
                delete mapFeature.GetSettings().toolTipProps;
            }
        }
    }
}

tf.TFMap.SetVerticalMapToolTipStyle = function(size, pixelCoords, styleContent, styleArrow) {
    var ls = tf.TFMap.LayoutSettings;
    var arrowDimsToolTipInt = ls.arrowDimsToolTipInt;
    var fraction = 1 / 4;
    var isTop = pixelCoords[1] < size[1] * fraction;
    var isBottom = pixelCoords[1] > size[1] * (1 - fraction);
    var offSetTopInt = arrowDimsToolTipInt;
    var transformText;
    if (isTop) { styleContent.top = (pixelCoords[1] - offSetTopInt) + "px"; transformText = "translateY(0%)"; }
    else if (isBottom) { styleContent.top = (pixelCoords[1] + offSetTopInt) + "px"; transformText = "translateY(-100%)"; }
    else { transformText = "translateY(-50%)"; }
    styleContent["-webkit-transform"] = styleContent.transform = transformText;
};

tf.TFMap.MapToolTipLeftRightStyle = function(mapFeatureSender, rectWrapper, rectObj, styleContent, styleArrow, isLeft) {
    var ls = tf.TFMap.LayoutSettings;
    var arrowDimsToolTipInt = ls.arrowDimsToolTipInt;
    var halfToolTipDim = arrowDimsToolTipInt / 2;
    var map = mapFeatureSender.map, size = map.GetPixelSize(), pointCoords = mapFeatureSender.coords,
        pixelCoords = map.MapToPixelCoords(pointCoords);
    var offsetX = mapFeatureSender.offsetX != undefined ? mapFeatureSender.offsetX : 0;
    var offsetY = mapFeatureSender.offsetY != undefined ? mapFeatureSender.offsetY : 0;
    var sign = isLeft ? 1 : -1;

    pixelCoords[0] += offsetX * sign;
    pixelCoords[1] += offsetY * sign;

    styleContent.top = pixelCoords[1] + "px";
    styleArrow.top = (pixelCoords[1] - halfToolTipDim) + "px";

    if (isLeft) { styleContent.left = (pixelCoords[0]) + "px"; styleArrow.left = (pixelCoords[0] - halfToolTipDim) + "px"; }
    else { styleContent.right = (size[0] - pixelCoords[0]) + "px"; styleArrow.right = (size[0] - (pixelCoords[0] + halfToolTipDim)) + "px"; }

    tf.TFMap.SetVerticalMapToolTipStyle(size, pixelCoords, styleContent, styleArrow);
};

tf.TFMap.MapToolTipLeftStyle = function(mapFeatureSender, rectWrapper, rectObj, styleContent, styleArrow) {
    return tf.TFMap.MapToolTipLeftRightStyle(mapFeatureSender, rectWrapper, rectObj, styleContent, styleArrow, true);
};

tf.TFMap.MapToolTipRightStyle = function(mapFeatureSender, rectWrapper, rectObj, styleContent, styleArrow) {
    return tf.TFMap.MapToolTipLeftRightStyle(mapFeatureSender, rectWrapper, rectObj, styleContent, styleArrow, false);
};

tf.TFMap.GetDynamicMapFeatureToolTipProps = function (map, mapFeature, pointCoords, sidePanelWidthInt) {
    var mapFeatureToolTipProps = tf.TFMap.GetMapFeatureToolTipProps(mapFeature);
    var pixelCoords = map.MapToPixelCoords(pointCoords);
    var size = map.GetPixelSize();
    var toolTipArrowClass, toolTipStyle;
    var isOnRightSide = pixelCoords[0] > (size[0] + sidePanelWidthInt) / 2;

    if (isOnRightSide) {
        toolTipArrowClass = "right";
        toolTipStyle = tf.TFMap.MapToolTipRightStyle;
    }
    else {
        toolTipArrowClass = "left"
        toolTipStyle = tf.TFMap.MapToolTipLeftStyle;
    }
    return tf.js.ShallowMerge({
        toolTipArrowClass: toolTipArrowClass, delayMillis: tf.TFMap.MapFeatureToolTipDelayMillis, toolTipStyle: toolTipStyle, toolTipText: ""
    }, mapFeatureToolTipProps);
};

tf.TFMap.SetContentToolTipInfo = function (toolTipProps, toolTipText, wrapper, delayUse, toolTipClassName,
    toolTipArrowClassName, toolTipStyle, keepOnHoverOutTarget, toolTipFunction, insertWrapper) {
    toolTipProps.toolTipText = toolTipText;
    toolTipProps.toolTipFunction = toolTipFunction;
    toolTipProps.wrapper = wrapper;
    toolTipProps.insertWrapper = insertWrapper;
    toolTipProps.delayUse = delayUse != undefined ? delayUse : 0;
    toolTipProps.toolTipClassName = toolTipClassName;
    toolTipProps.toolTipArrowClassName = toolTipArrowClassName;
    toolTipProps.toolTipStyle = toolTipStyle;
    toolTipProps.keepOnHoverOutTarget = !!keepOnHoverOutTarget;
};

tf.TFMap.SetButtonToolTipInfo = function(button, toolTipText, wrapper, delayUse, toolTipClassName, toolTipArrowClassName, toolTipStyle,
    keepOnHoverOutTarget, toolTipFunction, insertWrapper, offsetX, offsetY) {
    button.element = button.GetButton();
    tf.TFMap.SetContentToolTipInfo(button, toolTipText, wrapper, delayUse, toolTipClassName, toolTipArrowClassName, toolTipStyle, keepOnHoverOutTarget, toolTipFunction, insertWrapper)
    button.offsetX = offsetX;
    button.offsetY = offsetY;
};

tf.TFMap.GetMapFeatureToolTipInfo = function(mapFeature, map, toolTipText, wrapper, delayUse, toolTipClassName, toolTipArrowClassName,
    toolTipStyle, coords, offsetX, offsetY, onClick, keepOnHoverOutTarget) {
    var coordsUse;

    if (coords != undefined) { coordsUse = coords; }
    else { coordsUse = mapFeature.GetPointCoords(); }

    var mapFeatureToolTipInfo = {
        startInHover: true,
        mapFeature: mapFeature, map: map, coords: coordsUse, offsetX: offsetX, offsetY: offsetY,
        onClick: onClick
    };
    tf.TFMap.SetContentToolTipInfo(mapFeatureToolTipInfo, toolTipText, wrapper, delayUse, toolTipClassName, toolTipArrowClassName, toolTipStyle, keepOnHoverOutTarget)
    return mapFeatureToolTipInfo;
};

tf.TFMap.CreateSVGButton = function (appContent, buttonSettings, svgHTML, buttonClass, toolTipText, svgAddClasses, modeVerb) {
    var button = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
        svgHTML: svgHTML,
        buttonClass: buttonClass + " ripple", toolTipText: toolTipText
    }));
    button.GetSettings().modeVerb = modeVerb;
    var buttonSVG = button.GetButton().firstChild;
    if (svgAddClasses != undefined) { tf.dom.AddCSSClass(buttonSVG, svgAddClasses); }
    return button;
};
