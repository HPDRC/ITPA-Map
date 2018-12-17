"use strict";

tf.TFMap.DirectionsPanel = function(settings) {
    var theThis, wrapper, isShowing, caption, backButton, closeButton, driveButton, walkButton, bikeButton, busButton, currentMode, modeButtons, switchStartEndButton;
    var wayPointAddressesWrapper;
    var disclaimerWrapper;
    var startAddress, endAddress;
    var canSearch;
    var directionsResults;
    var contentWrapper;
    var contentBotWrapper;
    var contentBotWrapperFadeTop, contentBotWrapperFadeBot;
    var wayPoints, wayPointMapFeatures;
    var pushedDirections;

    this.PushDirections = function (directionSettings) {
        if (currentMode == tf.TFMap.directionModeBus) {
            var appContent = settings.appContent, map = appContent.GetMap();
            pushedDirections = {
                fromCoords: startAddress.GetValue().coords,
                toCoords: endAddress.GetValue().coords,
                mode: tf.TFMap.directionModeBus,
                center: map.GetCenter(),
                res: map.GetResolution()
            };
            setDirections(directionSettings);
        }
    }

    function setDirections(directionSettings) {
        var appContent = settings.appContent;
        clearWayPoints();
        appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_directionsMode, directionSettings.mode);
        setSelectedMode();
        setAddressItemCoords(startAddress, directionSettings.fromCoords);
        setAddressItemCoords(endAddress, directionSettings.toCoords);
        if (!!directionSettings.center) {
            var map = appContent.GetMap();
            map.SetCenter(directionSettings.center);
            map.SetResolution(directionSettings.res);
        }
    }

    function backToBusDirections() {
        if (!!pushedDirections) {
            var pd = pushedDirections;
            pushedDirections = undefined;
            setDirections(pd);
        }
    }

    this.SetAutoSetNextExtent = function () { directionsResults.SetAutoSetNextExtent(); }

    this.GetRouteCoordinates = function() {
        return directionsResults.GetRouteCoordinates();
    }

    this.GetCanAddWayPoint = function() {
        return canSearch && wayPoints.length < tf.TFMap.MaxDirectionsWayPoints && currentMode != tf.TFMap.directionModeBus;
    }

    this.DeleteWayPoint = function(mapFeature) {
        var nWayPoints = wayPointMapFeatures.length;
        for (var i = 0; i < nWayPoints; ++i) {
            if (wayPointMapFeatures[i] == mapFeature) {
                mapFeature.GetSettings().wayPointIndex = undefined;
                wayPoints.splice(i, 1);
                wayPointMapFeatures.splice(i, 1);
                break;
            }
        }
        renumWayPoints();
        checkCanSearch();
    }

    this.AddWayPoint = function(mapFeature) {
        if (theThis.GetCanAddWayPoint()) {
            var coordsAdd = mapFeature.GetPointCoords().slice(0);
            var nWayPoints = wayPoints.length;
            if (nWayPoints < 1) {
                wayPoints = [coordsAdd];
                wayPointMapFeatures = [mapFeature];
                checkCanSearch();
            }
            else {
                var routeCoordinates = theThis.GetRouteCoordinates();
                var hitTestAddWayPoint = tf.helpers.HitTestMapCoordinatesArray(routeCoordinates, coordsAdd, undefined, undefined, undefined);
                var indexAdd = nWayPoints;
                var wayPointHitTests = [];
                for (var i = 0; i < nWayPoints; ++i) {
                    var wpmf = wayPointMapFeatures[i];
                    wayPointHitTests.push(tf.helpers.HitTestMapCoordinatesArray(routeCoordinates, wpmf.GetPointCoords(), undefined, undefined, undefined));
                }

                wayPointHitTests.sort(function sortWayPoints(a, b) {
                    if (a.minDistanceIndex < b.minDistanceIndex) { return -1; }
                    else if (a.minDistanceIndex > b.minDistanceIndex) { return 1; }
                    else if (a.proj < b.proj) { return -1; }
                    else if (a.proj < b.proj) { return 1; }
                    return 0;
                });

                for (var i = 0; i < nWayPoints; ++i) {
                    var htwp = wayPointHitTests[i];
                    if (htwp.minDistanceIndex > hitTestAddWayPoint.minDistanceIndex ||
                        (htwp.minDistanceIndex == hitTestAddWayPoint.minDistanceIndex && htwp.proj > hitTestAddWayPoint.proj)) {
                        indexAdd = i;
                        break;
                    }
                }

                wayPoints.splice(indexAdd, 0, coordsAdd);
                wayPointMapFeatures.splice(indexAdd, 0, mapFeature);
            }
            renumWayPoints();
        }
    }

    this.OnWayPointChangedCoords = function(mapFeature) {
        for (var i in wayPointMapFeatures) {
            if (wayPointMapFeatures[i] == mapFeature) {
                wayPoints[i] = mapFeature.GetPointCoords().slice(0);
                checkCanSearch();
                break;
            }
        }
    }

    this.OnResize = function() { return directionsResults.OnResize(); }

    this.OnAddressMapFeatureChangedCoords = function(directionsAddressItem, pointCoords) {
        if (directionsAddressItem == startAddress || directionsAddressItem == endAddress) {
            setAddressItemCoords(directionsAddressItem, pointCoords);
        }
    }

    this.SelectAddressItem = function(directionsAddressItem) {
        settings.appContent.EnsureDirectionsVisible();
        directionsAddressItem.SetSelected();
    }
    this.SelectResultItem = function(directionsResultsItem) {
        settings.appContent.EnsureDirectionsVisible();
        return directionsResults.SelectResultItem(directionsResultsItem);
    }

    this.UpdateDistances = function() { return directionsResults.UpdateDistances(); }

    this.GetWrapper = function() { return wrapper; }

    this.GetNeedsAddress = function() {
        return !startAddress.GetHasInputText() || !endAddress.GetHasInputText();
    }

    this.SetDirectionsAddress = function(addressStr, isStart) {
        if (tf.js.GetIsNonEmptyString(addressStr)) {
            var theAddress = isStart ? startAddress : endAddress;
            theAddress.SetValue({ address: addressStr });
            theAddress.Geocode();
        }
    };

    this.SetDirectionsTargetToCoords = function(pointCoords, forceEnd, skipEnsureVisible) {
        var appContent = settings.appContent, appCtx = appContent.GetAppCtx();

        if (!skipEnsureVisible) { appContent.EnsureDirectionsVisible(); }

        if (!hasCoords(pointCoords)) {
            var addressSet = (!!forceEnd || (startAddress.GetIsValid() || startAddress.GetHasInputText())) ? endAddress : startAddress;
            clearWayPoints();
            setAddressItemCoords(addressSet, pointCoords);
            if (!skipEnsureVisible) { appContent.MakeSureMapCoordsAreVisible(pointCoords); }
        }
    }

    this.UpdateVisibility = function() {
        var shouldBeVisible = theThis.GetShouldBeVisible();
        if (isShowing != shouldBeVisible) {
            var ls = tf.TFMap.LayoutSettings;
            tf.dom.ReplaceCSSClassCondition(wrapper, isShowing = shouldBeVisible, ls.sidePanelWrapperVisibleClassName, ls.sidePanelWrapperCollapsedClassName);
        }
    }

    this.UpdateMode = function() {
        setSelectedMode();
    }

    this.GetShouldBeVisible = function() { return settings.appContent.GetAppCtx().GetCtxAttribute(tf.TFMap.CAN_showingDirections); }

    function renumWayPoints() {
        var nWayPoints = wayPointMapFeatures.length;
        for (var i = 0; i < nWayPoints; ++i) {
            var wayPointMapFeature = wayPointMapFeatures[i];
            wayPointMapFeature.GetSettings().wayPointIndex = i;
            wayPointMapFeature.RefreshStyle();
        }
    }

    function clearWayPoints() {
        wayPoints = [];
        wayPointMapFeatures = [];
        settings.appContent.OnDirectionWayPointsDiscarded();
    }

    function setAddressItemCoords(addressSet, pointCoords) {
        var addressStr = pointCoords[1].toFixed(5) + ", " + pointCoords[0].toFixed(5);
        addressSet.SetValue({ address: addressStr, coords: pointCoords });
        addressSet.RevGeocode();
        checkCanSearch();
    }

    function hasCoords(coords) {
        return startAddress.GetHasCoords(coords) || endAddress.GetHasCoords(coords);
    }

    function switchStartEnd() {
        var value = startAddress.GetValueForSwap();
        startAddress.SetValueForSwap(endAddress.GetValueForSwap());
        endAddress.SetValueForSwap(value);
        checkCanSearch();
    }

    function onButtonClicked(notification) {
        var button = !!notification.toolTipSender ? notification.toolTipSender : notification.sender;
        var modeVerb;
        switch (button) {
            case switchStartEndButton:
                switchStartEnd();
                break;
            case backButton:
                backToBusDirections();
                break;
            case closeButton:
                settings.appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_showingDirections, false);
                break;
            default:
                if ((modeVerb = button.GetSettings().modeVerb) != undefined) {
                    settings.appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_directionsMode, modeVerb);
                }
                break;
        }
    }

    function createSVGButton(buttonSettings, svgHTML, buttonClass, toolTipText, svgAddClasses, modeVerb) {
        var button = settings.appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            svgHTML: svgHTML,
            buttonClass: buttonClass + " rippleWhite", toolTipText: toolTipText
        }));
        button.GetSettings().modeVerb = modeVerb;
        var buttonSVG = button.GetButton().firstChild;
        if (svgAddClasses != undefined) { tf.dom.AddCSSClass(buttonSVG, svgAddClasses); }
        return button;
    }

    function setSelectedMode() {
        var selMode = settings.appContent.GetAppCtx().GetCtxAttribute(tf.TFMap.CAN_directionsMode);
        if (selMode != currentMode) {
            currentMode = selMode;
            for (var i in modeButtons) {
                var modeButton = modeButtons[i], buttonMode = modeButton.GetSettings().modeVerb;
                tf.dom.ReplaceCSSClassCondition(modeButton.GetButton(), buttonMode == currentMode, captionButtonSelectedClassName, captionButtonUnSelectedClassName);
            }
            directionsResults.SetModeOfTransportation(selMode);
        }
        var backButtonDisplayStr = (!!pushedDirections) ? "inline-block" : "none";
        backButton.GetButton().style.display = backButtonDisplayStr;
    }

    function onAddressInputChange(notification) { checkCanSearch(); }

    function onAddressInputSearch(notification) {
        var address = notification.sender;
        if (!address.GetIsValid()) {
            address.Geocode();
        }
    }

    function checkCanSearch() {
        canSearch = startAddress.GetIsValid() && endAddress.GetIsValid();
        //console.log('can search ' + canSearch);
        directionsResults.CheckCanSearch(startAddress, endAddress, wayPoints);
        showDisclaimer();
    }

    function onFoundOutCanSearch(notification) {
        showDisclaimer();
    }

    function showDisclaimer() {
        var disclaimerVisible = directionsResults.GetCanSearch();
        var ls = tf.TFMap.LayoutSettings;
        tf.dom.ReplaceCSSClassCondition(disclaimerWrapper, disclaimerVisible, disclaimerWrapperVisibleClassName, disclaimerWrapperHiddenClassName);
        tf.dom.ReplaceCSSClassCondition(contentWrapper, disclaimerVisible, contentWithDisclaimerClassName, ls.sidePaneFullHeightContentWrapperClassName);
    }

    function createWayPointAddress(placeHolder, mapFeatureIcon, id) {
        return new tf.TFMap.DirectionsAddress({
            itemVisibleClassName: itemVisibleClassName, itemHiddenClassName: itemHiddenClassName,
            placeHolder: placeHolder, appContent: settings.appContent, onInputChange: onAddressInputChange,
            onGo: onAddressInputSearch, mapFeatureIcon: mapFeatureIcon, id: id,
            //autocomplete: "on"
            autocomplete: "off"
        });
    }

    function getSelModeFromContext() { return settings.appContent.GetAppCtx().GetCtxAttribute(tf.TFMap.CAN_directionsMode); }

    var addressBookSelect, addressBookWrapper;

    function createControl() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var ls = tf.TFMap.LayoutSettings;
        var customizedScrollBarClassName = ls.customizedScrollBarClassName;
        var useBusDirections = !!settings.useBusDirections;

        wrapper = new tf.dom.Div({ cssClass: ls.sidePanelWrapperClassName });
        contentWrapper = new tf.dom.Div({ cssClass: ls.sidePanelContentWrapperClassName });
        caption = new tf.dom.Div({ cssClass: captionClassName });

        var delayMillis = 0;
        var toolTipClass = "*end";
        var toolTipArrowClass = "top";

        var buttonSettings = {
            offsetY: 0, onClick: onButtonClicked, onHover: undefined, wrapper: caption, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        var directionsCaptionToolBar = new tf.dom.Div({ cssClass: captionToolBarClassName });

        backButton = createSVGButton(buttonSettings,
            appStyles.GetArrowLeftSVGNoColor(), modeButtonClassName + " " + captionButtonUnSelectedClassName, "Back to bus directions", modesSVGsClassName);

        driveButton = createSVGButton(buttonSettings, appContent.GetAppStyles().GetCarSVG(),
            modeButtonClassName, tf.TFMap.UserFriendlyModeVerbs[tf.TFMap.directionModeDrive],
            modesSVGsClassName, tf.TFMap.directionModeDrive);
        walkButton = createSVGButton(buttonSettings, appContent.GetAppStyles().GetWalkSVG(),
            modeButtonClassName, tf.TFMap.UserFriendlyModeVerbs[tf.TFMap.directionModeWalk],
            modesSVGsClassName, tf.TFMap.directionModeWalk);
        bikeButton = createSVGButton(buttonSettings, appContent.GetAppStyles().GetBikeSVG(),
            modeButtonClassName, tf.TFMap.UserFriendlyModeVerbs[tf.TFMap.directionModeBike],
            modesSVGsClassName, tf.TFMap.directionModeBike);

        modeButtons = [driveButton, walkButton, bikeButton];

        if (useBusDirections) {
            busButton = createSVGButton(buttonSettings, appContent.GetAppStyles().GetBusSVG(),
                modeButtonClassName, tf.TFMap.UserFriendlyModeVerbs[tf.TFMap.directionModeBus],
                modesSVGsClassName, tf.TFMap.directionModeBus);
            modeButtons.push(busButton);
        }

        buttonSettings.toolTipClass = "*start";

        closeButton = createSVGButton(tf.js.ShallowMerge(buttonSettings, { wrapper: contentWrapper }),
            appStyles.GetXMarkSVG(), ls.sidePanelCloseButtonClassName, "Close directions", undefined);

        directionsCaptionToolBar.AddContent(backButton.GetButton(), driveButton.GetButton(), walkButton.GetButton(), bikeButton.GetButton());
        if (useBusDirections) { directionsCaptionToolBar.AddContent(busButton.GetButton()); }
        caption.AddContent(directionsCaptionToolBar);

        var allWayPointAddressesWrapper = new tf.dom.Div({ cssClass: allWayPointAddressesWrapperClassName });

        startAddress = createWayPointAddress(tf.TFMap.StartLocationName, appStyles.GetFromImage()/*, "tf-start-address-edit"*/);
        endAddress = createWayPointAddress(tf.TFMap.EndLocationName, appStyles.GetToImage()/*, "tf-end-address-edit"*/);

        /*
        addressBookWrapper = new tf.dom.Div({ cssClass: addressBookWrapperClassName });
        addressBookSelect = new tf.ui.Select({ cssClass: addressBookSelectClassName, optionsCSSClass: addressBookSelectClassName, onChange: undefined });
        addressBookWrapper.AddContent(addressBookSelect);
        */
        
        /*function processForm(e) { if (e.preventDefault) { e.preventDefault(); } return false; };
        var form = document.createElement('form');
        form.appendChild(startAddress.GetWrapper().GetHTMLElement());
        form.appendChild(endAddress.GetWrapper().GetHTMLElement());
        if (form.attachEvent) { form.attachEvent("submit", processForm); } else { form.addEventListener("submit", processForm); }
        allWayPointAddressesWrapper.AddContent(form);*/

        allWayPointAddressesWrapper.AddContent(startAddress.GetWrapper(), endAddress.GetWrapper()/*, addressBookWrapper*/);

        var switchStartEndWrapper = new tf.dom.Div({ cssClass: switchStartEndWrapperClassName });

        buttonSettings.delayMillis = tf.TFMap.toolTipDelayMillis;
        buttonSettings.offsetX = -10;
        buttonSettings.wrapper = switchStartEndWrapper;
        buttonSettings.toolTipClass = "end";
        buttonSettings.toolTipArrowClass = "right";

        switchStartEndButton = createSVGButton(buttonSettings, appContent.GetAppStyles().GetUpDownArrowSVG(),
            directionsButtonBaseClassName + " " + switchStartEndButtonClassName,
            "Reverse " + tf.TFMap.StartLocationName + " and " + tf.TFMap.EndLocationName,
            switchStartEndSVGsClassName);

        switchStartEndWrapper.AddContent(switchStartEndButton.GetButton());

        disclaimerWrapper = new tf.dom.Div({ cssClass: disclaimerWrapperClassName });

        var disclaimerContent = new tf.dom.Div({ cssClass: disclaimerContentClassName });
        var disclaimerStr = "Use TerraFly directions as a trip planning aid; you are responsible for observing applicable laws and local ordinances at all times."

        disclaimerContent.GetHTMLElement().innerHTML = disclaimerStr;
        disclaimerWrapper.AddContent(disclaimerContent);

        var contentTopWrapper = new tf.dom.Div({ cssClass: ls.sidePaneContentFixedHeightClassName });
        contentBotWrapper = new tf.dom.Div({ cssClass: ls.sidePaneContentVariableHeightClassName + " " + customizedScrollBarClassName });

        contentBotWrapperFadeTop = new tf.dom.Div({ cssClass: contentBotFadeTopClassName + " " + itemHiddenClassName });
        contentBotWrapperFadeBot = new tf.dom.Div({ cssClass: contentBotFadeBotClassName + " " + itemHiddenClassName });

        directionsResults = new tf.TFMap.DirectionsResults({
            onFoundOutCanSearch: onFoundOutCanSearch,
            appContent: settings.appContent, layer: settings.layer, pinLayer: settings.pinLayer, itemsLayer: settings.itemsLayer, modeOfTransportation: getSelModeFromContext(),
            wayPointsLayer: settings.wayPointsLayer,
            scrollerWrapper: contentBotWrapper,
            itemVisibleClassName: itemVisibleClassName, itemHiddenClassName: itemHiddenClassName,
            contentBotWrapperFadeTop: contentBotWrapperFadeTop, contentBotWrapperFadeBot: contentBotWrapperFadeBot,
            useStageBusDirections: !!settings.useStageBusDirections,
            transitServerURL: settings.transitServerURL
        });

        showDisclaimer();

        contentTopWrapper.AddContent(caption, allWayPointAddressesWrapper, switchStartEndWrapper, contentBotWrapperFadeTop);
        contentBotWrapper.AddContent(directionsResults.GetWrapper());

        contentWrapper.AddContent(closeButton.GetButton(), contentTopWrapper, contentBotWrapper);
        contentWrapper.AddContent(contentBotWrapperFadeBot);

        wrapper.AddContent(contentWrapper, disclaimerWrapper);

        setSelectedMode();
    }

    var cssTag, captionClassName, captionToolBarClassName, modesSVGsClassName,
        captionButtonSelectedClassName, captionButtonUnSelectedClassName, modeButtonClassName, allWayPointAddressesWrapperClassName, wayPointAddressWrapperClassName,
        directionsButtonBaseClassName, switchStartEndWrapperClassName, switchStartEndSVGsClassName, switchStartEndButtonClassName,
        disclaimerWrapperClassName, disclaimerWrapperVisibleClassName, disclaimerWrapperHiddenClassName, disclaimerContentClassName, contentWithDisclaimerClassName,
        itemVisibleClassName, itemHiddenClassName,
        contentBotFadeTopClassName, contentBotFadeBotClassName;

    //var addressBookWrapperClassName, addressBookSelectClassName;

    function createCSSClassNames() {
        itemVisibleClassName = tf.TFMap.CreateClassName(cssTag, "ItemVisible");
        itemHiddenClassName = tf.TFMap.CreateClassName(cssTag, "ItemHidden");
        captionClassName = tf.TFMap.CreateClassName(cssTag, "Caption");
        captionToolBarClassName = tf.TFMap.CreateClassName(cssTag, "CaptionToolBar");
        modesSVGsClassName = tf.TFMap.CreateClassName(cssTag, "ModeSVGs");
        captionButtonSelectedClassName = tf.TFMap.CreateClassName(cssTag, "CBSelected");
        captionButtonUnSelectedClassName = tf.TFMap.CreateClassName(cssTag, "CBUnselected");
        modeButtonClassName = tf.TFMap.CreateClassName(cssTag, "ModeButton");
        allWayPointAddressesWrapperClassName = tf.TFMap.CreateClassName(cssTag, "AllWayPointAddressesWrapper");
        directionsButtonBaseClassName = tf.TFMap.CreateClassName(cssTag, "DirectionsButtonBase");
        switchStartEndWrapperClassName = tf.TFMap.CreateClassName(cssTag, "SwitchStartEndWrapper");
        switchStartEndButtonClassName = tf.TFMap.CreateClassName(cssTag, "SwitchStartEndButton");
        switchStartEndSVGsClassName = tf.TFMap.CreateClassName(cssTag, "SwitchStartEndSVGs");
        disclaimerWrapperClassName = tf.TFMap.CreateClassName(cssTag, "DisclaimerWrapper");
        disclaimerWrapperVisibleClassName = tf.TFMap.CreateClassName(cssTag, "DisclaimerWrapperVisible");
        disclaimerWrapperHiddenClassName = tf.TFMap.CreateClassName(cssTag, "DisclaimerWrapperHidden");
        contentWithDisclaimerClassName = tf.TFMap.CreateClassName(cssTag, "ContentWithDisclaimer");
        disclaimerContentClassName = tf.TFMap.CreateClassName(cssTag, "DisclaimerContent");
        contentBotFadeTopClassName = tf.TFMap.CreateClassName(cssTag, "ContentBotFadeTop");
        contentBotFadeBotClassName = tf.TFMap.CreateClassName(cssTag, "ContentBotFadeBot");

        //addressBookWrapperClassName = tf.TFMap.CreateClassName(cssTag, "AddressBookWrapper");
        //addressBookSelectClassName = tf.TFMap.CreateClassName(cssTag, "AddressBookSelect");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var darkTextColor = ls.darkTextColor, darkTextShadow = ls.darkTextShadow;
        var sidePanelWidthInt = ls.sidePanelWidthInt, sidePaneWidthPx = sidePanelWidthInt + 'px';
        var directionsCaptionPaddingTopInt = ls.directionsCaptionPaddingTopInt;
        var directionsCaptionPaddingBotInt = 2;
        var directionsCaptionPaddingTopPx = directionsCaptionPaddingTopInt + 'px';
        var directionsCaptionContentHeightInt = ls.directionsCaptionContentHeightInt;
        var directionsCaptionContentHeightPx = directionsCaptionContentHeightInt + 'px';
        var directionsCaptionHeightInt = directionsCaptionContentHeightInt + directionsCaptionPaddingTopInt + directionsCaptionPaddingBotInt;
        var directionsCaptionHeightPx = directionsCaptionHeightInt + 'px';
        var directionsCaptionBigContentHeightInt = directionsCaptionHeightInt - directionsCaptionPaddingBotInt;
        var directionsCaptionBigContentHeightPx = directionsCaptionBigContentHeightInt + 'px';
        var directionsCaptionSVGHeightInt = directionsCaptionBigContentHeightInt - 8;
        var directionsCaptionSVGHeightPx = directionsCaptionSVGHeightInt + 'px';
        var directionsCaptionToolBarPaddingLeft = 30;
        var directionsCaptionButtonSeparationInt = 24;
        var directionsCaptionButtonSeparationPx = directionsCaptionButtonSeparationInt + 'px';;
        var paddingDirectionsDisclaimerContentInt = 4;
        var paddingDirectionsDisclaimerContentPx = paddingDirectionsDisclaimerContentInt + 'px';
        var directionsDisclaimerContentSubDimFromPaddingInt = 2 * paddingDirectionsDisclaimerContentInt;
        var directionsDisclaimerContentSubDimFromPaddingPx = directionsDisclaimerContentSubDimFromPaddingInt + 'px';
        var directionsDisclaimerDimCalcStr = "calc(100% - " + directionsDisclaimerContentSubDimFromPaddingPx + ")";
        var directionsDisclaimerWrapperHeightInt = ls.directionsDisclaimerWrapperHeightInt, directionsDisclaimerWrapperHeightPx = directionsDisclaimerWrapperHeightInt + 'px';
        var directionsContentBotWrapperFadeHeightInt = ls.directionsContentBotWrapperFadeHeightInt;
        var backgroundLivelyStyle = { backgroundColor: ls.backgroundLivelyColor };

        cssClasses[itemVisibleClassName] = { inherits: [CSSClasses.displayBlock] };

        cssClasses[itemHiddenClassName] = { inherits: [CSSClasses.displayNone] };

        cssClasses[captionClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.WOneHundred, backgroundLivelyStyle,
                CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap],
            paddingTop: (directionsCaptionPaddingTopInt / 2) + 'px',
            paddingBottom: (directionsCaptionPaddingTopInt / 2) + 'px',
            marginBottom: ls.directionsCaptionMarginBottomInt + "px",
            height: directionsCaptionHeightPx
        };

        cssClasses[captionToolBarClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative],
            height: "100%", paddingLeft: (directionsCaptionToolBarPaddingLeft) + 'px'
        };

        cssClasses[modesSVGsClassName] = {
            width: directionsCaptionSVGHeightPx, height: directionsCaptionSVGHeightPx, fill: "rgba(255, 255, 255, 0.9)", stroke: "rgba(0, 0, 0, 0.3)", strokeWidth: "0.1px"
        };

        var captionButton = {
            inherits: [CSSClasses.transparentImageButton, CSSClasses.overflowHidden, CSSClasses.positionAbsolute, CSSClasses.displayBlock, CSSClasses.flexGrowZero],
            width: directionsCaptionContentHeightPx, height: directionsCaptionContentHeightPx
        };

        var bigCaptionButton = {
            stroke: "darkgray", strokeWidth: "0.2px", position: 'relative', display: 'inline-block',
            borderRadius: "50%", marginRight: directionsCaptionButtonSeparationPx,
            width: directionsCaptionBigContentHeightPx, height: directionsCaptionBigContentHeightPx
        };

        cssClasses[captionButtonSelectedClassName] = { backgroundColor: darkTextColor };
        cssClasses[captionButtonUnSelectedClassName] = { inherits: [CSSClasses.backgroundColorTransparent] };

        cssClasses[modeButtonClassName] = { inherits: [captionButton, bigCaptionButton] };

        cssClasses[allWayPointAddressesWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, backgroundLivelyStyle, CSSClasses.overflowVisible, CSSClasses.positionRelative], paddingBottom: '8px'
        };

        cssClasses[directionsButtonBaseClassName] = {
            inherits: [CSSClasses.transparentImageButton, CSSClasses.overflowHidden, CSSClasses.displayBlock],
            fill: "rgba(255,255,255,0.5)", background: 'transparent'
        };
        cssClasses[directionsButtonBaseClassName + ":hover"] = { fill: "white" };

        cssClasses[switchStartEndWrapperClassName] = {
            inherits: [CSSClasses.overflowVisible, CSSClasses.positionAbsolute, CSSClasses.noBorderNoPadding],
            background: 'transparent',
            top: ls.directionsSwitchStartEndTopInt + 'px',
            right: "4px", width: "40px", height: "40px"
        };

        cssClasses[switchStartEndButtonClassName] = { inherits: [CSSClasses.positionRelative], borderRadius: "50%", width: "40px", height: "40px" };
        cssClasses[switchStartEndSVGsClassName] = { width: "24px", height: "24px", strokeWidth: "0" };

        /*
        var interRowPadding = "6px";

        cssClasses[addressBookWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible, CSSClasses.displayBlock, CSSClasses.positionRelative, CSSClasses.cursorDefault],
            border: "1px solid #ddd",
            borderRadius: "2px",
            marginLeft: "5px",
            width: "calc(100% - 12px)",
            marginTop: interRowPadding,
            paddingTop: interRowPadding, paddingBottom: interRowPadding
        };

        cssClasses[addressBookSelectClassName] = {
            inherits: [CSSClasses.robotoFontFamily],
            color: 'inherit', outline: 'none', border: 'none', fontSize: "14px",
            background: "white",
            width: "calc(100% - 10px)",
            marginLeft: "4px",
            fontSize: (ls.itemInListTitletFontSizeInt + 1) + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt + 1) + 'px',
            borderRadius: "3px"
        };
        */

        cssClasses[disclaimerWrapperClassName] = {
            inherits: [CSSClasses.positionAbsolute, CSSClasses.leftBotZero, CSSClasses.overflowHidden],
            height: directionsDisclaimerWrapperHeightPx, background: "white", width: "100%"
        };

        cssClasses[disclaimerWrapperVisibleClassName] = { inherits: [CSSClasses.displayFlex] };
        cssClasses[disclaimerWrapperHiddenClassName] = { inherits: [CSSClasses.displayNone] };

        cssClasses[contentWithDisclaimerClassName] = { height: "calc(100% - " + (directionsDisclaimerWrapperHeightInt) + "px)" };

        cssClasses[disclaimerContentClassName] = {
            inherits: [CSSClasses.cursorDefault, CSSClasses.displayBlock, CSSClasses.overflowHidden, CSSClasses.marginAuto],
            textOverflow: "ellipsis", padding: paddingDirectionsDisclaimerContentPx,
            textAlign: "center", width: directionsDisclaimerDimCalcStr,
            fontSize: ls.directionsDisclaimerFontSizeInt + "px",
            lineHeight: ls.directionsDisclaimerLineHeightInt + "px",
            //fontSize: "11px",
            //lineHeight: "normal",
            fontWeight: "300", color: "black"
        };

        var contentBotFadeCommon = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.pointerEventsNone, CSSClasses.positionAbsolute, CSSClasses.overflowVisible],
            left: "0px",
            zIndex: '' + (ls.rootDivZIndex + ls.listFadeWrapperZIndexAdd),
            width: "calc(100% - 18px)", paddingLeft: "6px", height: (directionsContentBotWrapperFadeHeightInt - 0) + 'px !important'
        };

        cssClasses[contentBotFadeTopClassName] = {
            inherits: [contentBotFadeCommon], bottom: "-" + directionsContentBotWrapperFadeHeightInt + "px",
            background: "linear-gradient(to bottom, " + "rgba(255,255,255,0.8)" + "," + "rgba(255,255,255,0)" + ")"
        };

        cssClasses[contentBotFadeBotClassName] = {
            inherits: [contentBotFadeCommon],
            bottom: "0px", background: "linear-gradient(to top, " + "rgba(255,255,255,0.8)" + "," + "rgba(255,255,255,0)" + ")"
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    function initialize() {
        cssTag = 'directionsPanel';
        wayPoints = [];
        wayPointMapFeatures = [];
        canSearch = false;
        isShowing = undefined;
        currentMode = undefined;
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        theThis.UpdateVisibility();
        settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

