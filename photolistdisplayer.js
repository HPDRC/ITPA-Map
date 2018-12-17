"use strict";

tf.TFMap.PhotoListDisplayer = function(settings) {
    var theThis, cssTag, wrapper, content, itemToolBar, selectRecordButton, wheelListener, buttonSettings, imageItemsCache;
    var clickedItem;
    var clientOnClickCB, clientGetToolTipTextCB;
    var addSelItemPxInt;
    var lastPhotoList, photosToMapCoords, photosToolTips, photoTitles;
    var timerToolBarAttach, lineToPhoto;
    var buttonWithToolBar;

    this.OnNextPrev = function(trueIfNext) {
        if (!!clickedItem) {
            var button = clickedItem.button, buttonSettings = button.GetSettings(), index = buttonSettings.photoIndex;
            var buttons = imageItemsCache.GetObjects();
            var count = imageItemsCache.GetActiveCount();
            var inc = !!trueIfNext ? 1 : -1;
            var nextIndex = index + inc;
            if (nextIndex >= count) { nextIndex = 0; } else if (nextIndex < 0) { nextIndex = count - 1; }
            var newButton = buttons[nextIndex];
            onClickOrSelect(newButton.button, false);
        }
    }

    this.GetWrapper = function() { return wrapper; }

    this.GetLastPhotoList = function() { return lastPhotoList; }

    this.Update = function(photoList) {
        detachItemToolBar();
        content.ClearContent();
        imageItemsCache.Reset();
        clickedItem = undefined;
        buttonWithToolBar = undefined;
        var photoNamesA = photoList.GetPhotoNames(), nPhotoNames = photoNamesA.length;

        clientOnClickCB = tf.js.GetFunctionOrNull(photoList.GetOnClick());
        clientGetToolTipTextCB = tf.js.GetFunctionOrNull(photoList.GetToolTipText());
        lastPhotoList = photoList;
        photosToMapCoords = photoList.GetLastContentSettings().photosToMapCoords;
        photoTitles = photoList.GetLastContentSettings().photoTitles;
        if (!tf.js.GetIsArrayWithLength(photosToMapCoords, nPhotoNames)) { photosToMapCoords = undefined; }
        for (var i = 0; i < nPhotoNames; ++i) {
            var photoName = photoNamesA[i];
            var imageItem = getNextImageItemFromCache();
            var imageItemWrapper = imageItem.wrapper;
            var button = imageItem.button, buttonSettings = button.GetSettings();
            var buttonButton = button.GetButton();
            buttonSettings.photoName = photoName;
            buttonSettings.imageItem = imageItem;
            buttonSettings.photoIndex = i;
            var wE = tf.dom.GetHTMLElementFrom(imageItemWrapper), wES = wE.style;
            buttonButton.innerHTML = "";
            wES.background = tf.TFMap.LayoutSettings.backgroundLivelyColor + " url(" + photoName + ") center/100% no-repeat";
            content.AddContent(imageItemWrapper);
            tf.TFMap.ValidateImageOrDisplayMessage(photoName, buttonButton, function(invalidPhotoName, someWrapper, imageItemParam) {
                return invalidPhotoName == imageItemParam.button.GetSettings().photoName;
            }, imageItem);
        }
    }

    function onWheel(notification) {
        var delta = 100;
        var contentE = content.GetHTMLElement();
        var isUp = notification.isUp, sign = isUp ? -1 : 1;
        contentE.scrollLeft += (delta * sign);
        //console.log('on mouse wheel ' + (isUp ? "UP" : "DOWN"));
    }

    function getButtonSettings() {
        var delayMillis = tf.TFMap.toolTipDelayMillis, toolTipClass = "start", toolTipArrowClass = "bottom";
        return {
            onClick: onButtonClicked, onHover: undefined, wrapper: wrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass,
            toolTipText: "View Photo", buttonClass: itemWrapperClassName + " ripple"
        };
    }

    function createControl() {
        var customizedScrollBarClassName = tf.TFMap.LayoutSettings.customizedScrollBarClassName;
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        wrapper = new tf.dom.Div({ cssClass: wrapperClassName });

        buttonSettings = getButtonSettings();

        content = new tf.dom.Div({ cssClass: contentClassName + " " + customizedScrollBarClassName });

        itemToolBar = new tf.dom.Div({ cssClass: itemToolBarClassName });

        selectRecordButton = settings.appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            buttonClass: selectRecordButtonClassName + " ripple",
            svgHTML: appStyles.GetMapMarker1SVG(),
            toolTipText: getSelectToolTipText,
            toolTipClass: "end",
            onClick: onSelectRecord
        }));

        var selectRecordButtonSVG = selectRecordButton.GetButton().firstChild;
        tf.dom.AddCSSClass(selectRecordButtonSVG, selectRecordButtonSVGClassName);

        itemToolBar.AddContent(selectRecordButton.GetButton());

        wheelListener = new tf.events.DOMWheelListener({ target: content, callBack: onWheel, optionalScope: theThis });
        wrapper.AddContent(content);
    }

    var wrapperClassName, contentClassName, itemWrapperClassName, itemButtonClassName, itemToolBarClassName, selectRecordButtonClassName, selectRecordButtonSVGClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        contentClassName = tf.TFMap.CreateClassName(cssTag, "Content");
        itemWrapperClassName = tf.TFMap.CreateClassName(cssTag, "ItemWrapper");
        itemButtonClassName = tf.TFMap.CreateClassName(cssTag, "ItemButton");
        itemToolBarClassName = tf.TFMap.CreateClassName(cssTag, "ItemToolBar");
        selectRecordButtonClassName = tf.TFMap.CreateClassName(cssTag, "SelectRecordButton");
        selectRecordButtonSVGClassName = tf.TFMap.CreateClassName(cssTag, "SelectRecordButtonSVG");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var addSelItemPx = addSelItemPxInt + 'px';
        var halfAddSelItemPxInt = addSelItemPxInt / 2;
        var halfAddSelItemPx = halfAddSelItemPxInt + 'px';
        var ls = tf.TFMap.LayoutSettings;
        var livelyColor = ls.backgroundLivelyColor;
        var underBottomPaneHeightInt = ls.underBottomPaneHeightInt;
        var itemWrapperHeightInt = underBottomPaneHeightInt - 30;
        var itemWrapperHeightPx = itemWrapperHeightInt + 'px';
        var itemWrapperDimInt = itemWrapperHeightInt * 9 / 4;
        var itemWrapperDimPx = itemWrapperDimInt + 'px';
        var svgDim = "45%";

        var toolBarWidthInt = Math.floor(itemWrapperDimInt / 3);
        var toolBarWidthPx = toolBarWidthInt + 'px';
        var itemToolBarHeight = "calc(100% + 4px)";

        var horMarginInt = 4, horMarginPx = horMarginInt + 'px';
        var heightToolBarButtonInt = toolBarWidthInt - 2 * horMarginInt;

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.transitionPoint2s, CSSClasses.displayBlock, CSSClasses.overflowVisible, CSSClasses.backgroundColorTransparent, CSSClasses.cursorDefault, CSSClasses.pointerEventsNone,
            CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute],
            left: "0px", bottom: "0px",
            zIndex: '' + (ls.rootDivZIndex + ls.photoListDisplayerWrapperZIndexAdd),
            height: underBottomPaneHeightInt + 'px', width: "100%"
        };

        cssClasses[contentClassName] = {
            inherits: [CSSClasses.whiteSpaceNoWrap, CSSClasses.displayBlock, CSSClasses.cursorDefault, CSSClasses.pointerEventsAll, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative],
            background: livelyColor, overflowY: 'hidden', overflowX: 'auto',
            zIndex: '' + (ls.rootDivZIndex + ls.photoListDisplayerContentZIndexAdd),
            flexFlow: "row nowrap", height: "100%",
            paddingLeft: halfAddSelItemPx, paddingRight: halfAddSelItemPx,
            width: "calc(100% - " + addSelItemPx + ")"
        };

        cssClasses[itemWrapperClassName] = {
            inherits: [CSSClasses.displayInlineBlock, CSSClasses.overflowVisible, CSSClasses.cursorPointer, CSSClasses.pointerEventsAll, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative,
            CSSClasses.whiteSpaceNormal, CSSClasses.verticalAlignMiddle],
            marginLeft: "0px", marginRight: "0px", height: "calc(100% - 12px)", marginTop: "4px", width: itemWrapperDimPx,
            borderRadius: "2px",
            border: "2px solid transparent"
        };

        cssClasses[itemButtonClassName] = {
            inherits: [CSSClasses.displayBlock, CSSClasses.overflowHidden, CSSClasses.cursorPointer, CSSClasses.pointerEventsAll, CSSClasses.noMarginNoBorderNoPadding,
            CSSClasses.positionRelative, CSSClasses.whiteSpaceNormal],
            left: "0px", top: "0px",
            background: "transparent",
            height: "100%", width: "100%",
            color: "white",
            fontSize: "11px"
        };

        cssClasses[itemToolBarClassName] = {
            inherits: [CSSClasses.transitionPoint2s, CSSClasses.displayBlock, CSSClasses.overflowVisible, CSSClasses.cursorDefault, CSSClasses.pointerEventsNone,
            CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute, CSSClasses.whiteSpaceNormal],
            left: "-2px",
            top: "-2px",
            background: "rgba(0, 0, 0, 0.5)",
            height: itemToolBarHeight,
            width: toolBarWidthPx,
            borderRadius: "0px",
            color: "white",
            fontSize: "11px",
            borderRight: "2px solid rgba(0, 0, 0, 0.2)"
        };

        cssClasses[selectRecordButtonClassName] = {
            inherits: [CSSClasses.positionAbsolute, CSSClasses.pointerEventsAll, CSSClasses.transparentImageButton,
            CSSClasses.directionsCloseSVG, CSSClasses.backgroundColorTransparent],
            zIndex: '' + (ls.rootDivZIndex + ls.photoListDisplayerSelectRecordButtonZIndexAdd),
            width: "100%",
            height: itemToolBarHeight,
            left: "0px",
            top: "0px"
        };

        cssClasses[selectRecordButtonSVGClassName] = { width: svgDim, height: svgDim };

        return cssClasses;
    }

    function resizeItems() {
        var count = imageItemsCache.GetActiveCount();
        if (count > 0) {
            var layoutSettings = tf.TFMap.LayoutSettings;
            var underBottomPaneHeightInt = layoutSettings.underBottomPaneHeightInt;
            var itemWrapperHeightInt = underBottomPaneHeightInt - 30;
            var itemWrapperDimInt = itemWrapperHeightInt * 9 / 4;
            var itemWrapperDimPx = itemWrapperDimInt + 'px';
            var imageItems = imageItemsCache.GetObjects();

            for (var i = 0; i < count; ++i) {
                var imageItem = imageItems[i];
                var itemWrapper = imageItem.wrapper;
                var S = tf.dom.GetHTMLElementFrom(itemWrapper).style;
                S.width = itemWrapperDimPx;
            }
        }
    }

    function setClickedStyle(item, bool) {
        var S = tf.dom.GetHTMLElementFrom(item.wrapper).style;
        var layoutSettings = tf.TFMap.LayoutSettings;
        var underBottomPaneHeightInt = layoutSettings.underBottomPaneHeightInt;
        var itemWrapperHeightInt = underBottomPaneHeightInt - 30;
        var itemWrapperDimInt = itemWrapperHeightInt * 9 / 4;
        var itemWrapperDimPx = itemWrapperDimInt + 'px';
        var colorSelect = "white";
        if (!!bool) {
            S.border = "2px solid " + colorSelect;
            S.width = (itemWrapperDimInt + addSelItemPxInt) + 'px';
            //S.marginLeft = (- addSelItemPxInt / 2) + 'px';
        }
        else {
            S.border = "2px solid transparent";
            S.width = itemWrapperDimPx;
            S.marginLeft = "0px";
        }
    }

    function setClickedItem(item) {
        if (!!clickedItem) {
            if (clickedItem != item) {
                setClickedStyle(clickedItem, false);
                clickedItem = item;
            }
        }
        else {
            clickedItem = item;
        }
        if (!!clickedItem) {
            setClickedStyle(clickedItem, true);
        }
    }

    function makeButtonNotification(button, isSelect) {
        var buttonSettings = button.GetSettings();
        var photoName = buttonSettings.photoName;
        return { sender: theThis, photoName: photoName, index: buttonSettings.photoIndex, button: button, photoList: lastPhotoList, isSelect: isSelect }
    }

    function onClickOrSelect(button, isSelect) {
        var buttonSettings = button.GetSettings();
        //detachItemToolBar();
        setClickedItem(buttonSettings.imageItem);
        if (!!clientOnClickCB) {
            clientOnClickCB(makeButtonNotification(button, isSelect));
        }
        else {
            settings.appContent.ShowPhoto({ photoName: buttonSettings.photoName }, sender.GetButton());
        }
    }

    function onSelectRecord(notification) {
        if (!!buttonWithToolBar) { onClickOrSelect(buttonWithToolBar, true); }
    }

    function onButtonClicked(notification) {
        var sender = notification.sender;
        if (tf.js.GetIsValidObject(sender) && tf.js.GetFunctionOrNull(sender.GetButton)) { onClickOrSelect(sender, false); }
    }

    function getToolTipOrSelectText(button, isSelect) {
        var viewSelectStr = "click to " + (isSelect ? "select" : "view");
        var toolTipText;
        if (!!photoTitles) {
            var buttonSettings = button.GetSettings();
            toolTipText = tf.TFMap.MapTwoLineSpan(viewSelectStr, photoTitles[buttonSettings.photoIndex]);
        }
        else {
            toolTipText = viewSelectStr;
        }
        return toolTipText;
    }

    function getSelectToolTipText(button) { return getToolTipOrSelectText(buttonWithToolBar, true); }
    function getToolTipText(button) { return getToolTipOrSelectText(button, false); }

    function getButtonSettings() {
        var delayMillis = tf.TFMap.toolTipDelayMillis, toolTipClass = "start", toolTipArrowClass = "bottom";
        return {
            onClick: onButtonClicked, onHover: undefined, wrapper: wrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass,
            toolTipText: getToolTipText, buttonClass: itemButtonClassName + " ripple"
        };
    }

    function onFocusImageItem(notification) {
        var hasFocus = notification.hasFocus;
        var target = notification.event.target;
        var targetIsImageItem = target == notification.callBackSettings.wrapper;
        if (targetIsImageItem) { if (hasFocus) { tf.dom.ScrollHorizontallyToEnsureVisible(content, target); } }
    }

    function unDrawLine() {
        if (!!lineToPhoto) {
            var overMapCanvas = settings.appContent.GetOverMapCanvas();
            overMapCanvas.DelOMCLine(lineToPhoto);
            lineToPhoto = undefined;
            overMapCanvas.Draw();
        }
    }

    function detachItemToolBar() {
        if (!!timerToolBarAttach) { clearTimeout(timerToolBarAttach); timerToolBarAttach = undefined; }
        unDrawLine();
        itemToolBar.GetHTMLElement().style.opacity = "0";
        buttonWithToolBar = undefined;
        itemToolBar.RemoveFromParent();
    }

    function attachItemToolBar(button) {
        var buttonSettings = button.GetSettings();
        var imageItem = buttonSettings.imageItem;
        var wrapper = imageItem.wrapper;
        buttonWithToolBar = button;
        itemToolBar.AppendTo(wrapper);
        timerToolBarAttach = setTimeout(function() {
            var appContent = settings.appContent, map = appContent.GetMap(), overMapCanvas = appContent.GetOverMapCanvas();
            var buttonIndex = buttonSettings.photoIndex;
            var imgCoords = photosToMapCoords[buttonIndex];
            var buttonRect = button.GetButton().getBoundingClientRect();
            var buttonPixelCoord = [buttonRect.left + buttonRect.width / 2, buttonRect.top - 4];
            var buttonMapCoord = map.PixelToMapCoords(buttonPixelCoord);
            lineToPhoto = overMapCanvas.AddOMCLine(buttonMapCoord, imgCoords, buttonPixelCoord);
            itemToolBar.GetHTMLElement().style.opacity = "1";
            settings.appContent.GetOverMapCanvas().Draw();
        }, 400);
    }

    function onHoverImageItem(notification) {
        if (!!lastPhotoList && !!photosToMapCoords) {
            var target = notification.event.target;
            var targetIsImageItem = target == tf.dom.GetHTMLElementFrom(notification.callBackSettings.wrapper);
            if (targetIsImageItem) {
                var imgButton = notification.callBackSettings.imgButton;
                detachItemToolBar();
                if (notification.isInHover) { attachItemToolBar(imgButton); }
                //else { console.log('hovered out'); }
            }
        }
    }

    function getNextImageItemFromCache() {
        var nextItem = imageItemsCache.GetNext();
        setClickedStyle(nextItem, false);
        return nextItem;
    }

    function createNewImageItem() {
        var imgButton = settings.appContent.CreateButton(tf.js.ShallowMerge(buttonSettings));
        var imgButtonButton = imgButton.GetButton();
        var itemWrapper = new tf.dom.Div({ cssClass: itemWrapperClassName });
        var blurListener = new tf.events.DOMFocusBlurListener({ target: itemWrapper, callBack: onFocusImageItem, optionalScope: theThis, callBackSettings: { imgButton: imgButton, wrapper: itemWrapper } });
        var hoverListener = new tf.events.DOMMouseEnterLeaveListener({ target: itemWrapper, callBack: onHoverImageItem, optionalScope: theThis, callBackSettings: { imgButton: imgButton, wrapper: itemWrapper } });
        itemWrapper.AddContent(imgButtonButton);
        return { wrapper: itemWrapper, button: imgButton, blurListener: blurListener, hoverListener: hoverListener };
    }

    function deleteImageItem(notification) { }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); resizeItems(); }

    var lcl;

    function initialize() {
        addSelItemPxInt = 16;
        cssTag = "photoListDisplayer";
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        imageItemsCache = new tf.js.ObjectCache({ createNew: createNewImageItem, onDelete: deleteImageItem });
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

