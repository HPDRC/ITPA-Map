"use strict";

tf.TFMap.BaseLayersToolBar = function (settings) {
    var theThis, wrapper, mapWrapper, selectBaseLayersButton, perspectiveMapButton;

    this.GetWrapper = function () { return wrapper; }

    function getBaseLayersToolTipText() {
        var baseLayersPanel = settings.appContent.GetBaseLayersPanel();
        return !!baseLayersPanel ? baseLayersPanel.GetOpenCloseToolTip() : undefined;
    }

    function onClickBaseLayersButton() {
        var baseLayersPanel = settings.appContent.GetBaseLayersPanel();
        if (!!baseLayersPanel) { baseLayersPanel.SetVisible(!baseLayersPanel.GetIsVisible()); }
    }

    function onClickPerspectiveMapButton() { var perspectiveMap = getPerspectiveMap(); perspectiveMap.SetIsVisible(!getPerspectiveMapIsVisible()); }

    function getPerspectiveMapToolTipText() {
        var pText = '3D perspective view';
        var fText = '2D orthogonal view';
        var isPerspectiveMapVisible = getPerspectiveMapIsVisible();
        var topLine = ("displaying " + (isPerspectiveMapVisible ? pText : fText)) ;
        var botLine = ("switch to " + (isPerspectiveMapVisible ? fText : pText));
        return tf.TFMap.MapTwoLineSpan(topLine, botLine);
    }

    function updatePerspectiveMapButtonText() {
        var text = getPerspectiveMapIsVisible() ? "2D" : "3D";
        perspectiveMapButton.GetButton().innerHTML = text;
    }

    function getPerspectiveMap() { return settings.appContent.GetPerspectiveMap(); }

    function getPerspectiveMapIsVisible() { return getPerspectiveMap().GetIsVisible(); }

    function onPerspectiveMapVisibilityChange() { updatePerspectiveMapButtonText(); }

    function createControl() {
        var ls = tf.TFMap.LayoutSettings;
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var baseLayersPanel = appContent.GetBaseLayersPanel();
        var buttonLabel = !!baseLayersPanel ? baseLayersPanel.GetPanelNameShort() : "Layers";
        wrapper = new tf.dom.Div({ cssClass: wrapperClassName + " " + ls.aerialOrMapColorScheme });
        var delayMillis = tf.TFMap.toolTipDataSetDelayMillis;
        var toolTipClass = "center";
        var toolTipArrowClass = "left";
        var toolTipStyle = undefined;
        var buttonSettings = {
            wrapper: wrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass, toolTipStyle: toolTipStyle
        };

        var baseButtonClassName = buttonSVGClassName + " " + textButtonClassName + " ripple";
        var buttonAdded = false, buttonClassNameUse = baseButtonClassName;

        if (settings.usePerspectiveMap) {
            perspectiveMapButton = settings.appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
                onClick: onClickPerspectiveMapButton,
                buttonClass: buttonClassNameUse, toolTipText: getPerspectiveMapToolTipText,
                svgHTML: undefined//appStyles.GetLayersSVG()
            }));

            wrapper.AddContent(perspectiveMapButton.GetButton());

            if (!buttonAdded) { buttonAdded = true; buttonClassNameUse = buttonSpaceClassName + " " + buttonClassNameUse }
            appContent.GetPerspectiveMap().AddListener(tf.consts.perspectiveMapVisibilityChangeEvent, onPerspectiveMapVisibilityChange);
            updatePerspectiveMapButtonText();
        }

        if (settings.useBaseLayers) {
            selectBaseLayersButton = settings.appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
                onClick: onClickBaseLayersButton,
                buttonClass: buttonClassNameUse, toolTipText: getBaseLayersToolTipText,
                svgHTML: appStyles.GetLayersSVG()
            }));

            wrapper.AddContent(selectBaseLayersButton.GetButton());

            if (!buttonAdded) { buttonAdded = true; buttonClassNameUse = buttonSpaceClassName + " " + buttonClassNameUse }
        }
    }

    var cssTag, wrapperClassName, buttonClassName, buttonSVGClassName, textButtonClassName, buttonSpaceClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        buttonClassName = tf.TFMap.CreateClassName(cssTag, "Button");
        buttonSVGClassName = tf.TFMap.CreateClassName(cssTag, "ButtonSVG");
        textButtonClassName = tf.TFMap.CreateClassName(cssTag, "textButton");
        buttonSpaceClassName = tf.TFMap.CreateClassName(cssTag, "ButtonSpace");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var darkTextColor = ls.darkTextColor;
        var widthMapToolBarInt = ls.widthMapToolBarInt, widthMapToolBarPx = widthMapToolBarInt + 'px';
        var dimMapTypeAuxInt = ls.dimMapTypeAuxInt, dimMapTypeAuxPx = dimMapTypeAuxInt + "px";
        var dimMapTypeAuxMarginInt = ls.dimMapTypeAuxMarginInt, dimMapTypeAuxMarginPx = dimMapTypeAuxMarginInt + "px";
        var leftWrapper = ls.createAuxTypeMap ? (dimMapTypeAuxMarginInt + dimMapTypeAuxInt + ls.toolBarToToolBarHorSpacingInt) : (dimMapTypeAuxMarginInt);
        var leftWrapperPx = leftWrapper + 'px';

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.whiteSpaceNoWrap, CSSClasses.boxShadow002003, CSSClasses.pointerEventsAll, CSSClasses.positionAbsolute,
                CSSClasses.displayFlex, CSSClasses.flexFlowColumnNoWrap],
            borderRadius: "4px",
            left: leftWrapperPx,
            //zIndex: '' + (ls.rootDivZIndex + ls.baseLayersToolBarWrapperZIndexAdd),
            bottom: (ls.scaleLineHeightInt + ls.toolBarToScaleLineVerSpacingInt) + 'px',
            //bottom: "calc(100% + " + (dimMapTypeAuxMarginInt) + "px)",
            padding: "4px"
        };

        var svgDims = "calc(100% - 6px)"

        cssClasses[buttonSVGClassName] = { inherits: [CSSClasses.boxShadow002003, CSSClasses.displayBlock] };
        cssClasses[buttonSVGClassName + " svg"] = { width: svgDims, height: svgDims, margin: "auto" };
        cssClasses[buttonSVGClassName + ":hover"] = { border: "none" };

        cssClasses[buttonClassName] = {
            inherits: [CSSClasses.baseImageButton, CSSClasses.verticalAlignMiddle],
            height: widthMapToolBarPx
        };

        var marginLeftDisplace = "0px";

        var baseToolBarButton = { inherits: [CSSClasses.baseImageButton, CSSClasses.verticalAlignMiddle], width: widthMapToolBarPx, height: widthMapToolBarPx };

        cssClasses[textButtonClassName] = {
            inherits: [baseToolBarButton, CSSClasses.borderRadius2px],
            fontSize: ls.buttonTextFontSizeInt + 'px',
            lineHeight: ls.buttonTextFontSizeInt + 'px',
            color: 'inherit',
            fontWeight: "600",
            width: widthMapToolBarPx,
            height: widthMapToolBarPx,
            marginLeft: marginLeftDisplace
        };

        cssClasses[textButtonClassName + ":hover"] = {
            fontSize: (ls.buttonTextFontSizeInt + 2) + 'px',
            lineHeight: (ls.buttonTextFontSizeInt + 2) + 'px'
        }

        //var topMarginPx = ls.topMarginInt + 'px';

        cssClasses[buttonSpaceClassName] = {
            marginTop: "6px"
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        cssTag = 'baseLayersToolBar';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

