"use strict";

tf.TFMap.BottomPane = function(settings) {
    var theThis, cssTag, paneWrapper, paneContent, underBottomWrapper;
    var upClassName, downClassName, fullWidthClassName, widthWithSidePanelClassName, underBottomWrapperClassName;

    this.GetPositionClasses = function() { return { upClassName: upClassName, downClassName: downClassName, fullWidthClassName: fullWidthClassName, widthWithSidePanelClassName: widthWithSidePanelClassName }; }
    this.GetContentPane = function() { return paneContent; }
    this.GetWrapper = function() { return paneWrapper; }
    this.GetUnderBottomWrapper = function() { return underBottomWrapper; }

    function createControl() {
        paneWrapper = new tf.dom.Div({ cssClass: wrapperClassName });
        paneContent = new tf.dom.Div({ cssClass: contentClassName });
        underBottomWrapper = new tf.dom.Div({ cssClass: underBottomWrapperClassName });
        paneContent.AddContent(underBottomWrapper);
        paneContent.AddContent();
        paneWrapper.AddContent(paneContent);
    }

    var wrapperClassName, contentClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        contentClassName = tf.TFMap.CreateClassName(cssTag, "Content");
        underBottomWrapperClassName = tf.TFMap.CreateClassName(cssTag, "UnderBottomWrapper");
        upClassName = tf.TFMap.CreateClassName(cssTag, "Up");
        downClassName = tf.TFMap.CreateClassName(cssTag, "Down");
        fullWidthClassName = tf.TFMap.CreateClassName(cssTag, "FullWidth");
        widthWithSidePanelClassName = tf.TFMap.CreateClassName(cssTag, "WithSidePanel");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var underBottomPaneHeightInt = ls.underBottomPaneHeightInt, underBottomPaneHeightPx = underBottomPaneHeightInt + 'px';
        var marginBottomWrapperInt = ls.marginBottomBottomPaneWrapperInt, marginBottomWrapperPx = marginBottomWrapperInt + 'px';
        var sidePanelWidthInt = ls.sidePanelWidthInt, sidePanelWidthPx = sidePanelWidthInt + 'px';

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.zIndex1, CSSClasses.transitionPoint2s, CSSClasses.displayBlock, CSSClasses.overflowVisible,
            CSSClasses.backgroundColorTransparent, CSSClasses.cursorDefault, CSSClasses.pointerEventsNone,
            CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute],
            height: "1px"
        };

        cssClasses[contentClassName] = {
            inherits: [CSSClasses.pointerEventsNone, CSSClasses.WHOneHundred, CSSClasses.displayBlock, CSSClasses.overflowShow,
            CSSClasses.backgroundColorTransparent, CSSClasses.cursorDefault, CSSClasses.noMarginNoBorderNoPadding,
            CSSClasses.positionAbsolute, CSSClasses.leftTopZero, CSSClasses.zIndex1]
        };

        cssClasses[underBottomWrapperClassName] = {
            inherits: [CSSClasses.transitionPoint2s, CSSClasses.displayBlock, CSSClasses.overflowVisible, CSSClasses.backgroundColorTransparent,
            CSSClasses.cursorDefault, CSSClasses.pointerEventsNone, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute],
            zIndex: '' + (ls.rootDivZIndex + ls.underBottomWrapperZIndexAdd),
            bottom: marginBottomWrapperPx, top: "calc(100% + " + marginBottomWrapperPx + ")", left: "0px", height: underBottomPaneHeightPx, width: "100%"
        };

        cssClasses[upClassName + " ." + wrapperClassName] = { bottom: (underBottomPaneHeightInt + marginBottomWrapperInt) + 'px' };
        cssClasses[downClassName + " ." + wrapperClassName] = { bottom: marginBottomWrapperPx };

        cssClasses[fullWidthClassName + " ." + wrapperClassName] = { inherits: [CSSClasses.WOneHundred], left: "0px" };
        cssClasses[widthWithSidePanelClassName + " ." + wrapperClassName] = { width: "calc(100% - " + sidePanelWidthPx + ")", left: sidePanelWidthPx };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        cssTag = 'bottomPane';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

