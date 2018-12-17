"use strict";

tf.TFMap.MapFeaturePropsDisplayer = function(settings) {
    var theThis, cssTag, map, wrapper, propsContent, coordsButton, toolBar, toolBarAdditionalButtons, isVisible, lastMapFeature, closeButton, directionsButton, toast;
    var wrapperClassName, visibleClassName, hiddenClassName;
    var propsTextButtonClassName, mapFeaturePropsImageClassName, mapFeaturePropsImageWrapperClassName;
    var toolBarClassName, contentClassName;
    var allEventDispatchers, visibilityChangeEventName;

    this.AddVisibilityChangeListener = function (callBack) { allEventDispatchers.AddListener(visibilityChangeEventName, callBack); }

    this.OnPostCompose = function(notification) {
        if (!!lastMapFeature) {
            var props = lastMapFeature.GetSettings();
            if (tf.js.GetFunctionOrNull(props.onPostCompose)) {
                props.onPostCompose({ sender: theThis, pcNotification: notification, lastMapFeature: lastMapFeature, props: props });
            }
        }
    }

    this.GetCSSClasseNames = function() { return { visibleClassName: visibleClassName, hiddenClassName: hiddenClassName }; }

    this.CreateMapFeaturePropsSpan = function(spanClass, innerHTML, color) {
        var styleStr = "";
        if (color != undefined) {
            //console.log('color specified');
            styleStr = ' style="background-color:' + color + ';"';
        }
        return '<span class="' + spanClass + '" ' + styleStr + '> ' + innerHTML + '</span> ';
    };

    this.CreateMapFeatureTitleSpan = function(innerHTML, color) { return theThis.CreateMapFeaturePropsSpan(titleClassName, innerHTML, color); };

    this.CreateMapFeatureTextSpan = function(innerHTML) { return theThis.CreateMapFeaturePropsSpan(textClassName, innerHTML); };

    this.CreateMapFeatureImageDiv = function(imageSrc) {
        var urlStr = "url('" + imageSrc + "')";
        var backgroundStr = "background: " + urlStr + " center/100% no-repeat;";
        var styleStr = 'style="' + backgroundStr + 'background-size:contain;"';
        return '<div class="' + mapFeaturePropsImageWrapperClassName + '"><div class="' + mapFeaturePropsImageClassName + '" ' + styleStr + '>' + '</div></div>';
    };

    this.GetMapFeaturePropsTextButtonClass = function() { return propsTextButtonClassName; };

    this.GetWrapper = function() { return wrapper; }
    this.GetIsVisible = function() { return isVisible; }
    this.RefreshProps = function(mapFeature) { return refreshProps(mapFeature); }
    this.ShowProps = function(mapFeature) { return showProps(mapFeature); }
    this.GetLastMapFeature = function() { return lastMapFeature; }
    this.Hide = function() { return setDisplayVisible(false); }

    function createSpan(spanClass, spanText) { return '<span class="' + spanClass + '">' + spanText + '</span>' }

    function showLastMapFeatureProps() {
        var props = lastMapFeature.GetSettings();
        if (tf.js.GetFunctionOrNull(props.getDisplayProps)) {

            if (tf.js.GetFunctionOrNull(props.onPrepareForPropsDisplay)) {
                props.onPrepareForPropsDisplay(lastMapFeature);
            }
            var displayProps = props.getDisplayProps(lastMapFeature);
            var coords = lastMapFeature.GetPointCoords()
            props.coords = coords;
            propsContent.GetHTMLElement().innerHTML = displayProps.innerHTML;
            if (!!coords) {
                var coordsHTML = coords[1].toFixed(5) + ', ' + coords[0].toFixed(5);
                coordsButton.GetButton().innerHTML = coordsHTML;
                coordsButton.GetButton().style.display = 'block';
            }
            else { coordsButton.GetButton().style.display = 'none'; }
            if (!!props.addButtons) {
                var appContent = settings.appContent;
                var buttonSettings = getToolBarButtonSettings();
                var nButtonsAdd = props.addButtons.length;
                for (var i = 0; i < nButtonsAdd; ++i) {
                    var addButton = props.addButtons[i];
                    var button = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, addButton));
                    if (tf.js.GetIsNonEmptyString(addButton.buttonText)) {
                        button.GetButton().innerHTML = addButton.buttonText;
                    }
                    toolBarAdditionalButtons.AddContent(button.GetButton());
                }
            }
        }
    }
    function refreshProps(mapFeature) { if (!!lastMapFeature && lastMapFeature == mapFeature) { showLastMapFeatureProps(); } }

    function showProps(mapFeature) {
        setDisplayVisible(false);
        if (!!(lastMapFeature = mapFeature)) {
            var props = lastMapFeature.GetSettings();
            if (tf.js.GetFunctionOrNull(props.getDisplayProps)) { showLastMapFeatureProps(); setDisplayVisible(true); }
            else { lastMapFeature = undefined; }
        }
    }

    function renderMap() { settings.appContent.GetMap().Render(); }

    function setDisplayVisible(bool) {
        var appContent = settings.appContent;
        isVisible = !!bool;
        tf.dom.ReplaceCSSClassCondition(appContent.GetRootDiv(), isVisible, visibleClassName, hiddenClassName);
        if (!isVisible) {
            toolBarAdditionalButtons.ClearContent();
            propsContent.GetHTMLElement().scrollTop = "0px";
            if (!!lastMapFeature) {
                var props = lastMapFeature.GetSettings();
                var lastMapFeatureSaved = lastMapFeature;
                if (!!props.additionalFeatures) {
                    for (var i in props.additionalFeatures) {
                        settings.additionalFeaturesLayer.DelMapFeature(props.additionalFeatures[i], true);
                    }
                    settings.additionalFeaturesLayer.DelWithheldFeatures();
                }
                if (!!props.bottomContent) {
                    appContent.SetBottomPaneUp(false);
                }
                lastMapFeature = undefined;
                if (tf.js.GetFunctionOrNull(props.onPostCompose)) { renderMap(); }
                if (tf.js.GetFunctionOrNull(props.onClose)) { props.onClose(lastMapFeatureSaved); }
                appContent.OnCloseMapFeatureProps();
            }
        }
        else {
            var props = lastMapFeature.GetSettings();
            if (!!props.additionalFeatures) {
                for (var i in props.additionalFeatures) {
                    settings.additionalFeaturesLayer.AddMapFeature(props.additionalFeatures[i], true);
                }
                settings.additionalFeaturesLayer.AddWithheldFeatures();
            }
            if (!!props.bottomContent) {
                appContent.SetBottomContent(props.bottomContentType, props.bottomContent);
            }
            if (tf.js.GetFunctionOrNull(props.onPostCompose)) { renderMap(); }
        }
        notifyVisibilityChange();
    }

    function closeLastToast() { if (!!toast) { toast.Close(); toast = undefined; } }

    function showToast(str, timeout) {
        closeLastToast();
        var toaster = settings.appContent.GetToaster();
        if (!!toaster) {
            if (timeout == undefined) { timeout = 0; }
            toast = toaster.Toast({ text: str, timeout: timeout });
        }
    }

    function onButtonClicked(notification) {
        var button = notification.sender;
        if (!tf.js.GetFunctionOrNull(notification.sender.GetSettings)) {
            button = notification.toolTipSender;
        }

        var appContent = settings.appContent;
        var map = appContent.GetMap();
        switch (button) {
            case directionsButton:
                appContent.SetDirectionsTargetToMapFeature(lastMapFeature);
                break;
            case closeButton:
                setDisplayVisible(false);
                break;
            case coordsButton:
                if (!!lastMapFeature) { appContent.AnimatedSetCenterIfDestVisible(lastMapFeature.GetPointCoords()); }
                break;
            default:
                if (!!lastMapFeature) {
                    var props = lastMapFeature.GetSettings();
                    if (!!props && tf.js.GetFunctionOrNull(props.onClick)) { props.onClick(notification); }
                }
                break;
        }
    }

    function getToolBarButtonSettings() {
        var delayMillis = tf.TFMap.toolTipDelayMillis;
        var toolTipClass = "*start";
        var toolTipArrowClass = "top";

        var buttonSettings = {
            onClick: onButtonClicked, onHover: undefined, wrapper: wrapper, delayMillis: delayMillis,
            toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass,
            offsetY: -9
        };
        return buttonSettings;
    }

    function createControl() {
        var appContent = settings.appContent;
        var mapDiv = appContent.GetMapDiv();
        var rootDiv = appContent.GetRootDiv();
        var customizedScrollBarClassName = tf.TFMap.LayoutSettings.customizedScrollBarClassName;

        wrapper = new tf.dom.Div({ cssClass: wrapperClassName });
        toolBar = new tf.dom.Div({ cssClass: toolBarClassName });
        propsContent = new tf.dom.Div({ cssClass: contentClassName + " " + customizedScrollBarClassName });

        var buttonSettings = getToolBarButtonSettings();

        closeButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, { buttonClass: closeButtonClassName + " ripple", toolTipText: "Close" }));
        directionsButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, { buttonClass: directionsButtonClassName + " ripple", toolTipText: "Get Directions" }));

        var coordsWrapper = new tf.dom.Div({ cssClass: coordsButtonWrapperClassName });

        //buttonSettings.wrapper = coordsWrapper;
        buttonSettings.toolTipClass = "*center";
        buttonSettings.toolTipArrowClass = "right";

        coordsButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, { buttonClass: coordsButtonClassName + " ripple", toolTipText: "Center Map to Location" }));

        toolBarAdditionalButtons = new tf.dom.Div({ cssClass: additionalButtonsClassName })

        coordsWrapper.AddContent(coordsButton.GetButton());

        toolBar.AddContent(closeButton.GetButton(), directionsButton.GetButton(), toolBarAdditionalButtons);
        wrapper.AddContent(toolBar, propsContent, coordsWrapper);
    }

    var coordsButtonWrapperClassName, coordsButtonClassName, additionalButtonsClassName, closeButtonClassName, directionsButtonClassName, titleClassName, textClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        visibleClassName = tf.TFMap.CreateClassName(cssTag, "WrapperVisible");
        hiddenClassName = tf.TFMap.CreateClassName(cssTag, "WrapperHidden");
        toolBarClassName = tf.TFMap.CreateClassName(cssTag, "ToolBar");
        contentClassName = tf.TFMap.CreateClassName(cssTag, "Content");
        coordsButtonWrapperClassName = tf.TFMap.CreateClassName(cssTag, "CoordsButtonWrapper");
        coordsButtonClassName = tf.TFMap.CreateClassName(cssTag, "CoordsButton");
        additionalButtonsClassName = tf.TFMap.CreateClassName(cssTag, "AdditionalButtons");
        closeButtonClassName = tf.TFMap.CreateClassName(cssTag, "CloseButton");
        directionsButtonClassName = tf.TFMap.CreateClassName(cssTag, "DirectionsButton");
        textClassName = tf.TFMap.CreateClassName(cssTag, "Text");
        titleClassName = tf.TFMap.CreateClassName(cssTag, "Title");
        propsTextButtonClassName = tf.TFMap.CreateClassName(cssTag, "TextButton");
        mapFeaturePropsImageClassName = tf.TFMap.CreateClassName(cssTag, "PropsImage");
        mapFeaturePropsImageWrapperClassName = tf.TFMap.CreateClassName(cssTag, "PropsImageWrapper");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var minWidthPropsDisplayerInt = ls.minWidthPropsDisplayerInt, minWidthPropsDisplayerPx = minWidthPropsDisplayerInt + 'px';
        var maxFeaturePropsDisplayHeightInt = ls.maxFeaturePropsDisplayHeightInt, maxFeaturePropsDisplayHeightPx = maxFeaturePropsDisplayHeightInt + 'px';
        var propsToolBarButtonWidthInt = ls.propsToolBarButtonWidthInt, propsToolBarButtonWidthPx = propsToolBarButtonWidthInt + 'px';
        var lightBackground = ls.lightBackground;
        var lightBackgroundHalfOpaque = ls.lightBackgroundHalfOpaque;
        var darkTextColor = ls.darkTextColor, darkTextShadow = ls.darkTextShadow;

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.borderRadius2px, CSSClasses.transitionPoint2s, CSSClasses.cursorDefault, CSSClasses.pointerEventsAll,
            CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute, CSSClasses.displayFlex],
            flexFlow: "column nowrap",
            boxShadow: "rgba(0, 0, 0, 0.1) -4px 4px 10px",
            maxHeight: ls.CSSLiteralMaxHeightMapFeaturePropsDisplayer,
            //background: "rgba(0,0,0,0.2)",
            zIndex: '' + (ls.rootDivZIndex + ls.mapFeaturePropsDisplayerWrapperZIndexAdd),
            borderRadius: '2px',
            fontSize: ls.propsDisplayerWrapperFontSizeInt + "px",
            lineHeight: ls.propsDisplayerWrapperLineHeightInt + "px",
            maxWidth: ls.propsDisplayerWrapperMaxWidthInt + "px"
        };

        cssClasses[visibleClassName + " ." + wrapperClassName] = {
            inherits: [CSSClasses.overflowVisible],
            width: 'initial', minWidth: minWidthPropsDisplayerPx,
            right: ls.leftMarginInt + "px",
            top: ls.topMarginInt + "px",
            opacity: 1, transform: "translateX(0px)", "-webkit-transform": "translateX(0px)"
        };

        cssClasses[hiddenClassName + " ." + wrapperClassName] = {
            inherits: [CSSClasses.overflowHidden],
            width: '0px', minWidth: '0px',
            right: ls.leftMarginInt + "px",
            top: ls.topMarginInt + "px",
            opacity: 0, transform: "translateX(100%)", "-webkit-transform": "translateX(100%)"
        };

        cssClasses[toolBarClassName] = {
            inherits: [CSSClasses.lightBackground, CSSClasses.pointerEventsAll, CSSClasses.borderRadius2px, CSSClasses.positionRelative, CSSClasses.displayInlineBlock, CSSClasses.whiteSpaceNoWrap],
            verticalAlign: "bottom", height: propsToolBarButtonWidthPx, maxWidth: 'initial', width: "100%"
        };

        var contentCommon = {
            inherits: [CSSClasses.displayBlock, CSSClasses.overflowHidden],
            color: "white",
            //textShadow: "1px 1px 2px black",
            textShadow: "0px 0px 4px black",
            fontWeight: "600",
            background: "rgba(0, 0, 0, 0.2)"// lightBackground
        };

        cssClasses[contentClassName] = {
            inherits: [contentCommon],
            overflowY: "auto",
            maxHeight: "calc(" + maxFeaturePropsDisplayHeightPx + " - " + (propsToolBarButtonWidthInt * 2 + 12) + "px)",
            //marginTop: "2px",
            width: "calc(100% - 16px)",
            padding: "8px",
            paddingTop: "0px",
            paddingBottom: "4px"
        };

        var textShadowContentAU = "black 1px 1px 4px";
        var commonAU = {
            color: "white",
            fontSize: "120%",
            lineHeight: "120%",
            fontWeight: "600",
            textShadow: textShadowContentAU
        };

        cssClasses[contentClassName + " a"] = { inherits: [commonAU] };
        cssClasses[contentClassName + " u"] = { inherits: [commonAU] };

        cssClasses[ls.showingMapClassName + " ." + contentClassName + " img"] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding],
            boxShadow: "1px 1px 2px black",
            margin: "1px",
            marginTop: "6px",
            marginBottom: "-2px",
            borderRadius: "2px", padding: "2px"
        };

        cssClasses[ls.showingAerialClassName + " ." + contentClassName + " img"] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding],
            boxShadow: "1px 1px 2px yellow",
            margin: "1px",
            marginTop: "6px",
            marginBottom: "-2px",
            borderRadius: "2px", padding: "2px"
        };

        cssClasses[coordsButtonWrapperClassName] = { inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible, CSSClasses.positionRelative] };

        cssClasses[coordsButtonClassName] = {
            inherits: [CSSClasses.borderRadius2px, CSSClasses.baseTextButton, contentCommon],
            fontSize: ls.propsDisplayerCoordsButtonFontSizeInt + "px",
            lineHeight: ls.propsDisplayerCoordsButtonLineHeightInt + "px",
            fontWeight: "600",
            textShadow: darkTextShadow, color: darkTextColor,
            //background: lightBackgroundHalfOpaque,
            background: "rgba(255, 255, 255, 0.5)",
            height: (ls.propsDisplayerCoordsButtonLineHeightInt + 4) + 'px',
            border: 'none', marginTop: "2px", padding: "0px 0px", width: "calc(100% - " + (0) + "px)"
        };

        cssClasses[additionalButtonsClassName] = {
            inherits: [CSSClasses.displayInlineBlock, CSSClasses.borderRadius2px],
            marginLeft: "2px", paddingLeft: "2px", borderLeft: "1px solid " + darkTextColor,
            lineHeight: "100%", verticalAlign: "middle"
        };

        var buttonCommon = {
            inherits: [CSSClasses.baseImageButton, CSSClasses.verticalAlignMiddle, CSSClasses.displayInlineBlock, CSSClasses.borderRadius2px],
            border: "1px solid transparent", fill: darkTextColor, width: propsToolBarButtonWidthPx, height: propsToolBarButtonWidthPx, marginBottom: "2px"
        };

        cssClasses[closeButtonClassName] = { inherits: [buttonCommon, CSSClasses.closeButtonBackground] };
        cssClasses[directionsButtonClassName] = { inherits: [buttonCommon, CSSClasses.directionsButtonBackground2] };

        var textColorSearchProps = "#002255";
        var textTitle = {
            color: textColorSearchProps,
            textShadow: ls.lightTextShadow,
            overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "normal", maxWidth: "16rem",
            fontSize: ls.propsDisplayerTextFontSizeInt + "px",
            lineHeight: ls.propsDisplayerTextLineHeightInt + "px",
            //fontSize: "0.8rem",
            //lineHeight: "1rem",
            fontWeight: "400"
        };

        cssClasses[textClassName] = {
            inherits: [textTitle, contentCommon],
            backgroundColor: "transparent"
        };

        cssClasses[titleClassName] = {
            inherits: [textTitle],
            color: darkTextColor, textShadow: darkTextShadow,
            fontSize: ls.propsDisplayerTitleFontSizeInt + "px",
            lineHeight: ls.propsDisplayerTitleLineHeightInt + "px",
            //fontSize: "0.9rem",
            //lineHeight: "1.1rem",
            borderBottom: "1px solid gray", marginLeft: "-7px", marginTop: "2px", maxWidth: 'initial', width: "calc(100% + 6px)",
            borderRadius: "4px", paddingLeft: "4px", paddingRight: "4px", marginBottom: "2px", paddingTop: "2px", textAlign: "center", fontWeight: "800"
        };

        cssClasses[propsTextButtonClassName] = {
            inherits: [CSSClasses.verticalAlignMiddle, CSSClasses.baseTextButton, CSSClasses.noBorderNoPadding, CSSClasses.lightBackground, CSSClasses.darkTextColor],
            fontSize: ls.propsDisplayerTextButtonFontSizeInt + "px",
            lineHeight: ls.propsDisplayerTextButtonLineHeightInt + "px",
            //fontSize: "0.8rem",
            //lineHeight: "1.0rem",
            fontWeight: "500", marginLeft: "4px", marginRight: "4px", borderBottom: "1px solid " + lightBackground
        };

        cssClasses[mapFeaturePropsImageClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute, CSSClasses.leftTopZero, CSSClasses.WHOneHundred]
        };

        cssClasses[mapFeaturePropsImageWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative],
            textAlign: "center",
            height: ls.propsDisplayerImgHeightPxInt + "px",
            margin: "2px",
            marginBottom: "4px",
            border: "1px solid white"
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    function notify(eventName, props) { allEventDispatchers.Notify(eventName, tf.js.ShallowMerge(props, { sender: theThis, eventName: eventName, isVisible: isVisible })); }
    function notifyVisibilityChange() {
        return notify(visibilityChangeEventName, {
        });
    }

    var lcl;

    function initialize() {
        allEventDispatchers = new tf.events.MultiEventNotifier({ eventNames: [visibilityChangeEventName = "vis"] });
        cssTag = 'featurePropsDisplay';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

