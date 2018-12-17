"use strict";

tf.Transit.IsBusUpdated = function (d1, d2) { return d1.coords[0] != d2.coords[0] || d1.coords[1] != d2.coords[1] || d1.updated.getTime() != d2.updated.getTime(); }

tf.Transit.CompareBuses = function (a, b) {
    var da = a.itemData, db = b.itemData;
    var aRouteIdInFleet = parseInt(da.route_id_in_feed, 10), bRouteIdInFleet = parseInt(db.route_id_in_feed, 10);
    if (aRouteIdInFleet != bRouteIdInFleet) { return aRouteIdInFleet - bRouteIdInFleet; }
    var aDir = da.lineDirection.order, bDir = db.lineDirection.order;
    if (aDir != bDir) { return aDir - bDir; }
    var aBusId = parseInt(da.name, 10), bBusId = parseInt(db.name, 10);
    if (aBusId != bBusId) { return aBusId - bBusId; }
    return 0;
};

tf.Transit.PreProcessBusItemData = function (data) {
    var toRad = Math.PI / 180.0;
    data.key = data.id + '|' + data.trip_id
    data.coords = [data.lon, data.lat];
    data.direction_rad = data.heading != -1 ? data.heading * toRad : undefined;
    data.updated = tf.js.GetDateFromTimeStamp(data.position_updated);
    data.lineDirection = tf.Transit.GetLineDirection(data.direction);
    return data;
};

tf.Transit.PreProcessHistoryBusData = function (data) {
    var newData = [];
    var nEvents = 0, startDate, totalSeconds = 0;
    var firstEventMillis = undefined;

    function extractHistoryEvent(data) {
        return {
            position_updated: data.position_updated,
            updated: data.updated,
            updatedMillis: data.updated.getTime(),
            updated_hms: data.updated_hms,
            offset_hms: data.offset_hms,

            coords: [data.lon, data.lat],
            direction_rad: data.direction_rad,
            dist_to_shape: data.dist_to_shape,

            stop_index: data.stop_index,
            stop_id: data.stop_id,
            next_stop_index: data.next_stop_index,
            next_stop_id: data.next_stop_id,

            is_finished: data.is_finished
        };
    };

    if (!!data) {
        var events = data.events;

        nEvents = tf.js.GetIsArray(events) ? events.length : 0;

        if (nEvents > 0) {
            var existingItems = {};

            startDate = new Date(data.baseDate);
            totalSeconds = data.nsecs;

            for (var i = 0; i < nEvents; ++i) {
                var d = events[i];

                tf.Transit.PreProcessBusItemData(d);

                var dKey = d.key;
                var existingItem = existingItems[dKey], existingItemData;
                var needCreate = !existingItem;

                if (needCreate) { d.events = []; newData.push(existingItem = existingItems[dKey] = d); }

                var thisEvent = extractHistoryEvent(d);

                if (firstEventMillis == undefined) { firstEventMillis = thisEvent.updatedMillis; }

                existingItem.events.push(thisEvent);
            }
        }
    }
    return { newData: newData, props: { nEvents: nEvents, firstEventMillis: firstEventMillis, totalSeconds: totalSeconds, startDate: startDate } };
};

