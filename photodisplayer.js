"use strict";

tf.TFMap.PhotoDisplayer = function(settings) {
    var theThis, cssTag, isShowing, wrapper, contentWrapper, content, wheelListener, lastParentContainer, closeButton, clientOnClick, contentToolTipStr;
    var lastPhotoSettings;
    var zoom;
    var hasValidImage, imageDims;

    this.OnClose = function() { if (theThis.GetIsShowing()) { onClose(); } }
    this.GetWrapper = function() { return wrapper; }
    this.GetIsShowing = function() { return isShowing; }

    this.Show = function(parentContainer, photoSettings) {
        //setZoom(1);
        lastPhotoSettings = photoSettings;
        var contentButtonStyle = content.GetButton().style;
        if (!!(clientOnClick = tf.js.GetFunctionOrNull(photoSettings.onClick))) {
            contentButtonStyle.cursor = 'pointer';
            contentToolTipStr = photoSettings.toolTipText;
        }
        else {
            contentButtonStyle.cursor = 'default';
            contentToolTipStr = undefined;
        }
        var fileName = photoSettings.photoName;
        var wE = content.GetButton(), wES = wE.style;
        wE.innerHTML = "";
        wES.backgroundImage = "url(" + fileName + ")";
        setIsShowing(true, parentContainer);
        hasValidImage = false;
        tf.TFMap.ValidateImageOrDisplayMessage(fileName, content.GetButton(), checkIfStillCurrentImage);
    }

    this.Hide = function(parentContainer) {
        var wE = content.GetButton(), wES = wE.style;
        wES.background = undefined;
        setIsShowing(false, parentContainer);
    }

    function checkIfStillCurrentImage(imageSrc, messageContainer, optionalParam, theImage) {
        if (hasValidImage = theImage.GetIsValid()) { imageDims = theImage.GetDimensions(); }
        //console.log(imageDims);
        return isShowing && !!lastPhotoSettings && lastPhotoSettings.photoName == imageSrc;
    }

    /*function setZoom(newZoom) {
        var maxZoom = 8;
        if (newZoom < 1) { newZoom = 1; }
        else if (newZoom > maxZoom) { newZoom = maxZoom; }
        if (newZoom != zoom) {
            zoom = newZoom;
            var contentE = content.GetButton();
            contentE.style.width = contentE.style.height = newZoom + "00%";
        }
    }*/

    function onWheel(notification) {
        //console.log('on mouse wheel ' + cssTag + ' ' + (notification.isUp ? "UP" : "DOWN"));
        var mouseCoords = tf.events.GetMouseEventCoords(notification.event);
        var contentE = content.GetButton();
        console.log(mouseCoords);
        var contentRect = contentWrapper.GetHTMLElement().getBoundingClientRect();
        var percX = 1 - mouseCoords[0] / (contentRect.width + 1);
        var percY = 1 - mouseCoords[1] / (contentRect.height + 1);
        //contentE.style.marginLeft = mouseCoords[0] + 'px';
        //contentE.style.marginTop = mouseCoords[1] + 'px';
        //contentE.style.left = Math.floor(percX * 100) + '%';
        //contentE.style.top = Math.floor(percY * 100) + '%';
        var isUp = notification.isUp, sign = isUp ? 1 : -1;
        var newZoom = zoom + sign;
        //setZoom(newZoom);
    }

    function setIsShowing(showBool, parentContainer) {
        if (isShowing != (showBool = !!showBool)) {
            isShowing = showBool;
            var parentContainerUse = isShowing ? parentContainer : (parentContainer != undefined ? parentContainer : lastParentContainer);
            tf.dom.ReplaceCSSClassCondition(parentContainerUse, isShowing, visibleClassName, hiddenClassName);
            if (isShowing) {
                wrapper.GetHTMLElement().disabled = false;
                lastParentContainer = parentContainer;
            }
            else {
                wrapper.GetHTMLElement().disabled = true;
                lastParentContainer = undefined;
            }
        }
    }

    function onClose(notification) { theThis.Hide(); settings.appContent.OnPhotoDisplayHidden(); }

    function getPhotoToolTip() { return contentToolTipStr; }

    function onNextPrev(trueIfNext) {
        if (!!lastPhotoSettings) {
            if (!!lastPhotoSettings.photoListDisplayer) {
                lastPhotoSettings.photoListDisplayer.OnNextPrev(trueIfNext);
            }
        }
    }

    function onSeeRecord(notification) { if (!!clientOnClick) { clientOnClick({ sender: theThis, photoSettings: lastPhotoSettings }); } }

    function createControl() {
        var offsetY = 8;
        var dimCloseButton = "24px", appContent = settings.appContent, delayMillis = tf.TFMap.toolTipDelayMillis, toolTipClass = "center", toolTipArrowClass = "*right";
        wrapper = new tf.dom.Div({ cssClass: wrapperClassName });
        contentWrapper = new tf.dom.Div({ cssClass: contentWrapperClassName });

        var wrapperE = wrapper.GetHTMLElement();

        wrapperE.disabled = true;
        var buttonSettings = { wrapper: contentWrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass };

        content = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            offsetX: 4, buttonClass: contentClassName, toolTipText: getPhotoToolTip, onClick: onSeeRecord, wrapper: contentWrapper, keepOnHoverOutTarget: true
        }));

        var contentButton = content.GetButton();

        contentWrapper.AddContent(contentButton);

        buttonSettings.offsetX = 0; buttonSettings.wrapper = wrapper; buttonSettings.insertWrapper = wrapper;
        buttonSettings.toolTipClass = "end"; buttonSettings.toolTipArrowClass = "top";

        closeButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            offsetY: offsetY,
            svgHTML: appContent.GetAppStyles().GetXMarkSVG(),
            width: dimCloseButton, height: dimCloseButton,
            buttonClass: buttonsClassName + " " + closeClassName + " ripple", toolTipText: "Close viewer", onClick: onClose
        }));
        tf.dom.AddCSSClass(closeButton.GetButton().firstChild, buttonsSVGClassName);

        var prevButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            offsetY: offsetY,
            svgHTML: appContent.GetAppStyles().GetArrowLeftSVGNoColor(),
            width: dimCloseButton, height: dimCloseButton,
            buttonClass: buttonsClassName + " " + prevClassName + " ripple", toolTipText: "View previous photo", onClick: function() { onNextPrev(false); }
        }));
        tf.dom.AddCSSClass(prevButton.GetButton().firstChild, buttonsSVGClassName);

        var nextButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            offsetY: offsetY,
            svgHTML: appContent.GetAppStyles().GetArrowRightSVGNoColor(),
            width: dimCloseButton, height: dimCloseButton,
            buttonClass: buttonsClassName + " " + nextClassName + " ripple", toolTipText: "View next photo", onClick: function() { onNextPrev(true); }
        }));
        tf.dom.AddCSSClass(nextButton.GetButton().firstChild, buttonsSVGClassName);

        //wheelListener = new tf.events.DOMWheelListener({ target: contentWrapper/*content.GetButton()*/, callBack: onWheel, optionalScope: theThis });
        wrapper.AddContent(contentWrapper, closeButton.GetButton(), prevButton.GetButton(), nextButton.GetButton());
    }

    var wrapperClassName, hiddenClassName, visibleClassName, contentWrapperClassName, contentClassName, buttonsClassName, buttonsSVGClassName, closeClassName, prevClassName, nextClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        hiddenClassName = tf.TFMap.CreateClassName(cssTag, "WrapperHidden");
        visibleClassName = tf.TFMap.CreateClassName(cssTag, "WrapperVisible");
        contentWrapperClassName = tf.TFMap.CreateClassName(cssTag, "ContentWrapper");
        contentClassName = tf.TFMap.CreateClassName(cssTag, "Content");
        buttonsClassName = tf.TFMap.CreateClassName(cssTag, "Buttons");
        closeClassName = tf.TFMap.CreateClassName(cssTag, "CloseButton");
        prevClassName = tf.TFMap.CreateClassName(cssTag, "PrevButton");
        nextClassName = tf.TFMap.CreateClassName(cssTag, "NextButton");
        buttonsSVGClassName = tf.TFMap.CreateClassName(cssTag, "ButtonSVG");

    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var ls = tf.TFMap.LayoutSettings;
        var bottomListHeight = ls.underBottomPaneHeightInt;
        var cssClasses = [];
        var dimButtonInt = 32, dimButtonPx = dimButtonInt + 'px';
        var svgMarginInt = 2, svgDims = dimButtonInt - 2 * svgMarginInt;
        var imgBkSizeVerb = "contain";

        //contentWrapperClassName, contentClassName, buttonsClassName, closeClassName, prevClassName, nextClassName

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.transitionPoint2s, CSSClasses.displayBlock,
            //CSSClasses.overflowHidden,
            CSSClasses.overflowVisible,
            CSSClasses.cursorDefault, CSSClasses.pointerEventsNone,
            CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute],
            top: "0px",
            zIndex: '' + (ls.rootDivZIndex + ls.photoDisplayerWrapperZIndexAdd),
            backgroundColor: "black", height: "100%"
        };

        cssClasses[hiddenClassName + " ." + wrapperClassName] = { left: "100%", width: "0px" };
        cssClasses[visibleClassName + " ." + wrapperClassName] = { left: '0px', width: "100%" };

        var imgDisplayer = {
            "-webkit-background-size": imgBkSizeVerb, "-moz-background-size": imgBkSizeVerb, "-o-background-size": imgBkSizeVerb, backgroundSize: imgBkSizeVerb,
            backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundColor: "black"//, backgroundAttachment: "fixed",
        };

        cssClasses[contentWrapperClassName] = {
            inherits: [CSSClasses.whiteSpaceNoWrap, CSSClasses.displayBlock,
            CSSClasses.pointerEventsAll,
            //CSSClasses.overflowHidden,
            CSSClasses.overflowVisible,
            CSSClasses.cursorPointer, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative],
            marginLeft: "0px", marginRight: "0px",
            zIndex: '' + (ls.rootDivZIndex + ls.photoDisplayerContentWrapperZIndexAdd),
            height: "calc(100% - " + (bottomListHeight + 2) + "px)",
            width: "100%"
        };

        cssClasses[contentClassName] = {
            inherits: [CSSClasses.whiteSpaceNoWrap, CSSClasses.displayBlock,
            CSSClasses.pointerEventsAll,
            //CSSClasses.overflowHidden,
            CSSClasses.overflowVisible,
            CSSClasses.cursorPointer, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute, CSSClasses.transitionBackground, imgDisplayer],
            color: "white", fontSize: "11px", left: "0px", top: "0px",
            zIndex: '' + (ls.rootDivZIndex + ls.photoDisplayerContentZIndexAdd),
            height: "100%", width: "100%"
        };

        cssClasses[buttonsClassName] = {
            inherits: [CSSClasses.positionAbsolute, CSSClasses.pointerEventsAll, CSSClasses.transparentImageButton,
                CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap, CSSClasses.borderRadius2px],
            background: "darkblue", padding: "4px",
            zIndex: '' + (ls.rootDivZIndex + ls.photoDisplayerButtonZIndexAdd),
            width: dimButtonPx, height: dimButtonPx, top: "8px"
        };

        cssClasses[buttonsClassName + " svg"] = {
            fill: "white", stroke: "none"
        };

        cssClasses[buttonsClassName + ":hover"] = {
            background: "white"
        };

        cssClasses[buttonsClassName + ":hover svg"] = {
            fill: ls.darkTextColor, stroke: "none"
        };

        var buttonLeftInt = 8;

        cssClasses[closeClassName] = { left: buttonLeftInt + "px" };

        buttonLeftInt += dimButtonInt * 2 + 6;

        cssClasses[prevClassName] = { left: buttonLeftInt + "px" };

        buttonLeftInt += dimButtonInt + 6;

        cssClasses[nextClassName] = { left: buttonLeftInt + "px" };

        cssClasses[buttonsSVGClassName] = {
            inherits: [CSSClasses.flexGrowOne],
            width: "70%", height: "70%"/*,
            stroke: "white", strokeWidth: "6px"*/
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        zoom = 1;
        cssTag = "photoDisplay";
        isShowing = undefined;
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

