"use strict";

tf.TFMap.MapToolBar = function(settings) {
    var theThis, wrapper, geolocationButton, zoomInPlusButton, zoomOutMinusButton;
    var cssTag, wrapperClassName, toolBarButtonClassName;
    var geolocationButtonClassName, zoomInButtonClassName, zoomOutButtonClassName;
    var separatorMarginBottomClassName;

    this.GetWrapper = function() { return wrapper; }

    function onLevelChangeEnded() {
        setTimeout(function() { settings.appContent.OnMapLevelChange(); }, 0);
    }

    function onButtonClicked(notification) {
        var zoomDiff;
        switch (notification.sender) {
            case zoomInPlusButton: zoomDiff = 1; break;
            case zoomOutMinusButton: zoomDiff = -1; break;
            case geolocationButton:
                settings.appContent.ShowUserLocation();
                break;
        }
        if (zoomDiff != undefined) {
            var map = settings.appContent.GetMap();
            var newLevel = map.GetLevel() + zoomDiff;
            if (newLevel >= tf.TFMap.MinMapLevel && newLevel <= tf.TFMap.MaxMapLevel) { map.AnimatedSetLevel(newLevel, onLevelChangeEnded, 200, undefined); }
        }
    }

    function createControl() {
        var ls = tf.TFMap.LayoutSettings;
        wrapper = new tf.dom.Div({ cssClass: wrapperClassName + " " + ls.aerialOrMapColorScheme });

        var appContent = settings.appContent;
        var delayMillis = tf.TFMap.toolTipDelayMillis;
        var toolTipClass = "center";
        var toolTipArrowClass = "right";
        var buttonSettings = {
            onClick: onButtonClicked, onHover: undefined, wrapper: wrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };
        var buttonsAdded = false;

        if (!!settings.userLocation) {
            var classNamesGeoLocationButton = geolocationButtonClassName;
            if (!!settings.zoom) { classNamesGeoLocationButton += " " + separatorMarginBottomClassName; }
            geolocationButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
                svgHTML: appContent.GetAppStyles().GetGeolocationSVG(),
                buttonClass: toolBarButtonClassName + " " + classNamesGeoLocationButton + " ripple", toolTipText: "Show Your Location"
            }));
            wrapper.AddContent(geolocationButton.GetButton());
            buttonsAdded = true;
        }
        if (!!settings.zoom) {
            zoomInPlusButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
                svgHTML: appContent.GetAppStyles().GetAddSVG(),
                buttonClass: toolBarButtonClassName + " " + zoomInButtonClassName + " ripple", toolTipText: "Zoom In"
            }));
            zoomOutMinusButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
                svgHTML: appContent.GetAppStyles().GetMinusSVG(),
                buttonClass: toolBarButtonClassName + " " + zoomOutButtonClassName + " ripple", toolTipText: "Zoom Out"
            }));
            wrapper.AddContent(zoomInPlusButton.GetButton(), zoomOutMinusButton.GetButton());
            buttonsAdded = true;
        }

        if (!buttonsAdded) {
            var ls = tf.TFMap.LayoutSettings;
            var wrapperE = wrapper.GetHTMLElement(), wrapperES = wrapperE.style;
            wrapperES.width = "1px";
            wrapperES.padding = wrapperES.margin = wrapperES.border = "0px";
            wrapperES.marginRight = -(ls.widthMapToolBarInt /*- ls.leftMarginInt */ + ls.toolBarToToolBarHorSpacingInt) + "px";
        }
    }

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        toolBarButtonClassName = tf.TFMap.CreateClassName(cssTag, "ToolBarButton");
        geolocationButtonClassName = tf.TFMap.CreateClassName(cssTag, "GeoLocationButton");
        zoomInButtonClassName = tf.TFMap.CreateClassName(cssTag, "ZoomInButton");
        zoomOutButtonClassName = tf.TFMap.CreateClassName(cssTag, "ZoomOutButton");
        separatorMarginBottomClassName = tf.TFMap.CreateClassName(cssTag, "SeparatorMarginBottom");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var widthMapToolBarInt = ls.widthMapToolBarInt, widthMapToolBarPx = widthMapToolBarInt + 'px';
        var rightMarginInt = ls.leftMarginInt, rightMarginPx = rightMarginInt + "px";
        var bottomMarginInt = ls.topMarginInt, bottomMarginPx = bottomMarginInt + "px";
        var marginBottomMapToolBarInt = 6, marginBottomMapToolBar = marginBottomMapToolBarInt + "px";
        var svgDims = "calc(100% - 10px)";

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.boxShadow002003, CSSClasses.borderRadius2px, CSSClasses.pointerEventsAll, CSSClasses.positionAbsolute],
            bottom: bottomMarginPx, right: rightMarginPx, padding: "4px"
        };

        cssClasses[toolBarButtonClassName] = { inherits: [CSSClasses.borderRadius2px, CSSClasses.boxShadow002003, CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap] };
        cssClasses[toolBarButtonClassName + " svg"] = { width: svgDims, height: svgDims, margin: "auto" };
        cssClasses[toolBarButtonClassName + ":hover"] = { border: "none" };

        var baseToolBarButton = { inherits: [CSSClasses.baseImageButton, CSSClasses.verticalAlignMiddle], width: widthMapToolBarPx, height: widthMapToolBarPx };

        cssClasses[geolocationButtonClassName] = { inherits: [baseToolBarButton] };
        cssClasses[separatorMarginBottomClassName] = { marginBottom: (marginBottomMapToolBarInt * 3) + 'px' };
        cssClasses[zoomInButtonClassName] = { inherits: [baseToolBarButton], marginBottom: marginBottomMapToolBar };
        cssClasses[zoomOutButtonClassName] = { inherits: [baseToolBarButton] };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        cssTag = 'mapToolBar';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