tf.Transit.BusKL = function (settings) {
    var theThis, KL;

    this.GetKL = function () { return KL; }

    function createKL() {
        KL = new tf.js.KeyedList({
            name: tf.js.GetNonEmptyString(settings.KLName, "transitBusKL"),
            getKeyFromItemData: function (itemData) { return itemData.key; },
            needsUpdateItemData: function (updateObj) { return tf.Transit.IsBusUpdated(updateObj.itemData, updateObj.itemDataSet); },
            filterAddItem: function (itemData) {
                //return true;
                return itemData.trip_id >= 0;
            }
        });
    }

    function initialize() { createKL(); }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.Transit.BusService = function (settings) {
    var theThis;

    function preProcessServiceData(dataArray) {
        var preProcessCall = tf.js.GetFunctionOrNull(settings.preProcessServiceDataItem) ? settings.preProcessServiceDataItem : tf.Transit.PreProcessBusItemData;
        if (tf.js.GetIsArray(dataArray)) {
            var nDataItems = dataArray.length;
            for (var i = 0; i < nDataItems ; ++i) { dataArray[i] = preProcessCall(dataArray[i]); }
        }
        return dataArray;
    }

    function initialize() {
        var serviceName = !!settings.isRT ? "rtbuses" : "bushistory";
        tf.Transit.BackendService.call(theThis, tf.js.ShallowMerge({ serviceName: serviceName, preProcessServiceData: preProcessServiceData }, settings)); }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.Transit.BusService, tf.Transit.BackendService);

tf.Transit.BusPointFeatures = function (settings) {
    var theThis, pointFeatures;

    this.GetFlashBusSelectStyle = function(elapsed01) {
        var color = settings.appContent.GetIsShowingAerial() ? "#fff" : "#c30";
        return getFlashBusStyleAtTime(elapsed01, color);
    }

    function getFlashBusStyleAtTime(elapsed01, color) {
        var radius = 4 + Math.pow(elapsed01, 1 / 2) * 32, opacity = 1 - Math.pow(elapsed01, 2), line_width = (12 - elapsed01);
        var flashStyle = { circle: true, circle_radius: radius, snapToPixel: false, line: true, line_width: line_width, line_color: color, line_opacity: opacity * 100 };
        return flashStyle;
    }

    this.GetPointFeatures = function () { return pointFeatures; }

    this.UpdateForMapType = function (KL) { pointFeatures.RefreshStyles(KL); }

    function getBusStyles() {
        function getBusStyle(keyedFeature, mapFeature) {
            var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
            var isAerial = appContent.GetIsShowingAerial();
            var isHover = mapFeature.GetIsDisplayingInHover();
            var zindex = isHover ? 200 : 100;
            var bottomMargin = 0;
            var iconAnchor = [0.5, 0.5];
            var colorStroke = isHover ? "rgba(255, 0, 0, 0.8)" : (isAerial ? "rgba(0, 0, 0, 0.9)" : "rgba(128, 160, 0, 0.7)");
            var colorFill = isAerial ? "rgba(255, 255, 255, 0.35)" : "rgba(255, 255, 255, 0.15)";
            var imageDim = isHover ? 16 : 14;
            var addImageDimHeight = isHover ? 3 : 2;
            var imageSize = [imageDim, imageDim + addImageDimHeight];
            //var imageUse = appStyles.GetBusImage();
            var imageUse = appStyles.GetBusPNGImage();
            //var lineWidth = isAerial ? (isHover ? 3 : 2) : (isHover ? 2 : 1);
            var lineWidth = isHover ? 2 : 1;
            return appStyles.GetSVGMapMarkerWithFrameStyle(zindex, imageUse, [imageSize[0], imageSize[1]], imageDim + 18, colorStroke, iconAnchor, bottomMargin,
                colorFill, lineWidth);
        }
        return { style: getBusStyle, hoverStyle: getBusStyle };
    }

    function getBusToolTip(notification) {
        var toolTipText = "Bus";
        var mapFeature = notification.mapFeature, item = pointFeatures.GetItemFromMapFeature(mapFeature);
        if (!!item) {
            var data = item.GetData();
            var topLine = data.lineDirection.ab + ' ' + data.headsign;
            var botLine = 'updated ' + tf.js.GetAMPMHourWithSeconds(data.updated);
            toolTipText = tf.TFMap.MapTwoLineSpan(topLine, botLine);
        }
        return toolTipText;
    }

    function onClickBusMapFeature(notification) { if (tf.js.GetFunctionOrNull(settings.onClick)) { settings.onClick(notification); } }

    function initialize() {
        var mapFeatureInItemAttributeName = "busMapFeature";
        var itemInMapFeatureAttributeName = "busItem";
        pointFeatures = new tf.TFMap.KeyedListMapFeatures({
            refreshStyleOnUpdate: false,
            onClick: onClickBusMapFeature,
            mapFeatureInItemAttributeName: mapFeatureInItemAttributeName,
            itemInMapFeatureAttributeName: itemInMapFeatureAttributeName,
            styles: getBusStyles(),
            toolTipProps: { toolTipText: getBusToolTip, keepOnHoverOutTarget: false, offsetX: 24 },
            layer: settings.layer,
            appContent: settings.appContent
        });
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.Transit.BusListItemContentClasses = function (settings) {
    var theThis, cssTag, classNames, layoutChangeListener;

    this.GetClassNames = function () { return classNames; }

    function createCSSClassNames() {
        classNames = {
            itemWrapperClassName: tf.TFMap.CreateClassName(cssTag, "ItemWrapper"),
            itemWrapperSelectedClassName: tf.TFMap.CreateClassName(cssTag, "ItemWrapperSelected"),
            itemContentWrapperClassName: tf.TFMap.CreateClassName(cssTag, "ItemContentWrapper"),
            itemTitleClassName: tf.TFMap.CreateClassName(cssTag, "ItemTitle"),
            itemNameClassName: tf.TFMap.CreateClassName(cssTag, "ItemName"),
            itemDirectionColorClassName: tf.TFMap.CreateClassName(cssTag, "ItemDirectionColor"),
            itemButtonClassName: tf.TFMap.CreateClassName(cssTag, "ItemButton")
        };
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var isSmallScreen = appStyles.GetIsSmallScreen();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var paddingHorTitleInt = 2;//isSmallScreen ? 4 : 8, paddingHorTitlePx = paddingHorTitleInt + 'px';
        var widthDirectionDivInt = isSmallScreen ? 20 : 30;
        var marginLeftTitleDivInt = widthDirectionDivInt + 2;
        var stdTextOverflow = { inherits: [CSSClasses.pointerEventsNone], overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", verticalAlign: "middle" };
        var maxWidthNameInt = isSmallScreen ? 36 : 56;
        var widthTitleSubInt = isSmallScreen ? 108 : 158;

        cssClasses[classNames.itemWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.displayBlock, CSSClasses.overflowHidden],
            padding: "1px", borderRadius: "0px", width: "calc(100% - 2px)"
        };

        cssClasses[classNames.itemWrapperClassName + ":hover"] = { backgroundColor: "rgba(0, 0, 0, 0.1)" };

        cssClasses[classNames.itemWrapperSelectedClassName] = { backgroundColor: "red" };

        cssClasses[classNames.itemWrapperSelectedClassName + ":hover"] = { backgroundColor: "red" };

        cssClasses[classNames.itemContentWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.transparentImageButton, CSSClasses.backgroundColorTransparent,
                CSSClasses.displayBlock, CSSClasses.pointerEventsNone],
            marginLeft: "2px", marginRight: "2px",
            borderRadius: "2px", lineHeight: "0px", width: "calc(100% - 0px)"
        };

        cssClasses[classNames.itemButtonClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.transparentImageButton, CSSClasses.backgroundColorTransparent, CSSClasses.displayBlock,
            CSSClasses.positionAbsolute],
            borderRadius: "0px",
            left: "0px", top: "0px",
            width: "100%",
            height: "100%"
        };

        var displayType = CSSClasses.displayInlineBlock;

        cssClasses[classNames.itemDirectionColorClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.lightTextShadow, stdTextOverflow, displayType],
            //margin: "auto",
            borderRadius: "2px",
            textAlign: "center",
            width: widthDirectionDivInt + "px",
            color: "white",
            borderLeft: "1px solid darkgoldenrod",
            fontSize: ls.itemInListTitletFontSizeInt + 'px',
            lineHeight: ls.itemInListTitleLineHeightInt + 'px'
        };

        cssClasses[classNames.itemTitleClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, displayType, CSSClasses.darkTextShadow, stdTextOverflow],
            textAlign: "left",
            paddingLeft: "4px",
            //margin: "auto",
            width: "calc(100% - " + (widthTitleSubInt) + "px)",
            color: "#444",
            background: "white",
            fontSize: ls.itemInListTitletFontSizeInt + 'px',
            lineHeight: ls.itemInListTitleLineHeightInt + 'px'
        };

        cssClasses[classNames.itemNameClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, displayType, CSSClasses.darkTextShadow, stdTextOverflow],
            borderLeft: "1px solid #ebebeb",
            textAlign: "center",
            paddingLeft: "2px",
            fontWeigth: "500",
            //margin: "auto",
            width: maxWidthNameInt + 'px',
            color: "black",
            background: "white",
            fontSize: (ls.itemInListTitletFontSizeInt * 0.8) + 'px',
            lineHeight: ls.itemInListTitleLineHeightInt + 'px'
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    function initialize() {
        cssTag = 'busListItemContent';
        createCSSClassNames();
        registerCSSClasses();
        layoutChangeListener = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.Transit.BusListContent = function (settings) {
    var theThis, keyedListContent, selectedContent;

    this.OnKLChange = function (notification) {
        keyedListContent.OnKLChange(notification);
        if (!!selectedContent) {
            if (!keyedListContent.GetItemFromContent(selectedContent)) {
                selectedContent = undefined;
                //console.log('bus kl content: deselected deleted content');
            }
        }
    }

    this.GetSelectedContent = function () { return selectedContent; }

    this.SetSelectedContent = function (newSelectedContent) {
        if (newSelectedContent != selectedContent) {
            if (!!selectedContent) { setSelectedStyle(selectedContent, false); }
            if (!!(selectedContent = newSelectedContent)) { setSelectedStyle(selectedContent, true); }
        }
    }

    this.EnsureContentVisible = function (content) {
        if (!!content) {
            tf.dom.ScrollVerticallyToEnsureVisible(settings.contentWrapper, content.wrapper, settings.customAppContentI.getVerListWithFadePaddingTopBotInt());
        }
    }

    this.GetKeyedListContent = function () { return keyedListContent; }

    function onItemClick(notification) {
        var clickCB = tf.js.GetFunctionOrNull(settings.onItemClick);
        if (!!clickCB) {
            var button = !!notification ? notification.domObj : undefined;
            if (!!button) {
                var content = button.content;
                var item = keyedListContent.GetItemFromContent(content);
                if (!!item) { clickCB({ sender: theThis, item: item }); }
            }
        }
    }

    function updateContentForItem(item) {
        var content = keyedListContent.GetContentFromItem(item);
        if (!!content) {
            var isRT = settings.isRT;
            var itemData = item.GetData();
            //content.wrapper.GetHTMLElement().innerHTML = itemData.lineDirection.ab + ' ' + itemData.headsign + ' updated ' + tf.js.GetAMPMHourWithSeconds(itemData.updated);
            var routeColor = "#" + itemData.route_color;
            var nameStr = itemData.name;
            var titleStr = itemData.headsign;
            var titleE = content.title.GetHTMLElement(), titleES = titleE.style;
            var nameE = content.name.GetHTMLElement();
            var updatedE = content.updated.GetHTMLElement();
            titleE.innerHTML = titleStr /*+ " " + titleStr*/;
            nameE.innerHTML = nameStr;
            updatedE.innerHTML = isRT ? tf.js.GetAMPMHourWithMinutes(itemData.updated) : itemData.events.length;
            //titleES.borderBottom = "1px solid " + routeColor;
            var dcE = content.directionColor.GetHTMLElement(), dcES = dcE.style;
            dcES.backgroundColor = routeColor;
            dcE.innerHTML = itemData.lineDirection.ab;
        }
    }

    function setSelectedStyle(content, isSelected) {
        if (isSelected) { tf.dom.AddCSSClass(content.wrapper, settings.busListItemClassNames.itemWrapperSelectedClassName); }
        else { tf.dom.RemoveCSSClass(content.wrapper, settings.busListItemClassNames.itemWrapperSelectedClassName); }
    }

    function prepareSpareContent(content) { setSelectedStyle(content, false); return content; }

    function createNewContent() {
        var isRT = settings.isRT;
        var wrapper = new tf.dom.Div({ cssClass: settings.busListItemClassNames.itemWrapperClassName });
        var contentWrapper = new tf.dom.Div({ cssClass: settings.busListItemClassNames.itemContentWrapperClassName });
        var button = new tf.dom.Button({ cssClass: settings.busListItemClassNames.itemButtonClassName, onClick: onItemClick });
        var title = new tf.dom.Div({ cssClass: settings.busListItemClassNames.itemTitleClassName });
        var name = new tf.dom.Div({ cssClass: settings.busListItemClassNames.itemNameClassName });
        var updated = new tf.dom.Div({ cssClass: settings.busListItemClassNames.itemNameClassName });
        var directionColor = new tf.dom.Div({ cssClass: settings.busListItemClassNames.itemDirectionColorClassName });

        contentWrapper.AddContent(directionColor, title, name, updated);
        wrapper.AddContent(button, contentWrapper);

        directionColor.GetHTMLElement().title = 'route direction';
        title.GetHTMLElement().title = 'bus headsign';
        updated.GetHTMLElement().title = isRT ? 'last updated' : 'number of events';
        name.GetHTMLElement().title = 'bus name';

        var content = { wrapper: wrapper, button: button, contentWrapper: contentWrapper, title: title, directionColor: directionColor, name: name, updated: updated };

        button.content = content;

        return content;
    }

    function createKLContent() {
        var contentInItemAttributeName = tf.js.GetNonEmptyString(settings.contentInItemAttributeName, "busContent");
        var itemInContentAttributeName = tf.js.GetNonEmptyString(settings.itemInContentAttributeName, "busItem");
        keyedListContent = new tf.TFMap.KeyedListContent({
            KL: settings.KL, wrapper: settings.wrapper, contentWrapper: settings.contentWrapper,
            contentWrapperDisplayVisibleVerb: settings.busListClasses.GetContentWrapperDisplayVisibleVerb(),
            contentInItemAttributeName: contentInItemAttributeName, itemInContentAttributeName: itemInContentAttributeName,
            createNewContent: createNewContent, prepareSpareContent: prepareSpareContent, updateContentForItem: updateContentForItem, compareContent: settings.compareContent
        });
    }

    function initialize() {
        createKLContent();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.Transit.BusListClasses = function (settings) {
    var theThis, cssTag, classNames, layoutChangeListener;

    this.GetClassNames = function () { return classNames; }

    this.GetContentWrapperDisplayVisibleVerb = function () { return "block"; }

    this.CreateToolBarListFooter = function(forHistory) {
        var ls = tf.TFMap.LayoutSettings;
        var customAppContentI = settings.customAppContentI;
        var customAppClassNames = customAppContentI.getClassNames();
        var wrapper = customAppContentI.createNonScrollVariableHeightContent(customAppClassNames.minHeightPaneClassName);
        var toolBar = customAppContentI.createMainToolBar();
        var footer = customAppContentI.createFooter();
        var scrollWrapperAndContent = customAppContentI.createVertScrollWrapperAndContentWithFade();
        var replay = !!forHistory ? customAppContentI.createToolBar(undefined, classNames.rangeClassName) : undefined;
        wrapper.AddContent(toolBar.wrapper);
        if (!!replay) {
            tf.dom.AddCSSClass(replay.wrapper, customAppContentI.getClassNames().borderTopClassName);
            wrapper.AddContent(replay.wrapper);
        }
        wrapper.AddContent(scrollWrapperAndContent.scrollWrapper, footer.wrapper);
        return {
            wrapper: wrapper, toolBar: toolBar, replay: replay,
            scrollWrapper: scrollWrapperAndContent.scrollWrapper, scrollContent: scrollWrapperAndContent.scrollContent, footer: footer
        };
    }

    this.SetListVisible = function (busTLF, isVisible) {
        if (!!busTLF) {
            var verbVisible = 'flex', verbHidden = 'none';
            busTLF.wrapper.GetHTMLElement().style.display = !!isVisible ? verbVisible : verbHidden;
        }
    }

    this.CreateList = function(listSettings) {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var customAppContentI = settings.customAppContentI;
        var isRT = listSettings.isRT;
        var ls = tf.TFMap.LayoutSettings;
        var delayMillis = 0;
        var toolTipClass = "*start";
        var toolTipArrowClass = "top";
        var buttonSettings = {
            offsetY: 0, onClick: undefined, onHover: undefined, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        //isRT = false;

        var busTLF = theThis.CreateToolBarListFooter(!isRT);

        var toolBarButtonClassNames = customAppContentI.getToolBarButtonClasses();
        var toolBarSpanClassNames = customAppContentI.getToolBarSpanClasses();
        var mainToolBarButtonClassNames = customAppContentI.getMainToolBarButtonClasses();
        var mainToolBarSpanClassNames = customAppContentI.getMainToolBarSpanClasses();

        busTLF.busTitleButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
            wrapper: busTLF.toolBar.wrapper,
            onClick: listSettings.onClickBusTitleButton
        }), appStyles.GetBusSVG(), mainToolBarButtonClassNames, listSettings.busTitleButtonToolTipText, undefined, "busButton");

        busTLF.busListTitleSpan = document.createElement('span');
        busTLF.busListTitleSpan.className = mainToolBarSpanClassNames;

        busTLF.busLoadingDiv = new tf.dom.Div({ cssClass: classNames.loadingDivClassName });

        busTLF.toolBar.content.AddContent(busTLF.busTitleButton.GetButton(), busTLF.busListTitleSpan, busTLF.busLoadingDiv);

        if (!isRT) {
            busTLF.busTitleRefreshButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
                toolTipClass: "*start",
                wrapper: busTLF.toolBar.wrapper,
                onClick: listSettings.onClickRefreshButton
            }), appStyles.GetRefreshSVG(), mainToolBarButtonClassNames, "Refresh list", undefined, "refreshButton");
            busTLF.toolBar.content.AddContent(busTLF.busTitleRefreshButton.GetButton());
            busTLF.replaySlider = document.createElement('input');
            busTLF.replaySlider.type = 'range';
            busTLF.replay.content.AddContent(busTLF.replaySlider);

            var playerSVGs = appStyles.GetPlayerSVGs();

            busTLF.replayStopButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
                wrapper: busTLF.replay.wrapper,
                onClick: listSettings.onClickReplayStop
            }), playerSVGs.stop, toolBarButtonClassNames, listSettings.replayStopToolTipText, undefined, "playButton");

            busTLF.replayPlayButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
                wrapper: busTLF.replay.wrapper,
                onClick: listSettings.onClickReplayPlay
            }), playerSVGs.play, toolBarButtonClassNames, listSettings.replayPlayToolTipText, undefined, "playButton");

            busTLF.replayLabelSpan = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
                wrapper: busTLF.replay.wrapper,
                onClick: listSettings.onClickReplaySpan
            }), "", toolBarButtonClassNames + " " + classNames.textAlignCenterClassName,
            listSettings.replaySpanToolTipText, undefined, "labelButton");

            var replayLabelSpanE = busTLF.replayLabelSpan.GetButton(), replayLabelSpanES = replayLabelSpanE.style;

            replayLabelSpanES.display = 'block';
            replayLabelSpanES.width = "50%";

            busTLF.replaySpeedButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
                wrapper: busTLF.replay.wrapper,
                onClick: listSettings.onClickReplaySpeed
            }), "100x", toolBarButtonClassNames + " " + classNames.textAlignCenterClassName, listSettings.replaySpeedToolTipText, undefined, "speedButton");

            busTLF.replayAutoRepeatButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
                wrapper: busTLF.replay.wrapper,
                onClick: listSettings.onClickReplayAutoRepeat
            }), playerSVGs.noAutoRepeat, toolBarButtonClassNames, listSettings.replayAutoRepeatToolTipText, undefined, "autoRepeatButton");

            busTLF.replay.content.AddContent(busTLF.replayStopButton.GetButton(), busTLF.replayPlayButton.GetButton(), busTLF.replayLabelSpan.GetButton(),
                busTLF.replaySpeedButton.GetButton(), busTLF.replayAutoRepeatButton.GetButton());
        }

        customAppContentI.getContentWrapper().AddContent(busTLF.wrapper);

        return new tf.Transit.BusList(tf.js.ShallowMerge(listSettings, {
            busListClasses: theThis,
            appContent: appContent,
            customAppContentI: customAppContentI,
            busTLF: busTLF
        }));
    }

    function createCSSClassNames() {
        classNames = {
            loadingDivClassName: tf.TFMap.CreateClassName(cssTag, "LoadingDiv"),
            textAlignCenterClassName: tf.TFMap.CreateClassName(cssTag, "TextAlign"),
            rangeClassName: tf.TFMap.CreateClassName(cssTag, "Range")
        };
    }

    function createCSSClasses() {
        var customAppContentI = settings.customAppContentI;
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var isSmallScreen = appStyles.GetIsSmallScreen();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;

        var mainToolBarButtonDimInt = customAppContentI.getMainToolBarButtonDimInt();
        var mainToolBarButtonDimPx = mainToolBarButtonDimInt + 'px';

        cssClasses[classNames.loadingDivClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.transparentImageButton, CSSClasses.backgroundColorTransparent,
                CSSClasses.displayNone, CSSClasses.loadingBackgroundTransparent, CSSClasses.cursorDefault],
            height: mainToolBarButtonDimPx,
            width: mainToolBarButtonDimPx,
            margin: "auto"
        };

        var textMarginHorInt = 4;
        var textMarginHorPx = textMarginHorInt + 'px';

        cssClasses[classNames.textAlignCenterClassName] = {
            marginLeft: textMarginHorPx,
            marginRight: textMarginHorPx,
            width: 'initial',
            textAlign: "center",
            justifyContent: "center"
        };

        cssClasses[classNames.textAlignCenterClassName + ":hover"] = { textDecoration: "underline" };

        var rangeHeightInt = isSmallScreen ? 20 : 30, thumbBorderInt = 1, trackHeightInt = 4, thumbWidthInt = 4, thumbHeightInt = rangeHeightInt / 2;

        tf.styles.AddRangeClasses({
            cssClasses: cssClasses,
            className: classNames.rangeClassName,
            thumbHeightInt: thumbHeightInt,
            thumbBorderInt: thumbBorderInt,
            rangeSettings: {
                inherits: [CSSClasses.noMarginNoBorderNoPadding],
                width: "100%", height: rangeHeightInt + "px", background: "transparent", cursor: "pointer",
                marginLeft: "4px", marginRight: "4px"
            },
            trackSettings: {
                inherits: [CSSClasses.noMarginNoBorderNoPadding],
                width: "100%", height: trackHeightInt + "px", cursor: "pointer", background: ls.backgroundLivelyColor,
                borderColor: "transparent", color: "transparent"
            },
            thumbSettings: {
                inherits: [CSSClasses.noMarginNoBorderNoPadding],
                border: thumbBorderInt + "px solid " + ls.darkTextColor,
                height: thumbHeightInt + "px", width: thumbWidthInt + "px",
                borderRadius: "0px", background: "#ffffff", cursor: "pointer",
                boxShadow: "0px 0px 1px " + ls.backgroundLivelyColor + ", 0px 0px 1px " + ls.backgroundLivelyColor
            }
        });

        cssClasses[classNames.rangeClassName] = tf.js.ShallowMerge(cssClasses[classNames.rangeClassName], { overflow: "hidden" });

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    function initialize() {
        cssTag = 'busListClasses';
        createCSSClassNames();
        registerCSSClasses();
        layoutChangeListener = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.Transit.BusList = function (settings) {
    var theThis, isVisible, listContent;

    this.GetBusTLF = function () { return settings.busTLF; }
    this.GetListContent = function () { return listContent; }

    this.OnServiceRefresh = function (notification) {
        var isRefreshing = notification.sender.GetIsRefreshing();
        var buttonSVG = settings.busTLF.busTitleButton.GetButton().firstChild;
        var loadingDisplayVerb;
        var isRT = settings.isRT;
        if (isRefreshing) {
            loadingDisplayVerb = 'block';
            if (!isRT) {
                settings.busTLF.replay.wrapper.GetHTMLElement().style.display = "none";
                updateFooterText("Retrieving most recent transit activity...");
            }
        }
        else {
            loadingDisplayVerb = 'none';
        }
        settings.busTLF.busLoadingDiv.GetHTMLElement().style.display = loadingDisplayVerb;
        if (!isRT) {
            settings.busTLF.busTitleRefreshButton.GetButton().style.display = isRefreshing ? "none" : "block";
        }
    }

    this.OnKLChange = function (notification) {
        listContent.OnKLChange(notification);
        updateFooterTotals();
    }

    function updateFooterTotals() {
        if (settings.isRT) {
            updateFooter(" currently", "");
        }
        else {
            var replayVisibilityVerb = settings.getHistoryNEvents() > 0 ? 'block' : 'none';
            settings.busTLF.replay.wrapper.GetHTMLElement().style.display = replayVisibilityVerb;
            updateFooter("", " during the past hour");
        }
    }

    this.SetVisible = function (newIsVisible) {
        if (isVisible != (newIsVisible = !!newIsVisible)) {
            isVisible = newIsVisible;
            settings.busListClasses.SetListVisible(settings.busTLF, isVisible);
        }
    }

    this.GetIsVisible = function () { return isVisible; }

    this.GetListContent = function () { return listContent; }

    function updateFooterText(theText) { settings.busTLF.footer.content.GetHTMLElement().innerHTML = theText; }

    function updateFooter(prefixStr, suffixStr) {
        var footerStr;
        var count = settings.KL.GetItemCountAfterUpdate();
        if (count == 0) { footerStr = "No bus activity found" }
        else {
            var busBuses = count == 1 ? "bus" : "buses";
            footerStr = count + " " + busBuses + prefixStr + " in circulation" + suffixStr;
        }
        updateFooterText(footerStr);
    }

    function initialize() {
        var busTLF = settings.busTLF;
        theThis.SetVisible(!!settings.isVisible);
        var titleStr = settings.isRT ? "Real time activity" : "Recent activity";
        busTLF.busListTitleSpan.innerHTML = titleStr;
        listContent = new tf.Transit.BusListContent(tf.js.ShallowMerge(settings, {
            wrapper: busTLF.scrollWrapper, contentWrapper: busTLF.scrollContent
        }));
        if (settings.isRT) { updateFooterTotals(); }
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.Transit.BusServiceFeaturesContent = function (settings) {
    var theThis, KL, service, layer, busPointFeatures, busList, isVisible, serviceWasRefreshed, serviceWasLoaded, nextAvailableZIndex, historyReplayProps;
    var minIntervalPositionMillis, lastTimePositionedAt;
    var postComposeListener;
    var historyTimer;
    var historyReplayAutoRepeats, historyReplayCurrentSpeed;
    var useLongTimeStampFormat;
    var inPauseWhenVisible;
    var allEventDispatchers, updateNameEvent;
    var klListener;

    this.GetKL = function () { return KL.GetKL(); }

    this.GetLayer = function () { return layer; }

    this.AddUpdateListener = function (callBack) { allEventDispatchers.AddListener(updateNameEvent, callBack); }

    this.RefreshNow = function () {
        //var busTLF = getBusTLF();
        //firstEventMillis: firstEventMillis, totalSeconds: totalSeconds
        //busTLF.replaySlider.value = 100;
        service.RefreshNow();
    }

    this.GetNextAvailableZIndex = function () { return nextAvailableZIndex; }

    this.UpdateForMapType = function () { if (!!busPointFeatures) { busPointFeatures.UpdateForMapType(KL.GetKL()); } }

    this.GetIsVisible = function () { return isVisible; }

    this.SetVisible = function (newIsVisible) {
        if (isVisible != (newIsVisible = !!newIsVisible)) {
            isVisible = newIsVisible;
            layer.SetVisible(isVisible);
            busList.SetVisible(isVisible);
            if (settings.isRT) {
                service.SetAutoRefreshes(isVisible);
            }
            else {
                if (isVisible) {
                    if (inPauseWhenVisible != undefined) {
                        historyTimer.Pause(inPauseWhenVisible);
                    }
                    forceMapRender();
                    if (!serviceWasRefreshed) { serviceWasRefreshed = true; service.RefreshNow(); }
                    //else { theThis.ClearHistory(); }
                }
                else {
                    inPauseWhenVisible = historyTimer.GetIsPaused();
                    historyTimer.Pause(true);
                }
            }
        }
    }

    this.ClearHistory = function () { historyReplayProps = undefined; KL.GetKL().UpdateFromNewData([]); }

    this.PositionAtTimeMillis = function (atTimeMillis) {
        var changed = false;
        var KLKL = KL.GetKL(), count = KLKL.GetItemCount();
        if (count > 0) {
            if (lastTimePositionedAt == undefined || Math.abs(lastTimePositionedAt - atTimeMillis) >= minIntervalPositionMillis) {
                var items = KLKL.GetKeyedItemList();
                lastTimePositionedAt = atTimeMillis;
                for (var i in items) { var item = items[i]; positionItemAtTime(item, atTimeMillis); }
                //console.log('positionedAtTime');
                busPointFeatures.GetPointFeatures().RefreshPositions(KL.GetKL());
                changed = true;
            }
        }
        if (changed) { notifyUpdate(); }
        return changed;
    }

    this.GetHistoryStartDate = function () { return !!historyReplayProps ? historyReplayProps.startDate : undefined; }

    this.GetHistoryNEvents = function () { return !!historyReplayProps ? historyReplayProps.nEvents : 0; }

    function forceMapRender() {
        settings.appContent.GetMap().Render();
    }

    function positionItemAtTime(item, atTimeMillis) {
        var isExcluded = false;
        var itemData = item.GetData(), events = itemData.events;
        var len = events.length, coords, direction_rad, posSeg01 = 0, offsetHMS, nextStopIndex, updated;
        var startDate = theThis.GetHistoryStartDate();

        if (!!startDate) { atTimeMillis += startDate.getTime(); }

        var searchIndex = tf.js.BinarySearch(events, atTimeMillis, function (key, item) { return key - item.updatedMillis; });
        var exactIndex;

        if (searchIndex < 0) {
            var insertIndex = -(searchIndex + 1);
            if (insertIndex == 0 || insertIndex >= len) { isExcluded = true; }

            if (insertIndex == 0) { exactIndex = 0; }
            else if (insertIndex >= len - 1) { exactIndex = len - 1; posSeg01 = 1; }
            else {
                var prevIndex = insertIndex - 1, prevEntry = events[prevIndex], prevMillis = prevEntry.updatedMillis;
                var nextIndex = insertIndex, nextEntry = events[nextIndex], nextMillis = nextEntry.updatedMillis;
                var diffMillis = nextMillis - prevMillis;
                var dMilis01 = diffMillis > 0 ? (atTimeMillis - prevMillis) / diffMillis : 0;

                posSeg01 = dMilis01;

                nextStopIndex = prevEntry.next_stop_index;

                if (dMilis01 > 0) {

                    var prevCoords = prevEntry.coords;
                    var prevHeading = prevEntry.direction_rad;
                    var prevHMS = prevEntry.offset_hms;

                    var nextCoords = nextEntry.coords;
                    var nextHeading = nextEntry.direction_rad;
                    var nextHMS = nextEntry.offset_hms;

                    var dlon = nextCoords[0] - prevCoords[0];
                    var dlat = nextCoords[1] - prevCoords[1];
                    coords = [prevCoords[0] + dlon * dMilis01, prevCoords[1] + dlat * dMilis01];

                    var deltaRotation = tf.units.GetShortestArcBetweenAngles(prevHeading, nextHeading)
                    direction_rad = prevHeading + deltaRotation * dMilis01;

                    if (prevHMS != undefined && nextHMS != undefined) {
                        var dHMS = nextHMS - prevHMS;
                        offsetHMS = Math.floor(prevHMS + dMilis01 * dHMS);
                    }
                    else {
                        offsetHMS = 0;
                    }

                    updated = prevEntry.updated;
                }
                else {
                    exactIndex = prevIndex;
                }
            }
        }
        else { exactIndex = searchIndex; }

        //if (isExcluded) { console.log('excluded'); } else { console.log("included"); }

        if (exactIndex != undefined) {
            var exactEntry = events[exactIndex];
            coords = exactEntry.coords; direction_rad = exactEntry.direction_rad; offsetHMS = exactEntry.offset_hms;
            nextStopIndex = exactEntry.next_stop_index;
            updated = exactEntry.updated;
        }

        if (isNaN(offsetHMS) && offsetHMS != undefined) { isExcluded = true; }

        itemData.isExcluded = isExcluded;
        itemData.coords = coords;
        itemData.direction_rad = direction_rad;
        itemData.posSeg01 = posSeg01;
        itemData.offset_hms = offsetHMS;
        itemData.next_stop_index = nextStopIndex;
        itemData.updated = updated;

        //tf.Transit.SetBusItemDataLabels(itemData);

        return isExcluded;
    }

    function createLayer() {
        nextAvailableZIndex = settings.layerZIndex;
        var layerSettings = { name: settings.layerName, isVisible: true, isHidden: true, useClusters: false, zIndex: nextAvailableZIndex++ };
        var use3D = false;
        //var use3D = true;
        layer = settings.appContent.CreateCustomMapLayer(layerSettings, use3D);
    }

    function onKLChange(notification) {
        busList.OnKLChange(notification);
        busPointFeatures.GetPointFeatures().OnKLChange(notification);
        if (!settings.isRT) {
            lastTimePositionedAt = undefined;
            theThis.PositionAtTimeMillis(0);
        }
    }

    function getSelectedMapFeature() { return busPointFeatures.GetPointFeatures().GetSelectedMapFeature(); }
    function setSelectedMapFeature(mapFeature) { busPointFeatures.GetPointFeatures().SetSelectedMapFeature(mapFeature); }

    function getMapFeatureFromItem(item) { return busPointFeatures.GetPointFeatures().GetMapFeatureFromItem(item); }
    function getItemFromMapFeature(mapFeature) { return busPointFeatures.GetPointFeatures().GetItemFromMapFeature(mapFeature); }

    function getSelectedContent() { return busList.GetListContent().GetSelectedContent(); }
    function setSelectedContent(content) { busList.GetListContent().SetSelectedContent(content); }

    function getContentFromItem(item) { return busList.GetListContent().GetKeyedListContent().GetContentFromItem(item); }
    function getItemFromContent(content) { return busList.GetListContent().GetKeyedListContent().GetItemFromContent(content); }

    function onListBusItemClick(notification) {
        var mapFeature = getMapFeatureFromItem(notification.item);
        if (!!mapFeature) {
            var coords = mapFeature.GetPointCoords();
            settings.appContent.MakeSureMapCoordsAreVisible(coords, 150);
            if (getSelectedMapFeature() != mapFeature) {
                setSelectedMapFeature(mapFeature);
                new tf.map.PointsStyleAnimator({ maps: [settings.appContent.GetMap()], pointProviders: [coords], duration: 1000, getStyle: busPointFeatures.GetFlashBusSelectStyle });
            }
            else { setSelectedMapFeature(undefined); }
        }
        var content = getContentFromItem(notification.item);
        if (!!content) {
            if (getSelectedContent() != content) { setSelectedContent(content); }
            else { setSelectedContent(undefined); }
        }
    }

    function onBusMapFeatureClick(notification) {
        if (getSelectedMapFeature() != notification.mapFeature) {
            var item = getItemFromMapFeature(notification.mapFeature);
            if (!!item) { setSelectedMapFeature(notification.mapFeature); }
        }
        else { setSelectedMapFeature(undefined); }

        var item = getItemFromMapFeature(notification.mapFeature);

        if (!!item) {
            var content = getContentFromItem(item);
            if (!!content) {
                if (getSelectedContent() != content) {
                    setSelectedContent(content);
                    busList.GetListContent().EnsureContentVisible(content);
                }
                else { setSelectedContent(undefined); }
            }
        }
    }

    function hasHistoryEvents() { return theThis.GetHistoryNEvents() > 0; }

    function onMapPostCompose(notification) {
        //console.log('bus post compose');
        if (isVisible && !settings.isRT) {
            if (theThis.GetHistoryNEvents() > 0) {
                if (!historyTimer.GetIsPaused()) {
                    var nextTimeMillis = historyTimer.GetElapsedTime();
                    if (theThis.PositionAtTimeMillis(nextTimeMillis)) { setHistoryReplayPosMillis(nextTimeMillis); }
                    notification.continueAnimation();
                }
            }
        }
    }

    function preProcessHistoryBusData(data) {
        //firstEventMillis: firstEventMillis, totalSeconds: totalSeconds
        var results = tf.Transit.PreProcessHistoryBusData(data);
        var busTLF = getBusTLF();
        historyReplayProps = results.props;
        var totalMillis = historyReplayProps.totalSeconds * 1000;
        busTLF.replaySlider.min = 0;
        busTLF.replaySlider.max = totalMillis;
        //busTLF.replaySlider.value = 0;
        historyTimer.SetLimit(totalMillis);
        setHistoryReplayPosMillis(0);
        if (!serviceWasLoaded) { serviceWasLoaded = true; if (theThis.GetHistoryNEvents() > 0) { setHistoryPlayPaused(false); } }
        return results.newData;
    }

    function setHistoryPlayPaused(isPaused) {
        historyTimer.Pause(isPaused);
        updatePlayButton(isPaused);
    }

    function onHistorySliderChange(evt, pos) {
        //console.log(pos);
        var posMillis = parseInt(pos.current, 10);
        theThis.PositionAtTimeMillis(posMillis);
        setHistoryReplayPosMillis(posMillis, false);
    }

    function onServiceRefresh(notification) {
        var isRefreshing = notification.sender.GetIsRefreshing();
        if (isRefreshing) {
            if (!settings.isRT) {
                historyReplayProps = undefined;
                stopAnimation();
            }
        }
        busList.OnServiceRefresh(notification);
    }

    function stopAnimation() {
        setHistoryPlayPaused(true);
        setHistoryReplayPosMillis(0);
    }

    function getBusTLF() { return busList.GetBusTLF(); }

    function updatePlayButton(isPaused) {
        var busTLF = getBusTLF();
        if (!!busTLF.replayPlayButton) {
            var playerSVGs = settings.appContent.GetAppStyles().GetPlayerSVGs();
            var svgUse = isPaused ? playerSVGs.play : playerSVGs.pause;
            var button = busTLF.replayPlayButton.GetButton();
            button.innerHTML = svgUse;
        }
    }

    function onClickReplayPlay() { if (hasHistoryEvents()) { if (historyTimer.GetIsPaused()) { setHistoryPlayPaused(false); forceMapRender(); } else { setHistoryPlayPaused(true); } } }
    function replayPlayToolTipText() { return historyTimer.GetIsPaused() ? "resume replay" : "pause replay"; }

    function onClickReplayStop() { if (hasHistoryEvents()) { stopAnimation(); } }
    function replayStopToolTipText() { return "stop replay"; }

    function setHistoryAutoRepeats(newHistoryAutoRepeats) {
        if (historyReplayAutoRepeats != (newHistoryAutoRepeats = !!newHistoryAutoRepeats)) {
            historyReplayAutoRepeats = newHistoryAutoRepeats;
            if (!settings.isRT) {
                var busTLF = getBusTLF();
                if (!!historyTimer) { historyTimer.SetWrap(historyReplayAutoRepeats); }
                var playerSVGs = settings.appContent.GetAppStyles().GetPlayerSVGs();
                var svgUse = historyReplayAutoRepeats ? playerSVGs.autoRepeat : playerSVGs.noAutoRepeat;
                var button = busTLF.replayAutoRepeatButton.GetButton();
                button.innerHTML = svgUse;
            }
        }
    }

    function setHistoryReplayPosMillis(newPosMillis, skipSetRange) {
        if (!settings.isRT) {
            var busTLF = getBusTLF();
            var timeStampStr;
            var newCurrentTime = new Date();
            updateReplayTimeStamp(newPosMillis);
            historyTimer.SetElapsedTime(newPosMillis);
            if (!skipSetRange) { busTLF.replaySlider.value = newPosMillis; }
        }
    }

    function setHistoryReplaySpeed(newSpeed) {
        if (historyReplayCurrentSpeed != newSpeed) {
            historyReplayCurrentSpeed = newSpeed;
            if (!settings.isRT) {
                var busTLF = getBusTLF();
                if (!!historyTimer) { historyTimer.SetSpeed(historyReplayCurrentSpeed); }
                var button = busTLF.replaySpeedButton.GetButton();
                button.innerHTML = historyReplayCurrentSpeed + 'x';
            }
        }
    }

    function updateReplayTimeStamp(newPosMillis) {
        if (!settings.isRT) {
            var timeStampStr;
            if (historyReplayProps != undefined) {
                var newCurrentTime = new Date();
                newCurrentTime.setTime(historyReplayProps.startDate.getTime() + newPosMillis);
                if (useLongTimeStampFormat) {
                    timeStampStr = tf.js.GetTimeStampFromDate(newCurrentTime);
                    timeStampStr = timeStampStr.substring(0, 19);
                }
                else { timeStampStr = tf.js.GetAMPMHourWithSeconds(newCurrentTime); }
            }
            else { timeStampStr = ""; }
            getBusTLF().replayLabelSpan.GetButton().innerHTML = timeStampStr;
        }
    }

    function onClickReplaySpeed() {
        var newSpeed = historyReplayCurrentSpeed * 10;;
        if (newSpeed > 100) { newSpeed = 1; }
        setHistoryReplaySpeed(newSpeed);
    }

    function replaySpeedToolTipText() {
        var topLine = "replaying at " + (historyReplayCurrentSpeed == 1 ? "normal" : historyReplayCurrentSpeed + " x normal") + " speed";
        var botLine = "click to change";
        return tf.TFMap.MapTwoLineSpan(topLine, botLine);
    }

    function onClickReplayAutoRepeat() { setHistoryAutoRepeats(!historyReplayAutoRepeats); }

    function replayAutoRepeatToolTipText() {
        var topLine = "replay auto repeat is <u>" + (historyReplayAutoRepeats ? "on" : "off") + "</u>";
        var botLine = "switch it " + (historyReplayAutoRepeats ? "off" : "on");
        return tf.TFMap.MapTwoLineSpan(topLine, botLine);
    }

    function onClickReplaySpan() {
        useLongTimeStampFormat = !useLongTimeStampFormat;
        updateReplayTimeStamp(lastTimePositionedAt);
    }

    function replaySpanToolTipText() { return "change time stamp format"; }

    function createComponents() {
        var isRT = settings.isRT;
        var settingsIsVisible = !!settings.isVisible;
        KL = new tf.Transit.BusKL({ KLName: (isRT ? "rtBusKL" : "histBusKL") });
        var KLKL = KL.GetKL();
        busPointFeatures = new tf.Transit.BusPointFeatures({ layer: layer, appContent: settings.appContent, onClick: onBusMapFeatureClick });
        var busListContentSettings = {
            onClickReplayPlay: onClickReplayPlay,
            replayPlayToolTipText: replayPlayToolTipText,
            onClickReplayStop: onClickReplayStop,
            replayStopToolTipText: replayStopToolTipText,
            onClickReplaySpeed: onClickReplaySpeed,
            replaySpeedToolTipText: replaySpeedToolTipText,
            onClickReplayAutoRepeat: onClickReplayAutoRepeat,
            replayAutoRepeatToolTipText: replayAutoRepeatToolTipText,
            onClickReplaySpan: onClickReplaySpan,
            replaySpanToolTipText: replaySpanToolTipText,
            getHistoryNEvents: theThis.GetHistoryNEvents,
            onClickRefreshButton: settings.onClickRefreshButton,
            onClickBusTitleButton: settings.onClickBusTitleButton,
            busTitleButtonToolTipText: settings.busTitleButtonToolTipText,
            isVisible: settingsIsVisible,
            busListClasses: settings.busListClasses,
            busListItemClassNames: settings.busListItemContentClasses.GetClassNames(),
            isRT: isRT,
            compareContent: tf.Transit.CompareBuses,
            KL: KLKL,
            onItemClick: onListBusItemClick
        };
        busList = settings.busListClasses.CreateList(busListContentSettings);
        var busTLF = getBusTLF();
        klListener = KLKL.AddAggregateListener(onKLChange);
        var busServiceSettings = {
            isRT: isRT,
            autoRefreshes: isRT,
            clearBeforeRefresh: !isRT,
            refreshTimeoutMillis: 10000,
            KL: KLKL,
            transitServerURL: settings.transitServerURL,
            onPreRefresh: onServiceRefresh,
            onPostRefresh: onServiceRefresh
        };
        if (!isRT) { busServiceSettings.preProcessServiceData = preProcessHistoryBusData; }
        service = new tf.Transit.BusService(busServiceSettings);
        if (!isRT) {
            postComposeListener = settings.appContent.GetMap().AddListener(tf.consts.mapPostComposeEvent, onMapPostCompose);
            tf.dom.OnRangeChange(busTLF.replaySlider, onHistorySliderChange);
            historyTimer = new tf.helpers.Timer();
            //historyTimer.Pause(true);
            historyTimer.SetLimit(1);
            setHistoryReplayPosMillis(0);
            updatePlayButton(true);
            setHistoryAutoRepeats(true);
            setHistoryReplaySpeed(100);
        }
        theThis.SetVisible(settingsIsVisible);
    };

    function notify(eventName, props) { allEventDispatchers.Notify(eventName, tf.js.ShallowMerge(props, { sender: theThis, eventName: eventName, isRT: settings.isRT })); }
    function notifyUpdate(props) { return notify(updateNameEvent, props); }

    function initialize() {
        allEventDispatchers = new tf.events.MultiEventNotifier({ eventNames: [updateNameEvent = "upd"] });
        minIntervalPositionMillis = 50;
        useLongTimeStampFormat = false;
        createLayer();
        createComponents();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.Transit.BusRTAndHistoryContent = function (settings) {
    var theThis, busListClasses, busListItemContentClasses, showingRT, rtContent, historyContent, nextAvailableZIndex;
    var allEventDispatchers, changeListEventName;

    this.GetRTContent = function () { return rtContent; }
    this.GetHistoryContent = function () { return historyContent; }

    this.GetNextAvailableZIndex = function () { return nextAvailableZIndex; }

    this.UpdateForMapType = function () {
        if (!!rtContent) { rtContent.UpdateForMapType(); }
        if (!!historyContent) { historyContent.UpdateForMapType(); }
    }

    this.OnVisibilityChange = function (notification) {
        if (notification.isVisible) { resetVisibility(); } else {
            if (!!rtContent) { rtContent.SetVisible(false); }
            if (!!historyContent) { historyContent.SetVisible(false); }
        }
    }

    this.AddListChangeListener = function (callBack) { allEventDispatchers.AddListener(changeListEventName, callBack); }

    this.GetIsShowingRT = function () { return showingRT; }

    this.SetShowingRT = function (newShowingRT) {
        if (showingRT != (newShowingRT = !!newShowingRT)) {
            if ((newShowingRT && !!rtContent) || (!newShowingRT && !!historyContent)) {
                showingRT = newShowingRT; resetVisibility();
                notify(changeListEventName);
            }
        }
    }

    function notify(eventName, props) { allEventDispatchers.Notify(eventName, tf.js.ShallowMerge(props, { sender: theThis, eventName: eventName })); }

    function resetVisibility() {
        if (!!rtContent) { rtContent.SetVisible(showingRT); }
        if (!!historyContent) { historyContent.SetVisible(!showingRT); }
    }

    function closePanel() { settings.customAppContentI.setVisible(false); }

    function initialize() {
        allEventDispatchers = new tf.events.MultiEventNotifier({ eventNames: [changeListEventName = "chg"] });

        var createBothLists = false;

        if (!settings.showHistory) { settings.showRT = true; } else if (settings.showRT) { createBothLists = true; }

        showingRT = settings.showRT;

        if (!!settings.showHistory && !!settings.startWithHistory) { showingRT = false; }

        busListClasses = new tf.Transit.BusListClasses(settings);
        busListItemContentClasses = new tf.Transit.BusListItemContentClasses(settings);

        nextAvailableZIndex = settings.layerZIndex;

        if (!!settings.showRT) {
            rtContent = new tf.Transit.BusServiceFeaturesContent(tf.js.ShallowMerge(settings, {
                onClickBusTitleButton: function () { if (createBothLists) { theThis.SetShowingRT(false); } else { closePanel(); } },
                busTitleButtonToolTipText: createBothLists ? "Switch to recent activity" : "Collapse panel",
                isVisible: showingRT,
                isRT: true,
                busListClasses: busListClasses,
                busListItemContentClasses: busListItemContentClasses,
                layerZIndex: nextAvailableZIndex
            }));
            nextAvailableZIndex = rtContent.GetNextAvailableZIndex();
        }
        if (!!settings.showHistory) {
            historyContent = new tf.Transit.BusServiceFeaturesContent(tf.js.ShallowMerge(settings, {
                onClickRefreshButton: function () { historyContent.RefreshNow(); },
                onClickBusTitleButton: function () { if (createBothLists) { theThis.SetShowingRT(true); } else { closePanel(); } },
                busTitleButtonToolTipText: createBothLists ? "Switch to real time activity" : "Collapse panel",
                isVisible: !showingRT,
                isRT: false,
                busListClasses: busListClasses,
                busListItemContentClasses: busListItemContentClasses,
                layerZIndex: nextAvailableZIndex
            }));
            nextAvailableZIndex = historyContent.GetNextAvailableZIndex();
        }
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

