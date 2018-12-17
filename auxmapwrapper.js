"use strict";

tf.TFMap.AuxMapWrapper = function(settings) {
    var theThis, wrapper, mapWrapper, changeMapTypeButton;

    this.GetWrapper = function () { return wrapper; }

    this.GetMapWrapper = function () { return mapWrapper; }

    function getToolTipText() { return "Switch to " + settings.appContent.GetSwitchToMapTypeName() + " view"; }

    function checkButtonType() {
        tf.dom.ReplaceCSSClassCondition(wrapper, settings.appContent.GetIsShowingAerial(), notMapTypeClassName, mapTypeClassName);
    }

    function onClickButton() {
        settings.appContent.SwitchMapType();
        checkButtonType();
    }

    function createControl() {
        wrapper = new tf.dom.Div({ cssClass: wrapperClassName });
        var delayMillis = tf.TFMap.toolTipDataSetDelayMillis;
        var toolTipClass = "center";
        var toolTipArrowClass = "left";
        var toolTipStyle = undefined;
        var buttonSettings = {
            onClick: onClickButton, wrapper: wrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass, toolTipStyle: toolTipStyle
        };

        changeMapTypeButton = settings.appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            buttonClass: changeMapTypeButtonClassName + " ripple", toolTipText: getToolTipText
        }));

        checkButtonType();

        mapWrapper = new tf.dom.Div({ cssClass: mapWrapperClassName });

        wrapper.AddContent(mapWrapper, changeMapTypeButton.GetButton());
    }

    var cssTag, wrapperClassName, mapWrapperClassName, notMapTypeClassName, mapTypeClassName, changeMapTypeButtonClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        mapWrapperClassName = tf.TFMap.CreateClassName(cssTag, "MapWrapper");
        notMapTypeClassName = tf.TFMap.CreateClassName(cssTag, "NotMap");
        mapTypeClassName = tf.TFMap.CreateClassName(cssTag, "Map");
        changeMapTypeButtonClassName = tf.TFMap.CreateClassName(cssTag, "ChangeMapTypeButton");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var toolTipContentBackground = ls.toolTipContentBackground;
        var dimMapTypeAuxInt = ls.dimMapTypeAuxInt, dimMapTypeAuxPx = dimMapTypeAuxInt + "px";
        var dimMapTypeAuxMarginInt = ls.dimMapTypeAuxMarginInt, dimMapTypeAuxMarginPx = dimMapTypeAuxMarginInt + "px";
        var auxMapBorderDimPx = ls.auxMapBorderDimInt + 'px';

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.positionAbsolute, CSSClasses.overflowVisible, CSSClasses.pointerEventsAll, CSSClasses.boxShadow01403],
            left: dimMapTypeAuxMarginPx,
            //bottom: "calc(100% + " + (dimMapTypeAuxMarginInt) + "px)",
            bottom: (ls.scaleLineHeightInt + ls.toolBarToScaleLineVerSpacingInt) + 'px',
            zIndex: '' + (ls.rootDivZIndex + ls.auxMapWrapperZIndexAdd),
            width: dimMapTypeAuxPx,
            height: dimMapTypeAuxPx
        };

        cssClasses[mapWrapperClassName] = {
            inherits: [CSSClasses.positionAbsolute, CSSClasses.overflowVisible, CSSClasses.pointerEventsNone, CSSClasses.WHOneHundred, CSSClasses.leftTopZero]
        };

        cssClasses[notMapTypeClassName] = { border: auxMapBorderDimPx + " solid " + toolTipContentBackground };
        cssClasses[mapTypeClassName] = { border: auxMapBorderDimPx + " solid white" };

        cssClasses[changeMapTypeButtonClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.cursorPointer, CSSClasses.outline0, CSSClasses.verticalAlignMiddle, CSSClasses.listStyleNone,
            CSSClasses.overflowVisible, CSSClasses.positionAbsolute, CSSClasses.leftTopZero, CSSClasses.WHOneHundred],
            zIndex: '' + (ls.rootDivZIndex + ls.changeMapTypeButtonAddZIndex), color: 'inherit', background: 'inherit', boxShadow: 'none'
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }

    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        cssTag = 'auxMap';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

