"use strict";

tf.TFMap.SidePane = function(settings) {
    var theThis, cssTag, paneWrapper, paneContent, toggleButton, isVisible;

    this.GetContentPane = function() { return paneContent; }
    this.GetWrapper = function() { return paneWrapper; }
    this.CheckIsVisible = function() { return checkIsVisible(); }

    function onToggleButtonClick(notification) { settings.appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_sidePanelVisible, toggleButton.GetIsToggled()); }

    function getToggleButtonToolTipText() { var verbStr = isVisible ? "Collapse" : "Expand"; return verbStr + " side panel"; }

    function getShouldBeVisible() { return settings.appContent.GetAppCtx().GetCtxAttribute(tf.TFMap.CAN_sidePanelVisible); }

    function setVisible(isVisibleSet) {
        tf.dom.ReplaceCSSClassCondition(paneWrapper, isVisible = isVisibleSet, visibleClassName, collapsedClassName);
        toggleButton.SetIsToggled(isVisible);
    }

    function checkIsVisible() { var shouldBeVisible = getShouldBeVisible(); if (isVisible != shouldBeVisible) { setVisible(shouldBeVisible); } }

    function createControl() {
        var appContent = settings.appContent;
        var shouldBeVisible = getShouldBeVisible();
        var toggleButtonWrapper = new tf.dom.Div({ cssClass: toggleButtonWrapperClassName });
        var delayMillis = 0;
        var toolTipClass = "center";
        var toolTipArrowClass = "left";
        var toolTipStyle = undefined;
        var ls = tf.TFMap.LayoutSettings;

        var buttonSettings = {
            onClick: onToggleButtonClick, onHover: undefined, wrapper: toggleButtonWrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass, toolTipStyle: toolTipStyle
        };

        paneWrapper = new tf.dom.Div({ cssClass: wrapperClassName });
        paneContent = new tf.dom.Div({ cssClass: contentClassName });

        toggleButton = appContent.CreateToggleButton(tf.js.ShallowMerge(buttonSettings, {
            offsetX: 4,
            buttonClass: toggleButtonClassName + " ripple", classToggled: ls.arrowLeftBackgroundClassName, classNotToggled: ls.arrowRightBackgroundClassName,
            isToggled: shouldBeVisible, toolTipText: getToggleButtonToolTipText
        }));

        toggleButtonWrapper.AddContent(toggleButton.GetButton());
        paneWrapper.AddContent(paneContent, toggleButtonWrapper);
        setVisible(shouldBeVisible);
    }

    var wrapperClassName, contentClassName, collapsedClassName, visibleClassName, toggleButtonWrapperClassName, toggleButtonClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        contentClassName = tf.TFMap.CreateClassName(cssTag, "Content");
        collapsedClassName = tf.TFMap.CreateClassName(cssTag, "Collapsed");
        visibleClassName = tf.TFMap.CreateClassName(cssTag, "Visible");
        toggleButtonWrapperClassName = tf.TFMap.CreateClassName(cssTag, "ToggleButtonWrapper");
        toggleButtonClassName = tf.TFMap.CreateClassName(cssTag, "ToggleButton");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var sidePanelWidthInt = ls.sidePanelWidthInt, sidePanelWidthPx = sidePanelWidthInt + 'px';
        var sidePaneLeftMarginInt = ls.leftMarginInt;
        var sidePanelTopMarginInt = ls.topMarginInt, sidePanelTopMarginPx = sidePanelTopMarginInt + 'px';
        var lightBackground = ls.lightBackground;
        var toggleButtonHeightPx = ls.toggleButtonHeightInt + 'px';

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.transitionPoint2s, CSSClasses.leftTopZero, CSSClasses.HOneHundred, CSSClasses.displayBlock, CSSClasses.overflowVisible,
            CSSClasses.backgroundColorTransparent, CSSClasses.cursorDefault, CSSClasses.pointerEventsNone, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute],
            zIndex: '' + (ls.rootDivZIndex + ls.sidePaneWrapperZIndexAdd),
            width: sidePanelWidthPx
        };

        cssClasses[contentClassName] = {
            inherits: [CSSClasses.pointerEventsNone, CSSClasses.WHOneHundred, CSSClasses.displayBlock, CSSClasses.overflowShow, CSSClasses.backgroundColorTransparent,
            CSSClasses.cursorDefault, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute, CSSClasses.leftTopZero, CSSClasses.zIndex1]
        };

        cssClasses[collapsedClassName] = {
            transform: "translateX(-" + (sidePanelWidthInt /*+ sidePaneLeftMarginInt*/) + "px)",
            "-webkit-transform": "translateX(-" + (sidePanelWidthInt /*+ sidePaneLeftMarginInt*/) + "px)"
        };

        cssClasses[visibleClassName] = {
            transform: "translateX(0px)",
            "-webkit-transform": "translateX(0px)"
        };

        cssClasses[toggleButtonWrapperClassName] = {
            inherits: [CSSClasses.borderRadius2px, CSSClasses.pointerEventsAll, CSSClasses.whiteSpaceNoWrap, CSSClasses.displayBlock, CSSClasses.overflowVisible, CSSClasses.cursorDefault,
            CSSClasses.noMargin, CSSClasses.noPadding, CSSClasses.positionAbsolute, CSSClasses.zIndex1],
            left: "calc(100% + 1px)", top: sidePanelTopMarginPx, background: lightBackground
        };

        cssClasses[toggleButtonClassName] = {
            inherits: [CSSClasses.borderRadius2px, CSSClasses.baseImageButton, CSSClasses.borderLeftD4, CSSClasses.boxShadow01403, CSSClasses.overflowHidden],
            width: "23px", height: toggleButtonHeightPx
        };

        cssClasses[toggleButtonClassName + ":hover"] = {
            border: "1px solid rgba(0,48,118,0.4)"
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        cssTag = 'sidePane';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

