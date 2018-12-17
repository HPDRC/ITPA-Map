"use strict";

tf.TFMap.DirectionsAddress = function(settings) {
    var theThis, wrapper, inputBoxWrapperIsInHover, inputBoxWrapper, inputBox, inputBoxHasFocus, searchButton, inputBoxWrapperHoverListener, inputBoxBoxFocusListener, inputBoxWrapperClickListener, placeHolder;
    var value, inputFade;
    var lastGeoCoder, lastRevGeoCoder;
    var geoCoderCount, revGeocoderCount;
    var isInError;
    var isSwappingValue, isSettingValue;
    var lastIsValid;
    var mapFeatureIconWrapper, mapFeatureIconButton;
    var delayedRevGeoCode;

    this.SetSelected = function() {
        if (theThis.GetIsValid()) {
            var coords = value.coords.slice(0);
            settings.appContent.MakeSureMapCoordsAreVisible(coords);
            flashCoords(coords);
        }
        inputBox.GetInputBox().focus();
    }

    this.GetSettings = function() { return settings; }
    this.GetPlaceHolder = function() { return settings.placeHolder; }

    this.GetValueForSwap = function() { return { value: value, inputBoxText: inputBox.GetText(), isInError: isInError }; }
    this.SetValueForSwap = function(valueForSwap) { isSwappingValue = true; value = valueForSwap.value; inputBox.SetText(valueForSwap.inputBoxText); isInError = valueForSwap.isInError; showIsInError(); isSwappingValue = false; }

    this.GetInputText = function() { return inputBox.GetText(); }
    this.GetHasInputText = function() { return theThis.GetInputText().length > 0; }

    this.GetIsValid = function() { lastIsValid = value != undefined && inputBox.GetUnTrimText() == value.address && value.coords !== undefined; return lastIsValid; }
    this.GetIsInError = function() { return isInError; }

    this.SetValue = function(newValue) {
        isSettingValue = true;
        clearIsInError();
        if (newValue != undefined) {
            if (newValue.coords === undefined) { lastIsValid = false; }
            value = { address: newValue.address, coords: newValue.coords ? newValue.coords.slice(0) : undefined };
            inputBox.SetText(value.address);
        }
        else {
            value = undefined;
            inputBox.SetText("");
        }
        showIsInError();
        isSettingValue = false;
    }

    this.GetValue = function() { return tf.js.ShallowMerge(value); }

    this.GetWrapper = function() { return wrapper; }

    this.GetHasCoords = function(coords) {
        return value != undefined &&
            value.coords[0] == coords[0] &&
            value.coords[1] == coords[1];
    }

    this.Geocode = function() {
        var inputBoxText = inputBox.GetText();
        if (tf.js.GetIsNonEmptyString(inputBoxText)) {
            cancelGeoCoders();
            lastGeoCoder = new tf.services.Geocoder({ callBack: onGeocoded, address: inputBoxText, requestProps: { address: inputBoxText, geoCoderCount: ++geoCoderCount } });
        }
    }

    this.RevGeocode = function() { delayedRevGeoCode.DelayCallBack(); }

    function doRevGeoCode() {
        if (value != undefined) {
            cancelGeoCoders();
            var props = { coords: value.coords, revGeocoderCount: ++revGeocoderCount };
            lastRevGeoCoder = new tf.services.TFReverseGeocoder({ callBack: onRevGeocoded, pointCoords: value.coords, requestProps: props, getJSON: true });
        }
    }

    function clearIsInError() {
        if (isInError) { isInError = false; showIsInError(); }
    }

    function setIsInError() {
        if (!isInError) { isInError = true; showIsInError(); notifyInputChange(); }
    }

    function showIsInError() {
        var isValid = theThis.GetIsValid();
        var errorClass = inputErrorClassName;
        var validClass = inputValidClassName;
        var okClass = inputOKClassName;
        var classesIn = isInError ? errorClass : (isValid ? validClass : okClass);
        var classesOut = isInError ? okClass + " " + validClass : (isValid ? errorClass + " " + okClass : errorClass + " " + validClass);
        var classNameVisible = settings.itemVisibleClassName, classNameHidden = settings.itemHiddenClassName;
        lastIsValid = isValid;
        tf.dom.ReplaceCSSClassCondition(inputBox.GetInputBox(), true, classesIn, classesOut);
        tf.dom.ReplaceCSSClassCondition(mapFeatureIconWrapper, isValid, classNameVisible, classNameHidden);
    }

    function cancelGeoCoders() {
        if (!!lastGeoCoder) { lastGeoCoder.Cancel(); lastGeoCoder = undefined; }
        if (!!lastRevGeoCoder) { lastRevGeoCoder.Cancel(); lastRevGeoCoder = undefined; }
    }

    function onGeocoded(notification) {
        if (lastGeoCoder != undefined) {
            lastGeoCoder = undefined;
            if (tf.js.GetIsValidObject(notification) && notification.geocoderAccuracy > 0 && notification.geocoderAccuracy < 4) {
                if (notification.requestProps.geoCoderCount == geoCoderCount) {
                    if (!theThis.GetIsValid()) {
                        theThis.SetValue({ address: notification.requestProps.address, coords: notification.pointCoords });
                    }
                }
            }
            else { setIsInError(); }
        }
    }

    function onRevGeocoded(notification) {
        //console.log('rev geocoded returned');
        if (notification.sender.WasCancelled()) {
            //console.log('rev geocode had been cancelled');
            return;
        }
        if (lastRevGeoCoder != undefined) {
            lastRevGeoCoder = undefined;
            if (tf.js.GetIsValidObject(notification) && notification.success) {
                //console.log('rev geocoded ok');
                if (notification.requestProps.revGeocoderCount == revGeocoderCount) {
                    var fullAddr = notification.address;
                    if (tf.js.GetIsNonEmptyString(fullAddr)) { theThis.SetValue({ address: fullAddr, coords: notification.requestProps.coords }); } else { setIsInError(); }
                }
            }
            else {
                //console.log(JSON.stringify(notification));
                setIsInError();
            }
        }
        else {
            //console.log('lastRevGeoCoder is undefined!');
        }
    }

    function notify(cb, extraParams) { if (tf.js.GetFunctionOrNull(cb)) { cb(tf.js.ShallowMerge({ sender: theThis }, extraParams)) } }

    function notifyInputChange(notification) {
        if (!(isSwappingValue /*|| isSettingValue*/)) {
            notify(settings.onInputChange, { notification: notification });
        }
    }

    function onInputChange(notification) {
        if (!!lastIsValid) {
            showIsInError();
        }
        else {
            clearIsInError();
            showIsInError();
        }
        notifyInputChange(notification);
    }

    function onGo() {
        notify(settings.onGo);
    }

    function createSVGButton(buttonSettings, svgHTML, buttonClass, toolTipText, svgAddClasses, modeVerb) {
        var button = settings.appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            svgHTML: svgHTML,
            buttonClass: buttonClass, toolTipText: toolTipText
        }));
        button.GetSettings().modeVerb = modeVerb;
        var buttonSVG = button.GetButton().firstChild;
        tf.dom.AddCSSClass(buttonSVG, svgAddClasses);
        return button;
    }

    function onHoverInputBoxWrapper(notification) {
        var target = notification.event.target;
        if (target == inputBoxWrapper.GetHTMLElement()) {
            inputBoxWrapperIsInHover = notification.isInHover;
            if (!inputBoxHasFocus) { showFocusedStyles(false); }
        }
    }

    function showFocusedStyles(showBool) {
        tf.dom.ReplaceCSSClassCondition(inputBoxWrapper, showBool, inputFocusedClassName, inputNonFocusedClassName);
    }

    function setFocusToInput() { inputBox.GetInputBox().focus(); }

    function onFocusInputBoxBox(notification) {
        var hasFocus = notification.hasFocus;
        var target = notification.event.target;
        var targetIsInputBox = target == inputBox.GetInputBox();
        if (targetIsInputBox /*|| targetIsSearchButton*/) {
            var activeElement = document.activeElement;
            inputBoxHasFocus = hasFocus || activeElement == searchButton.GetButton();
            if (inputBoxHasFocus) { showFocusedStyles(true); }
            else if (!inputBoxWrapperIsInHover) { showFocusedStyles(false); }
        }
    }

    function onClickInputBoxWrapper(notification) {
        var target = notification.event.target;
        if (target == inputBoxWrapper.GetHTMLElement()) { setFocusToInput(); }
    }

    function flashCoords(coords) { var appContent = settings.appContent; appContent.GetAppStyles().FlashCoords(appContent.GetMap(), [coords], "#0f0"); }

    function onButtonClicked(notification) {
        var button = notification.sender;
        setFocusToInput();
        switch (button) {
            case searchButton:
                onGo();
                break;
            case mapFeatureIconButton:
                if (theThis.GetIsValid()) {
                    var coords = value.coords.slice(0);
                    settings.appContent.AnimatedSetCenterIfDestVisible(coords);
                    setTimeout(function() { flashCoords(coords); }, 500);
                }
                break;
        }
    }

    function getSearchToolTip() {
        return inputBox.GetText().length > 0 ? "Search" : placeHolder;
    }

    function createControl() {
        wrapper = new tf.dom.Div({ cssClass: wrapperClassName });

        var appContent = settings.appContent;
        var appStyles = appContent.GetAppStyles();
        var delayMillis = tf.TFMap.toolTipDelayMillis;
        var toolTipClass = "end";
        var toolTipArrowClass = "top";

        inputBoxWrapper = new tf.dom.Div({ cssClass: inputWrapperClassName + " " + inputNonFocusedClassName });

        var buttonSettings = {
            offsetY: 6, onClick: onButtonClicked, onHover: undefined, wrapper: inputBoxWrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        placeHolder = "Search " + settings.placeHolder + " or select it on map";

        inputBox = new tf.TFMap.InputBox({
            id: settings.id,
            autocomplete: settings.autocomplete,
            onChange: onInputChange, onGo: onGo, placeHolder: placeHolder, className: inputClassName, maxLength: tf.TFMap.maxCharsAddressInput
        });

        inputFade = new tf.dom.Div({ cssClass: inputFadeClassName });

        buttonSettings.toolTipClass = "start";

        searchButton = createSVGButton(buttonSettings, appStyles.GetSearchSVG(),
            buttonBaseClassName + " " + searchButtonClassName + " rippleWhite",
            getSearchToolTip,
            searchButtonSVGClassName, tf.TFMap.directionModeDrive);

        showIsInError();

        var inputBoxBox = inputBox.GetInputBox();

        inputBoxWrapper.AddContent(inputBoxBox, inputFade, searchButton.GetButton());

        buttonSettings.toolTipClass = "end";

        mapFeatureIconWrapper = new tf.dom.Div({
            cssClass: mapFeatureIconWrapperClassName + " " + settings.itemHiddenClassName
        });
        mapFeatureIconButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            buttonClass: mapFeatureIconButtonClassName + " ripple", toolTipText: "Center map to " + settings.placeHolder
        }));

        var mapFeatureIconButtonButton = mapFeatureIconButton.GetButton();
        mapFeatureIconButtonButton.appendChild(settings.mapFeatureIcon);
        mapFeatureIconWrapper.AddContent(mapFeatureIconButtonButton);

        wrapper.AddContent(mapFeatureIconWrapper, inputBoxWrapper);

        inputBoxWrapperClickListener = new tf.events.DOMClickListener({ target: inputBoxWrapper, callBack: onClickInputBoxWrapper, optionalScope: theThis, callBackSettings: null });
        inputBoxWrapperHoverListener = new tf.events.DOMMouseEnterLeaveListener({ target: inputBoxWrapper, callBack: onHoverInputBoxWrapper, optionalScope: theThis, callBackSettings: null });
        inputBoxBoxFocusListener = new tf.events.DOMFocusBlurListener({ target: inputBox.GetInputBox(), callBack: onFocusInputBoxBox, optionalScope: theThis, callBackSettings: null });
    }

    var cssTag, wrapperClassName, inputWrapperClassName, inputClassName, inputFocusedClassName, inputNonFocusedClassName, inputValidClassName, inputOKClassName, inputErrorClassName,
        inputFadeClassName, searchButtonClassName, searchButtonSVGClassName, buttonBaseClassName, mapFeatureIconWrapperClassName, mapFeatureIconButtonClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        inputClassName = tf.TFMap.CreateClassName(cssTag, "Input");
        inputFocusedClassName = tf.TFMap.CreateClassName(cssTag, "InputFocused");
        inputNonFocusedClassName = tf.TFMap.CreateClassName(cssTag, "InputNonFocused");
        inputWrapperClassName = tf.TFMap.CreateClassName(cssTag, "InputWrapper");
        inputValidClassName = tf.TFMap.CreateClassName(cssTag, "InputValid");
        inputOKClassName = tf.TFMap.CreateClassName(cssTag, "InputOK");
        inputErrorClassName = tf.TFMap.CreateClassName(cssTag, "InputError");
        inputFadeClassName = tf.TFMap.CreateClassName(cssTag, "InputFade");
        buttonBaseClassName = tf.TFMap.CreateClassName(cssTag, "Button");
        searchButtonClassName = tf.TFMap.CreateClassName(cssTag, "SearchButton");
        searchButtonSVGClassName = tf.TFMap.CreateClassName(cssTag, "SearchButtonSVG");
        mapFeatureIconWrapperClassName = tf.TFMap.CreateClassName(cssTag, "mapFeatureIconWrapper");
        mapFeatureIconButtonClassName = tf.TFMap.CreateClassName(cssTag, "mapFeatureIconButton");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var darkTextColor = ls.darkTextColor, darkTextShadow = ls.darkTextShadow;
        var livelyColor = ls.backgroundLivelyColor;
        var sidePanelWidthInt = ls.sidePanelWidthInt, sidePaneWidthPx = sidePanelWidthInt + 'px';

        var paddingLeftWayPointAddressInt = ls.paddingLeftWayPointAddressInt, paddingLeftWayPointAddressPx = paddingLeftWayPointAddressInt + 'px';
        var heightWayPointAddressInt = ls.directionsHeightWayPointAddressInt, heightWayPointAddressPx = heightWayPointAddressInt + 'px';

        var directionxWayPointInputLeftInt = paddingLeftWayPointAddressInt;
        var directionxWayPointInputLeftPx = directionxWayPointInputLeftInt + "px";
        var directionsInputHorizontalPaddingInt = 4;
        var directionsInputHorizontalPaddingPx = directionsInputHorizontalPaddingInt + 'px';

        var directionsWidthInputInt = sidePanelWidthInt - paddingLeftWayPointAddressInt - 80;

        //var directionsWidthInputPx = directionsWidthInputInt + 'px';

        var directionsHeightInputInt = ls.directionsHeightInputInt;

        var directionsFontSizeInputPx = ls.directionsFontSizeInputInt + 'px';
        var directionsHeightInputPx = directionsHeightInputInt + 'px';

        var directionsWayPointInputFadeWidth = 20;

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.positionRelative], height: heightWayPointAddressPx, width: "calc(100% - " + paddingLeftWayPointAddressPx + ')',
            paddingLeft: paddingLeftWayPointAddressPx, paddingTop: "10px", paddingBottom: "10px", transform: 'initial'
        };

        cssClasses[inputClassName] = {
            inherits: [CSSClasses.robotoFontFamily, CSSClasses.positionAbsolute, CSSClasses.overflowHidden, CSSClasses.leftTopZero],
            color: 'white', outline: 'none', border: 'none',
            fontSize: directionsFontSizeInputPx,
            lineHeight: directionsHeightInputPx + ' !important',
            padding: '0',
            verticalAlign: 'middle', listStyle: 'none', borderRadius: "4px",
            background: 'transparent', margin: '0 !important',
            paddingLeft: directionsInputHorizontalPaddingPx, height: directionsHeightInputPx + ' !important',
            zIndex: '' + (ls.rootDivZIndex + ls.directionsInputZIndexAdd)
        };

        cssClasses[inputFocusedClassName + " ." + inputClassName] = {
            width: (directionsWidthInputInt) + 'px',
            paddingRight: (directionsInputHorizontalPaddingInt + directionsHeightInputInt) + 'px'
        };

        cssClasses[inputNonFocusedClassName + " ." + inputClassName] = {
            width: (directionsWidthInputInt + directionsHeightInputInt) + 'px',
            paddingRight: (directionsInputHorizontalPaddingInt) + 'px'
        };

        cssClasses[inputWrapperClassName] = {
            inherits: [CSSClasses.cursorText, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute, CSSClasses.overflowVisible],
            width: (directionsWidthInputInt + 2 * directionsInputHorizontalPaddingInt + directionsHeightInputInt + directionsHeightInputInt) + 'px',
            height: directionsHeightInputPx + ' !important',
            left: directionxWayPointInputLeftPx
        };

        cssClasses[inputValidClassName] = { borderBottom: '1px solid rgba(0,255,0,1)' };
        cssClasses[inputOKClassName] = { borderBottom: '1px solid rgba(255,255,255,0.3)' };
        cssClasses[inputErrorClassName] = { borderBottom: '1px solid rgba(255,0,0,1)' };

        cssClasses[inputFadeClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.pointerEventsNone, CSSClasses.positionAbsolute, CSSClasses.overflowVisible],
            top: "0px", background: "linear-gradient(to right, rgba(30, 144, 255,0),rgba(30, 144, 255, 1))",
            zIndex: '' + (ls.rootDivZIndex + ls.directionsInputFadeZIndexAdd),
            padding: '0', paddingLeft: directionsInputHorizontalPaddingPx, paddingRight: directionsInputHorizontalPaddingPx,
            width: directionsWayPointInputFadeWidth + 'px', height: directionsHeightInputPx + ' !important'
        };

        cssClasses[inputFocusedClassName + " ." + inputFadeClassName] = { left: (directionsWidthInputInt - directionsWayPointInputFadeWidth) + 'px' };
        cssClasses[inputNonFocusedClassName + " ." + inputFadeClassName] = { left: (directionsHeightInputInt + directionsWidthInputInt - directionsWayPointInputFadeWidth) + 'px' };

        cssClasses[buttonBaseClassName] = {
            inherits: [CSSClasses.transparentImageButton, CSSClasses.overflowHidden, CSSClasses.displayBlock],
            fill: "rgba(255,255,255,0.5)", background: 'transparent'
        };
        cssClasses[buttonBaseClassName + ":hover"] = { fill: "white" };

        cssClasses[searchButtonClassName] = {
            inherits: [CSSClasses.positionAbsolute],
            zIndex: '' + (ls.rootDivZIndex + ls.diretionsSearchButtonZIndexAdd),
            background: livelyColor, borderRadius: "50%", height: directionsHeightInputPx
        };

        cssClasses[searchButtonSVGClassName] = { disabled: 'inherit', opacity: 'inherit', visibility: 'inherit', width: "16px", height: "16px", strokeWidth: "0" };

        cssClasses[inputFocusedClassName + " ." + searchButtonClassName] = {
            inherits: [CSSClasses.visibilityVisible], opacity: "1", disabled: 'false', width: directionsHeightInputPx, left: 'initial', right: directionsHeightInputPx
        };

        cssClasses[inputNonFocusedClassName + " ." + searchButtonClassName] = {
            inherits: [CSSClasses.visibilityHidden], opacity: "0", disabled: 'true', width: '0px', right: 'initial', left: "100%"
        };

        cssClasses[mapFeatureIconWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible, CSSClasses.positionAbsolute],
            top: "8px", left: "12px", width: (directionsHeightInputInt + 6) + 'px', height: (directionsHeightInputInt + 6) + 'px'
        };

        cssClasses[mapFeatureIconButtonClassName] = {
            inherits: [CSSClasses.transparentImageButton],
            background: 'lightblue', borderRadius: "50%", padding: "2px", width: "calc(100% - 2px)", height: "calc(100% - 2px)"
        };
        cssClasses[mapFeatureIconButtonClassName + ":focus"] = { background: 'white' };
        cssClasses[mapFeatureIconButtonClassName + " img"] = { width: "100%", height: "100%" };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    function initialize() {
        delayedRevGeoCode = new tf.events.DelayedCallBack(tf.TFMap.DelayDirections, doRevGeoCode, theThis);
        isSwappingValue = isSettingValue = isInError = false;
        revGeocoderCount = geoCoderCount = 0;
        inputBoxWrapperIsInHover = false;
        inputBoxHasFocus = false;
        cssTag = 'directionsAddress';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

