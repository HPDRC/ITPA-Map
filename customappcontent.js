"use strict";

tf.TFMap.KeyedListItemContentStartVerb = "start";
tf.TFMap.KeyedListItemContentEndVerb = "end";
tf.TFMap.KeyedListItemContentAddVerb = "add";
tf.TFMap.KeyedListItemContentDelVerb = "del";
tf.TFMap.KeyedListItemContentUpdateVerb = "upd";

tf.TFMap.KeyedListContent = function (settings) {
    var theThis, contentInItemAttributeName, itemInContentAttributeName, spareContents;

    this.GetItemFromContent = function (content) { return !!content ? content[itemInContentAttributeName] : undefined; }
    this.GetContentFromItem = function (item) { return !!item ? item[contentInItemAttributeName] : undefined; }

    this.OnKLChange = function (notification) {
        var contentWrapper = settings.contentWrapper;
        var wrapperE = contentWrapper.GetHTMLElement(), wrapperES = wrapperE.style;
        var visibleVerb = tf.js.GetNonEmptyString(settings.contentWrapperDisplayVisibleVerb, "block");
        wrapperES.display = 'none';
        addContents(notification.addedItems);
        updateContents(notification.updatedItems);
        deleteContents(notification.deletedItems);
        wrapperES.display = visibleVerb;
        sortIfNeeded();
    }

    this.UpdateContentForItem = function (item) {
        return settings.updateContentForItem(item);
    }

    function sortAndCheckIfChanged(compareFnc) {
        var isSorted = true, sortedContent;
        if (tf.js.GetFunctionOrNull(compareFnc)) {
            var KL = settings.KL, count = KL.GetItemCount();
            if (count > 1) {
                var items = settings.KL.GetKeyedItemList();
                var itemsToSort = [];
                sortedContent = [];
                for (var i in items) {
                    var item = items[i], content = theThis.GetContentFromItem(item);
                    if (!!content) { itemsToSort.push(item); sortedContent.push({ item: item, itemData: item.GetData(), content: content }); }
                }
                if ((count = itemsToSort.length) > 0) {
                    sortedContent.sort(compareFnc);
                    for (var i = 0; i < count && isSorted ; ++i) {
                        isSorted = sortedContent[i].item == itemsToSort[i];
                    }
                }
            }
        }
        return { isSorted: isSorted, sortedContent: sortedContent };
    }

    function sortIfNeeded() {
        var checkResult = sortAndCheckIfChanged(settings.compareContent);
        if (!checkResult.isSorted) {
            var sortedContent = checkResult.sortedContent, count = sortedContent.length;
            var contentWrapper = settings.contentWrapper;
            var wrapperE = contentWrapper.GetHTMLElement(), wrapperES = wrapperE.style;
            var visibleVerb = tf.js.GetNonEmptyString(settings.contentWrapperDisplayVisibleVerb, "block");
            wrapperES.display = 'none';
            settings.contentWrapper.ClearContent();
            for (var i = 0; i < count ; ++i) { contentWrapper.AddContent(sortedContent[i].content.wrapper); }
            wrapperES.display = visibleVerb;
            //console.log('sorted');
        }
    }

    function createNewContent(item) {
        return settings.createNewContent(item);
    }

    function setContentToItem(item, content) {
        if (!!item && !!content) {
            item[contentInItemAttributeName] = content;
            content[itemInContentAttributeName] = item;
            settings.contentWrapper.AddContent(content.wrapper);
        }
    }

    function delContentFromItem(item) {
        var content = theThis.GetContentFromItem(item);
        if (!!content) {
            if (tf.js.GetFunctionOrNull(settings.onContentBecameSpare)) {
                settings.onContentBecameSpare(content, item);
            }
            settings.contentWrapper.RemoveContent(content.wrapper);
            delete item[contentInItemAttributeName];
            delete content[itemInContentAttributeName];
            spareContents.push(content);
        }
    }

    function createOrGetSpareContent(item) {
        var newOrSpareContent;
        if (spareContents.length > 0) {
            newOrSpareContent = spareContents.pop();
            if (tf.js.GetFunctionOrNull(settings.prepareSpareContent)) {
                newOrSpareContent = settings.prepareSpareContent(newOrSpareContent, item);
            }
        }
        else {
            newOrSpareContent = createNewContent(item);
        }
        return newOrSpareContent;
    }
    function createContentForItem(item) { if (!!item) { setContentToItem(item, createOrGetSpareContent(item)); theThis.UpdateContentForItem(item); }; }

    function addContents(items) { for (var i in items) { createContentForItem(items[i]); } }
    function updateContents(items) { for (var i in items) { theThis.UpdateContentForItem(items[i]); } }
    function deleteContents(items) {
        for (var i in items) { delContentFromItem(items[i]); }
        /*var count = 0;
        for (var i in items) {
            ++count;
            delContentFromItem(items[i]);
        }
        console.log(settings.contentInItemAttributeName + ' deleted ' + count + ' items');*/
    };

    function initialize() {
        contentInItemAttributeName = tf.js.GetNonEmptyString(settings.contentInItemAttributeName, "contentInItem");
        itemInContentAttributeName = tf.js.GetNonEmptyString(settings.itemInContentAttributeName, "itemInContent");
        spareContents = [];
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.TFMap.KeyedListMapFeatures = function (settings) {
    var theThis, mapFeatureInItemAttributeName, itemInMapFeatureAttributeName, selectedMapFeature, getOptionalSettingsCB;
    var mapFeatureType, itemDataFieldNameWithCoords, itemDataFieldNameWithCoordsCB;

    this.GetMapFeatureType = function () { return mapFeatureType; };

    this.RefreshStyles = function (KL) {
        if (!!KL) {
            var items = KL.GetKeyedItemList();
            for (var i in items) {
                var item = items[i], mapFeature = theThis.GetMapFeatureFromItem(item);
                if (!!mapFeature) { mapFeature.RefreshStyle(); }
            }
        }
    };

    this.GetIsPoint = function () { return mapFeatureType === "point"; };

    this.RefreshPositions = function (KL) {
        if (!!KL && theThis.GetIsPoint()) {
            var items = KL.GetKeyedItemList();
            for (var i in items) {
                var item = items[i], mapFeature = theThis.GetMapFeatureFromItem(item);
                if (!!mapFeature) {
                    var itemData = item.GetData();
                    var coordinates = getCoordsFromItemData(itemData);
                    if (!!coordinates) { mapFeature.SetPointCoords(coordinates); }
                }
            }
        }
    }

    this.GetSelectedMapFeature = function () { return selectedMapFeature; }
    this.SetSelectedMapFeature = function (newSelectedMapFeature) {
        if (newSelectedMapFeature != selectedMapFeature) {
            if (!!selectedMapFeature) { selectedMapFeature.SetIsAlwaysInHover(false); }
            if (selectedMapFeature = newSelectedMapFeature) { selectedMapFeature.SetIsAlwaysInHover(true); }
        }
    }

    this.OnKLChange = function (notification) {
        deleteMapFeatures(notification.deletedItems);
        addMapFeatures(notification.addedItems);
        updateMapFeatures(notification.updatedItems);
    };

    this.GetMapFeatureFromItem = function (item) { return getMapFeatureFromItem(item); }
    this.GetItemFromMapFeature = function (mapFeature) { return getItemFromMapFeature(mapFeature); }

    this.Clear = function (KL) {
        if (!!KL) {
            var items = KL.GetKeyedItemList();
            for (var i in items) {
                delMapFeatureFromItem(items[i]);
            }
        }
        settings.layer.RemoveAllFeatures();
    };

    function getItemFromMapFeature(mapFeature) { return !!mapFeature ? mapFeature.GetSettings()[itemInMapFeatureAttributeName] : undefined; };

    function getMapFeatureFromItem(item) { return !!item ? item[mapFeatureInItemAttributeName] : undefined; };

    function delMapFeatureFromItem(item) {
        var mapFeature = getMapFeatureFromItem(item); if (!!mapFeature) {
            delete item[mapFeatureInItemAttributeName];
            delete mapFeature.GetSettings()[itemInMapFeatureAttributeName];
        }
    };

    function getCoordsFromItemData(itemData) { return itemDataFieldNameWithCoordsCB ? itemDataFieldNameWithCoordsCB(itemData) : itemData[itemDataFieldNameWithCoords].slice(0); };

    function createMapFeatureForItem(item) {
        var mapFeature;
        if (!!item) {
            var itemData = item.GetData();
            //console.log(JSON.stringify(itemData));
            var coordinates = getCoordsFromItemData(itemData);
            if (coordinates) {
                var mapFeatureGeom = { type: mapFeatureType, coordinates: coordinates };
                var optionalSettings = !!getOptionalSettingsCB ? getOptionalSettingsCB({ sender: theThis, item: item, itemData: itemData }) : {};
                optionalSettings[itemInMapFeatureAttributeName] = item;
                item[mapFeatureInItemAttributeName] = mapFeature = new tf.map.Feature(tf.js.ShallowMerge(settings.styles, mapFeatureGeom, optionalSettings, { onCustomAppClick: settings.onClick }));
            }
        }
        return mapFeature;
    }

    function addMapFeatures(items) {
        var layer = settings.layer, toolTipProps = settings.toolTipProps;
        for (var i in items) {
            var item = items[i], mapFeature = createMapFeatureForItem(item);
            if (mapFeature) {
                if (!!toolTipProps) { tf.TFMap.SetMapFeatureToolTipProps(mapFeature, toolTipProps); }
                layer.AddMapFeature(mapFeature, true);
            }
        }
        layer.AddWithheldFeatures();
    };

    function updateMapFeatures(items) {
        if (theThis.GetIsPoint()) {
            for (var i in items) {
                var item = items[i], mapFeature = getMapFeatureFromItem(item);
                if (!!mapFeature) {
                    var itemData = item.GetData();
                    mapFeature.SetPointCoords(itemData.coords);
                    if (!!settings.refreshStyleOnUpdate) { mapFeature.RefreshStyle(); }
                }
            }
        }
    };

    function deleteMapFeatures(items) {
        var layer = settings.layer;
        var appCtx = settings.appContent.GetAppCtx();
        var curToolTipSender = appCtx.GetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender);
        var ndel = 0;
        for (var i in items) {
            var item = items[i], mapFeature = getMapFeatureFromItem(item);
            if (!!mapFeature) {
                if (selectedMapFeature == mapFeature) { selectedMapFeature = undefined; }
                if (curToolTipSender == mapFeature) {
                    appCtx.SetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender, undefined);
                    //console.log('deselected deleted custom map feature tooltip');
                }
                layer.DelMapFeature(mapFeature, true);
                delMapFeatureFromItem(item);
                ++ndel;
            }
        }
        layer.DelWithheldFeatures();
    };

    function initialize() {
        itemDataFieldNameWithCoordsCB = tf.js.GetFunctionOrNull(settings.itemDataFieldNameWithCoords);
        itemDataFieldNameWithCoords = tf.js.GetNonEmptyString(settings.itemDataFieldNameWithCoords, "coords");
        mapFeatureType = tf.js.GetNonEmptyString(settings.mapFeatureType, "point").toLowerCase();
        getOptionalSettingsCB = tf.js.GetFunctionOrNull(settings.getOptionalSettings);
        mapFeatureInItemAttributeName = tf.js.GetNonEmptyString(settings.mapFeatureInItemAttributeName, "mapFeatureInItem");
        itemInMapFeatureAttributeName = tf.js.GetNonEmptyString(settings.itemInMapFeatureAttributeName, "itemInMapFeature");
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.TFMap.CustomAppContent = function (settings) {
    var theThis, cssTag, isVisible, sidePanelWidthInt, sidePanelWidthSmallInt;
    var wrapper, contentWrapper, toggleButton;
    var adjustingStyles;
    var toggleButtonWrapper, toggleButtonHidden;
    var classNames;
    var mainToolBarButtonDimInt, vertListWithFadePaddingTopBotInt;
    var onMapPostComposeCB;

    this.OnMapPostCompose = function (notification) { if (!!onMapPostComposeCB) { onMapPostComposeCB(notification); } }

    this.UpdateForMapType = function () {
        if (tf.js.GetFunctionOrNull(settings.updateForMapType)) {
            settings.updateForMapType({ sender: theThis });
        }
    }

    function getToggleButtonHidden() { return toggleButtonHidden; }

    function setToggleButtonHidden(newHidden) {
        if (toggleButtonHidden != (newHidden = !!newHidden)) {
            toggleButtonHidden = newHidden;
            toggleButtonWrapper.GetHTMLElement().style.display = toggleButtonHidden ? "none" : "block";
        }
    }

    function getWrapper() { return wrapper; }
    function getContentWrapper() { return contentWrapper; }
    function getSettings () { return settings; }
    function getWidthInt() { return sidePanelWidthInt; }
    function getWidthIntSmall() { return sidePanelWidthSmallInt; }

    function getCurrentWidthInt() { return settings.appContent.GetAppStyles().GetIsSmallScreen() ? sidePanelWidthSmallInt : sidePanelWidthInt; }

    function getIsVisible() { return isVisible; }

    function setVisible(isVisibleSet) {
        if (isVisible != (isVisibleSet = !!isVisibleSet)) {
            isVisible = isVisibleSet;
            tf.dom.ReplaceCSSClassCondition(wrapper, isVisible, classNames.visibleClassName, classNames.collapsedClassName);
            toggleButton.SetIsToggled(isVisible);
            adjustStyles();
            if (tf.js.GetFunctionOrNull(settings.onVisibilityChange)) {
                settings.onVisibilityChange({ sender: theThis, isVisible: isVisible });
            }
        }
    }

    function adjustStyles() {
        var appContent = settings.appContent, rootDiv = appContent.GetRootDiv(), rootDivE = rootDiv.GetHTMLElement(), rootDivS = rootDivE.style;
        var desiredWidth = isVisible ? "calc(100% - " + (getCurrentWidthInt()) + "px)" : "100%";
        if (!adjustingStyles && desiredWidth != rootDivS.width) {
            adjustingStyles = true;
            rootDivS.width = desiredWidth;
            appContent.OnLayoutChange();
            adjustingStyles = false;
        }
    }

    function onToggleButtonClick(notification) { setVisible(!isVisible); }

    function getToggleButtonToolTipText() {
        var toolTipText;
        if (tf.js.GetFunctionOrNull(settings.toggleButtonToolTipText)) { toolTipText = settings.toggleButtonToolTipText(); }
        else if (tf.js.GetIsNonEmptyString(settings.toggleButtonToolTipText)) { toolTipText = settings.toggleButtonToolTipText; }
        else { toolTipText = isVisible ? "Collapse application panel" : "Expand application panel"; }
        return toolTipText;
    }

    function createControl() {
        var delayMillis = 0, toolTipClass = "center", toolTipArrowClass = "right", toolTipStyle = undefined;
        var ls = tf.TFMap.LayoutSettings;
        var appContent = settings.appContent;
        var shouldBeVisible = !!settings.visible;
        toggleButtonWrapper = new tf.dom.Div({ cssClass: classNames.toggleButtonWrapperClassName });

        wrapper = new tf.dom.Div({ cssClass: classNames.wrapperClassName });

        var buttonSettings = {
            onHover: undefined, wrapper: toggleButtonWrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass, toolTipStyle: toolTipStyle
        };

        toggleButton = appContent.CreateToggleButton(tf.js.ShallowMerge(buttonSettings, {
            offsetX: 4,
            onClick: onToggleButtonClick,
            buttonClass: classNames.toggleButtonClassName + " ripple", classToggled: ls.arrowRightBackgroundClassName, classNotToggled: ls.arrowLeftBackgroundClassName,
            isToggled: shouldBeVisible, toolTipText: getToggleButtonToolTipText
        }));

        toggleButtonWrapper.AddContent(toggleButton.GetButton());

        setToggleButtonHidden(!!settings.toggleButtonHidden);

        contentWrapper = createContentWrapper();

        wrapper.AddContent(toggleButtonWrapper, contentWrapper);

        setVisible(shouldBeVisible);

        appContent.GetAppDiv().AddContent(wrapper);
    }

    function createCSSClassNames() {
        classNames = {
            wrapperClassName: tf.TFMap.CreateClassName(cssTag, "Wrapper"),
            collapsedClassName: tf.TFMap.CreateClassName(cssTag, "Collapsed"),
            visibleClassName: tf.TFMap.CreateClassName(cssTag, "Visible"),
            toggleButtonWrapperClassName: tf.TFMap.CreateClassName(cssTag, "ToggleButtonWrapper"),
            toggleButtonClassName: tf.TFMap.CreateClassName(cssTag, "ToggleButton"),

            topCaptionClassName: tf.TFMap.CreateClassName(cssTag, "TopCaption"),
            fullWidthClassName: tf.TFMap.CreateClassName(cssTag, "FullWidthNoOverflow"),
            captionLogoClassName: tf.TFMap.CreateClassName(cssTag, "CaptionLogo"),
            captionTitleClassName: tf.TFMap.CreateClassName(cssTag, "CaptionTitle"),
            captionDescClassName: tf.TFMap.CreateClassName(cssTag, "CaptionDesc"),
            captionTitleDescWrapperClassName: tf.TFMap.CreateClassName(cssTag, "TitleDescWrapper"),
            footerWrapperClassName: tf.TFMap.CreateClassName(cssTag, "FooterWrapper"),
            footerContentClassName: tf.TFMap.CreateClassName(cssTag, "FooterContent"),
            fullWidthWithPaddingClassName: tf.TFMap.CreateClassName(cssTag, "FullWidthWithPadding"),
            toolBarWrapperClassName: tf.TFMap.CreateClassName(cssTag, "ToolBarWrapper"),
            toolBarContentClassName: tf.TFMap.CreateClassName(cssTag, "ToolBarContent"),
            mainToolBarContentClassName: tf.TFMap.CreateClassName(cssTag, "MainToolBarContent"),
            toolBarButtonClassName: tf.TFMap.CreateClassName(cssTag, "ToolBarButton"),
            mainToolBarButtonClassName: tf.TFMap.CreateClassName(cssTag, "MainToolBarButton"),
            variableFontSizeClassName: tf.TFMap.CreateClassName(cssTag, "variableFontSize"),
            nonScrollVariableHeightClassName: tf.TFMap.CreateClassName(cssTag, "NonScroll"),

            toolBarSpanClasses: tf.TFMap.CreateClassName(cssTag, "ToolBarSpan"),
            mainToolBarSpanClasses: tf.TFMap.CreateClassName(cssTag, "MainToolBarSpan"),

            borderTopClassName: tf.TFMap.CreateClassName(cssTag, "BorderTop"),
            fadeTopClassName: tf.TFMap.CreateClassName(cssTag, "FadeTop"),
            fadeBotClassName: tf.TFMap.CreateClassName(cssTag, "FadeBot"),
            minHeightPaneClassName: tf.TFMap.CreateClassName(cssTag, "MinHeightPane"),
            minHeightListClassName: tf.TFMap.CreateClassName(cssTag, "MinHeightList"),

            zIndexListItem: tf.TFMap.CreateClassName(cssTag, "ZIndexListItem")
        };
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var isSmallScreen = appStyles.GetIsSmallScreen();
        var toggleButtonHeightPx = ls.toggleButtonHeightInt + 'px';
        var sidePanelTopMarginInt = ls.topMarginInt, sidePanelTopMarginPx = sidePanelTopMarginInt + 'px';
        var sidePanelWidthIntUse = isSmallScreen ? sidePanelWidthSmallInt : sidePanelWidthInt;
        var sidePanelWidthPx = sidePanelWidthIntUse + 'px';
        var logoBorderColor = ls.darkTextColor;
        var footerContentPaddingInt = isSmallScreen ? 2 : 4, footerContentPaddingPx = footerContentPaddingInt + 'px';
        var backgroundLivelyStyle = { backgroundColor: ls.backgroundLivelyColor };
        var paddingCaptionVerHorInt = 6;
        var paddingCaptionVerHorPx = paddingCaptionVerHorInt + 'px';
        var directionsSelectedColor = ls.directionsSelectedColor;
        var largeVertPaddingInt = ls.baseLayersPaneTopCaptionVerPaddingInt * 0.5;
        var largeVertPaddingPx = largeVertPaddingInt + 'px';
        var largePaddingInt = isSmallScreen ? 6 : 10;
        var descFontSizeInt = ls.directionsSummarySmallFontSizeInt;
        var requiredWrapperStyles = {
            inherits: [CSSClasses.transitionPoint2s, CSSClasses.HOneHundred, CSSClasses.displayBlock, CSSClasses.overflowVisible,
            CSSClasses.boxShadow002003, CSSClasses.cursorDefault, CSSClasses.pointerEventsAll, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute],
            right: 0, top: "0px",
            zIndex: '' + (ls.rootDivZIndex + ls.customAppContentWrapperZIndexAdd),
            width: sidePanelWidthPx
        };
        var defaultWrapperStyles = { backgroundColor: ls.backgroundLivelyColor };

        cssClasses[classNames.wrapperClassName] = tf.js.ShallowMerge(defaultWrapperStyles, settings.wrapperStyles, requiredWrapperStyles);

        cssClasses[classNames.collapsedClassName] = {
            transform: "translateX(" + (sidePanelWidthIntUse) + "px)",
            "-webkit-transform": "translateX(" + (sidePanelWidthIntUse) + "px)"
        };

        cssClasses[classNames.visibleClassName] = {
            transform: "translateX(0px)",
            "-webkit-transform": "translateX(0px)"
        };

        cssClasses[classNames.toggleButtonWrapperClassName] = {
            inherits: [CSSClasses.borderRadius2px, CSSClasses.pointerEventsAll, CSSClasses.whiteSpaceNoWrap, CSSClasses.displayBlock, CSSClasses.overflowVisible, CSSClasses.cursorDefault,
            CSSClasses.noMargin, CSSClasses.noPadding, CSSClasses.positionAbsolute, CSSClasses.zIndex1, CSSClasses.lightBackground],
            right: "calc(100% + 1px)",
            //top: sidePanelTopMarginPx
            top: "calc(50% - " + (ls.toggleButtonHeightInt / 2) + "px)"
        };

        cssClasses[classNames.toggleButtonClassName] = {
            inherits: [CSSClasses.borderRadius2px, CSSClasses.baseImageButton, CSSClasses.borderLeftD4, CSSClasses.boxShadow01403, CSSClasses.overflowHidden],
            width: "23px", height: toggleButtonHeightPx
        };

        cssClasses[classNames.toggleButtonClassName + ":hover"] = {
            border: "1px solid rgba(0,48,118,0.4)"
        };

        cssClasses[classNames.topCaptionClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.noMarginNoBorderNoPadding, backgroundLivelyStyle,
                CSSClasses.robotoFontFamily, CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap],
            width: "calc(100% - " + (0) + "px)",
            color: "white",
            borderTop: "2px solid " + ls.backgroundLivelyColor,
            borderBottom: "2px solid " + ls.backgroundLivelyColor,
            fontSize: ls.baseLayersPaneTopCaptionFontSizeInt + 'px',
            lineHeight: ls.baseLayersPaneTopCaptionLineHeightInt + 'px'
        };

        cssClasses[classNames.captionLogoClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.flexGrowZero, CSSClasses.displayFlex, CSSClasses.flexFlowColumnNoWrap],
            //minHeight: "0px",
            margin: "auto",
            backgroundColor: "white",
            padding: "2px",
            borderRadius: "2px",
            marginRight: isSmallScreen ? "4px" : "8px",
            border: "1px solid " + logoBorderColor,
            width: (largeVertPaddingInt * 2 + ls.baseLayersPaneTopCaptionLineHeightInt + descFontSizeInt) + 'px'
        };

        cssClasses[classNames.captionLogoClassName + " svg"] = {
            width: "100%",
            height: "initial",
            margin: "auto"
        };

        cssClasses[classNames.captionTitleDescWrapperClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.flexFlowColumnNoWrap, CSSClasses.flexGrowZero, CSSClasses.displayFlex],
            alignItems: "flex-start",
            paddingLeft: largePaddingInt + 'px',
            paddingRight: largePaddingInt + 'px',
            margin: "0px"
        };

        cssClasses[classNames.captionTitleClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.flexGrowOne, CSSClasses.displayFlex],
            padding: paddingCaptionVerHorPx,
            paddingLeft: "0px",
            paddingTop: largeVertPaddingPx,
            paddingBottom: '0px',
            margin: "0px"
        };

        cssClasses[classNames.captionDescClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.flexGrowOne, CSSClasses.displayFlex],
            padding: paddingCaptionVerHorPx,
            paddingLeft: isSmallScreen ? "2px" : "4px",
            borderTop: "1px solid white",
            paddingTop: '4px',
            paddingBottom: largeVertPaddingPx,
            fontSize: descFontSizeInt + 'px',
            lineHeight: (descFontSizeInt + 2) + 'px',
            margin: "0px"
        };

        var dimButtonInt = ls.widthMapToolBarInt, dimButtonIntPx = dimButtonInt + 'px';

        cssClasses[classNames.toolBarWrapperClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.noMarginNoBorderNoPadding, , CSSClasses.displayBlock],
            fontSize: ls.baseLayersPaneDefaultFontSizeInt + 'px',
            lineHeight: ls.baseLayersPaneDefaultLineHeightInt + 'px',
            //margin: "4px", marginLeft: "6px", marginRight: "6px",
            width: "100%"
            //width: "calc(100% - 16px)"//, margin: "auto"
        };

        cssClasses[classNames.toolBarContentClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.displayFlex, CSSClasses.flexFlowRowWrap, CSSClasses.overflowHidden, CSSClasses.darkTextShadow],
            //alignItems: "flex-start",
            textAlign: "left",
            fontSize: ls.baseLayersPaneDefaultFontSizeInt + 'px',
            lineHeight: ls.baseLayersPaneDefaultLineHeightInt + 'px',
            margin: "auto",
            padding: "2px",
            width: "calc(100% - 4px)"
        };

        cssClasses[classNames.mainToolBarContentClassName] = {
            background: "navajowhite",
            //alignItems: "flex-start",
            fontSize: ls.baseLayersPaneTopCaptionFontSizeInt + 'px',
            lineHeight: ls.baseLayersPaneTopCaptionLineHeightInt + 'px'
        };

        var addButtonDimInt = isSmallScreen ? 6 : -2;

        cssClasses[classNames.toolBarButtonClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.transparentImageButton, CSSClasses.backgroundColorTransparent, CSSClasses.displayFlex,
                CSSClasses.flexFlowRowNoWrap, CSSClasses.flexGrowZero, CSSClasses.flexShrinkZero],
            height: (ls.baseLayersPaneDefaultLineHeightInt + addButtonDimInt) + 'px',
            width: (ls.baseLayersPaneDefaultLineHeightInt + addButtonDimInt) + 'px',
            color: ls.backgroundLivelyColor,
            fontSize: isSmallScreen ? "11px" : "18px",
            marginLeft: "2px",
            marginRight: "2px",
            margin: "auto"
        };

        cssClasses[classNames.toolBarButtonClassName + " svg"] = { width: "100%", height: "100%", fill: ls.backgroundLivelyColor };

        var addMainButtonDimInt = isSmallScreen ? 4 : 4;

        mainToolBarButtonDimInt = ls.baseLayersPaneTopCaptionLineHeightInt + addMainButtonDimInt;

        cssClasses[classNames.mainToolBarButtonClassName] = {
            inherits: [CSSClasses.transitionPoint2s, cssClasses[classNames.toolBarButtonClassName]],
            height: (mainToolBarButtonDimInt) + 'px',
            width: (mainToolBarButtonDimInt) + 'px',
            //fontSize: (mainToolBarButtonDimInt) + 'px',
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            borderRadius: "2px",
            border: "1px solid " + ls.darkTextColor,
            lineHeight: (mainToolBarButtonDimInt) + 'px',
            padding: "1px",
            margin: "auto"
        };

        cssClasses[classNames.mainToolBarButtonClassName + " svg"] = { width: "100%", height: "100%", fill: /*ls.backgroundLivelyColor /**/ls.darkTextColor/**/ };

        cssClasses[classNames.toolBarSpanClasses] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.displayFlex,
                //CSSClasses.flexFlowColumnNoWrap,
                CSSClasses.flexFlowRowNoWrap,
                CSSClasses.flexGrowOne, CSSClasses.flexShrinkOne, CSSClasses.pointerEventsNone],
            fontSize: ls.baseLayersPaneDefaultFontSizeInt + 'px',
            lineHeight: (ls.baseLayersPaneDefaultLineHeightInt - 6)+ 'px',
            padding: "2px",
            margin: "auto"
        };

        var mainToolBarSpanPaddingInt = isSmallScreen ? 2 : 4;
        var mainToolBarSpanHorPaddingInt = isSmallScreen ? 4 : 8;

        cssClasses[classNames.mainToolBarSpanClasses] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.displayFlex,
                //CSSClasses.flexFlowColumnNoWrap,
                CSSClasses.flexFlowRowNoWrap,
                CSSClasses.flexGrowOne, CSSClasses.flexShrinkOne, CSSClasses.pointerEventsNone],
            fontSize: (ls.baseLayersPaneTopCaptionFontSizeInt - 0) + 'px',
            lineHeight: ls.baseLayersPaneTopCaptionLineHeightInt + 'px',
            padding: mainToolBarSpanPaddingInt + "px",
            paddingLeft: mainToolBarSpanHorPaddingInt + 'px',
            paddingRight: mainToolBarSpanHorPaddingInt + 'px'
        };

        cssClasses[classNames.footerWrapperClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.noMarginNoBorderNoPadding, backgroundLivelyStyle,
                CSSClasses.robotoFontFamily, CSSClasses.displayBlock]
        };

        cssClasses[classNames.footerContentClassName] = {
            inherits: [CSSClasses.displayFlex, CSSClasses.flexFlowColumnNoWrap, CSSClasses.lightTextShadow],
            minHeight: "0px",
            width: "calc(100% - " + (2 * footerContentPaddingInt) + "px)",
            textAlign: "center",
            padding: footerContentPaddingPx,
            color: "white",
            fontSize: ls.directionsSummarySmallFontSizeInt + 'px',
            lineHeight: ls.directionsSummarySmallLineHeightInt + 'px'
        };

        cssClasses[classNames.variableFontSizeClassName] = {
            fontSize: ls.baseLayersPaneDefaultFontSizeInt + 'px',
            lineHeight: ls.baseLayersPaneDefaultLineHeightInt + 'px'
        };

        cssClasses[classNames.fullWidthClassName] = {
            width: "100%"
        };

        cssClasses[classNames.fullWidthWithPaddingClassName] = {
            width: "100%"
            /*width: "calc(100% - 10px)",
            paddingLeft: "10px"*/
        };

        cssClasses[classNames.nonScrollVariableHeightClassName] = {
            inherits: [CSSClasses.displayFlex, CSSClasses.flexFlowColumnNoWrap, CSSClasses.flexGrowOne, CSSClasses.flexShrinkOne],
            //height: "100%",
            minHeight: "0px"
        };

        var minHeightListInt = isSmallScreen ? 100 : 200;

        vertListWithFadePaddingTopBotInt = isSmallScreen ? 4 : 8;
        var vertListWithFadePaddingTopBotPx = vertListWithFadePaddingTopBotInt + 'px';

        var topBotFadeBorder = "1px solid " + ls.listBorderColor;

        var topBotFadeCommon = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.pointerEventsNone, CSSClasses.positionAbsolute, CSSClasses.overflowVisible],
            left: "0px",
            zIndex: '' + (ls.rootDivZIndex + ls.listFadeWrapperZIndexAdd),
            width: "100%",
            height: vertListWithFadePaddingTopBotInt + 'px !important'
        };

        cssClasses[classNames.zIndexListItem] = {
            zIndex: '' + (ls.rootDivZIndex + ls.listFadeWrapperZIndexAdd + 20)
        };

        cssClasses[classNames.borderTopClassName] = { borderTop: topBotFadeBorder };

        cssClasses[classNames.fadeTopClassName] = {
            inherits: [topBotFadeCommon], top: "0px",
            borderTop: topBotFadeBorder, background: "linear-gradient(to bottom, " + "rgba(255,255,255,1)" + "," + "rgba(255,255,255,0)" + ")"
        };

        cssClasses[classNames.fadeBotClassName] = {
            inherits: [topBotFadeCommon],
            borderBottom: topBotFadeBorder, bottom: "0px", background: "linear-gradient(to top, " + "rgba(255,255,255,1)" + "," + "rgba(255,255,255,0)" + ")"
        };

        cssClasses[classNames.minHeightPaneClassName] = {
            minHeight: minHeightListInt + 'px'
        };

        cssClasses[classNames.minHeightListClassName] = {
            //backgroundColor: "#f0f0ff",
            backgroundColor: ls.lightBackground,
            paddingTop: vertListWithFadePaddingTopBotPx,
            paddingBottom: vertListWithFadePaddingTopBotPx/*,
            minHeight: minHeightListInt + 'px'*/
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) {
        registerCSSClasses();
        //settings.appContent.GetAppStyles().SetMinNonSmallScreenWidthAddValue(isVisible ? sidePanelWidthInt : 0);
        adjustStyles();
    }

    function createContentWrapper() { var ls = tf.TFMap.LayoutSettings; return new tf.dom.Div({ cssClass: ls.sidePanelContentWrapperClassName + " " + ls.sidePaneFullHeightContentWrapperClassName }); }

    function createNonScrollContent() {
        var ls = tf.TFMap.LayoutSettings;
        return new tf.dom.Div({ cssClass: ls.sidePaneContentFixedHeightClassName + " " + classNames.variableFontSizeClassName + " " + classNames.fullWidthClassName });
    }

    function createNonScrollVariableHeightContent(additionalClassNames) {
        var ls = tf.TFMap.LayoutSettings;
        var classNamesUse = ls.sidePaneContentFixedHeightClassName + " " + classNames.variableFontSizeClassName +
            " " + classNames.nonScrollVariableHeightClassName + " " + classNames.fullWidthClassName;
        if (tf.js.GetIsNonEmptyString(additionalClassNames)) { classNamesUse += ' ' + additionalClassNames; }
        return new tf.dom.Div({ cssClass: classNamesUse });
    }

    function createScrollContent(additionalClassNames) {
        var ls = tf.TFMap.LayoutSettings;
        var classNamesUse = ls.sidePaneContentVariableHeightClassName + " " + classNames.fullWidthWithPaddingClassName + " " + classNames.variableFontSizeClassName
            + " " + ls.customizedScrollBarClassName;
        if (tf.js.GetIsNonEmptyString(additionalClassNames)) { classNamesUse += ' ' + additionalClassNames; }
        return new tf.dom.Div({ cssClass: classNamesUse });
    }

    function createWrapperContent(wrapperClassName, contentClassName, additionalWrapperClassNames, additionalContentClassNames) {
        var wrapperClassNameUse = wrapperClassName, contentClassNameUse = contentClassName;
        if (tf.js.GetIsNonEmptyString(additionalWrapperClassNames)) { wrapperClassNameUse += " " + additionalWrapperClassNames; }
        if (tf.js.GetIsNonEmptyString(additionalContentClassNames)) { contentClassNameUse += " " + additionalContentClassNames; }
        var wrapper = new tf.dom.Div({ cssClass: wrapperClassNameUse }), content = new tf.dom.Div({ cssClass: contentClassNameUse });
        wrapper.AddContent(content);
        return { wrapper: wrapper, content: content };
    }

    function createMainToolBar() {
        return createWrapperContent(classNames.toolBarWrapperClassName, classNames.toolBarContentClassName + " " + classNames.mainToolBarContentClassName);
    }

    function createToolBar(additionalWrapperClassNames, additionalContentClassNames) {
        return createWrapperContent(classNames.toolBarWrapperClassName, classNames.toolBarContentClassName, additionalWrapperClassNames, additionalContentClassNames);
    }

    function createFooter() { return createWrapperContent(classNames.footerWrapperClassName, classNames.footerContentClassName); }

    function createVertScrollWrapperAndContentWithFade() {
        var ls = tf.TFMap.LayoutSettings;
        var scrollWrapper = createNonScrollVariableHeightContent(classNames.minHeightListClassName);
        var fadeTop = new tf.dom.Div({ cssClass: classNames.fadeTopClassName });
        var fadeBot = new tf.dom.Div({ cssClass: classNames.fadeBotClassName });
        var scrollContent = createScrollContent(/*classNames.minHeightListClassName*/);
        scrollWrapper.AddContent(fadeTop, fadeBot, scrollContent);
        scrollWrapper.GetHTMLElement().style.overflow = "hidden";
        return { scrollWrapper: scrollWrapper, scrollContent: scrollContent }
    }

    function getToolBarButtonClasses() { return classNames.toolBarButtonClassName; }
    function getMainToolBarButtonClasses() { return getToolBarButtonClasses() + " " + classNames.mainToolBarButtonClassName; }

    function getClassNames() { return classNames; }
    function getVerListWithFadePaddingTopBotInt() { return /*classNames.*/vertListWithFadePaddingTopBotInt; }

    function createTitleDescSVGLogo(titleStr, descStr, logoSVGHTML) {
        var wrapper = new tf.dom.Div({ cssClass: classNames.topCaptionClassName });
        var titleDescWrapper = new tf.dom.Div({ cssClass: classNames.captionTitleDescWrapperClassName });
        var title = new tf.dom.Div({ cssClass: classNames.captionTitleClassName });
        var desc = new tf.dom.Div({ cssClass: classNames.captionDescClassName });
        var logo = new tf.dom.Div({ cssClass: classNames.captionLogoClassName });

        title.GetHTMLElement().innerHTML = titleStr;
        desc.GetHTMLElement().innerHTML = tf.js.GetNonEmptyString(descStr, "A TerraFly application");
        titleDescWrapper.AddContent(title, desc);
        logo.GetHTMLElement().innerHTML = logoSVGHTML;
        wrapper.AddContent(titleDescWrapper, logo);
        return { wrapper: wrapper, titleDescWrapper: titleDescWrapper, title: title, desc: desc, logo: logo };
    }

    function getToolBarSpanClasses() { return classNames.toolBarSpanClasses; }
    function getMainToolBarSpanClasses() { return getToolBarSpanClasses() + " " + classNames.mainToolBarSpanClasses; }

    function setOnMapPostCompose(callBack) { onMapPostComposeCB = tf.js.GetFunctionOrNull(callBack); }

    function setInterface() {
        if (tf.js.GetFunctionOrNull(settings.setInterface)) {
            var myInterface = {
                sender: theThis,
                setOnMapPostCompose: setOnMapPostCompose,

                getMainToolBarButtonDimInt: function() { return mainToolBarButtonDimInt; },

                createTitleDescSVGLogo: createTitleDescSVGLogo,
                createNonScrollContent: createNonScrollContent,
                createNonScrollVariableHeightContent: createNonScrollVariableHeightContent,
                createVertScrollWrapperAndContentWithFade: createVertScrollWrapperAndContentWithFade,
                createScrollContent: createScrollContent,
                createMainToolBar: createMainToolBar,
                createToolBar: createToolBar,
                createFooter: createFooter,

                getClassNames: getClassNames,
                getVerListWithFadePaddingTopBotInt: getVerListWithFadePaddingTopBotInt,

                getToolBarSpanClasses: getToolBarSpanClasses,
                getMainToolBarSpanClasses: getMainToolBarSpanClasses,
                getToolBarButtonClasses: getToolBarButtonClasses,
                getMainToolBarButtonClasses: getMainToolBarButtonClasses,

                getToggleButtonHidden: getToggleButtonHidden,
                setToggleButtonHidden: setToggleButtonHidden,
                getWrapper: getWrapper,
                getContentWrapper: getContentWrapper,
                getSettings: getSettings,
                getWidthInt: getWidthInt,
                getWidthIntSmall: getWidthIntSmall,
                getCurrentWidthInt: getCurrentWidthInt,
                getIsVisible: getIsVisible,
                setVisible: setVisible
            };
            settings.setInterface(myInterface);
        }
    }

    function initialize() {
        cssTag = 'customAppContent';
        sidePanelWidthInt = tf.js.GetFloatNumberInRange(settings.widthInt, 0, 99999999, 400);
        sidePanelWidthSmallInt = tf.js.GetFloatNumberInRange(settings.widthIntSmall, 0, 99999999, 300);
        //settings.appContent.GetAppStyles().SetMinNonSmallScreenWidthAddValue(sidePanelWidthInt);
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        var appStyles = settings.appContent.GetAppStyles();
        appStyles.AddOnLayoutChangeListener(onLayoutChange);
        setInterface();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.TFMap.CustomApp = function (settings) {
    var theThis, appName, tfMapApp, customAppContent, customAppContentI;
    var slideAppStartVerb, collapsedAppStartVerb, expandedAppStartVerb;
    var startVisible, slideVisible;
    var onParametersParsedCB, onCreatedCB;
    var customAppContent, customAppContentI;

    this.GetTFMapApp = function () { return tfMapApp; }

    function onCreated(notification) {
        if (startVisible && slideVisible) {
            customAppContentI.setVisible(true);
            customAppContentI.setToggleButtonHidden(false);
        }
        if (!!onCreatedCB) { onCreatedCB(notification); }
    }

    function toggleButtonToolTipText() {
        var toolTipText;
        if (!!customAppContentI) {
            var expandCollapse = customAppContentI.getIsVisible() ? "Collapse " : "Expand ";
            toolTipText = expandCollapse + appName + " panel";
        }
        return toolTipText;
    }

    function onAddComponents(notification) {
        var appContent = tfMapApp.GetContent();
        customAppContent = appContent.CreateCustomAppContent({
            transitServerURL: settings.transitServerURL,
            onVisibilityChange: settings.onVisibilityChange,
            updateForMapType: settings.updateForMapType,
            widthInt: settings.widthInt, widthIntSmall: settings.widthIntSmall,
            visible: startVisible && !slideVisible,
            toggleButtonHidden: startVisible && slideVisible,
            toggleButtonToolTipText: toggleButtonToolTipText,
            wrapperStyles: { background: "transparent" },
            setInterface: function (theInterface) {
                customAppContentI = theInterface;
                if (tf.js.GetFunctionOrNull(settings.onContentSetInterface)) {
                    settings.onContentSetInterface(theInterface);
                }
            }
        });
    }

    function startCollapsed() { startVisible = slideVisible = false; }
    function startExpanded() { startVisible = true; slideVisible = false; }
    function startSlideExpand() { startVisible = slideVisible = true; }

    function onParametersParsed(notification) {
        var params = notification.params;
        var appStart = tf.js.GetIsValidObject(params) ? params[tf.consts.appStartParamName] : undefined;
        appStart = tf.js.GetNonEmptyString(appStart, slideAppStartVerb);
        switch (appStart.toLowerCase()) {
            default: case slideAppStartVerb: startExpanded();/*startSlideExpand();*/ break;
            case collapsedAppStartVerb: startCollapsed(); break;
            case expandedAppStartVerb: startExpanded(); break;
        }
        if (!!onParametersParsedCB) { onParametersParsedCB(notification); }
    }

    function initialize() {
        appName = tf.js.GetNonEmptyString(settings.appName, "TerraFly App");
        slideAppStartVerb = "slide";
        collapsedAppStartVerb = tf.consts.appStartCollapsedValue;
        expandedAppStartVerb = tf.consts.appStartExpandedValue;
        onCreatedCB = tf.js.GetFunctionOrNull(settings.onCreated);
        onParametersParsedCB = tf.js.GetFunctionOrNull(settings.onParametersParsed);
        settings.sidePanelWidthInt = tf.js.GetFloatNumberInRange(settings.sidePanelWidthInt, 0, 99999999, 400);
        settings.sidePanelWidthSmallInt = tf.js.GetFloatNumberInRange(settings.sidePanelWidthSmallInt, 0, 99999999, 300);
        settings.onCreated = onCreated;
        settings.onAddComponents = onAddComponents;
        settings.onParametersParsed = onParametersParsed;
        settings.appTitle = appName;
        tfMapApp = new tf.TFMap.App(settings);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
