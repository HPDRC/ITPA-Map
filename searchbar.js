"use strict";

tf.TFMap.SearchBar = function(settings) {
    var theThis, divWrapper, inputBox, menuButton, searchButton, directionsButton, loadingSearchButton;

    this.CheckSearchActive = function() { return checkSearchActive(); }
    this.GetWrapper = function() { return divWrapper; }
    this.SetSearchText = function(searchText) { return setSearchText(searchText); }
    this.GetSearchText = function() { return getSearchString(); }

    function setSearchText(searchText) {
        inputBox.SetText(searchText);
        checkSearchActive();
    }

    function onSearch() {
        if (getIsActiveIsSearching().isActive) { settings.appContent.SearchAddress(getSearchString()); }
    }

    function updateFullScreenButton(useFullScreen) {
        tf.dom.ReplaceCSSClassCondition(menuButton.GetButton(), useFullScreen, goFullScreenBackgroundClassName, restoreFullScreenBackgroundClassName);
    }

    function onButtonClicked(notification) {
        var sender = notification.sender;
        switch (sender) {
            case menuButton:
                if (tf.browser.GetIsFullScreen(document)) {
                    tf.browser.ExitFullScreen(document);
                    updateFullScreenButton(true);
                }
                else {
                    tf.browser.RequestFullScreen(settings.appContent.GetRootDiv().GetHTMLElement());
                    updateFullScreenButton(false);
                }
                break;
            case searchButton: onSearch(); break;
            case directionsButton:
                settings.appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_showingDirections, true);
                break;
        }
    }

    function getIsActiveIsSearching() {
        var isSearching = settings.appContent.GetAppCtx().GetCtxAttribute(tf.TFMap.CAN_isSearchingAddress);
        var isActive = getSearchString().length > 0 && !isSearching;
        return { isSearching: isSearching, isActive: isActive };
    }

    function checkSearchActive() {
        var isActiveIsSearching = getIsActiveIsSearching();
        var isSearching = isActiveIsSearching.isSearching;
        var isActive = isActiveIsSearching.isActive;
        tf.dom.ReplaceCSSClassCondition(searchButton.GetButton(), isActive, activeSearchButtonClassName, inactiveSearchButtonClassName);
        var appStyles = settings.appContent.GetAppStyles();
        var inputBoxBox = inputBox.GetInputBox();
        var visibleDisplayVerb = "inline-block";
        var ls = tf.TFMap.LayoutSettings;
        if (isSearching) {
            inputBoxBox.style.color = ls.inactiveTextColor;
            inputBoxBox.disabled = true;
            searchButton.GetButton().style.display = 'none';
            loadingSearchButton.GetButton().style.display = visibleDisplayVerb;
        }
        else {
            inputBoxBox.style.color = ls.darkTextColor;
            inputBoxBox.disabled = false;
            loadingSearchButton.GetButton().style.display = 'none';
            searchButton.GetButton().style.display = visibleDisplayVerb;
        }
    }

    function getSearchToolTip() {
        return getIsActiveIsSearching().isActive ? "Search" : "Type an address or a place to search";
    }
    function getSearchString() { return inputBox.GetText(); }

    function onInputChange() { checkSearchActive(); }
    function onInputKeyPress(event) { if (tf.js.GetKeyCodeFromEvent(event) == 13) { onSearch(); } else { onInputChange(); } }

    function getFullScreenToolTip() {
        return tf.browser.GetIsFullScreen() ? "Exit full screen" : "Display full screen";
    }

    function createControl() {
        var inputFade = new tf.dom.Div({ cssClass: inputFadeClassName });
        var searchBarInputWrapper = new tf.dom.Div({ cssClass: inputWrapperClassName });

        divWrapper = new tf.dom.Div({ cssClass: wrapperClassName });
        inputBox = new tf.TFMap.InputBox({ onChange: onInputChange, onGo: onSearch, placeHolder: settings.placeHolder, className: inputClassName, maxLength: tf.TFMap.maxCharsAddressInput });
        searchBarInputWrapper.AddContent(inputBox.GetInputBox(), inputFade);

        var appContent = settings.appContent;
        var delayMillis = 0;
        var toolTipClass = "*start";
        var toolTipArrowClass = "top";

        var ls = tf.TFMap.LayoutSettings;
        var fontSizeToolTipInt = ls.fontSizeToolTipInt;

        var buttonSettings = {
            offsetY: - (fontSizeToolTipInt / 2 + 2),
            onClick: onButtonClicked, onHover: undefined, wrapper: divWrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        menuButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, { buttonClass: menuButtonClassName, toolTipText: getFullScreenToolTip, toolTipClass: "*end" }));
        searchButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, { buttonClass: "", toolTipText: getSearchToolTip }));
        directionsButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, { buttonClass: directionsButtonClassName, toolTipText: "Get Directions" }));
        loadingSearchButton = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, { buttonClass: searchingSearchButtonClassName, toolTipText: "Searching..." }));

        loadingSearchButton.GetButton().style.display = 'none';

        updateFullScreenButton(true);
        checkSearchActive();

        divWrapper.AddContent(menuButton.GetButton(), searchBarInputWrapper, searchButton.GetButton(), loadingSearchButton.GetButton(), directionsButton.GetButton());
    }

    var cssTag, wrapperClassName, inputFadeClassName, inputWrapperClassName, inputClassName, menuButtonClassName, activeSearchButtonClassName,
        inactiveSearchButtonClassName, searchingSearchButtonClassName, directionsButtonClassName, goFullScreenBackgroundClassName, restoreFullScreenBackgroundClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        inputFadeClassName = tf.TFMap.CreateClassName(cssTag, "InputFade");
        inputWrapperClassName = tf.TFMap.CreateClassName(cssTag, "InputWrapper");
        inputClassName = tf.TFMap.CreateClassName(cssTag, "Input");
        menuButtonClassName = tf.TFMap.CreateClassName(cssTag, "MenuButton");
        activeSearchButtonClassName = tf.TFMap.CreateClassName(cssTag, "Active");
        inactiveSearchButtonClassName = tf.TFMap.CreateClassName(cssTag, "Inactive");
        searchingSearchButtonClassName = tf.TFMap.CreateClassName(cssTag, "Searching");
        directionsButtonClassName = tf.TFMap.CreateClassName(cssTag, "Directions");
        goFullScreenBackgroundClassName = tf.TFMap.CreateClassName(cssTag, "gfsbg");
        restoreFullScreenBackgroundClassName = tf.TFMap.CreateClassName(cssTag, "rfsbg");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var isSmallScreen = appStyles.GetIsSmallScreen();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var topMarginInt = ls.topMarginInt, topMarginPx = topMarginInt + 'px';
        var leftMarginInt = ls.leftMarginInt, leftMarginPx = leftMarginInt + 'px';
        var heightSearchBoxInt = ls.heightSearchBoxInt, heightSearchBoxPx = heightSearchBoxInt + 'px';
        var lightBackground = ls.lightBackground;
        var lightBackgroundFadeStart = ls.lightBackgroundHalfOpaque;
        var searchBarInputHeightInt = ls.searchBarInputHeightInt, searchBarInputHeightPx = searchBarInputHeightInt + 'px';
        var searchBarInputWidthInt = ls.searchBarInputWidthInt, searchBarInputWidthPx = searchBarInputWidthInt + 'px';
        var searchBarHorizPaddingInt = ls.searchBarHorizPaddingInt, searchBarHorizPaddingPx = searchBarHorizPaddingInt + 'px';
        var searchBarInputFontSizePx = ls.searchBarInputFontSizeInt + 'px';
        var searchBarInputWrapperWidthInt = searchBarInputWidthInt + 2 * searchBarHorizPaddingInt + 2, searchBarInputWrapperWidthPx = searchBarInputWrapperWidthInt + 'px';
        var searchBarInputFadeWidth = isSmallScreen ? 10: 20;
        var marginRightSearchBox = isSmallScreen ? "2px" : "6px";
        var paddingWrapperVerPx = ls.searchBarPaddingVerInt + 'px';
        var paddingWrapperHorInt = ls.searchBarPaddingHorInt, paddingWrapperHorPx = paddingWrapperHorInt + 'px';

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.whiteSpaceNoWrap, CSSClasses.overflowVisible, CSSClasses.pointerEventsAll,
                CSSClasses.displayBlock,
                //CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap,
            CSSClasses.boxShadow01403, CSSClasses.noBorder, CSSClasses.lightBackground],
            marginTop: topMarginPx, marginLeft: leftMarginPx,
            //width: "calc(100% - " + (leftMarginInt + 16) + "px)",
            width: "calc(100% - " + (leftMarginInt + 2 * paddingWrapperHorInt) + "px)",
            //width: "100%",
            borderRadius: '2px',
            height: heightSearchBoxPx,
            paddingTop: paddingWrapperVerPx, paddingBottom: paddingWrapperVerPx,
            paddingLeft: paddingWrapperHorPx, paddingRight: paddingWrapperHorPx
        };

        cssClasses[inputFadeClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.pointerEventsNone, CSSClasses.positionAbsolute, CSSClasses.overflowVisible],
            top: "2px", left: (searchBarInputWrapperWidthInt - searchBarInputFadeWidth) + 'px',
            background: "linear-gradient(to right, " + lightBackgroundFadeStart + "," + lightBackground + ")",
            padding: '0',
            width: (searchBarInputFadeWidth - 3) + 'px',
            height: (searchBarInputHeightInt - 4) + 'px !important'
        };

        var searchBarInputCommon = {
            width: searchBarInputWidthPx, height: searchBarInputHeightPx + ' !important',
            padding: '0', verticalAlign: 'middle', listStyle: 'none', margin: '0 !important', overflow: 'visible'
        };

        cssClasses[inputWrapperClassName] = {
            inherits: [searchBarInputCommon, CSSClasses.cursorText, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative,
                CSSClasses.overflowVisible, CSSClasses.displayInlineBlock],
            width: searchBarInputWrapperWidthPx,
            marginRight: marginRightSearchBox
        };

        cssClasses[inputClassName] = {
            inherits: [CSSClasses.robotoFontFamily, searchBarInputCommon, CSSClasses.positionAbsolute, CSSClasses.leftTopZero],
            color: 'inherit', outline: 'none', border: 'none', fontSize: searchBarInputFontSizePx,
            paddingLeft: searchBarHorizPaddingPx, paddingRight: searchBarHorizPaddingPx,
            borderLeft: "1px solid lightgray", borderRight: "1px solid lightgray",
            lineHeight: searchBarInputHeightPx + ' !important', background: 'white'
        };

        var widthSearchBoxButton = isSmallScreen ? "32px" : "40px";
        var marginSearchBoxButton = isSmallScreen ? "-8px" : "0px";

        var baseButton = {
            inherits: [CSSClasses.baseImageButton, CSSClasses.displayInlineBlock, CSSClasses.verticalAlignMiddle],
            width: widthSearchBoxButton, height: heightSearchBoxPx, marginRight: marginSearchBoxButton
        }

        cssClasses[menuButtonClassName] = { inherits: [baseButton], marginRight: marginRightSearchBox };

        cssClasses[activeSearchButtonClassName] = { inherits: [baseButton, CSSClasses.activeSearchButtonBackground] };
        cssClasses[inactiveSearchButtonClassName] = { inherits: [baseButton, CSSClasses.inactiveSearchButtonBackground] };
        cssClasses[searchingSearchButtonClassName] = { inherits: [baseButton, CSSClasses.loadingBackground], boxShadow: 'none' };

        cssClasses[directionsButtonClassName] = { inherits: [baseButton, CSSClasses.directionsButtonBackground] };

        cssClasses[goFullScreenBackgroundClassName] = { inherits: [CSSClasses.goFullScreenBackground] };
        cssClasses[restoreFullScreenBackgroundClassName] = { inherits: [CSSClasses.restoreFullScreenBackground] };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        cssTag = 'searchBar';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        if (tf.js.GetIsNonEmptyString(settings.initialText)) { setSearchText(settings.initialText); }
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
