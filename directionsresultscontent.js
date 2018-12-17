"use strict";

tf.TFMap.DirectionsResultsContent = function(settings) {
    var theThis, wrapper, content, directionResultsItemCache, selectedItem;
    var itemMapFeatureStyles;
    var firstRow, lastRow, planSelectControlDiv, planSelectControl;
    var firstClickListener, lastClickListener;
    var autoSetNextExtent;

    var curStartAddress, curEndAddress, curInstructionsAndRoute;

    this.SetAutoSetNextExtent = function () { autoSetNextExtent = true; }

    this.OnResize = function() {
        if (curStartAddress != undefined) {
            update(curStartAddress, curEndAddress, curInstructionsAndRoute);
        }
    }

    this.SelectResultItem = function(directionsResultsItem) { return selectItem(directionsResultsItem, false, true); }
    this.UpdateDistances = function() { return updateDistances(); }
    this.Update = function(startAddress, endAddress, instructionsAndRoute) { return update(startAddress, endAddress, instructionsAndRoute); }
    this.Show = function(bool) {
        if (!bool) {
            hideItems();
        }
        return showWrapper(bool);
    }
    this.GetWrapper = function() { return wrapper; }

    function showWrapper(bool) {
        var classNameVisible = settings.itemVisibleClassName, classNameHidden = settings.itemHiddenClassName;
        tf.dom.ReplaceCSSClassCondition(wrapper, bool, classNameVisible, classNameHidden);
        tf.dom.ReplaceCSSClassCondition(settings.contentBotWrapperFadeTop, bool, classNameVisible, classNameHidden);
        tf.dom.ReplaceCSSClassCondition(settings.contentBotWrapperFadeBot, bool, classNameVisible, classNameHidden);
    }

    function updateDistances() {
        var items = directionResultsItemCache.GetObjects(), nActive = directionResultsItemCache.GetActiveCount();
        for (var i = 0; i < nActive; ++i) { items[i].UpdateDistance(); }
        updateStartEnd();
    }

    function hideItems() {
        curStartAddress = curEndAddress = curInstructionsAndRoute = undefined;
        var items = directionResultsItemCache.GetObjects(), nActive = directionResultsItemCache.GetActiveCount();
        for (var i = 0; i < nActive; ++i) {
            items[i].Hide();
        }
    }

    function updateStartEnd() {
        if (!!curInstructionsAndRoute) {
            var totalDistanceMeters = curInstructionsAndRoute.total_distance;
            var totalTimeSeconds = curInstructionsAndRoute.total_time;
            var summaryAddressStart = '<span class="' + classNames.summaryAddressClassName + '">';
            var summarySpanEnd = "</span>";
            var isUSScaleUnits = settings.appContent.GetMap().GetIsUSScaleUnits();
            var distanceStr = tf.TFMap.GetDirectionsDistanceText(totalDistanceMeters, isUSScaleUnits);
            if (curInstructionsAndRoute.transitInstructions && !!curInstructionsAndRoute.plan) {
                var steps = curInstructionsAndRoute.plan.steps, nSteps = steps.length, lastStep = steps[nSteps - 1];
                distanceStr += " -- " + tf.TFMap.GetWalkRideDistanceStr(lastStep.walkkm, lastStep.tripkm, isUSScaleUnits);
            }
            var summaryText = '<br /><span class="' + classNames.summaryTimeClassName + '">' + tf.js.ConvertToHourMinute2(totalTimeSeconds) + summarySpanEnd +
                ' <span class="' + classNames.summaryDistanceClassName + '">(' + distanceStr + ')' + summarySpanEnd;
            firstRow.GetHTMLElement().innerHTML = summaryAddressStart + curStartAddress.GetInputText() + summarySpanEnd + summaryText;
            lastRow.GetHTMLElement().innerHTML = summaryAddressStart + curEndAddress.GetInputText() + summarySpanEnd + summaryText;
        }
    }

    function update(startAddress, endAddress, instructionsAndRoute) {
        var instructions = instructionsAndRoute.instructions;
        var nInstructions = instructions.length;
        var nReps = 1;
        //var nReps = 10;
        content.ClearContent();
        selectedItem = undefined;
        hideItems();
        directionResultsItemCache.Reset();
        settings.scrollerWrapper.GetHTMLElement().scrollTop = "0px";
        content.AddContent(firstRow);
        curStartAddress = startAddress;
        curEndAddress = endAddress;
        curInstructionsAndRoute = instructionsAndRoute;

        if (curInstructionsAndRoute.transitInstructions) {
            var allPlans = curInstructionsAndRoute.allPlans;
            if (allPlans.length > 1) {
                planSelectControl.Clear();
                for (var i = 0; i < allPlans.length; ++i) {
                    var theOption = {
                        busPlanIndex: i,
                        value: i + '', innerHTML: "plan " + (i + 1), id: i + ''
                    };
                    planSelectControl.AddOrSetOption(theOption);
                }
                planSelectControl.SetCurrentOption(curInstructionsAndRoute.curPlanIndex + '');
                content.AddContent(planSelectControlDiv);
            }
        }

        updateStartEnd();

        for (var j = 0; j < nReps; ++j) {
            for (var i = 0; i < nInstructions; ++i) {
                var instructionItem = directionResultsItemCache.GetNext();
                instructionItem.Update(instructionsAndRoute, i);
                content.AddContent(instructionItem.GetWrapper());
            }
        }

        content.AddContent(lastRow);

        if (autoSetNextExtent) {
            autoSetNextExtent = false;
            setMapExtent(true);
        }
    }

    function setMapExtent(keepDirectionsOpen) {
        if (!!curInstructionsAndRoute) {
            settings.appContent.SetMapExtent(curInstructionsAndRoute.extent, keepDirectionsOpen);
        }
    }

    function onSummaryRowClicked(notification) { setMapExtent(false); }

    function createNewDirectionResultItem(notification) {
        return new tf.TFMap.DirectionsResultsItem(tf.js.ShallowMerge(settings, {
            itemClassNames: itemClassNames,
            wrapper: content, scrollerWrapper: settings.scrollerWrapper, onClick: onItemClicked, itemMapFeatureStyles: itemMapFeatureStyles
        }));
    }

    function deleteDirectionResultItem() { }

    function flashCoords(coords) { var appContent = settings.appContent; appContent.GetAppStyles().FlashCoords(appContent.GetMap(), [coords], "#0f0"); }

    function selectItem(newSelectedItem, animateBool, flashBool) {
        if (selectedItem != undefined) { selectedItem.SetSelected(false); }
        (selectedItem = newSelectedItem).SetSelected(true);
        tf.dom.ScrollVerticallyToEnsureVisible(settings.scrollerWrapper, selectedItem.GetWrapper());
        var coords = selectedItem.GetMapFeature().GetPointCoords();
        var appContent = settings.appContent;
        if (!!animateBool) {
            appContent.AnimatedSetCenterIfDestVisible(coords);
            if (!!flashBool) { setTimeout(function() { flashCoords(coords); }, 500); }
        }
        else if (!!flashBool) {
            appContent.MakeSureMapCoordsAreVisible(coords);
            flashCoords(coords);
        }
    }

    function onItemClicked(notification) { selectItem(notification.sender, true, true); }

    function createItemMapFeatureStyles() {
        var radius = 19;
        var colorFill = "#0f0";
        var shapePoints = 3;
        function getStyle(keyedFeature, mapFeature) {
            var isHover = mapFeature.GetIsDisplayingInHover();
            var mapFeatureSettings = mapFeature.GetSettings();
            var shapeRadius = isHover ? radius + 2 : radius;
            var shapeZIndex = isHover ? 5 : 0;
            var rotationRad = mapFeatureSettings.directionsAngle;
            var appStyles = settings.appContent.GetAppStyles();
            var snaptopixel = false;
            var itemMapFeatureStyle = [];
            var imageStyle = appStyles.GetSVGMapMarkerStyle(appStyles.GetDirectionsMapArrowImage(), [shapeRadius + 4, shapeRadius + 4], [0.5, 0.5], 0, ++shapeZIndex)
            imageStyle.rotate_with_map = true;
            imageStyle.rotation_rad = rotationRad;
            imageStyle.snaptopixel = snaptopixel;
            itemMapFeatureStyle.push(imageStyle);

            return itemMapFeatureStyle;
        }
        itemMapFeatureStyles = { style: getStyle, hoverStyle: getStyle };
    };

    function onChangeBusPlan(notification) {
        var option = planSelectControl.GetCurrentOption();
        settings.directionsResults.ChangeBusPlan(option.settings.busPlanIndex);
    };

    function createControl() {
        var ls = tf.TFMap.LayoutSettings;

        wrapper = new tf.dom.Div({ cssClass: classNames.wrapperClassName });
        content = new tf.dom.Div({ cssClass: classNames.contentClassName });
        firstRow = new tf.dom.Div({ cssClass: classNames.summaryTopClassName });
        lastRow = new tf.dom.Div({ cssClass: classNames.summaryBotClassName });
        firstClickListener = new tf.events.DOMClickListener({ target: firstRow, callBack: onSummaryRowClicked, optionalScope: theThis, callBackSettings: null });
        lastClickListener = new tf.events.DOMClickListener({ target: lastRow, callBack: onSummaryRowClicked, optionalScope: theThis, callBackSettings: null });

        planSelectControlDiv = new tf.dom.Div({ cssClass: classNames.planSelectControlWrapper + " " + ls.customizedScrollBarClassName });
        planSelectControl = new tf.ui.Select({ cssClass: classNames.planSelectControl + " " + ls.customizedScrollBarClassName, optionsCSSClass: classNames.planSelectControl, onChange: onChangeBusPlan });
        planSelectControlDiv.AddContent(planSelectControl);

        wrapper.AddContent(content);
    };

    var cssTag, classNames, itemClassNames;

    function createCSSClassNames() {
        classNames = {
            wrapperClassName: tf.TFMap.CreateClassName(cssTag, "Wrapper"),
            contentClassName: tf.TFMap.CreateClassName(cssTag, "Content"),
            summaryTopClassName: tf.TFMap.CreateClassName(cssTag, "SummaryTop"),
            summaryBotClassName: tf.TFMap.CreateClassName(cssTag, "SummaryBot"),
            planSelectControl: tf.TFMap.CreateClassName(cssTag, "PlanSelectControl"),
            planSelectControlWrapper: tf.TFMap.CreateClassName(cssTag, "PlanSelectControlWrapper"),
            summaryTimeClassName: tf.TFMap.CreateClassName(cssTag, "STime"),
            summaryDistanceClassName: tf.TFMap.CreateClassName(cssTag, "SDist"),
            summaryAddressClassName: tf.TFMap.CreateClassName(cssTag, "SAddr")
        };

        itemClassNames = {
            wrapperClassName: tf.TFMap.CreateClassName(cssTag, "DirItemWrapper"),
            wrapperVisibleClassName: tf.TFMap.CreateClassName(cssTag, "DirItemWrapperVisible"),
            wrapperHiddenClassName: tf.TFMap.CreateClassName(cssTag, "DirItemWrapperHidden"),
            contentClassName: tf.TFMap.CreateClassName(cssTag, "DirItemContent"),
            iconClassName: tf.TFMap.CreateClassName(cssTag, "DirItemIcon"),
            itemSelectedClassName: tf.TFMap.CreateClassName(cssTag, "DirItemItemSelected"),
            itemDistanceClassName: tf.TFMap.CreateClassName(cssTag, "DirItemItemDistance"),
            subDirectionsClassName: tf.TFMap.CreateClassName(cssTag, "DirItemSubDirections")
        };
    };

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var darkTextColor = ls.darkTextColor, darkTextShadow = ls.darkTextShadow;
        var sidePanelWidthInt = ls.sidePanelWidthInt, sidePaneWidthPx = sidePanelWidthInt + 'px';
        var resultsResultsIconDimInt = ls.directionsResultsIconDimInt, resultsResultsIconDimPx = resultsResultsIconDimInt + 'px';
        var directionsSelectedColor = ls.directionsSelectedColor;
        var backgroundLivelyStyle = { backgroundColor: ls.backgroundLivelyColor };
        var itemDistanceFontSizeInt = ls.directionsItemDistanceFontSizeInt, itemDistanceFontSizePx = itemDistanceFontSizeInt + 'px';

        cssClasses[classNames.wrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, backgroundLivelyStyle, CSSClasses.overflowVisible, CSSClasses.positionRelative],
            color: 'black', background: 'white', fontSize: "14px", fontWeight: "400", lineHeight: "20px"
        };

        cssClasses[classNames.contentClassName] = { inherits: [CSSClasses.overflowVisible, CSSClasses.positionRelative], height: "100%" };

        var widthSub = ls.directionsSummaryCommonWidthSubInt;

        var summaryCommon = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible, CSSClasses.displayInlineBlock, CSSClasses.positionRelative, CSSClasses.cursorPointer],
            marginLeft: "6px",
            padding: ls.directionsSummaryPaddingInt +"px",
            paddingLeft: "14px", width: "calc(100% - " + (widthSub) + "px)",
            borderTop: "2px solid transparent", borderBottom: "2px solid transparent"
        };

        var interRowPadding = "6px";

        cssClasses[classNames.summaryTopClassName] = { inherits: [summaryCommon], paddingBottom: interRowPadding };
        cssClasses[classNames.summaryTopClassName + ":hover"] = { borderBottom: "2px solid " + directionsSelectedColor };

        cssClasses[classNames.summaryBotClassName] = { inherits: [summaryCommon], paddingTop: interRowPadding };
        cssClasses[classNames.summaryBotClassName + ":hover"] = { borderTop: "2px solid " + directionsSelectedColor };

        cssClasses[classNames.planSelectControlWrapper] = {
            inherits: [summaryCommon],
            border: "1px solid #ddd",
            borderRadius: "2px",
            width: "calc(100% - " + (widthSub + 2) + "px)",
            marginTop: interRowPadding,
            paddingTop: interRowPadding, paddingBottom: interRowPadding
        };

        cssClasses[classNames.planSelectControl] = {
            inherits: [CSSClasses.robotoFontFamily],
            color: 'inherit', outline: 'none', border: 'none', fontSize: "14px",
            background: "white",
            width: "calc(100% - 8px)",
            fontSize: (ls.itemInListTitletFontSizeInt + 1) + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt + 1) + 'px',
            borderRadius: "3px"
        };

        cssClasses[classNames.summaryTimeClassName] = {
            color: "black",
            fontSize: ls.directionsSummarySmallFontSizeInt + "px",
            fontWeight: "700"
        };
        cssClasses[classNames.summaryDistanceClassName] = {
            color: "#778",
            fontSize: ls.directionsSummaryLargeFontSizeInt + "px",
            fontWeight: "300"
        };
        cssClasses[classNames.summaryAddressClassName] = {
            color: darkTextColor,
            fontSize: ls.directionsSummaryLargeFontSizeInt + "px",
            fontWeight: "500"
        };

        cssClasses[itemClassNames.wrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible, CSSClasses.displayBlock, CSSClasses.positionRelative],
            color: "black", backgroundColor: "white", textAlign: 'left', fontSize: 'inherit', lineHeight: 'inherit', fontWeight: 'inherit',
            width: (sidePanelWidthInt - resultsResultsIconDimInt - 0/*12*/) + "px", marginBottom: "10px", paddingLeft: "10px"
        };

        cssClasses[itemClassNames.wrapperVisibleClassName] = { inherits: [CSSClasses.displayBlock] };
        cssClasses[itemClassNames.wrapperHiddenClassName] = { inherits: [CSSClasses.displayNone] };

        //var subWidthPx = "52px";
        var subWidthPx = "62px";

        cssClasses[itemClassNames.contentClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible, CSSClasses.displayInlineBlock, CSSClasses.positionRelative],
            verticalAlign: "top", background: 'transparent', borderBottom: "1px solid #e6e6e6", padding: "12px", paddingLeft: "0px",
            fontSize: ls.directionsItemContentFontSizeInt + "px",
            lineHeight: ls.directionsItemContentLineHeightInt + "px",
            paddingBottom: ls.directionsItemContentPaddingBottomInt + "px",
            paddingTop: "6px", width: "calc(100% - " + subWidthPx + ")"
        };

        cssClasses[itemClassNames.iconClassName] = {
            inherits: [CSSClasses.displayInlineBlock, CSSClasses.noMarginNoBorderNoPadding],
            background: 'transparent', verticalAlign: "top", width: resultsResultsIconDimPx, height: resultsResultsIconDimPx
        };

        cssClasses[itemClassNames.iconClassName + " svg"] = {
            fill: ls.darkTextColor,
            marginLeft: ls.directionsResultsIconMarginLeftInt + "px",
            marginTop: ls.directionsResultsIconMarginTopInt + "px",
            width: "16px",
            height: "16px"
        };

        cssClasses[itemClassNames.itemSelectedClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible, CSSClasses.positionAbsolute],
            top: "0px", left: "0px", height: "100%", width: "1px", borderLeft: "5px solid " + directionsSelectedColor
        };

        cssClasses[itemClassNames.itemDistanceClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible, CSSClasses.displayBlock, CSSClasses.positionAbsolute],
            //bottom: (-itemDistanceFontSizeInt) + "px",
            bottom: "0px",
            lineHeight: itemDistanceFontSizeInt + 'px',
            //top: "calc(100% - " + itemDistanceFontSizePx + ")",
            background: 'white', color: "#778", paddingRight: "6px",
            left: (resultsResultsIconDimInt + 12) + 'px', fontSize: itemDistanceFontSizePx
        };

        var subDirectionsTransformStr = "translateX(-100%)";
        var subDirectionsDim = ls.directionsSubDirectionsButtonDimPxInt + 'px';

        cssClasses[itemClassNames.subDirectionsClassName] = {
            inherits: [CSSClasses.overflowVisible, CSSClasses.positionAbsolute, CSSClasses.directionsButtonBackground, CSSClasses.displayBlock, CSSClasses.backgroundColorTransparent,
            CSSClasses.cursorPointer],
            zIndex: 1,
            bottom: "1px", left: "100%",
            transform: subDirectionsTransformStr,
            "-webkit-transform": subDirectionsTransformStr,
            width: subDirectionsDim, height: subDirectionsDim,
            borderRadius: "2px"

        };
        cssClasses[itemClassNames.subDirectionsClassName + " svg"] = { fill: "black", width: "100%", height: "100%" };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); };
    function onLayoutChange(notification) { registerCSSClasses(); theThis.OnResize(); };

    function initialize() {
        autoSetNextExtent = false;
        createItemMapFeatureStyles();
        directionResultsItemCache = new tf.js.ObjectCache({ createNew: createNewDirectionResultItem, onDelete: deleteDirectionResultItem });
        cssTag = 'directionsContent';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    };

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

