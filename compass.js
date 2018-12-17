"use strict";

tf.TFMap.Compass = function(settings) {
    var theThis, cssTag, wrapper, clockWiseButton, resetButton, antiClockWiseButton;
    var wrapperClassName, antiClockButtonClassName, clockButtonClassName, clockAntiClockButtonClassName, compassButtonClassName, compassButtonSVGClassName;

    this.GetWrapper = function() { return wrapper; }

    function onButtonClicked(notification) {
        var diffRad, unit = 1;
        var appContent = settings.appContent, map = appContent.GetMap();
        switch (notification.sender) {
            case resetButton: map.AnimatedResetRotation(); break;
            case clockWiseButton: diffRad = unit; break;
            case antiClockWiseButton: diffRad = -unit; break;
        }
        if (diffRad != undefined) {
            var rotNow = map.GetRotationRad(), rotNew = rotNow + diffRad * Math.PI / 8;
            //var tolerance = 0.001;
            //if (diffRad > 0) { var lim = Math.PI; if (rotNew + tolerance >= lim) { rotNow -= lim; rotNew -= lim; map.SetRotationRad(rotNow); } }
            //else { var lim = -Math.PI; if (rotNew - tolerance <= lim) { rotNow += lim; rotNew += lim; map.SetRotationRad(rotNow); } }
            map.AnimatedSetRotation(rotNew);
        }
    }

    function makeFullToolTip(toolTipStr) {
        var topLine = 'Shift + Alt + mouse drag rotates the map';
        return tf.TFMap.MapTwoLineSpan(topLine, toolTipStr);
    }

    function createControl() {
        var ls = tf.TFMap.LayoutSettings;
        wrapper = new tf.dom.Div({ cssClass: wrapperClassName + " " + ls.aerialOrMapColorScheme });

        var appContent = settings.appContent;
        var delayMillis = tf.TFMap.toolTipDelayMillis;
        var toolTipClass = "*start";
        var toolTipArrowClass = "bottom";
        var buttonSettings = {
            onClick: onButtonClicked, onHover: undefined, wrapper: wrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        var buttonsAdded = false;

        if (!!settings.compassButtons) {

            antiClockWiseButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
                svgHTML: appContent.GetAppStyles().GetArrowDownFlipSVG(),
                buttonClass: clockAntiClockButtonClassName + " " + antiClockButtonClassName + " ripple", toolTipText: makeFullToolTip("Rotate Counter-clockwise")
            }));
            resetButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
                svgHTML: appContent.GetAppStyles().GetCompassSVG(),
                buttonClass: compassButtonSVGClassName + " " + compassButtonClassName + " ripple", toolTipText: makeFullToolTip("Reset Rotation")
            }));
            clockWiseButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
                svgHTML: appContent.GetAppStyles().GetArrowDownSVG(),
                buttonClass: clockAntiClockButtonClassName + " " + clockButtonClassName + " ripple", toolTipText: makeFullToolTip("Rotate Clockwise")
            }));
            buttonsAdded = true;
            wrapper.AddContent(antiClockWiseButton.GetButton(), resetButton.GetButton(), clockWiseButton.GetButton());
        }

        if (!buttonsAdded) {
            var ls = tf.TFMap.LayoutSettings;
            var wrapperE = wrapper.GetHTMLElement(), wrapperES = wrapperE.style;
            wrapperES.width = "1px";
            wrapperES.padding = wrapperES.margin = wrapperES.border = "0px";
            wrapperES.marginRight = -(ls.toolBarToToolBarHorSpacingInt) + "px"
        }

        rotateCompassButton();
    }

    function rotateCompassButton() { if (!!resetButton) { tf.GetStyles().RotateByDegree(resetButton.GetButton(), settings.appContent.GetMap().GetRotationDeg()); } }

    function onMapRotationChanged(notification) { rotateCompassButton(); }

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        clockAntiClockButtonClassName = tf.TFMap.CreateClassName(cssTag, "ClockAntiClockButton");
        compassButtonClassName = tf.TFMap.CreateClassName(cssTag, "CompassButton");
        compassButtonSVGClassName = tf.TFMap.CreateClassName(cssTag, "CompassButtonSVG");
        antiClockButtonClassName = tf.TFMap.CreateClassName(cssTag, "AntiClockButton");
        clockButtonClassName = tf.TFMap.CreateClassName(cssTag, "ClockButton");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var widthMapToolBarInt = ls.widthMapToolBarInt, widthMapToolBarPx = widthMapToolBarInt + 'px';
        var clockAntiClockSVGDims = "calc(100% - 9px)";

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.whiteSpaceNoWrap, CSSClasses.boxShadow002003, CSSClasses.pointerEventsAll, CSSClasses.positionAbsolute],
            borderRadius: "4px",
            //bottom: ls.topMarginInt + 'px',
            bottom: "0px",  // anchored to other toolbar
            right: (ls.widthMapToolBarInt + ls.leftMarginInt + ls.toolBarToToolBarHorSpacingInt) + "px",
            padding: "2px"
        };

        cssClasses[clockAntiClockButtonClassName] = {
            inherits: [CSSClasses.boxShadow002003, CSSClasses.baseImageButton, CSSClasses.verticalAlignMiddle, CSSClasses.displayInlineBlock],
            width: Math.floor(widthMapToolBarInt / 1.6) + "px",
            height: widthMapToolBarPx
        };

        cssClasses[clockAntiClockButtonClassName + " svg"] = { width: clockAntiClockSVGDims, height: clockAntiClockSVGDims };
        cssClasses[clockAntiClockButtonClassName + ":hover"] = { border: "none" };

        cssClasses[antiClockButtonClassName] = { marginRight: "4px", marginLeft: "2px" };
        cssClasses[clockButtonClassName] = { marginLeft: "4px", marginRight: "2px" };

        cssClasses[compassButtonSVGClassName] = { inherits: [CSSClasses.boxShadow002003, CSSClasses.displayInlineBlock] };
        cssClasses[compassButtonSVGClassName + " svg"] = { width: "calc(100% - 1px)", height: "calc(100% - 1px)" };
        cssClasses[compassButtonSVGClassName + ":hover"] = { border: "none" };

        cssClasses[compassButtonClassName] = {
            inherits: [CSSClasses.baseImageButton, CSSClasses.verticalAlignMiddle],
            borderRadius: "50%", marginLeft: "4px", marginRight: "4px", width: widthMapToolBarPx, height: widthMapToolBarPx
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl, mapRotationListener;

    function initialize() {
        cssTag = 'mapCompass';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        var appContent = settings.appContent;
        lcl = appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
        mapRotationListener = appContent.GetMap().AddListener(tf.consts.mapRotationChangeEvent, onMapRotationChanged);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

