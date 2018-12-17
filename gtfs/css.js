"use strict";

tf.GTFS = {};

tf.GTFS.DumpKL = function (theKL) {
    var items = theKL.GetKeyedItemList();
    for (var i in items) {
        var item = items[i], id = item.GetData();
        console.log(id);
    }
};

tf.GTFS.CSSClasses = function (settings) {
    var theThis, cssTag, classNames, layoutChangeListener;
    var emailRegex;
    var minPasswordLength;
    var upperCaseRE, lowerCaseRE, numbersRE, nonAlphasRE;
    var expandedTLF;

    this.SetTLFIsExpanded = function (theTLF, isExpanded) {
        if (isExpanded) {
            if (expandedTLF != theTLF) {
                if (expandedTLF != undefined) {
                    expandedTLF.SetIsExpanded(false);
                }
            }
            expandedTLF = theTLF;
        }
        else {
            if (expandedTLF == theTLF) {
                expandedTLF = undefined;
            }
        }
    }

    this.CreateFullRowControlWrapper = function () {
        var wrapper = new tf.dom.Div({ cssClass: classNames.topBotPaddedRowWrapper });
        var wrapperE = wrapper.GetHTMLElement(), wrapperES = wrapperE.style;
        wrapperES.borderTop = "1px solid navy";
        wrapperES.backgroundColor = "beige";
        return wrapper;
    };

    this.CreateButtons = function (buttonSpecs, buttonClassName, buttonWrapper) {
        var buttons = {};
        for (var i in buttonSpecs) {
            var buttonSpec = buttonSpecs[i];
            var button = new tf.dom.Button({ cssClass: buttonClassName, onClick: buttonSpec.handler });
            var buttonObj = { button: button, settings: buttonSpec };

            buttonObj.rename = function (theButton, theButtonObj) {
                return function (innerHTML) {
                    var newInnerHTML = tf.js.GetNonEmptyString(innerHTML, theButtonObj.settings.innerHTML);
                    theButtonObj.settings.innerHTML = theButton.GetButton().innerHTML = newInnerHTML;
                }
            }(button, buttonObj);

            buttons[i] = buttonObj;
            buttonObj.rename(buttonSpec.innerHTML);
            buttonWrapper.AddContent(button.GetButton());
        }
        return buttons;
    };
    
    this.GetIsEmailValid = function (emailStr) { return emailRegex.test(tf.js.GetNonEmptyString(emailStr, '')); }

    this.ValidatePassword = function(password) {
        var ok = false, message = "";
        password = tf.js.GetNonEmptyString(password, '');
        if (!!password && password.length >= minPasswordLength) {
            var hasUpperCase = upperCaseRE.test(password);
            var hasLowerCase = lowerCaseRE.test(password);
            var hasNumbers = numbersRE.test(password);
            var hasNonAlphas = nonAlphasRE.test(password);
            if (ok = (hasUpperCase + hasLowerCase + hasNumbers + hasNonAlphas >= 3)) {
                message = "password valid";
            }
            else {
                message = "password must contain upper and lower case <br />letters and at least one symbol or digit";
            }
        }
        else { message = "password must contain at least " + minPasswordLength + " characters"; }
        return { ok: ok, message: message };
    };

    this.CreateEmailPasswordGroup = function (onGo, emailId, passwordId, emailPlaceHolder, passwordPlaceHolder, autoComplete) {
        var cssClasses = settings.cssClasses;
        var cssClassNames = cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: cssClassNames.emailPasswordWrapper });
        var inputSettings = { onChange: undefined, onGo: onGo, className: cssClassNames.emailPasswordInputClassName, maxLength: 100 };
        var emailInputSettings = tf.js.ShallowMerge({ placeHolder: emailPlaceHolder }, inputSettings);
        var passwordInputSettings = tf.js.ShallowMerge({ placeHolder: passwordPlaceHolder }, inputSettings);
        var emailInput = new tf.TFMap.InputBox(emailInputSettings);
        var passwordInput = new tf.TFMap.InputBox(passwordInputSettings);
        var emailInputBox = emailInput.GetInputBox();
        var passwordInputBox = passwordInput.GetInputBox();

        emailInputSettings.nextFocusTarget = emailInputSettings.prevFocusTarget = passwordInputBox;
        passwordInputSettings.nextFocusTarget = passwordInputSettings.prevFocusTarget = emailInputBox;
        autoComplete = !!autoComplete;
        if (!!emailId) { emailInputBox.id = emailId; }
        if (!!passwordId) { passwordInputBox.id = passwordId; }
        passwordInputBox.type = 'password';
        emailInputBox.autocomplete = autoComplete ? "on" : "off";
        passwordInputBox.autocomplete = autoComplete ? "on" : "new-password";

        wrapper.AddContent(emailInputBox, passwordInputBox);

        return { wrapper: wrapper, emailInput: emailInput, passwordInput: passwordInput };
    };

    this.GetClassNames = function () { return classNames; }
    this.GetContentWrapperDisplayVisibleVerb = function () { return "block"; }

    this.SetAbsoluteScrollWrapperStyles = function (scrollWrapper) {
        var scrollWrapperES = scrollWrapper.GetHTMLElement().style;
        scrollWrapperES.position = "absolute";
        scrollWrapperES.left = scrollWrapperES.top = "0px";
        scrollWrapperES.width = "100%";
        scrollWrapperES.height = "100%";
        scrollWrapperES.padding = "0px";
        //scrollWrapperES.height = "calc(100% - 20px)";
        //scrollWrapperES.height = "calc(100% - 10px)";
    };

    this.CreateTLF = function (tlfSettings) {
        var ls = tf.TFMap.LayoutSettings;
        var customAppContentI = settings.customAppContentI;
        var customAppClassNames = customAppContentI.getClassNames();
        var wrapper = customAppContentI.createNonScrollVariableHeightContent(customAppClassNames.minHeightPaneClassName + " " + customAppClassNames.zIndexListItem);
        var toolBar = customAppContentI.createMainToolBar();
        var footer = customAppContentI.createFooter();
        var scrollWrapperAndContent = customAppContentI.createVertScrollWrapperAndContentWithFade();
        var cellButton = new tf.dom.Button({ cssClass: classNames.topToolBarCellButton + " ripple", onClick: undefined });
        var scrollWrapperContainer;
        toolBar.content.AddContent(cellButton.GetButton());
        wrapper.AddContent(toolBar.wrapper);
        wrapper.GetHTMLElement().style.overflow = "visible";
        if (tlfSettings.absoluteScrollers) {
            scrollWrapperContainer = customAppContentI.createNonScrollVariableHeightContent(classNames.minHeightListClassName);
            theThis.SetAbsoluteScrollWrapperStyles(scrollWrapperAndContent.scrollWrapper);
            scrollWrapperContainer.AddContent(scrollWrapperAndContent.scrollWrapper);
            wrapper.AddContent(scrollWrapperContainer);
        }
        else {
            wrapper.AddContent(scrollWrapperAndContent.scrollWrapper);
        }
        wrapper.AddContent(footer.wrapper);
        return {
            cellButton: cellButton,
            wrapper: wrapper,
            toolBar: toolBar,
            scrollWrapperContainer: scrollWrapperContainer,
            scrollWrapper: scrollWrapperAndContent.scrollWrapper,
            scrollContent: scrollWrapperAndContent.scrollContent,
            footer: footer
        };
    };

    this.CreateVertScrollWrapperAndContentWithFade = function () {
        return settings.customAppContentI.createVertScrollWrapperAndContentWithFade();
    };

    function createCSSClassNames() {
        classNames = {

            chatBoxItemWrapper: tf.TFMap.CreateClassName(cssTag, "ChatBoxItemWrapper"),
            chatBoxMessage: tf.TFMap.CreateClassName(cssTag, "ChatBoxMessage"),
            chatBoxMessageDate: tf.TFMap.CreateClassName(cssTag, "ChatBoxMessageDate"),
            chatBoxMessageEmail: tf.TFMap.CreateClassName(cssTag, "ChatBoxMessageEmail"),
            chatBoxList: tf.TFMap.CreateClassName(cssTag, "ChatBoxList"),

            fileInputClassName: tf.TFMap.CreateClassName(cssTag, "FileInput"),
            fileLabelClassName: tf.TFMap.CreateClassName(cssTag, "FileLabel"),

            itemWrapperClassName: tf.TFMap.CreateClassName(cssTag, "ItemWrapper"),
            itemWrapperSelectedClassName: tf.TFMap.CreateClassName(cssTag, "ItemWrapperSelected"),
            itemContentWrapperClassName: tf.TFMap.CreateClassName(cssTag, "ItemContentWrapper"),
            itemTitleClassName: tf.TFMap.CreateClassName(cssTag, "ItemTitle"),
            itemTitleSubClassName: tf.TFMap.CreateClassName(cssTag, "ItemTitleSub"),
            itemCountClassName: tf.TFMap.CreateClassName(cssTag, "itemCount"),
            itemButtonClassName: tf.TFMap.CreateClassName(cssTag, "ItemButton"),
            itemToolBarClassName: tf.TFMap.CreateClassName(cssTag, "ItemToolBar"),
            itemToolBarTextButton: tf.TFMap.CreateClassName(cssTag, "ItemToolBarTextButton"),
            itemToolBarFixWidthTextButtonWide: tf.TFMap.CreateClassName(cssTag, "ItemToolBarTextButtonWide"),

            topToolBarCellButton: tf.TFMap.CreateClassName(cssTag, "TopBarCellButton"),

            itemRowWrapperClassName: tf.TFMap.CreateClassName(cssTag, "ItemRowWrapper"),
            itemRowToolBarClassName: tf.TFMap.CreateClassName(cssTag, "ItemRowToolBar"),

            agenciesSelectClassName: tf.TFMap.CreateClassName(cssTag, "AgenciesSelect"),

            attributeNameClassName: tf.TFMap.CreateClassName(cssTag, "AttributeNameClassName"),
            attributeValueClassName: tf.TFMap.CreateClassName(cssTag, "AttributeValueClassName"),
            attributeDescClassName: tf.TFMap.CreateClassName(cssTag, "AttributeDescClassName"),

            rowPromptClassName: tf.TFMap.CreateClassName(cssTag, "RowPromptClassName"),

            contentWrapper: tf.TFMap.CreateClassName(cssTag, "ContentWrapper"),
            horContentWrapper: tf.TFMap.CreateClassName(cssTag, "HorContentWrapper"),
            signInButtonClassName: tf.TFMap.CreateClassName(cssTag, "signInButton"),
            signedInButtonClassName: tf.TFMap.CreateClassName(cssTag, "signedInButton"),
            signInButtonsWrapper: tf.TFMap.CreateClassName(cssTag, "SignInButtonsWrapper"),
            topBotPaddedRowWrapper: tf.TFMap.CreateClassName(cssTag, "topBotPaddedRowWrapper"),
            emailPasswordWrapper: tf.TFMap.CreateClassName(cssTag, "EmailPasswordWrapper"),
            emailPasswordStatus: tf.TFMap.CreateClassName(cssTag, "EmailPasswordStatus"),
            emailPasswordInputClassName: tf.TFMap.CreateClassName(cssTag, "InputEmailPassword"),

            emptyBlockDivClassName: tf.TFMap.CreateClassName(cssTag, "EmptyDivBlock"),

            fullEditorClassName: tf.TFMap.CreateClassName(cssTag, "FullEditor")
        };
    }

    function createCSSClasses() {
        var customAppContentI = settings.customAppContentI;
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var isSmallScreen = appStyles.GetIsSmallScreen();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var epiMinWidthPx = "1px";
        var epiHeightPx = "24px";
        var epiFontSizePx = "16px";
        var epiPaddingPx = "4px";
        var epiMarginPx = "1px";
        var epiBorderLR = "2px solid transparent";
        var lightBlueColor = "cornflowerblue";

        var stdTextOverflow = {
            inherits: [CSSClasses.pointerEventsNone, CSSClasses.overflowHidden, CSSClasses.whiteSpaceNoWrap, CSSClasses.textOverflowEllipsis], verticalAlign: "middle"
        };
        var displayType = CSSClasses.displayInlineBlock;

        var itemWrapperCommon = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.displayBlock, CSSClasses.overflowHidden],
            padding: "1px",
            borderRadius: "0px", width: "calc(100% - 2px)"
        };

        cssClasses[classNames.itemWrapperClassName] = {
            inherits: [itemWrapperCommon]
        };

        cssClasses[classNames.itemRowWrapperClassName] = {
            inherits: [itemWrapperCommon, CSSClasses.pointerEventsNone
            ],
            backgroundColor: lightBlueColor,
            borderTop: "1px solid navy"
        };

        cssClasses[classNames.itemWrapperClassName + ":hover"] = { backgroundColor: "rgba(0, 0, 0, 0.1)" };

        cssClasses[classNames.itemWrapperSelectedClassName] = {
            backgroundColor: lightBlueColor
        };

        cssClasses[classNames.itemWrapperSelectedClassName + ":hover"] = { backgroundColor: "royalblue" };

        var fullCellButtonCommon = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.transparentImageButton, CSSClasses.backgroundColorTransparent, CSSClasses.displayBlock, CSSClasses.positionAbsolute],
            borderRadius: "0px"
        };

        cssClasses[classNames.itemButtonClassName] = {
            inherits: [fullCellButtonCommon],
            left: "4px", top: "3px", width: "calc(100% - 8px)", height: "calc(100% - 6px)",
            backgroundColor: "white"
        };

        cssClasses[classNames.topToolBarCellButton] = {
            inherits: [fullCellButtonCommon, CSSClasses.backgroundColorTransparent, CSSClasses.pointerEventsAll],
            left: "0px", top: "0px", width: "calc(100% - 0px)", height: "calc(100% - 0px)"
        };

        cssClasses[classNames.itemContentWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.transparentImageButton, CSSClasses.backgroundColorTransparent,
            CSSClasses.displayBlock, CSSClasses.pointerEventsNone],
            color: "black",
            fontWeight: "600",
            textShadow: "none",
            marginTop: "5px",
            marginLeft: "2px", marginRight: "2px",
            borderRadius: "2px", lineHeight: "0px", width: "calc(100% - 4px)"
        };

        cssClasses[classNames.itemTitleClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.displayBlock, CSSClasses.darkTextShadow, stdTextOverflow, CSSClasses.whiteSpaceNormal],
            textAlign: "left",
            paddingLeft: "4px",
            paddingRight: "4px",
            //margin: "auto",
            margin: "3px",
            width: "auto",
            color: "#444",
            background: "beige",
            fontSize: ls.itemInListTitletFontSizeInt + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt + 1) + 'px'
        };

        cssClasses[classNames.itemTitleSubClassName] = {
            inherits: [cssClasses[classNames.itemTitleClassName]],
            background: "white",
            borderTop: "1px solid darkgray",
            paddingTop: "2px",
            fontSize: (ls.itemInListTitletFontSizeInt - 1) + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt) + 'px'
        };

        cssClasses[classNames.itemWrapperSelectedClassName + " ." + classNames.itemTitleClassName] = {
            fontSize: (ls.itemInListTitletFontSizeInt + 2) + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt + 3) + 'px',
            textAlign: "center"
        };

        cssClasses[classNames.itemCountClassName] = {
            inherits: [cssClasses[classNames.itemTitleClassName]]
        };

        cssClasses[classNames.itemToolBarClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.backgroundColorTransparent, displayType],
            borderRadius: "0px", left: "0px", top: "0px", width: "auto",
            paddingLeft: "4px",
            paddingRight: "4px",
            lineHeight: ls.itemInListTitleLineHeightInt + 'px',
            //backgroundColor: "blue",
            "float": "right"
        };

        cssClasses[classNames.itemRowToolBarClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.backgroundColorTransparent, displayType],
            borderRadius: "0px", left: "0px", top: "0px", width: "auto",
            //paddingLeft: "4px",
            //paddingRight: "4px",
            padding: "4px",
            //borderTop: "1px solid " + lightBlueColor,
            lineHeight: ls.itemInListTitleLineHeightInt + 'px'
            //backgroundColor: "blue"
        };

        cssClasses[classNames.itemToolBarTextButton] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.transparentImageButton, CSSClasses.backgroundColorTransparent, displayType, CSSClasses.pointerEventsAll],
            borderRadius: "2px",
            border: "1px solid " + ls.darkTextColor,
            marginLeft: "2px", marginRight: "2px",
            padding: "2px",
            fontSize: (ls.itemInListTitletFontSizeInt - 2) + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt - 4) + 'px'
        };

        var widthAddDelTextButtonInt = isSmallScreen ? 36 : 56;

        cssClasses[classNames.itemToolBarFixWidthTextButton] = {
            //backgroundColor: "#f0f8ff"
            backgroundColor: "white",
            color: "black",
            minWidth: widthAddDelTextButtonInt + "px",
            //width: widthAddDelTextButtonInt + "px",
            textShadow: "1px 1px 2px gray"
        };

        var widthAddDelTextButtonWideInt = isSmallScreen ? 46 : 66;

        cssClasses[classNames.itemToolBarFixWidthTextButtonWide] = {
            //backgroundColor: "#f0f8ff"
            backgroundColor: "white",
            color: "black",
            minWidth: widthAddDelTextButtonWideInt + "px",
            //width: widthAddDelTextButtonWideInt + "px",
            textShadow: "1px 1px 2px gray"
        };

        var epiCommon = {
            minWidth: epiMinWidthPx, width: "auto", height: epiHeightPx,
            padding: '0', verticalAlign: 'middle', listStyle: 'none', overflow: 'hidden'
        };

        var emailPasswordCommon = {
            inherits: [CSSClasses.robotoFontFamily, epiCommon, CSSClasses.positionRelative, CSSClasses.displayFlex, CSSClasses.flexGrowOne, CSSClasses.flexShrinkOne, CSSClasses.pointerEventsAll],
            color: 'inherit', outline: 'none', border: 'none', fontSize: epiFontSizePx,
            paddingLeft: epiPaddingPx, paddingRight: epiPaddingPx,
            marginLeft: epiMarginPx, marginRight: epiMarginPx,
            borderLeft: epiBorderLR, borderRight: epiBorderLR,
            //margin: '0',
            background: "white",
            lineHeight: epiHeightPx
        };

        cssClasses[classNames.emailPasswordInputClassName] = {
            inherits: [emailPasswordCommon]
        };

        var wrapperCommon = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap, CSSClasses.overflowHidden, CSSClasses.pointerEventsAll],
            width: "100%",
            borderRadius: "3px",
            marginBottom: "1px"
        };

        cssClasses[classNames.agenciesSelectClassName] = {
            inherits: [wrapperCommon, CSSClasses.robotoFontFamily, epiCommon],
            color: 'inherit', outline: 'none', border: 'none', fontSize: epiFontSizePx,
            paddingLeft: epiPaddingPx, paddingRight: epiPaddingPx,
            margin: "4px",
            borderLeft: epiBorderLR, borderRight: epiBorderLR,
            background: "white",
            width: "calc(100% - 8px)",
            fontSize: (ls.itemInListTitletFontSizeInt + 1) + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt + 1) + 'px',
            //lineHeight: "20px",
            borderRadius: "3px"
        };

        cssClasses[classNames.emailPasswordWrapper] = {
            inherits: [wrapperCommon, CSSClasses.pointerEventsAll],
            paddingBottom: "3px"
        };

        cssClasses[classNames.topBotPaddedRowWrapper] = {
            inherits: [wrapperCommon, CSSClasses.pointerEventsAll],
            paddingTop: "3px",
            paddingBottom: "3px"
        };

        cssClasses[classNames.signInButtonsWrapper] = {
            inherits: [wrapperCommon]
        };

        cssClasses[classNames.emailPasswordStatus] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.displayBlock,
            CSSClasses.overflowHidden, CSSClasses.textOverflowEllipsis,
            CSSClasses.flexFlowRowNoWrap, CSSClasses.flexGrowOne, CSSClasses.flexShrinkOne],
            backgroundColor: "royalblue",
            textShadow: "1px 1px 2px black",
            color: "white",
            minWidth: "1px",
            width: "calc(100% - 8px)",
            padding: "4px",
            fontSize: "12px",
            lineHeight: "14px",
            fontWeight: "500",
            textAlign: "center",
            borderTop: "1px solid azure",
            borderBottom: "1px solid navajowhite"
        };

        cssClasses[classNames.signInButtonClassName] = {
            inherits: [CSSClasses.transparentImageButton, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.backgroundColorTransparent,
            CSSClasses.positionRelative, CSSClasses.displayBlock, CSSClasses.flexFlowRowNoWrap, CSSClasses.flexGrowOne, CSSClasses.flexShrinkOne],
            borderRadius: "2px",
            backgroundColor: "royalblue",
            textShadow: "1px 1px 2px black",
            color: "white",
            minWidth: "1px",
            width: "calc(100% - 2px)",
            //width: "calc(100%)",
            padding: "4px",
            fontSize: "14px",
            lineHeight: "16px",
            fontWeight: "500",
            textAlign: "center",
            paddingTop: "6px",
            marginBottom: "1px",
            borderBottom: "1px solid transparent"
        };

        cssClasses[classNames.signedInButtonClassName] = {
            inherits: [CSSClasses.transparentImageButton, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.backgroundColorTransparent,
            CSSClasses.positionRelative, CSSClasses.displayInlineBlock, CSSClasses.flexFlowRowNoWrap, CSSClasses.flexGrowOne, CSSClasses.flexShrinkOne, CSSClasses.pointerEventsAll],
            borderRadius: "6px",
            backgroundColor: "royalblue",
            textShadow: "1px 1px 2px black",
            color: "white",
            minWidth: "1px",
            //width: "calc(100% - 2px)",
            //width: "calc(100%)",
            padding: "4px",
            fontSize: "12px",
            lineHeight: "14px",
            fontWeight: "500",
            textAlign: "center",
            paddingTop: "6px",
            marginLeft: "2px",
            marginRight: "2px",
            marginBottom: "1px",
            borderBottom: "1px solid transparent"
        };

        cssClasses[classNames.signInButtonClassName + ":hover"] = {
            textDecoration: "underline"
        };

        cssClasses[classNames.signedInButtonClassName + ":hover"] = {
            textDecoration: "underline"
        };

        var dimFileInputFloat = 0.1;
        var dimFileInputPx = dimFileInputFloat + "px";

        cssClasses[classNames.fileInputClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowHidden, CSSClasses.positionAbsolute, CSSClasses.pointerEventsAll],
            width: dimFileInputPx,
            height: dimFileInputPx,
            zIndex: "-1"
        };

        /*cssClasses[classNames.fileInputClassName + " + label"] = {
            inherits: [cssClasses[classNames.signedInButtonClassName]]
        };*/

        cssClasses[classNames.contentWrapper] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.displayFlex, CSSClasses.flexFlowColumnNoWrap],
            alignItems: "center",
            background: "rgb(30,144,255)"
        };

        cssClasses[classNames.horContentWrapper] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap],
            background: "rgb(30,144,255)",
            padding: "2px",
            width: "calc(100% - 4px)"
        };

        cssClasses[classNames.chatBoxList] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.listStyleTypeNone, CSSClasses.listStyleNone, CSSClasses.pointerEventsAll],
            border: "1px solid navajowhite",
            overflowX: "hidden",
            overflowY: "auto",
            margin: "2px",
            width: "calc(100% - 10px)",
            backgroundColor: "darkgray",
            //borderRadius: "4px",
            padding: "1px",
            height: "200px"
        };

        //cssClasses[classNames.chatBoxList + " :nth-of-type(odd)"] = { backgroundColor: "red" };
        //cssClasses[classNames.chatBoxList + " :nth-of-type(even)"] = { backgroundColor: "green" };

        cssClasses[classNames.chatBoxItemWrapper] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative,
                CSSClasses.pointerEventsAll, CSSClasses.overflowVisible, CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap],
            textAlign: "left",
            alignItems: "flex-end",
            marginBottom: "2px",
            width: "100%",
            backgroundColor: "transparent",
            borderBottom: "1px solid gray"
        };

        cssClasses[classNames.chatBoxMessage] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative,
                CSSClasses.pointerEventsAll, CSSClasses.overflowHidden, CSSClasses.displayInlineBlock],
            userSelect: "text",
            padding: "4px",
            paddingTop: "10px",
            paddingBottom: "10px",
            //margin: "2px",
            fontWeight: "500",
            //borderRadius: "6px",
            //maxWidth: "calc(75% - 12px)",
            //minWidth: "55%",
            width: "calc(100%)",
            lineHeight: "18px",
            fontSize: "14px",
            backgroundColor: "white",
            color: "black"
        };

        var chatBoxFloatCommon = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute,
            CSSClasses.pointerEventsAll, CSSClasses.overflowHidden, CSSClasses.displayInlineBlock],
            border: "1px solid gray",
            top: "100%",
            transform: "translateY(-50%)",
            padding: "1px",
            paddingLeft: "4px",
            paddingRight: "4px",
            borderRadius: "4px",
            lineHeight: "12px",
            fontSize: "11px",
            color: "black",
            zIndex: "1",
            backgroundColor: "white"
        };

        cssClasses[classNames.chatBoxMessageDate] = {
            inherits: [chatBoxFloatCommon],
            right: "4px"
        };

        cssClasses[classNames.chatBoxMessageEmail] = {
            inherits: [chatBoxFloatCommon],
            left: "4px"
        };

        cssClasses[classNames.fullEditorClassName] = {
            inherits: [CSSClasses.positionAbsolute, CSSClasses.leftTopZero, CSSClasses.displayBlock, CSSClasses.WHOneHundred],
            backgroundColor: ls.lightBackground,
            zIndex: '50'
        };

        cssClasses[classNames.emptyBlockDivClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.displayBlock, CSSClasses.overflowVisible, CSSClasses.pointerEventsAll, CSSClasses.noMarginNoBorderNoPadding]
        };

        var attributeCommon = {
            inherits: [cssClasses[classNames.emptyBlockDivClassName]]
        };

        cssClasses[classNames.attributeNameClassName] = {
            //borderBottom: "1px solid " + ls.darkTextColor,
            marginLeft: "2px", marginRight: "2px",
            padding: "2px",
            backgroundColor: "white",
            color: "black",
            fontWeight: "600",
            fontSize: (ls.itemInListTitletFontSizeInt - 2) + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt - 4) + 'px'
        };

        var attributeValueColor = "white";
        var attributeValueBk = "#037";

        cssClasses[classNames.attributeValueClassName] = {
            //border: "1px solid " + ls.darkTextColor,
            marginLeft: "2px", marginRight: "2px",
            padding: "2px",
            /*backgroundColor: "beige",
            color: "black",*/
            backgroundColor: attributeValueBk,
            color: attributeValueColor,
            fontSize: (ls.itemInListTitletFontSizeInt - 1) + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt + 1) + 'px'
        };

        cssClasses[classNames.attributeValueClassName + " a:link"] = cssClasses[classNames.attributeValueClassName + " a:hover"] = cssClasses[classNames.attributeValueClassName + " a:active"] = {
            backgroundColor: attributeValueBk,
            color: attributeValueColor
        };

        cssClasses[classNames.attributeValueClassName + " a:visited"] = {
            backgroundColor: attributeValueBk,
            color: "lightgray"
        };

        cssClasses[classNames.attributeDescClassName] = {
            //borderTop: "1px solid " + ls.darkTextColor,
            borderBottom: "1px solid " + ls.darkTextColor,
            marginLeft: "2px", marginRight: "2px",
            backgroundColor: "white",
            color: "black",
            padding: "2px",
            fontSize: (ls.itemInListTitletFontSizeInt - 2) + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt - 4) + 'px'
        };

        cssClasses[classNames.rowPromptClassName] = {
            //borderBottom: "1px solid " + ls.darkTextColor,
            margin: "auto",
            textAlign: "center",
            padding: "2px",
            backgroundColor: "white",
            color: "black",
            fontWeight: "600",
            minWidth: "70px",
            fontSize: (ls.itemInListTitletFontSizeInt - 2) + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt - 4) + 'px'
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    function initialize() {
        emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        upperCaseRE = /[A-Z]/;
        lowerCaseRE = /[a-z]/;
        numbersRE = /\d/;
        nonAlphasRE = /\W/;
        minPasswordLength = 8;
        settings.customAppContentI.getContentWrapper().GetHTMLElement().style.backgroundColor = 'azure';
        cssTag = 'GTFSClasses';
        createCSSClassNames();
        registerCSSClasses();
        layoutChangeListener = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.TLF = function (settings) {
    var theThis, isVisible, isHidden, TLF, isExpanded;

    this.AddScrollArea = function () {
        var scrollWrapperAndContent = settings.cssClasses.CreateVertScrollWrapperAndContentWithFade();
        if (TLF.scrollWrapperContainer) {
            settings.cssClasses.SetAbsoluteScrollWrapperStyles(scrollWrapperAndContent.scrollWrapper);
            TLF.scrollWrapperContainer.AddContent(scrollWrapperAndContent.scrollWrapper);
        }
        else {
            TLF.wrapper.InsertContentBefore(scrollWrapperAndContent.scrollWrapper, TLF.footer.wrapper);
        }
        return scrollWrapperAndContent;
    };

    this.SetIsVisible = function (newIsVisible) {
        if (isVisible != (newIsVisible = !!newIsVisible)) {
            isVisible = newIsVisible;
            checkVisibility();
        }
    }

    this.SetIsHidden = function (newIsHidden) {
        if (isHidden != (newIsHidden = !!newIsHidden)) {
            isHidden = newIsHidden;
            checkVisibility();
        }
    }

    this.Get = function () { return TLF; }

    this.GetIsExpanded = function () { return isExpanded; }

    this.SetIsExpanded = function (newExpand) {
        if (isExpanded != (newExpand = !!newExpand)) {
            isExpanded = newExpand;
            settings.cssClasses.SetTLFIsExpanded(theThis, isExpanded);
            var verb = isExpanded ? "block" : "none";
            var verbFlex = isExpanded ? "flex" : "none";
            var minHeight = isExpanded ? "200px" : "0px";
            //var minHeight = isExpanded ? "0px" : "0px";
            //var flexGrow = isExpanded ? "1" : "0";
            var flexGrow = isExpanded ? "0" : "0";
            var wrapperE = TLF.wrapper.GetHTMLElement();
            var footerWrapperE = TLF.footer.wrapper.GetHTMLElement();
            footerWrapperE.style.display = verb;
            if (!settings.noScrollWrapperVisibility) {
                TLF.scrollWrapper.GetHTMLElement().style.display = verbFlex;
            }

            if (!isHidden && isVisible) {
                wrapperE.style.display = isExpanded ? "flex" : "block";
            }

            wrapperE.style.overflow = isExpanded ? "visible" : "hidden";

            if (true) {
                //wrapperE.style.minHeight = minHeight;
                wrapperE.style.minHeight = "0px";
                wrapperE.style.flexGrow = flexGrow;
                wrapperE.style.borderBottom = "1px solid gray";
                //TLF.scrollContent.GetHTMLElement().style.minHeight = minHeight;
                //TLF.scrollWrapper.GetHTMLElement().style.minHeight = minHeight;
                TLF.scrollWrapper.GetHTMLElement().style.minHeight = "0px";
            }

            if (tf.js.GetFunctionOrNull(settings.onToggleExpanded)) {
                settings.onToggleExpanded({ sender: theThis });
            }
        }
    }
    this.ToggleIsExpanded = function () {
        theThis.SetIsExpanded(!theThis.GetIsExpanded());
    }

    function checkVisibility() {
        var shouldShow = isVisible && !isHidden;
        TLF.wrapper.GetHTMLElement().style.display = shouldShow ? (isExpanded ? 'flex' : 'block') : 'none';
    }

    function createControl() {
        TLF = settings.cssClasses.CreateTLF({ absoluteScrollers: settings.absoluteScrollers });
        TLF.cellButton.SetOnClick(theThis.ToggleIsExpanded);
        settings.customAppContentI.getContentWrapper().AddContent(TLF.wrapper);
    }

    function initialize() {
        createControl();
        theThis.SetIsHidden(settings.isHidden);
        theThis.SetIsVisible(settings.isVisible);
        theThis.SetIsExpanded(settings.isExpanded);
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.TextButtonRow = function (settings) {
    var theThis, allContent;

    this.Show = function (show) { allContent.wrapper.GetHTMLElement().style.display = !!show ? "flex" : "none"; }

    this.GetAllContent = function () { return allContent; }

    function createControl() {
        var cssClasses = settings.cssClasses;
        var cssClassNames = cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: cssClassNames.topBotPaddedRowWrapper });
        var buttons = cssClasses.CreateButtons(settings.buttonSpecs, cssClassNames.signedInButtonClassName, wrapper);

        allContent = {
            wrapper: wrapper,
            buttons: buttons
        };
    }

    function initialize() {
        createControl();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.ModifyCancelTextButonRow = function (settings) {
    var theThis;

    this.Rename = function (newModifyStr, newCancelStr) {
        var buttons = theThis.GetAllContent().buttons;
        buttons["modify"].rename(newModifyStr);
        buttons["cancel"].rename(newCancelStr);
    }

    function onModify(confirmed) {
        if (!!tf.js.GetFunctionOrNull(settings.onModify)) {
            settings.onModify({ sender: theThis, confirmed: confirmed });
        }
    }

    function initialize() {
        var buttonSpecs = {};
        buttonSpecs["modify"] = { innerHTML: "Modify", handler: function () { onModify(true); } };
        buttonSpecs["cancel"] = { innerHTML: "Cancel", handler: function () { onModify(false); } };
        tf.GTFS.TextButtonRow.call(theThis, tf.js.ShallowMerge(settings, { buttonSpecs: buttonSpecs }));
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.GTFS.ModifyCancelTextButonRow, tf.GTFS.TextButtonRow);

tf.GTFS.IsAdminButtonRow = function (settings) {
    var theThis, isAdmin, wasAdmin;

    this.SetIsAdmin = function (newIsAdmin) { isAdmin = newIsAdmin; wasAdmin = isAdmin; rename(); }
    this.GetIsAdmin = function () { return isAdmin; }

    function onIsAdmin() { isAdmin = !isAdmin; rename(); }

    function rename() {
        var text = "administrator?&nbsp;&nbsp;" + (isAdmin ? "YES" : "NO");
        if (wasAdmin == undefined) {
            if (isAdmin) { text += '&nbsp;&nbsp;( CHANGE )'; }
            else { text += '&nbsp;&nbsp;( default )'; }
        }
        else {
            if (isAdmin == wasAdmin) { text += '&nbsp;&nbsp;( unchanged )'; }
            else { text += '&nbsp;&nbsp;( CHANGE )'; }
        }
        theThis.GetAllContent().buttons["isadmin"].rename(text);
    }

    function initialize() {
        var buttonSpecs = {};
        buttonSpecs["isadmin"] = { innerHTML: "", handler: function () { onIsAdmin(); } };
        tf.GTFS.TextButtonRow.call(theThis, tf.js.ShallowMerge(settings, { buttonSpecs: buttonSpecs }));
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.GTFS.ModifyCancelTextButonRow, tf.GTFS.TextButtonRow);

tf.GTFS.EmailPasswordInputs = function (settings) {
    var theThis, allContent, hasValidEmail, hasValidPassword;

    this.Reset = function () {
        allContent.emailInput.SetText("");
        allContent.passwordInput.SetText("");
        checkHasEmailAndPassword();
    }

    this.GetAllContent = function () { return allContent; }

    this.SetFocusToEmail = function () { allContent.emailInput.GetInputBox().focus(); }

    this.GetEmailStr = function () { return allContent.emailInput.GetText(); }
    this.GetPasswordStr = function () { return allContent.passwordInput.GetText(); }

    this.GetEmailPasswordStrs = function () {
        var email = theThis.GetEmailStr(), password = theThis.GetPasswordStr();
        return {
            both: hasValidEmail && hasValidPassword.ok,
            hasValidEmail: hasValidEmail,
            hasValidPassword: hasValidPassword.ok,
            passwordMessage: hasValidPassword.message,
            email: email,
            password: password,
            hasAnyEmail: email.length > 0,
            hasAnyPassword: password.length > 0
        };
    }

    function checkHasEmailAndPassword() {
        var emailPasswordStrs = theThis.GetEmailPasswordStrs();
        var newHasValidEmail = settings.cssClasses.GetIsEmailValid(emailPasswordStrs.email);
        var newHasValidPassword = settings.cssClasses.ValidatePassword(emailPasswordStrs.password);
        if (newHasValidEmail != hasValidEmail || newHasValidPassword.ok != hasValidPassword.ok || newHasValidPassword.message != hasValidPassword.message) {
            hasValidEmail = newHasValidEmail;
            hasValidPassword = newHasValidPassword;
            if (tf.js.GetFunctionOrNull(settings.onHasEmailPasswordChange)) {
                settings.onHasEmailPasswordChange({ sender: theThis });
            }
        }
    };

    function onGo(notification) {
        if (tf.js.GetFunctionOrNull(settings.onGo)) {
            settings.onGo({ sender: theThis });
        }
    }

    function onChange(onChange) {
        checkHasEmailAndPassword();
    }

    function createControl() {
        var cssClasses = settings.cssClasses;
        var cssClassNames = cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: cssClassNames.emailPasswordWrapper });
        var inputSettings = { onChange: onChange, onGo: onGo, className: cssClassNames.emailPasswordInputClassName, maxLength: 100 };
        var emailInputSettings = tf.js.ShallowMerge({ placeHolder: tf.js.GetNonEmptyString(settings.emailPlaceHolder, '') }, inputSettings);
        var passwordInputSettings = tf.js.ShallowMerge({ placeHolder: tf.js.GetNonEmptyString(settings.passwordPlaceHolder, ''), type: 'password' }, inputSettings);
        var emailInput = new tf.TFMap.InputBox(emailInputSettings);
        var passwordInput = new tf.TFMap.InputBox(passwordInputSettings);
        var emailInputBox = emailInput.GetInputBox();
        var passwordInputBox = passwordInput.GetInputBox();
        var autoComplete = !!settings.autoComplete;

        emailInputSettings.nextFocusTarget = emailInputSettings.prevFocusTarget = passwordInputBox;
        passwordInputSettings.nextFocusTarget = passwordInputSettings.prevFocusTarget = emailInputBox;
        if (!!settings.emailId) { emailInputBox.id = settings.emailId; }
        if (!!settings.passwordId) { passwordInputBox.id = settings.passwordId; }
        emailInputBox.autocomplete = autoComplete ? "on" : "off";
        passwordInputBox.autocomplete = autoComplete ? "on" : "new-password";

        wrapper.AddContent(emailInputBox, passwordInputBox);

        allContent = { wrapper: wrapper, emailInput: emailInput, passwordInput: passwordInput };
    }

    function initialize() {
        createControl();
        hasValidEmail = false;
        hasValidPassword = settings.cssClasses.ValidatePassword("");
        checkHasEmailAndPassword();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.AgencyPrefixInput = function (settings) {
    var theThis, allContent, hasValidPrefix, minLength, maxLength;

    this.Show = function (show) { allContent.wrapper.GetHTMLElement().style.display = !!show ? "flex" : "none"; }

    this.Reset = function () {
        allContent.prefixInput.SetText("");
        checkHasValidPrefix();
    }

    this.GetAllContent = function () { return allContent; }

    this.SetFocusToPrefix = function () { allContent.prefixInput.GetInputBox().focus(); }

    this.GetPrefixStr = function () { return allContent.prefixInput.GetText().toUpperCase(); }

    this.GetPrefixStatus = function () {
        var prefix = theThis.GetPrefixStr();
        return {
            prefix: prefix,
            hasValidPrefix: hasValidPrefix.ok,
            prefixMessage: hasValidPrefix.message,
            hasAnyPrefix: prefix.length > 0
        };
    }

    function checkHasValidPrefix() {
        var prefix = theThis.GetPrefixStr();
        var newHasValidPrefix = validatePrefix(prefix);
        if (newHasValidPrefix.ok != hasValidPrefix.ok || newHasValidPrefix.message != hasValidPrefix.message) {
            hasValidPrefix = newHasValidPrefix;
            if (tf.js.GetFunctionOrNull(settings.onPrefixChange)) {
                settings.onPrefixChange({ sender: theThis });
            }
        }
    };

    function validatePrefix(prefix) {
        var ok = tf.js.GetIsStringWithMinLength(prefix, minLength) && prefix.length <= maxLength;
        var message = ok ? "" : getPrefixSpecs();
        return { ok: ok, message: message };
    }

    function onGo(notification) { if (tf.js.GetFunctionOrNull(settings.onGo)) { settings.onGo({ sender: theThis }); } }

    function onChange(onChange) { checkHasValidPrefix(); }

    function getPrefixSpecs() {
        return "enter prefix (" + minLength + " to " + maxLength + " characters)";
    }

    function createControl() {
        var cssClasses = settings.cssClasses;
        var cssClassNames = cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: cssClassNames.emailPasswordWrapper });
        var inputSettings = { onChange: onChange, onGo: onGo, className: cssClassNames.emailPasswordInputClassName, maxLength: maxLength, style: "text-transform:uppercase" };
        var prefixSettings = tf.js.ShallowMerge({
            placeHolder: tf.js.GetNonEmptyString(settings.prefixPlaceHolder, getPrefixSpecs())
        }, inputSettings);
        var prefixInput = new tf.TFMap.InputBox(prefixSettings);
        var prefixInputBox = prefixInput.GetInputBox();
        var autoComplete = !!settings.autoComplete;

        prefixInputBox.autocomplete = "off";

        wrapper.AddContent(prefixInputBox);

        allContent = { wrapper: wrapper, prefixInput: prefixInput };
    }

    function initialize() {
        maxLength = 8;
        minLength = 3;
        createControl();
        hasValidPrefix = validatePrefix("");
        checkHasValidPrefix();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.AutoHideStatus = function (settings) {
    var theThis, allContent, delayHide, isShowing;

    this.GetAllContent = function () { return allContent; }

    this.Show = function (show, statusText, noAutoClose) {
        var sE = allContent.statusWrapper.GetHTMLElement(), sES = sE.style;
        show = !!show;
        if (show) { statusText = statusText || ""; sE.innerHTML = statusText; }
        sES.display = show ? "block" : "none";
        if (isShowing = show) { if (!noAutoClose) { theThis.HideDelayed(); } }
    }

    this.GetIsShowing = function () { return isShowing; }

    this.HideDelayed = function () { delayHide.DelayCallBack(); }

    this.HideNow = function () { delayHide.CancelCallBack(); theThis.Show(false); }

    function createControl() {
        var cssClasses = settings.cssClasses;
        var classNames = cssClasses.GetClassNames();
        var statusWrapper = new tf.dom.Div({ cssClass: classNames.emailPasswordStatus });
        statusWrapper.GetHTMLElement().style.backgroundColor = "firebrick";

        allContent = {
            statusWrapper: statusWrapper
        };
    }

    function initialize() {
        createControl();
        theThis.Show(false);
        delayHide = new tf.events.DelayedCallBack(5000, theThis.HideNow, theThis);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.UserModifyControl = function (settings) {
    var theThis, allContent;

    this.GetIsAdmin = function () { return allContent.isAdminButtonRow.GetIsAdmin(); }
    this.GetEmailPasswordStrs = function () { return allContent.changeEmailPassword.GetEmailPasswordStrs(); }

    this.Show = function (show, itemData) {
        show = !!show;
        if (show) {
            var isAdmin = !!itemData ? itemData.isAdmin : undefined;
            allContent.isAdminButtonRow.SetIsAdmin(isAdmin);
            allContent.changeEmailPassword.Reset();
        }
        allContent.wrapper.GetHTMLElement().style.display = show ? "block" : "none";
        if (show) { theThis.SetFocusToEmail(); }
    }

    this.SetFocusToEmail = function () { allContent.changeEmailPassword.SetFocusToEmail(); }

    this.GetAllContent = function () { return allContent; }

    function onHasEmailPasswordChange(notification) { }

    function onGo() {
        if (allContent.changeEmailPassword.GetEmailPasswordStrs()) { if (!!tf.js.GetFunctionOrNull(settings.onGo)) { settings.onGo({ sender: theThis }); } }
        else { console.log('on go failed'); }
    }

    function createControl() {
        var appContent = settings.appContent;
        var cssClasses = settings.cssClasses;
        var classNames = cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: classNames.itemRowWrapperClassName });
        var changeEmailPassword = new tf.GTFS.EmailPasswordInputs(
            tf.js.ShallowMerge(settings, {
                onGo: onGo, emailPlaceHolder: "enter new email address", passwordPlaceHolder: "enter new password", autoComplete: false,
                onHasEmailPasswordChange: onHasEmailPasswordChange
            }));
        var isAdminButtonRow = new tf.GTFS.IsAdminButtonRow(tf.js.ShallowMerge(settings, {}));

        wrapper.AddContent(changeEmailPassword.GetAllContent().wrapper, isAdminButtonRow.GetAllContent().wrapper);

        allContent = {
            changeEmailPassword: changeEmailPassword,
            isAdminButtonRow: isAdminButtonRow,
            wrapper: wrapper
        };
    }

    function initialize() { createControl(); }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.ListSelectedContent = function (settings) {
    var theThis, allContent, currentContent, currentVerb;

    this.GetAllContent = function () { return allContent; }

    this.GetCurrentContent = function () { return currentContent; }

    this.AttachTo = function (content) {
        theThis.DetachIfAttached();
        if (!!content && !!content.wrapper) {
            var prevContent = currentContent;
            allContent.autoHideStatus.HideNow();
            currentContent = content;
            if (settings.onContentChange) { settings.onContentChange({}); }
            backToToolBar();
            currentContent.wrapper.AddContent(allContent.wrapper);
            notifyAttachDetach(true);
        }
    }

    this.DetachIfAttached = function () {
        if (!!currentContent) {
            allContent.autoHideStatus.HideNow();
            currentContent.wrapper.RemoveContent(allContent.wrapper);
            currentContent = undefined;
            notifyAttachDetach(false);
        }
    };

    function notifyAttachDetach(isAttached) { if (settings.onAttachDetach) { settings.onAttachDetach({ sender: theThis, isAttached: isAttached }); } };

    function showTitle(show, titleText) {
        var sE = allContent.titleWrapper.GetHTMLElement(), sES = sE.style;
        show = !!show;
        if (show) { titleText = titleText || ""; sE.innerHTML = titleText; }
        sES.display = show ? "block" : "none";
    }

    function showToolBar(show) { allContent.toolBar.GetHTMLElement().style.display = !!show ? "block" : "none"; }

    function backToToolBar() {
        var verbs = settings.verbs;
        if (verbs[currentVerb] != undefined && tf.js.GetFunctionOrNull(verbs[currentVerb].onShow)) {
            verbs[currentVerb].onShow(false);
        }
        currentVerb = undefined;
        showTitle(false);
        allContent.modifyCancelRow.Show(false);
        if (allContent.autoHideStatus.GetIsShowing()) { allContent.autoHideStatus.HideDelayed(); }
        showToolBar(true);
    }

    function startVerb(verb) {
        var verbs = settings.verbs;
        allContent.autoHideStatus.HideNow();
        allContent.modifyCancelRow.Show(false);
        if (verbs[verb] != undefined) {
            var theVerb = verbs[verb];
            if (tf.js.GetFunctionOrNull(theVerb.onShow)) {
                currentVerb = verb;
                showToolBar(false);
                theVerb.onShow(true);
                if (!theVerb.noModifyCancel) { allContent.modifyCancelRow.Show(true); }
            }
            else if (tf.js.GetFunctionOrNull(theVerb.onClick)) {
                theVerb.onClick();
            }
        }
    }

    function getCurrentVerb() { return currentVerb; }
    function getVerbs() { return settins.verbs; }

    function createControl() {
        var appContent = settings.appContent;
        var classNames = settings.cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: classNames.itemRowWrapperClassName });
        var toolBar = new tf.dom.Div({ cssClass: classNames.itemRowToolBarClassName });
        var delayMillis = 0, toolTipClass = "*start", toolTipArrowClass = "top";
        var buttonSettings = {
            wrapper: settings.toolTipWrapper, offsetY: -4, onClick: undefined, onHover: undefined, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        var buttons = {};

        var verbs = settings.verbs;

        toolBar.GetHTMLElement().style.textAlign = "right";

        for (var i in verbs) {
            var verb = verbs[i];
            var newButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
                onClick: function (verbName) { return function () { return startVerb(verbName); } }(i)
            }), undefined, classNames.itemToolBarTextButton + " " + classNames.itemToolBarFixWidthTextButton, verb.toolTip, undefined, "toolBarEdit");

            newButton.GetButton().innerHTML = verb.text;
            toolBar.AddContent(newButton.GetButton());
            buttons[i] = { verb: verb, button: newButton };
        }

        //var modifyCancelRow = new tf.GTFS.ModifyCancelTextButonRow(tf.js.ShallowMerge(settings, { onModify: settings.onModify }));
        var modifyCancelRow = new tf.GTFS.ModifyCancelTextButonRow(settings);

        modifyCancelRow.Show(false);

        var titleWrapper = new tf.dom.Div({ cssClass: classNames.emailPasswordStatus });

        var autoHideStatus = new tf.GTFS.AutoHideStatus(settings);

        wrapper.AddContent(toolBar, titleWrapper, modifyCancelRow.GetAllContent().wrapper, autoHideStatus.GetAllContent().statusWrapper);

        allContent = {
            autoHideStatus: autoHideStatus,
            titleWrapper: titleWrapper,
            modifyCancelRow: modifyCancelRow,
            toolBar: toolBar,
            buttons: buttons,
            wrapper: wrapper
        };

        showTitle(false);
    }

    function refreshSignInState() {
        var auth = settings.apiClient.GetAuth();
        var adminVerb = auth.isAdmin ? "inline-block" : "none";

        backToToolBar();

        for (var i in allContent.buttons) {
            var button = allContent.buttons[i];
            if (button.verb.isAdmin) {
                button.button.GetButton().style.display = adminVerb;
            }
        }
    }

    function initialize() {
        createControl();
        settings.apiClient.AddAuthListener(refreshSignInState);
        refreshSignInState();
        if (tf.js.GetFunctionOrNull(settings.setInterface)) {
            settings.setInterface({
                getVerbs: getVerbs,
                getCurrentVerb: getCurrentVerb,
                backToToolBar: backToToolBar,
                showTitle: showTitle,
                showToolbar: showToolBar
            });
        }
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.ListContent = function (settings) {
    var theThis, TLF, lastAuth, klListener, keyedListContent, selectedContent, attachedSelectedContent;

    this.GetAttachedSelectedContent = function () { return attachedSelectedContent; };
    this.OnCreated = function (notification) { }
    this.OnVisibilityChange = function (notification) { theThis.SetIsVisible(notification.isVisible); }
    this.SetIsVisible = function (newIsVisible) { TLF.SetIsVisible(newIsVisible); }
    this.GetTLF = function () { return TLF; }

    //function getItemFromContent(content) { return keyedListContent.GetItemFromContent(content); }
    //function getContentFromItem(item) { return keyedListContent.GetContentFromItem(item); }

    this.SetSelectedContent = function (newSelectedContent) {
        if (newSelectedContent != selectedContent) {
            if (!!selectedContent) {
                var savedSelectedContent = selectedContent;
                selectedContent = undefined;
                setSelectedStyle(savedSelectedContent, false);
                if (!!attachedSelectedContent) { attachedSelectedContent.DetachIfAttached(); }
            }
            if (!!(selectedContent = newSelectedContent)) {
                setSelectedStyle(selectedContent, true);
                if (!!attachedSelectedContent) { attachedSelectedContent.AttachTo(selectedContent); }
            }
        }
    };

    this.SetSelectedItem = function (newSelectedItem) {
        return theThis.SetSelectedContent(getContentFromItem(newSelectedItem));
    };

    this.GetSelectedContent = function () { return selectedContent; }

    this.GetSelectedItem = function () { return getItemFromContent(selectedContent); }

    function refreshSignInState() {
        var auth = settings.apiClient.GetAuth();
        TLF.SetIsHidden(!auth.email);
    }

    function updateFooterText(theText) { TLF.Get().footer.content.GetHTMLElement().innerHTML = theText; }

    function updateFooterCount() {
        var count = settings.KL.GetItemCount(), footerStr;
        if (count == 0) { footerStr = "empty list" }
        else {
            var itemItems = count == 1 ? settings.itemNameSingle : settings.itemNamePlural;
            footerStr = count + " " + itemItems;
        }
        updateFooterText(footerStr);
    }

    function getItemFromContent(content) { return keyedListContent.GetItemFromContent(content); }
    function getContentFromItem(item) { return keyedListContent.GetContentFromItem(item); }

    function setSelectedStyle(content, isSelected) {
        var classNames = settings.cssClasses.GetClassNames();
        if (isSelected) { tf.dom.AddCSSClass(content.wrapper, classNames.itemWrapperSelectedClassName); }
        else { tf.dom.RemoveCSSClass(content.wrapper, classNames.itemWrapperSelectedClassName); }
        if (tf.js.GetFunctionOrNull(settings.onSelectedStyleChange)) {
            settings.onSelectedStyleChange({ sender: theThis, content: content, isSelected: isSelected });
        }
    }

    function onItemClick(notification) {
        var button = !!notification ? notification.domObj : undefined;
        if (!!button) {
            var content = button.content;
            var item = getItemFromContent(content);
            if (!!item) {
                var contentToSelect = content == selectedContent ? undefined : content;
                theThis.SetSelectedContent(contentToSelect);
            }
            //if (!!item) { clickCB({ sender: theThis, item: item }); }
        }
    }

    function onKLChange(notification) {
        var selectedItemId, curUserSel;
        if (!!selectedContent) {
            if (selectedItem = getItemFromContent(selectedContent)) {
                selectedItemId = selectedItem.GetData().id;
            }
            curUserSel = !!attachedSelectedContent ? attachedSelectedContent.GetCurrentContent() : undefined;
            theThis.SetSelectedContent(undefined);
        }
        if (!!attachedSelectedContent) { attachedSelectedContent.DetachIfAttached(); }
        keyedListContent.OnKLChange(notification);
        if (selectedItemId != undefined) {
            var selectedItem = settings.KL.GetItem(selectedItemId);
            theThis.SetSelectedContent(getContentFromItem(selectedItem));
            if (!!curUserSel && !!selectedContent && !!attachedSelectedContent) {
                attachedSelectedContent.AttachTo(selectedContent);
            }
        }
        setTimeout(updateFooterCount, 0);
    }

    function prepareSpareContent(content, forItem) { setSelectedStyle(content, false); return settings.prepareSpareContent(content, forItem); }

    function createListContent() {
        var theTLF = TLF.Get();
        keyedListContent = new tf.TFMap.KeyedListContent({
            KL: settings.KL, wrapper: theTLF.scrollWrapper, contentWrapper: theTLF.scrollContent,
            contentWrapperDisplayVisibleVerb: 'block',
            contentInItemAttributeName: settings.contentInItemAttributeName, itemInContentAttributeName: settings.itemInContentAttributeName,
            createNewContent: settings.createNewContent, prepareSpareContent: prepareSpareContent,
            onContentBecameSpare: settings.onContentBecameSpare,
            updateContentForItem: settings.updateContentForItem, compareContent: settings.compareContent
        });
        klListener = settings.KL.AddAggregateListener(onKLChange);
    }

    function getButtonSettings() {
        var delayMillis = 0;
        var toolTipClass = "*start";
        var toolTipArrowClass = "top";
        var buttonSettings = {
            offsetY: 0, onClick: undefined, onHover: undefined, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };
        return buttonSettings;
    }

    function setTitle(newTitle) { TLF.Get().listTitleSpan.innerHTML = newTitle; };

    function updateTitleForExpanded() {
        if (!!TLF) {
            var text = TLF.GetIsExpanded() ? '-' : '+';
            text = '<b>' + text + '</b>&nbsp;&nbsp;' + settings.listTitle;
            setTitle(text);
        }
    }

    function onToggleExpanded(notification) {
        updateTitleForExpanded();
        if (tf.js.GetFunctionOrNull(settings.onToggleExpanded)) {
            settings.onToggleExpanded(notification);
        }
    }

    function createControl() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var customAppContentI = settings.customAppContentI;
        var mainToolBarButtonClassNames = customAppContentI.getToolBarButtonClasses();
        var mainToolBarSpanClassNames = customAppContentI.getToolBarSpanClasses();
        var buttonSettings = getButtonSettings();

        TLF = new tf.GTFS.TLF(tf.js.ShallowMerge(settings, { isVisible: true, isExpanded: false, isHidden: true, onToggleExpanded: onToggleExpanded }));

        var theTLF = TLF.Get();

        theTLF.listTitleSpan = document.createElement('div');
        theTLF.listTitleSpan.className = mainToolBarSpanClassNames;
        updateTitleForExpanded();

        theTLF.footer.content.GetHTMLElement().innerHTML = "";

        theTLF.toolBar.content.AddContent(theTLF.listTitleSpan);

        if (!!settings.attachedSelectedContentType) {
            var toolTipWrapper = customAppContentI.getContentWrapper();
            attachedSelectedContent = new settings.attachedSelectedContentType(tf.js.ShallowMerge(settings, {
                toolTipWrapper: toolTipWrapper,
                getItemFromContent: getItemFromContent
            }));
        }
    };

    function initialize() {
        createControl();
        createListContent();
        settings.apiClient.AddAuthListener(refreshSignInState);
        if (tf.js.GetFunctionOrNull(settings.setInterface)) {
            settings.setInterface({
                getContentFromItem: getContentFromItem,
                getItemFromContent: getItemFromContent,
                onItemClick: onItemClick
            });
        }
        updateFooterCount();
        refreshSignInState();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.AddDelCancelRow = function (settings) {
    var theThis;

    this.Rename = function (addStr, delStr, cancelStr) {
        var buttons = theThis.GetAllContent().buttons;
        buttons["add"].rename(addStr);
        buttons["del"].rename(delStr);
        buttons["cancel"].rename(cancelStr);
    }

    function onAddDelCancel(isAdd, confirmed) {
        if (!!tf.js.GetFunctionOrNull(settings.onAddDelCancel)) {
            settings.onAddDelCancel({ sender: theThis, isAdd: isAdd, confirmed: confirmed });
        }
    }

    function initialize() {
        var buttonSpecs = {};
        buttonSpecs["add"] = { innerHTML: "Add", handler: function () { onAddDelCancel(true, true); } };
        buttonSpecs["del"] = { innerHTML: "Remove", handler: function () { onAddDelCancel(false, true); } };
        buttonSpecs["cancel"] = { innerHTML: "Cancel", handler: function () { onAddDelCancel(false, false); } };
        tf.GTFS.TextButtonRow.call(theThis, tf.js.ShallowMerge(settings, { buttonSpecs: buttonSpecs }));
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.GTFS.ModifyCancelTextButonRow, tf.GTFS.TextButtonRow);

tf.GTFS.FileSelectInput = function (settings) {
    var theThis, allContent, fileInputId, onChangeListener, emptyLabel;

    this.GetAllContent = function () { return allContent; }

    this.Show = function (show) {
        onChange();
        allContent.fileLabel.htmlFor = fileInputId;
        allContent.wrapper.GetHTMLElement().style.display = !!show ? "flex" : "none";
    }

    this.GetFirstFile = function () {
        var file;
        var oFiles = allContent.fileInput.files, nFiles = !!oFiles ? oFiles.length : 0;
        if (nFiles > 0) { file = oFiles[0]; }
        return file;
    }

    function onChange(notification) { var file = theThis.GetFirstFile(); allContent.fileLabel.innerHTML = !!file ? file.name : emptyLabel; }

    function createControl() {
        var classNames = settings.cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: classNames.topBotPaddedRowWrapper });
        var fileInput = document.createElement('input');
        var fileLabel = document.createElement('label');
        fileInputId = tf.dom.CreateDomElementID("file-input");
        fileInput.id = fileInputId;
        fileInput.type = "file";
        fileInput.accept = tf.js.GetNonEmptyString(settings.accept, "*");
        fileInput.className = classNames.fileInputClassName;
        fileLabel.className = classNames.signedInButtonClassName;

        wrapper.AddContent(fileInput, fileLabel);

        onChangeListener = new tf.events.DOMChangeListener({ domObj: theThis, target: fileInput, callBack: onChange, optionalScope: theThis, callBackSettings: undefined });

        allContent = {
            wrapper: wrapper,
            fileInput: fileInput,
            fileLabel: fileLabel
        };

        theThis.Show(false);
    };

    function initialize() {
        emptyLabel = tf.js.GetNonEmptyString(settings.label, "Choose file");
        createControl();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.URLInput = function (settings) {
    var theThis, allContent;

    this.Show = function (show) { allContent.wrapper.GetHTMLElement().style.display = !!show ? "flex" : "none"; }

    this.Reset = function () {
        allContent.urlInput.SetText("");
        checkHasValidPrefix();
    }

    this.GetAllContent = function () { return allContent; }

    this.SetFocus = function () { allContent.urlInput.GetInputBox().focus(); }

    this.GetURLStr = function () { return allContent.urlInput.GetText(); }

    function onGo(notification) { if (tf.js.GetFunctionOrNull(settings.onGo)) { settings.onGo({ sender: theThis }); } }

    function createControl() {
        var cssClasses = settings.cssClasses;
        var cssClassNames = cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: cssClassNames.emailPasswordWrapper });
        var inputSettings = { onChange: undefined, onGo: onGo, className: cssClassNames.emailPasswordInputClassName, maxLength: 200 };
        var urlSettings = tf.js.ShallowMerge({
            placeHolder: tf.js.GetNonEmptyString(settings.prefixPlaceHolder, "enter URL")
        }, inputSettings);
        var urlInput = new tf.TFMap.InputBox(urlSettings);
        var urlInputBox = urlInput.GetInputBox();

        urlInputBox.autocomplete = "off";

        wrapper.AddContent(urlInputBox);

        allContent = { wrapper: wrapper, urlInput: urlInput };

        theThis.Show(false);
    }

    function initialize() {
        createControl();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

