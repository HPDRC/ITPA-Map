"use strict";

tf.TFMap.MoreMapTools = function (settings) {
    var theThis, cssTag, wrapper;
    var measureButton, distanceAreaButton, measureGeomUpdateListener;
    var mainMeasureToolTipText;
    var clearMeasurePointsButton;
    var measureButtonAndToolBar;
    var downloadButton, downloadButtonAndToolBar, downloadGeomUpdateListener;
    var downloadInformationAreaButton, downloadMapExtent, clearDownloadPointsButton;

    this.UpdateToolsVisibility = function () {
        if (settings.measure) {
            var isOn = isMeasureToolOn();
            if (isOn) {
                if (measureGeomUpdateListener == undefined) {
                    var measureTool = getMeasureToolFromContent();
                    if (!!measureTool) { measureGeomUpdateListener = measureTool.addUpdateGeomListener(onMeasureGeomUpdated); } else { isOn = false; }
                }
            }
            tf.dom.ReplaceCSSClassCondition(measureButtonAndToolBar.infoWrapper, isOn, infoContentVisibleClassName, infoContentHiddenClassName);
        }
        if (settings.download) {
            var isOn = isDownloadToolOn();
            if (isOn) {
                if (downloadGeomUpdateListener == undefined) {
                    var downloadTool = getDownloadToolFromContent();
                    if (!!downloadTool) { downloadGeomUpdateListener = downloadTool.addUpdateGeomListener(onDownloadGeomUpdated); } else { isOn = false; }
                }
            }
            tf.dom.ReplaceCSSClassCondition(downloadButtonAndToolBar.infoWrapper, isOn, infoContentVisibleClassName, infoContentHiddenClassName);
        }
    }

    this.GetWrapper = function () { return wrapper; }

    function getMeasureToolFromContent() { return settings.appContent.GetMeasureToolInterface(); }
    function getDownloadToolFromContent() { return settings.appContent.GetDownloadToolInterface(); }

    function updateMeasureContent(measureTool) {
        var distanceAreaButtonText = "";
        var contentText = "";
        var hintText = "click map to add points";
        var showClearPoints = true;
        if (!!measureTool) {
            var info = measureTool.getInfo();
            var showsArea = measureTool.getShowArea();
            distanceAreaButtonText = showsArea ? "Distance<br />and Area" : " Distance<br />only";
            if (info.nPoints >= 2) {
                var distances = info.lastDrawResult.distances;
                if (showsArea && info.nPoints > 2 && info.lengthClosed != undefined) {
                    var lengthClosedStr = tf.js.FormatDistanceText(info.lengthClosed, distances.distanceUnitText, false);
                    var areaStr = tf.js.FormatDistanceText(info.area, distances.distanceUnitText, true);
                    contentText += lengthClosedStr + " : " + areaStr;
                }
                else {
                    if (info.lengthOpen != undefined) {
                        var lengthOpenStr = tf.js.FormatDistanceText(info.lengthOpen, distances.distanceUnitText, false);
                        contentText += lengthOpenStr;
                    }
                }
                hintText = "click map to add more points";

                //var vertexInfos = measureTool.getVertexInfos(), vi = vertexInfos[0];
                //console.log(tf.units.GetHaversineDistance(vi.coords, vi.nextCoords));

            }
            else if (info.nPoints >= 1) {
                contentText = "additional point needed";
            }
            else {
                showClearPoints = false;
                contentText = "two points needed";
            }
        }

        clearMeasurePointsButton.GetButton().style.display = showClearPoints ? "block" : "none";
        distanceAreaButton.GetButton().innerHTML = distanceAreaButtonText;
        setContent(measureButtonAndToolBar.infoContentTop, contentText);
        setContent(measureButtonAndToolBar.infoContentBottom, hintText);
    }

    function onMeasureGeomUpdated(notification) { updateMeasureContent(notification.senderI); }

    function updateDownloadContent(downloadTool) {
        var distanceAreaButtonText = "";
        var contentText = "";
        var hasPoints = false;
        var hintText = "click map to add points";
        downloadMapExtent = undefined;
        if (!!downloadTool) {
            var info = downloadTool.getInfo();
            if (info.nPoints >= 2) {
                var lastExtentDrawResult = info.lastExtentDrawResult;
                var distances = lastExtentDrawResult.distances;
                var area = lastExtentDrawResult.area;
                var lengthStr = tf.js.FormatDistanceText(lastExtentDrawResult.totalDistance, distances.distanceUnitText, false);
                var areaStr = tf.js.FormatDistanceText(area, distances.distanceUnitText, true);
                downloadMapExtent = (area != 0 && lastExtentDrawResult.vertexExtent != undefined) ? lastExtentDrawResult.vertexExtent.slice(0) : undefined;
                contentText += lengthStr + " : " + areaStr;
                hintText = "drag points to adjust area";
                hasPoints = true;
            }
            else if (info.nPoints >= 1) {
                contentText = "additional point needed";
                hasPoints = true;
            }
            else {
                contentText = "two points needed";
            }
        }

        var displayDownloadStr = downloadMapExtent != undefined ? "block" : "none";
        var displayClearStr = hasPoints ? "block" : "none";

        clearDownloadPointsButton.GetButton().style.display = displayClearStr;
        downloadInformationAreaButton.GetButton().style.display = displayDownloadStr;
        setContent(downloadButtonAndToolBar.infoContentTop, contentText);
        setContent(downloadButtonAndToolBar.infoContentBottom, hintText);
    }

    function onDownloadGeomUpdated(notification) { updateDownloadContent(notification.senderI); }

    function doDownload() {
        if (downloadMapExtent != undefined) {
            var appContent = settings.appContent, map = appContent.GetMap();
            var passthroughParam = settings.appContent.GetVidPassThrough().passThrough;

            if (!passthroughParam) { passthroughParam = ''; }

            var strUrl =
                "http://vn4.cs.fiu.edu/cgi-bin/tfrectdisp.cgi?" +
                passthroughParam +
                "&dt=51306.25" +
                "&X1l=" + downloadMapExtent[0] +
                "&Y1l=" + downloadMapExtent[3] +
                "&X2l=" + downloadMapExtent[2] +
                "&Y2l=" + downloadMapExtent[1] +
                "&Source=best_available" +
                "&Res=" + map.GetResolution() +
                "&Overlay=wcity";
            window.open(strUrl, "_blank");
        }
    }

    function onButtonClicked(notification) {
        var appContent = settings.appContent;
        var measureTool = getMeasureToolFromContent();
        var downloadTool = getDownloadToolFromContent();
        switch (notification.sender) {
            case downloadInformationAreaButton:
                doDownload();
                break;
            case clearDownloadPointsButton:
                if (!!downloadTool) { downloadTool.clear(); }
                break;
            case downloadButton:
                appContent.ToggleDownloadTool();
                break;
            case clearMeasurePointsButton:
                if (!!measureTool) { measureTool.clear(); }
                break;
            case distanceAreaButton:
                if (!!measureTool) { measureTool.setShowArea(!measureTool.getShowArea()); }
                break;
            case measureButton:
                appContent.ToggleMeasureTool();
                break;
        }
    }

    function isMeasureToolOn() { return settings.appContent.IsMeasureToolOn(); }
    function isDownloadToolOn() { return settings.appContent.IsDownloadToolOn(); }

    function getMeasureToolToolTipText() { return isMeasureToolOn() ? "Hide measurements" : mainMeasureToolTipText; }

    function getDownloadToolToolTipText() { return isDownloadToolOn() ? "Hide download information area" : "Download information"; }

    function getDistanceAreaToolTipText() {
        var toolTipText;
        var measureTool = getMeasureToolFromContent();
        if (!!measureTool) {
            var showArea = measureTool.getShowArea();
            var areasAndDistancesStr = "distance <u>and</u> area";
            var distancesOnlyStr = "distance <u>only</u>";
            var topLineStr = "Measuring " + (showArea ? areasAndDistancesStr : distancesOnlyStr);
            var newSettingsStr = showArea ? distancesOnlyStr : areasAndDistancesStr;
            return tf.TFMap.MapTwoLineSpan(topLineStr, "Switch to " + newSettingsStr);
        }
        else { toolTipText = mainMeasureToolTipText; }
        return toolTipText;
    }

    function setContent(contentContainer, contentText) { contentContainer.GetHTMLElement().innerHTML = contentText; }

    function createButtonAndToolBar(buttonSettings, svgHTML, toolTipText, toolBarButtonsElems, toolBarPostButtonsElems, addMarginLeft) {
        var ls = tf.TFMap.LayoutSettings;
        var appContent = settings.appContent;
        var infoWrapper = new tf.dom.Div({ cssClass: infoWrapperClassName });
        var infoContentWrapper = new tf.dom.Div({ cssClass: infoContentWrapperClassName });
        var infoContentTop = new tf.dom.Div({ cssClass: infoContentClassName });
        var infoContentBottom = new tf.dom.Div({ cssClass: infoBottomClassName });
        var buttonFullClassName = ls.aerialOrMapColorScheme + " " + buttonSVGClassName + " " + buttonClassName;
        if (addMarginLeft) { buttonFullClassName += " " + marginLeftClassName; }
        var button = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            svgHTML: svgHTML, buttonClass: buttonFullClassName + " ripple", toolTipText: toolTipText
        }));

        infoContentWrapper.AddContent(infoContentTop, infoContentBottom);
        for (var i in toolBarButtonsElems) { infoWrapper.AddContent(toolBarButtonsElems[i]); }
        infoWrapper.AddContent(infoContentWrapper);
        for (var i in toolBarPostButtonsElems) { infoWrapper.AddContent(toolBarPostButtonsElems[i]); }
        return { infoWrapper: infoWrapper, infoContentWrapper: infoContentWrapper, infoContentTop: infoContentTop, infoContentBottom: infoContentBottom, button: button };
    }

    function createClearPointsButton(buttonSettings) {
        var cpb = settings.appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            toolTipClass: "*start", buttonClass: textButtonClassName + " ripple", toolTipText: "Remove all points from the map"
        }));
        var cpbButton = cpb.GetButton();
        cpbButton.innerHTML = "Clear<br />Points";
        return cpb;
    }

    function createControl() {
        var ls = tf.TFMap.LayoutSettings;
        wrapper = new tf.dom.Div({ cssClass: wrapperClassName + " " + ls.aerialOrMapColorScheme });

        var appContent = settings.appContent;
        var delayMillis = tf.TFMap.toolTipDelayMillis;
        var toolTipClass = "*start";
        var toolTipArrowClass = "bottom";
        var buttonSettings = {
            onClick: onButtonClicked, onHover: undefined, wrapper: wrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        var buttonWasAdded = false;

        var buttonClassNameUse = ls.aerialOrMapColorScheme + " " + textButtonClassName + " ripple";

        if (settings.measure) {
            clearMeasurePointsButton = createClearPointsButton(buttonSettings);
            distanceAreaButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
                buttonClass: buttonClassNameUse, toolTipText: getDistanceAreaToolTipText
            }));
            measureButtonAndToolBar = createButtonAndToolBar(buttonSettings, appContent.GetAppStyles().GetMeasureSVG(), getMeasureToolToolTipText,
                [distanceAreaButton.GetButton()], [clearMeasurePointsButton.GetButton()], buttonWasAdded);
            measureButton = measureButtonAndToolBar.button;
            wrapper.AddContent(measureButton.GetButton(), measureButtonAndToolBar.infoWrapper);
            buttonWasAdded = true;
        }

        if (settings.download) {
            clearDownloadPointsButton = createClearPointsButton(buttonSettings);
            downloadInformationAreaButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
                toolTipClass: "*start", buttonClass: buttonClassNameUse, toolTipText: "Download information from selected area"
            }));
            var downloadInformationAreaButtonButton = downloadInformationAreaButton.GetButton();

            downloadInformationAreaButtonButton.innerHTML = "Download<br />Information";
            downloadButtonAndToolBar = createButtonAndToolBar(buttonSettings, appContent.GetAppStyles().GetDownloadSVG(), getDownloadToolToolTipText,
                [downloadInformationAreaButtonButton], [clearDownloadPointsButton.GetButton()], buttonWasAdded);
            downloadButton = downloadButtonAndToolBar.button;
            wrapper.AddContent(downloadButton.GetButton(), downloadButtonAndToolBar.infoWrapper);
            buttonWasAdded = true;
        }

        theThis.UpdateToolsVisibility();
    }

    var wrapperClassName, buttonClassName, buttonSVGClassName, infoBottomClassName, textButtonClassName, marginLeftClassName;
    var infoWrapperClassName, infoContentClassName, infoContentWrapperClassName, infoContentVisibleClassName, infoContentHiddenClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        buttonClassName = tf.TFMap.CreateClassName(cssTag, "Button");
        buttonSVGClassName = tf.TFMap.CreateClassName(cssTag, "ButtonSVG");
        textButtonClassName = tf.TFMap.CreateClassName(cssTag, "textButton");
        infoWrapperClassName = tf.TFMap.CreateClassName(cssTag, "InfoWrapper");
        infoContentWrapperClassName = tf.TFMap.CreateClassName(cssTag, "InfoContentWrapper");
        infoContentClassName = tf.TFMap.CreateClassName(cssTag, "InfoContent");
        infoBottomClassName = tf.TFMap.CreateClassName(cssTag, "InfoContentBottom");
        infoContentVisibleClassName = tf.TFMap.CreateClassName(cssTag, "InfoContentVisible");
        infoContentHiddenClassName = tf.TFMap.CreateClassName(cssTag, "InfoContentHidden");
        marginLeftClassName = tf.TFMap.CreateClassName(cssTag, "MarginRight");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var darkTextColor = ls.darkTextColor;
        var widthMapToolBarInt = ls.widthMapToolBarInt, widthMapToolBarPx = widthMapToolBarInt + 'px';
        var scaleLineHeightInt = ls.scaleLineHeightInt;

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.whiteSpaceNoWrap, CSSClasses.boxShadow002003, CSSClasses.pointerEventsAll, CSSClasses.positionAbsolute,
                CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap],
            borderRadius: "4px",
            //bottom: ls.topMarginInt + 'px',
            bottom: "0px",  // anchored to other toolbar
            //right: ls.moreMapToolsRightInt + 'px',
            //right: (ls.widthMapToolBarInt + ls.leftMarginInt + ls.toolBarToToolBarHorSpacingInt) + "px",
            //left: "calc(-100%)",
            right: "calc(100% + " + (ls.toolBarToToolBarHorSpacingInt) + "px)",
            padding: "2px"
        };

        cssClasses[buttonSVGClassName] = { inherits: [CSSClasses.boxShadow002003, CSSClasses.displayInlineBlock] };
        cssClasses[buttonSVGClassName + " svg"] = { width: "calc(100% - 1px)", height: "calc(100% - 1px)", margin: "auto" };
        //cssClasses[buttonSVGClassName + ":hover"] = { border: "none" };

        cssClasses[buttonClassName] = {
            inherits: [CSSClasses.baseImageButton, CSSClasses.verticalAlignMiddle],
            width: widthMapToolBarPx, height: widthMapToolBarPx,
            borderRadius: "2px",
            border: "1px solid transparent"
        };

        cssClasses[buttonClassName + ":hover"] = {
            border: "none"
        }

        var marginLeftDisplace = "-2px";

        var fontSizePx = ls.moreMapToolsFontSizeInt + 'px';
        var lineHeightPx = ls.moreMapToolsLineHeightInt + 'px';

        var fontSizeLineHeight = { fontSize: fontSizePx, lineHeight: lineHeightPx };

        cssClasses[textButtonClassName] = {
            inherits: [CSSClasses.transparentImageButton, fontSizeLineHeight],
            borderRadius: "0px",
            border: "1px solid",
            borderLeft: "0px", borderRight: "0px",
            fontWeight: "600", paddingLeft: "4px", paddingRight: "4px",
            height: widthMapToolBarPx, marginLeft: marginLeftDisplace
        };

        cssClasses[infoWrapperClassName] = {
            inherits: [CSSClasses.transitionWithColor, CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap]
        };

        cssClasses[infoContentWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.displayFlex, CSSClasses.flexFlowColumnNoWrap, CSSClasses.lightBackground, CSSClasses.darkTextShadow,
            fontSizeLineHeight],
            marginLeft: "4px", marginRight: "1px", paddingTop: "1px", paddingBottom: "1px", paddingLeft: "5px", paddingRight: "5px",
            borderLeft: "1px solid", borderRight: "1px solid",
            zIndex: '' + (ls.rootDivZIndex + ls.moreMapToolsInfoContentWrapperZIndexAdd),
            borderRadius: "8px",
            fontWeight: "600",
            marginLeft: marginLeftDisplace
        };

        cssClasses[infoContentClassName] = {
            inherits: [CSSClasses.overflowHidden, CSSClasses.whiteSpaceNoWrap, CSSClasses.displayBlock, CSSClasses.flexFlowRowNoWrap, CSSClasses.flexGrowOne, CSSClasses.flexShrinkZero],
            textAlign: "center",
            marginTop: "1px", marginBottom: "0px"
        };

        cssClasses[infoBottomClassName] = {
            inherits: [cssClasses[infoContentClassName], CSSClasses.flexGrowZero, CSSClasses.flexShrinkOne, fontSizeLineHeight],
            fontWeight: "500", textAlign: "left", marginTop: "0px", marginBottom: "1px"
        };

        cssClasses[infoContentVisibleClassName] = { inherits: [CSSClasses.overflowVisible], width: "initial", opacity: "1" };
        cssClasses[infoContentHiddenClassName] = { inherits: [CSSClasses.overflowHidden], width: "1px", opacity: "0" };

        cssClasses[infoContentVisibleClassName + " ." + infoContentClassName] = { color: darkTextColor };
        cssClasses[infoContentHiddenClassName + " ." + infoContentClassName] = { color: "white" };

        cssClasses[infoContentVisibleClassName + " ." + infoBottomClassName] = { color: "black" };
        cssClasses[infoContentHiddenClassName + " ." + infoBottomClassName] = { color: "white" };

        cssClasses[marginLeftClassName] = { marginLeft: "8px" };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        cssTag = 'mapMoreTools';
        mainMeasureToolTipText = "Measure distance and area";
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

