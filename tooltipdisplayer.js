"use strict";

tf.TFMap.ToolTipDisplayer = function(settings) {
    var theThis, curParent;
    var delayedShowToolTip;
    var contentToolTip, contentToolTipArrow;
    var lastSender, lastToolTipClassName, lastToolTipArrowClassName;
    var buttonsCache, spansCache;
    var hoverListener;
    var isInHover;

    this.GetIsInHover = function() { return isInHover; }
    this.GetLastSender = function() { return lastSender; }
    this.Show = function(sender) { return show(sender); }
    this.RefreshToolTip = function() { return refreshToolTip(); }
    this.Hide = function() { return showToolTip(false); }
    this.GetIsVisible = function() { return curParent != undefined; }

    function detach() {
        if (!!curParent) {
            curParent.removeChild(contentToolTip.GetHTMLElement()); curParent.removeChild(contentToolTipArrow.GetHTMLElement());
            curParent = undefined;
            /*var root = settings.appContent.GetRootDiv();
            root.RemoveContent(contentToolTip);
            root.RemoveContent(contentToolTipArrow);*/
            curParent = undefined;
            buttonsCache.Reset();
            spansCache.Reset();
        }
    }

    function attach() {
        var wrapperUse = !!lastSender.insertWrapper ? lastSender.insertWrapper : lastSender.wrapper;
        if (!!(curParent = tf.dom.GetHTMLElementFrom(wrapperUse))) {
            //isInHover = true;
            curParent.appendChild(contentToolTip.GetHTMLElement()); curParent.appendChild(contentToolTipArrow.GetHTMLElement());
            /*var root = settings.appContent.GetRootDiv();
            root.AddContent(contentToolTip);
            root.AddContent(contentToolTipArrow);*/
        }
        else {
            curParent = undefined;
        }
    }

    function resetStylePos(appContent) {
        var elem = appContent.GetHTMLElement(), display = elem.style.display;
        elem.removeAttribute("style");
        elem.style.display = display;
    }

    function doPositionToolTip(lastSender, rectToolBar, rectObj, styleContent, styleArrow, rectInsert, posStr, arrowStr, centerToObject, isInset) {

        //posStr = 'center';
        //centerToObject = true;

        var ls = tf.TFMap.LayoutSettings;
        var fontSizeToolTipInt = ls.arrowDimsToolTipInt;
        var halfToolTipDim = fontSizeToolTipInt / 2;
        var offsetX = lastSender.offsetX != undefined ? lastSender.offsetX : 0;
        var offsetY = lastSender.offsetY != undefined ? lastSender.offsetY : 0;
        var parentRect = !!rectInsert ? rectInsert : rectToolBar;
        var halfObjectWidthForCentering = centerToObject ? rectObj.width / 2 - fontSizeToolTipInt : 0;
        var halfObjectHeightForCentering = centerToObject ? rectObj.height / 2 - fontSizeToolTipInt : 0;
        var isTopBot = false;
        var leftC, topC, rightC, bottomC;
        var leftA, topA, rightA, bottomA;
        var transformC;

        //console.log(posStr + ' ' + arrowStr + ' ' + offsetX + ' ' + offsetY + ' center: ' + centerToObject + ' inset: ' + isInset);

        switch (arrowStr) {
            case 'left':
                if (isInset) {
                    leftC = rectObj.left - parentRect.left + offsetX + halfToolTipDim;
                    leftA = rectObj.left - parentRect.left + offsetX;
                }
                else {
                    leftC = rectObj.right - parentRect.left + offsetX + halfToolTipDim;
                    leftA = rectObj.right - parentRect.left + offsetX;
                }
                break;
            case 'right':
                if (isInset) {
                    rightC = parentRect.right - rectObj.right + offsetX + halfToolTipDim;
                    rightA = parentRect.right - rectObj.right + offsetX
                }
                else {
                    rightC = parentRect.right - rectObj.left + offsetX + halfToolTipDim * 2;
                    rightA = parentRect.right - rectObj.left + offsetX + halfToolTipDim
                }
                break;
            case 'top':
                if (isInset) {
                    topC = rectObj.top - parentRect.top + offsetY + halfToolTipDim;
                    topA = rectObj.top - parentRect.top + offsetY
                }
                else {
                    topC = rectObj.bottom - parentRect.top + offsetY + halfToolTipDim * 2;
                    topA = rectObj.bottom - parentRect.top + offsetY + halfToolTipDim
                }
                isTopBot = true;
                break;
            case 'bottom':
                if (isInset) {
                    bottomC = parentRect.bottom - rectObj.bottom + offsetY + halfToolTipDim;
                    bottomA = parentRect.bottom - rectObj.bottom + offsetY
                }
                else {
                    bottomC = parentRect.bottom - rectObj.top + offsetY + halfToolTipDim * 2;
                    bottomA = parentRect.bottom - rectObj.top + offsetY + halfToolTipDim
                }
                isTopBot = true;
                break;
        }

        if (isTopBot) {
            switch (posStr) {
                case 'start':
                    rightC = parentRect.right - rectObj.right + offsetX + halfObjectWidthForCentering;
                    rightA = parentRect.right - rectObj.right + offsetX + halfToolTipDim + halfObjectWidthForCentering;
                    break;
                case 'end':
                    leftC = rectObj.left - parentRect.left + offsetX + halfObjectWidthForCentering;
                    leftA = rectObj.left - parentRect.left + offsetX + halfToolTipDim + halfObjectWidthForCentering;
                    break;
                case 'center':
                    leftC = rectObj.left - parentRect.left + offsetX + rectObj.width / 2;
                    leftA = rectObj.left - parentRect.left + offsetX + rectObj.width / 2;
                    transformC = "translateX(-50%)";
                    break;
            }
        }
        else {
            switch (posStr) {
                case 'start':
                    topC = rectObj.top - parentRect.top + offsetY + halfObjectHeightForCentering;
                    topA = rectObj.top - parentRect.top + offsetY + halfObjectHeightForCentering + halfToolTipDim;
                    break;
                case 'end':
                    bottomC = parentRect.bottom - rectObj.bottom + offsetY - halfToolTipDim + halfObjectHeightForCentering;
                    bottomA = parentRect.bottom - rectObj.bottom + offsetY + halfObjectHeightForCentering;
                    break;
                case 'center':
                    topC = rectObj.top - parentRect.top + offsetY + rectObj.height / 2;
                    topA = rectObj.top - parentRect.top + offsetY + rectObj.height / 2;
                    transformC = "translateY(-50%)";
                    break;
            }
        }

        styleContent.transform = transformC != undefined ? transformC : 'initial';
        styleContent.left = leftC != undefined ? leftC + 'px' : 'initial';
        styleContent.right = rightC != undefined ? rightC + 'px' : 'initial';
        styleContent.top = topC != undefined ? (topC.length != undefined ? topC : topC + 'px') : 'initial';
        styleContent.bottom = bottomC != undefined ? bottomC + 'px' : 'initial';

        styleArrow.transform = transformC != undefined ? transformC : 'initial';
        styleArrow.left = leftA != undefined ? leftA + 'px' : 'initial';
        styleArrow.right = rightA != undefined ? rightA + 'px' : 'initial';
        styleArrow.top = topA != undefined ? topA + 'px' : 'initial';
        styleArrow.bottom = bottomA != undefined ? bottomA + 'px' : 'initial';
    }

    function positionToolTip() {
        var contentToolTipES = contentToolTip.GetHTMLElement().style, contentToolTipArrowES = contentToolTipArrow.GetHTMLElement().style;
        var rectInsert = !!lastSender.insertWrapper ? tf.dom.GetHTMLElementFrom(lastSender.insertWrapper)/*.GetHTMLElement()*/.getBoundingClientRect() : undefined;
        var rectToolBar = tf.dom.GetHTMLElementFrom(lastSender.wrapper)/*.GetHTMLElement()*/.getBoundingClientRect();
        var rectObj = !!lastSender.element ? lastSender.element.getBoundingClientRect() : undefined;

        tf.dom.RemoveCSSClass(contentToolTip, lastToolTipClassName);
        tf.dom.RemoveCSSClass(contentToolTipArrow, lastToolTipArrowClassName);

        resetStylePos(contentToolTip);
        resetStylePos(contentToolTipArrow);

        //tf.dom.AddCSSClass(contentToolTip, lastToolTipClassName = lastSender.toolTipClassName);

        var isInset = false;
        var centerToObject = false;
        var toolTipArrowClassName = tf.js.GetNonEmptyString(lastSender.toolTipArrowClassName, "left").toLowerCase();
        var toolTipArrowClassNameUse;

        if (tf.js.GetIsNonEmptyString(toolTipArrowClassName)) { if (toolTipArrowClassName.charAt(0) == '*') { isInset = true; toolTipArrowClassName = toolTipArrowClassName.substring(1); } }

        var toolTipPosName = tf.js.GetNonEmptyString(lastSender.toolTipClassName, "center").toLowerCase();
        if (tf.js.GetIsNonEmptyString(toolTipPosName)) { if (toolTipPosName.charAt(0) == '*') { centerToObject = true; toolTipPosName = toolTipPosName.substring(1); } }

        switch (toolTipPosName) { case "start": break; default: case "center": toolTipPosName = "center"; break; case "end": break; }

        switch (toolTipArrowClassName) {
            default:
            case "left": toolTipArrowClassName = "left"; toolTipArrowClassNameUse = leftArrowToolTipClassName; break;
            case "right": toolTipArrowClassNameUse = rightArrowToolTipClassName; break;
            case "top": toolTipArrowClassNameUse = topArrowToolTipClassName; break;
            case "bottom": toolTipArrowClassNameUse = botArrowToolTipClassName; break;
        }
        tf.dom.AddCSSClass(contentToolTipArrow, lastToolTipArrowClassName = toolTipArrowClassNameUse);

        if (tf.js.GetFunctionOrNull(lastSender.toolTipStyle)) {
            lastSender.toolTipStyle(lastSender, rectToolBar, rectObj, contentToolTipES, contentToolTipArrowES, rectInsert, toolTipPosName, toolTipArrowClassName, centerToObject, isInset);
        }
        else {
            doPositionToolTip(lastSender, rectToolBar, rectObj, contentToolTipES, contentToolTipArrowES, rectInsert, toolTipPosName, toolTipArrowClassName, centerToObject, isInset);
        }
    }

    function show(sender) {
        if (tf.TFMap.DontHideToolTipsDebug) {
            if (!sender) { return; }
        }
        var doShow = false;
        detach();
        if (!!sender) {
            lastSender = sender;
            contentToolTip.ClearContent();

            var toolTipText = lastSender.toolTipText;

            if (tf.js.GetFunctionOrNull(lastSender.toolTipFunction)) {
                toolTipText = lastSender.toolTipFunction(lastSender);
            }

            if (!tf.js.GetIsArray(toolTipText)) {
                toolTipText = [toolTipText];
            }

            var nToolTips = toolTipText.length, nToolTipsAdded = 0;
            var useButton = !!tf.js.GetFunctionOrNull(lastSender.onClick);

            for (var i = 0; i < nToolTips; ++i) {
                var thisToolTip = toolTipText[i], thisToolTipContent;

                if (!!tf.js.GetFunctionOrNull(thisToolTip)) { thisToolTipContent = thisToolTip(lastSender, thisToolTip); }
                else { thisToolTipContent = thisToolTip; }

                if (thisToolTipContent != undefined) {
                    if (tf.js.GetIsNonEmptyString(thisToolTipContent)) {
                        var thisToolTipContentElement = useButton ? buttonsCache.GetNext() : spansCache.GetNext();
                        thisToolTipContentElement.tfToolTipButtonOrder = i;
                        thisToolTipContentElement.innerHTML = thisToolTipContent;
                        thisToolTipContent = thisToolTipContentElement;
                    }
                    ++nToolTipsAdded;
                    contentToolTip.AddContent(thisToolTipContent);
                }
            }

            if (nToolTipsAdded > 0) {
                positionToolTip();
                isInHover = !!lastSender.startInHover;
                attach();
                doShow = true;
            }
        }
        showToolTip(doShow);
    }

    function refreshToolTip() {
        if (!!lastSender) {
            var lastSenderSaved = lastSender;
            showToolTip(false);
        }
    }

    function showToolTipImmediate(bool) {
        var displayStr = !!bool ? 'block' : 'none';
        contentToolTipArrow.GetHTMLElement().style.display = contentToolTip.GetHTMLElement().style.display = displayStr;
        if (!bool) { lastSender = undefined; }
    }

    function showToolTipOn() { showToolTipImmediate(true); }

    function showToolTip(bool) {
        if (!!lastSender) {
            delayedShowToolTip.CancelCallBack();
            if (!bool || lastSender.delayUse == undefined) { showToolTipImmediate(bool); }
            else { delayedShowToolTip.ChangeDelay(lastSender.delayUse); delayedShowToolTip.DelayCallBack(); }
        }
    }

    function createNewButtonSpan(elem, classStr) { elem.className = classStr; return elem; }

    function createNewSpan(notification) { return createNewButtonSpan(document.createElement('span'), spanClassName); }

    function deleteSpan(notification) { /*console.log('deleted span');*/ }

    function onClickToolTipButton(notification) {
        if (!!lastSender) {
            if (!!tf.js.GetFunctionOrNull(lastSender.onClick)) {
                lastSender.onClick({ sender: theThis, toolTipSender: lastSender, order: notification.target.tfToolTipButtonOrder });
            }
        }
    }

    function createNewButton(notification) {
        var button = createNewButtonSpan(document.createElement('button'), buttonClassName);
        button.addEventListener('click', onClickToolTipButton);
        return button;
    }

    function deleteButton(notification) { /*console.log('deleted button');*/ }

    function onHoverToolTipContainer(notification) {
        //console.log(notification.isInHover);
        if (!!lastSender) {
            var target = notification.event.target;
            //console.log(notification.isInHover);
            if (target == contentToolTip.GetHTMLElement() || target == contentToolTipArrow.GetHTMLElement()) {
                var needsHide = !(isInHover = notification.isInHover) ? true : !lastSender.keepOnHoverOutTarget;
                if (needsHide) { settings.appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender, undefined); }
                //console.log(needsHide + ' ' + isInHover);
            }
        }
    }

    function createControl() {
        var ls = tf.TFMap.LayoutSettings;
        var customizedScrollBarClassName = ls.customizedScrollBarClassName
        contentToolTip = new tf.dom.Div({ cssClass: wrapperClassName + " " + customizedScrollBarClassName });
        contentToolTipArrow = new tf.dom.Div({ cssClass: "" });
        hoverListener = new tf.events.DOMMouseEnterLeaveListener({ target: contentToolTip, callBack: onHoverToolTipContainer, optionalScope: theThis, callBackSettings: null });
    }

    var cssTag, wrapperClassName, buttonClassName, spanClassName, leftArrowToolTipClassName, rightArrowToolTipClassName, topArrowToolTipClassName, botArrowToolTipClassName;;

    function commonCreateToolTip(dims, color, zIndex, borderNames) {
        var halfDims = Math.floor((dims + 1) / 2);
        if (halfDims < 0) { halfDims = 1; }
        var halfDimsMinusTwo = halfDims - 3, halfDimsPx = halfDims + "px";
        var preffixStr = 'border';
        var transparentBorderStr = halfDimsPx + " solid transparent";
        var colorBorderStr = halfDimsPx + " solid " + color;
        var result = { content: '', position: 'absolute', zIndex: '' + zIndex };
        result[preffixStr + borderNames[0]] = result[preffixStr + borderNames[1]] = transparentBorderStr;
        result[preffixStr + borderNames[2]] = colorBorderStr;
        return result;
    }

    function createLeftArrowDivClass(dims, color, zIndex) { return commonCreateToolTip(dims, color, zIndex, ["Top", "Bottom", "Right"]); }
    function createRightArrowDivClass(dims, color, zIndex) { return commonCreateToolTip(dims, color, zIndex, ["Top", "Bottom", "Left"]); }
    function createTopArrowDivClass(dims, color, zIndex) { return commonCreateToolTip(dims, color, zIndex, ["Left", "Right", "Bottom"]); }
    function createBotArrowDivClass(dims, color, zIndex) { return commonCreateToolTip(dims, color, zIndex, ["Left", "Right", "Top"]); }

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        buttonClassName = tf.TFMap.CreateClassName(cssTag, "Button");
        spanClassName = tf.TFMap.CreateClassName(cssTag, "Span");
        leftArrowToolTipClassName = tf.TFMap.CreateClassName(cssTag, "latt");
        rightArrowToolTipClassName = tf.TFMap.CreateClassName(cssTag, "ratt");
        topArrowToolTipClassName = tf.TFMap.CreateClassName(cssTag, "tatt");
        botArrowToolTipClassName = tf.TFMap.CreateClassName(cssTag, "batt");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var layoutSettings = tf.TFMap.LayoutSettings;
        var fontSizeToolTipInt = layoutSettings.fontSizeToolTipInt;
        var arrowDimsToolTipInt = layoutSettings.arrowDimsToolTipInt;
        var zIndexToolTipInt = layoutSettings.zIndexToolTipInt;
        var toolTipContentBackground = layoutSettings.toolTipContentBackground;

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.borderRadius2px, CSSClasses.whiteSpaceNoWrap, CSSClasses.pointerEventsAll, CSSClasses.displayBlock, CSSClasses.lightTextColor,
            CSSClasses.toolTipBackground, CSSClasses.positionAbsolute],
            fontWeight: layoutSettings.fontWeightToolTip, overflowY: 'auto', overflowX: 'hidden',
            maxHeight: "120px", zIndex: '' + zIndexToolTipInt,
            padding: "4px 8px", fontSize: fontSizeToolTipInt + "px", lineHeight: (fontSizeToolTipInt + 8) + "px",
            maxWidth: "16rem", boxShadow: "1px 1px 2px rgba(0,0,0,0.2)"
        };

        var commonSettings = {
            inherits: [CSSClasses.inheritBackgroundAndColorImageButton, CSSClasses.overflowHidden, CSSClasses.whiteSpaceNoWrap, CSSClasses.displayBlock, CSSClasses.lightTextShadow, CSSClasses.textOverflowEllipsis],
            fontWeight: 'inherit', width: "100%",
            background: "rgba(0, 0, 0, 0.1)", fontSize: 'inherit', lineHeight: 'inherit',
            borderTop: "1px solid transparent", borderBottom: "1px solid transparent",
            textAlign: 'inherit', marginBottom: "2px"
        };

        cssClasses[buttonClassName] = { inherits: [commonSettings, CSSClasses.cursorPointer] };
        cssClasses[buttonClassName + ":hover"] = { borderTop: "1px solid darkgray", borderBottom: "1px solid red", color: "#fff" };

        cssClasses[spanClassName] = { inherits: [commonSettings, CSSClasses.cursorDefault] };

        cssClasses[leftArrowToolTipClassName] = createLeftArrowDivClass(arrowDimsToolTipInt + 1, toolTipContentBackground, zIndexToolTipInt);
        cssClasses[rightArrowToolTipClassName] = createRightArrowDivClass(arrowDimsToolTipInt + 1, toolTipContentBackground, zIndexToolTipInt);
        cssClasses[topArrowToolTipClassName] = createTopArrowDivClass(arrowDimsToolTipInt + 1, toolTipContentBackground, zIndexToolTipInt);
        cssClasses[botArrowToolTipClassName] = createBotArrowDivClass(arrowDimsToolTipInt + 1, toolTipContentBackground, zIndexToolTipInt);

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        cssTag = 'ToolTip';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        isInHover = false;
        buttonsCache = new tf.js.ObjectCache({ createNew: createNewButton, onDelete: deleteButton });
        spansCache = new tf.js.ObjectCache({ createNew: createNewSpan, onDelete: deleteSpan });
        curParent = undefined;
        delayedShowToolTip = new tf.events.DelayedCallBack(tf.TFMap.toolTipDelayMillis, showToolTipOn, theThis);
        showToolTip(false);
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

