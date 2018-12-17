"use strict";

tf.TFMap.LegendGroupItem = function (settings) {
    var theThis, wrapper, selectedWrapper, contentWrapper, isSelected, visibilityOptionsRow, onChangeVisibleCB, defaultIsVisible, onResolution, titleWrapper;

    this.GetWrapper = function () { return wrapper; }

    this.GetIsSelected = function () { return isSelected; }

    this.GetIsVisible = function () { return settings.item.visible; }

    this.SetDefaultVisible = function (skipNotification) { return theThis.SetIsVisible(defaultIsVisible, skipNotification); }

    this.GetIsOnResolution = function () { return onResolution; }

    this.OnMapResolutionChange = function () {
        onResolution = false;
        var map = settings.appContent.GetMap(), res = map.GetResolution();
        var nComposites = settings.item.composites.length;
        var tolerance = 0.00001;
        for (var i = 0; i < nComposites && !onResolution; ++i) {
            var composite = settings.item.composites[i];
            onResolution = (composite.min - tolerance <= res && composite.max + tolerance >= res);
        }
        var displayVerb = onResolution ? "block" : "none";
        wrapper.GetHTMLElement().style.display = displayVerb;
        /*if (settings.item.name.trim() == "year built") {
            console.log("year built: " + onResolution);
            console.log("18: " + tf.units.GetResolutionByLevel(18));
            console.log("19: " + tf.units.GetResolutionByLevel(19));
        }*/
        return onResolution;
    }

    this.SetIsVisible = function (isVisible, skipNotification) {
        //console.log('change visible: ' + settings.item.name + ' ' + isVisible);
        var changed = false;
        if (settings.item.visible != (isVisible = !!isVisible)) {
            changed = true;
            settings.item.visible = isVisible;
            updateIsVisibleStyle();
            if (!skipNotification) {
                notify(onChangeVisibleCB);
            }
        }
        return changed;
    }

    this.SetIsSelected = function (newIsSelected) {
        if (isSelected != (newIsSelected = !!newIsSelected)) {
            isSelected = newIsSelected;
            tf.dom.ReplaceCSSClassCondition(selectedWrapper, isSelected, settings.itemSelectedClassName, settings.itemUnSelectedClassName);
        }
    }

    function notify(theCB, options) { if (!!theCB) { theCB(tf.js.ShallowMerge(options, { sender: theThis })) }; }

    function updateIsVisibleStyle() {
        if (!!visibilityOptionsRow) {
            var isVisible = theThis.GetIsVisible();
            for (var i in visibilityOptionsRow.elements) {
                var isSelected = false;
                switch (i) {
                    case settings.itemVisibleCommand:
                        isSelected = isVisible;
                        break;
                    default:
                    case settings.itemHiddenCommand:
                        isSelected = !isVisible;
                        break;
                }
                tf.dom.ReplaceCSSClassCondition(visibilityOptionsRow.elements[i].div, isSelected, settings.optionSelectedClassName, settings.optionUnSelectedClassName);
            }
        }
        updateTitle();
    }

    function onClick(notification) { theThis.SetIsVisible(!theThis.GetIsVisible()); }

    function onHover(notification) { /*console.log('hover');*/ }

    function updateTitle() {
        var iV = theThis.GetIsVisible();
        var label = iV ? settings.itemVisibleCommand : settings.itemHiddenCommand;
        titleWrapper.GetHTMLElement().innerHTML = settings.item.name + " (" + label.toLowerCase() + ")";
    }

    function createControl() {

        var item = settings.item;
        titleWrapper = new tf.dom.Div({ cssClass: settings.titleWrapperClassName });

        //wrapper = new tf.dom.Div({ cssClass: wrapperClassName + " " + settings.wrapperAddClassName/*, onClick: onClick, onHover: onHover*/ });
        wrapper = new tf.dom.Button({ cssClass: wrapperClassName + " " + settings.wrapperAddClassName, onClick: onClick, onHover: onHover });

        wrapper.GetHTMLElement().style.cursor = "pointer";

        selectedWrapper = new tf.dom.Div({ cssClass: settings.itemUnSelectedClassName });

        contentWrapper = new tf.dom.Div({ cssClass: settings.rowContainerClassName });

        var titleDescWrapper = new tf.dom.Div({ cssClass: settings.colContainerClassName });

        //console.log(item.name);

        updateTitle();

        titleDescWrapper.AddContent(titleWrapper);

        if (item.desc != item.name && tf.js.GetIsNonEmptyString(item.desc)) {
            var descWrapper = new tf.dom.Div({ cssClass: settings.descWrapperClassName });
            descWrapper.GetHTMLElement().innerHTML = item.desc;
            titleDescWrapper.AddContent(descWrapper);
        }

        //var resWrapper = new tf.dom.Div({ cssClass: settings.descWrapperClassName });
        //var minResName = item.min == 0 ? "min" : "1:" + item.min.toFixed(0);
        //resWrapper.GetHTMLElement().innerHTML = "displayed at map resolutions from " + minResName + " to 1:" + item.max.toFixed(0);
        //titleDescWrapper.AddContent(resWrapper);

        contentWrapper.AddContent(titleDescWrapper);

        //visibilityOptionsRow = settings.createOptionsRow([settings.itemVisibleCommand, settings.itemHiddenCommand], onOptionClicked);
        //visibilityOptionsRow.wrapper.GetHTMLElement().style.borderBottom = 'none';

        wrapper.AddContent(selectedWrapper, contentWrapper/*, visibilityOptionsRow.wrapper*/);

        settings.wrapper.AddContent(wrapper);

        theThis.SetIsSelected(settings.isSelected);
        theThis.OnMapResolutionChange();

        updateIsVisibleStyle();
    }

    function onOptionClicked(notification) {
        try {
            var appContent = settings.appContent;
            var needsModeToggle = false;
            switch (notification.callBackSettings.optionName) {
                case settings.itemVisibleCommand:
                    theThis.SetIsVisible(true);
                    break;
                case settings.itemHiddenCommand:
                    theThis.SetIsVisible(false);
                    break;
            }
            if (needsModeToggle) { settings.appContent.SwitchMapType(); }
        }
        catch (e) { console.log('exception while processing option click'); }
    }

    var cssTag, wrapperClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;

        cssClasses[wrapperClassName] = {
            background: 'rgb(255, 255, 240)'
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        defaultIsVisible = settings.item.visible;
        onChangeVisibleCB = tf.js.GetFunctionOrNull(settings.onChangeVisible);
        isSelected = false;
        cssTag = 'LegendGroupItem';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.TFMap.LegendGroupSetItem = function (settings) {
    var theThis, wrapper, descWrapper, groupsWrapper, groupsAreVisible, groupItems, onChangeVisibleCB;
    var selectedWrapper, titleWrapper;

    this.GetWrapper = function () { return wrapper; }

    this.OnMapResolutionChange = function () {
        var nOnResolution = 0, nGroups = groupItems.length;
        for (var i = 0; i < nGroups; ++i) {
            if (groupItems[i].OnMapResolutionChange()) {
                ++nOnResolution;
            }
        }
        var displayVerb = nOnResolution > 0 ? "block" : "none";
        wrapper.GetHTMLElement().style.display = displayVerb;
        if (nOnResolution > 0) {
            updateDesc();
        }
    }

    this.GetIsExpanded = function () { return groupsAreVisible; }

    this.ExpandCollapse = function (expandBool) {
        if (groupsAreVisible != (expandBool = !!expandBool)) {
            var displayStr = (groupsAreVisible = expandBool) ? "block" : "none";
            groupsWrapper.GetHTMLElement().style.display = displayStr;
            var wrapperE = wrapper.GetHTMLElement(), wrapperES = wrapperE.style;
            if (groupsAreVisible) {
                wrapperES.borderBottom = "1px solid " + tf.TFMap.LayoutSettings.directionsSelectedColor;
            }
            else {
                //wrapperES.borderBottom = '1px solid transparent';
                wrapperES.borderBottom = 'none';
            }

            checkSelectedStyle();
        }
    }

    this.SetIsVisible = function (isVisible, skipNotification) { return showHideAll(isVisible, skipNotification); }

    this.SetDefaultVisible = function (skipNotification) {
        var changed = false, nGroups = groupItems.length;
        for (var i = 0; i < nGroups; ++i) { if (groupItems[i].SetDefaultVisible(true)) { changed = true; } }
        if (changed) { if (skipNotification) { updateDesc(); } else { onChangeVisible(); } }
        return changed;
    }

    function checkSelectedStyle() {
        tf.dom.ReplaceCSSClassCondition(selectedWrapper, groupsAreVisible, settings.itemSelectedClassName, settings.itemUnSelectedClassName);
        updateName();
    }

    function onChangeVisible() { updateDesc(); notify(onChangeVisibleCB); }

    function notify(theCB, options) { if (!!theCB) { theCB(tf.js.ShallowMerge(options, { sender: theThis })) }; }

    function updateName() {
        var labelToggle = groupsAreVisible ? '-' : '+';
        titleWrapper.GetHTMLElement().innerHTML = labelToggle + ' ' + settings.item.name;
    }

    function updateDesc() {
        if (!!descWrapper) {
            var nGroups = groupItems.length, nVisible = 0, descStr = "", nEffectiveGroups = 0;
            for (var i = 0; i < nGroups; ++i) {
                var gi = groupItems[i], onRes = gi.GetIsOnResolution();
                if (onRes) {
                    ++nEffectiveGroups;
                    if (gi.GetIsVisible()) { ++nVisible; }
                }
            }
            nGroups = nEffectiveGroups;
            var isAreGroups = nGroups == 1 ? "is" : "are";
            var isAreVisible = nVisible == 1 ? "is" : "are";
            var groupGroups = nGroups == 1 ? "group" : "groups";
            var allStr = nGroups == 1 ? "" : "All ";
            var groupGroupsIsAre = " " + groupGroups + " " + isAreGroups + " ";
            if (nVisible == 0) { descStr = allStr + nGroups + groupGroupsIsAre + settings.itemHiddenCommand.toLowerCase(); }
            else if (nVisible == nGroups) { descStr = allStr + nGroups + groupGroupsIsAre + settings.itemVisibleCommand.toLowerCase(); }
            else { descStr = nVisible + " out of " + nGroups + " " + groupGroups + " " + isAreVisible + " " + settings.itemVisibleCommand.toLowerCase(); }
            descWrapper.GetHTMLElement().innerHTML = descStr;
        }
        updateName();
    }

    function showHideAll(showBool, skipNotification) {
        var changed = false, nGroups = groupItems.length;
        //console.log('nGroups ' +  nGroups);
        for (var i = 0; i < nGroups; ++i) { if (groupItems[i].SetIsVisible(showBool, true)) { changed = true; } }
        if (changed) { if (skipNotification) { updateDesc(); } else { onChangeVisible(); } }
        return changed;
    }

    function toggleExpanded() { theThis.ExpandCollapse(!theThis.GetIsExpanded()); }

    function onClick(notification) { toggleExpanded(); }

    function onHover(notification) { /*console.log('hover');*/ }

    function onOptionClicked(notification) {
        try {
            var appContent = settings.appContent;
            var needsModeToggle = false;
            switch (notification.callBackSettings.optionName) {
                case settings.showAllCommand:
                    showHideAll(true, false);
                    break;
                case settings.hideAllCommand:
                    showHideAll(false, false);
                    break;
            }
            if (needsModeToggle) { settings.appContent.SwitchMapType(); }
        }
        catch (e) { console.log('exception while processing option click'); }
    }

    function createControl() {
        var item = settings.item;
        var ls = tf.TFMap.LayoutSettings;
        titleWrapper = new tf.dom.Div({ cssClass: settings.titleWrapperClassName });

        wrapper = new tf.dom.Div({ cssClass: wrapperClassName });

        var wrapperE = wrapper.GetHTMLElement(), wrapperES = wrapperE.style;

        wrapperES.border = "1px solid " + ls.directionsSelectedColor;
        wrapperES.borderBottom = 'none';
        //wrapperES.borderBottom = '1px solid transparent';
        //wrapperES.border = "1px solid " + ls.backgroundLivelyColor;

        selectedWrapper = new tf.dom.Div({ cssClass: settings.itemUnSelectedClassName });

        var groupWrapper = new tf.dom.Button({ cssClass: wrapperClassName + " " + settings.wrapperAddClassName, onClick: onClick, onHover: onHover });
        var groupWrapperE = groupWrapper.GetHTMLElement(), groupWrapperES = groupWrapperE.style;
        
        groupWrapperES.borderBottom = 'none';
        groupWrapperES.cursor = "pointer";

        //descWrapper = new tf.dom.Div({ cssClass: settings.descWrapperClassName });
        //descWrapper.GetHTMLElement().style.paddingBottom = "0px";

        groupWrapper.AddContent(titleWrapper/*, descWrapper*/);

        //var optionsRow = settings.createOptionsRow([settings.showAllCommand, settings.hideAllCommand], onOptionClicked);

        var nonGroupsWrapper = new tf.dom.Div({ cssClass: settings.colContainerClassName });

        nonGroupsWrapper.AddContent(selectedWrapper, groupWrapper/*, optionsRow.wrapper*/);

        wrapper.AddContent(nonGroupsWrapper);

        groupsWrapper = new tf.dom.Div({ cssClass: settings.colContainerClassName + " " + groupsWrapperClassName + " " + settings.wrapperAddClassName });

        var nGroups = item.groups.length;
        var itemSettings = tf.js.ShallowMerge(settings, { wrapper: groupsWrapper, isSelected: true, onChangeVisible: onChangeVisible });

        groupItems = [];

        for (var i = 0; i < nGroups; ++i) {
            var legendItem = new tf.TFMap.LegendGroupItem(tf.js.ShallowMerge(itemSettings, { item: item.groups[i] }));
            groupItems.push(legendItem);
        }

        wrapper.AddContent(groupsWrapper);

        groupsWrapper.GetHTMLElement().style.display = "none";

        settings.wrapper.AddContent(wrapper);
        updateDesc();
        checkSelectedStyle();
    }

    var cssTag, wrapperClassName, groupsWrapperClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        groupsWrapperClassName = tf.TFMap.CreateClassName(cssTag, "groupsWrapper")
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;

        cssClasses[wrapperClassName] = {
            background: 'rgb(240, 255, 255)'
        };

        cssClasses[groupsWrapperClassName] = {
            marginTop: "0px"
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        onChangeVisibleCB = tf.js.GetFunctionOrNull(settings.onChangeVisible);
        cssTag = 'LegendGroupSetItem';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.TFMap.LegendList = function (settings) {
    var theThis, wrapper, decodedLegend, groupSetItems, allItems, onChangeVisibleCB;

    this.GetWrapper = function () { return wrapper; }
    this.GetDecodedLegend = function() { return decodedLegend; }

    this.OnMapResolutionChange = function () { for (var i in allItems) { allItems[i].OnMapResolutionChange(); } }

    this.ExpandCollapseAll = function (expandBool) { for (var i in groupSetItems) { groupSetItems[i].ExpandCollapse(expandBool); } }

    this.SetDefaultVisible = function () {
        var changed = false;
        for (var i in allItems) { if (allItems[i].SetDefaultVisible(true)) { changed = true; } }
        if (changed) { notify(onChangeVisibleCB); }
        return changed;
    }

    this.SetIsVisible = function (isVisible) {
        var changed = false;
        for (var i in allItems) { if (allItems[i].SetIsVisible(isVisible, true)) { changed = true; } }
        if (changed) { notify(onChangeVisibleCB); }
        return changed;
    }

    function notify(theCB, options) { if (!!theCB) { theCB(tf.js.ShallowMerge(options, { sender: theThis })) }; }

    function createControl() {
        wrapper = new tf.dom.Div({ cssClass: wrapperClassName });

        var itemSettings = tf.js.ShallowMerge(settings, { wrapper: wrapper, isSelected: false });

        allItems = [];
        groupSetItems = [];

        for (var i = 0; i < decodedLegend.length; ++i) {
            var decodedItem = decodedLegend[i];
            var isGroupSet = tf.js.GetIsNonEmptyArray(decodedItem.groups);
            var itemClass = isGroupSet ? tf.TFMap.LegendGroupSetItem : tf.TFMap.LegendGroupItem;
            var legendItem = new itemClass(tf.js.ShallowMerge(itemSettings, { item: decodedItem }));
            if (isGroupSet) { groupSetItems.push(legendItem); }
            allItems.push(legendItem);
            //wrapper.AddContent(legendItem.GetWrapper());
        }
    }

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible], background: 'transparent'
        };

        return cssClasses;
    }

    var cssTag, wrapperClassName;

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        onChangeVisibleCB = tf.js.GetFunctionOrNull(settings.onChangeVisible);
        decodedLegend = tf.js.DecodeLegend(settings.legendStr);
        //console.log(decodedLegend);
        cssTag = 'LegendList';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.TFMap.BaseLayersPanel = function (settings) {
    var theThis, panelName, panelNameShort, wrapper, contentWrapper, closeButton, isShowing, topContent, botContent;
    var allNoneDefaultOptions, expandCollapseOptions, aerialMapModeOptions;
    var isM2;
    var legendListH, legendListM;
    var currentLegendList;
    var openPanelStr, closePanelStr;
    var setAllVisibleLabelName, setAllHiddenLabelName, setDefaultsLabelName;

    this.OnMapResolutionChange = function () {
        if (isShowing) {
            if (!!currentLegendList) {
                currentLegendList.OnMapResolutionChange();
            }
        }
    }

    this.GetPanelName = function () { return panelName; }
    this.GetPanelNameShort = function () { return panelNameShort; }

    this.GetWrapper = function () { return wrapper; }

    this.UpdateForMapType = function() {
        if (isM2) {
            var isSHowingAerial = getIsShowingAerial();
            if (!!aerialMapModeOptions) {
                for (var i in aerialMapModeOptions.elements) {
                    var isSelected = false;
                    switch (i) {
                        case mapAerialLabelName:
                            isSelected = isSHowingAerial;
                            break;
                        default:
                        case mapMapLabelName:
                            isSelected = !isSHowingAerial;
                            break;
                    }
                    tf.dom.ReplaceCSSClassCondition(aerialMapModeOptions.elements[i].div, isSelected, optionSelectedClassName, optionUnSelectedClassName);
                }
            }
            currentLegendList = isSHowingAerial ? legendListH : legendListM;
            var otherList = isSHowingAerial ? legendListM : legendListH;
            theThis.OnMapResolutionChange();
            currentLegendList.GetWrapper().GetHTMLElement().style.display = 'block';
            otherList.GetWrapper().GetHTMLElement().style.display = 'none';
        }
    }

    this.SetVisible = function (visible) {
        if (isShowing != (visible = !!visible)) {
            var ls = tf.TFMap.LayoutSettings;
            tf.dom.ReplaceCSSClassCondition(wrapper, isShowing = visible, ls.sidePanelWrapperVisibleClassName, ls.sidePanelWrapperCollapsedClassName);
            if (isShowing) { theThis.OnMapResolutionChange(); }
            settings.appContent.SetHasSidePanelFullContent(isShowing);
        }
    }

    this.GetIsVisible = function () { return isShowing; }

    this.GetOpenCloseToolTip = function () { return isShowing ? closePanelStr : openPanelStr; }

    function getIsShowingAerial() { return settings.appContent.GetIsShowingAerial(); }

    function createSVGButton(buttonSettings, svgHTML, buttonClass, toolTipText, svgAddClasses, modeVerb) {
        var button = settings.appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            svgHTML: svgHTML,
            buttonClass: buttonClass + " rippleWhite", toolTipText: toolTipText
        }));
        button.GetSettings().modeVerb = modeVerb;
        var buttonSVG = button.GetButton().firstChild;
        if (svgAddClasses != undefined) { tf.dom.AddCSSClass(buttonSVG, svgAddClasses); }
        return button;
    }

    function onCloseClicked() {
        theThis.SetVisible(false);
    }

    function createControl() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var ls = tf.TFMap.LayoutSettings;
        var customizedScrollBarClassName = ls.customizedScrollBarClassName;
        var delayMillis = 0;
        var toolTipClass = "*end";
        var toolTipArrowClass = "top";
        var buttonSettings = {
            offsetY: 0, onClick: undefined, onHover: undefined, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        wrapper = new tf.dom.Div({ cssClass: ls.sidePanelWrapperClassName });
        contentWrapper = new tf.dom.Div({ cssClass: ls.sidePanelContentWrapperClassName + " " + ls.sidePaneFullHeightContentWrapperClassName });
        topContent = new tf.dom.Div({ cssClass: ls.sidePaneContentFixedHeightClassName });
        botContent = new tf.dom.Div({ cssClass: ls.sidePaneContentVariableHeightClassName + " " + customizedScrollBarClassName });

        closeButton = createSVGButton(tf.js.ShallowMerge(buttonSettings, {
            wrapper: contentWrapper, toolTipClass: "*start", onClick: onCloseClicked
        }), appStyles.GetXMarkSVG(), ls.sidePanelCloseButtonClassName, closePanelStr, undefined);

        var topCaption = new tf.dom.Div({ cssClass: topCaptionClassName });

        topCaption.GetHTMLElement().innerHTML = panelName;

        topContent.AddContent(topCaption);

        if (isM2 && settings.allowChangeType) {
            aerialMapModeOptions = createOptionsRow([mapAerialLabelName, mapMapLabelName]);
            topContent.AddContent(aerialMapModeOptions.wrapper);
        }

        allNoneDefaultOptions = createOptionsRow([setAllVisibleLabelName, setAllHiddenLabelName, setDefaultsLabelName]);

        expandCollapseOptions = createOptionsRow([expandAllGroupsLabel, collapseAllGroupsLabel]);

        topContent.AddContent(allNoneDefaultOptions.wrapper, expandCollapseOptions.wrapper);

        var legendSettings = {
            onChangeVisible: onChangeVisible,
            itemVisibleCommand: itemVisibleCommand,
            itemHiddenCommand: itemHiddenCommand,
            showAllCommand: setAllVisibleLabelName,
            hideAllCommand: setAllHiddenLabelName,
            optionSelectedClassName: optionSelectedClassName,
            optionUnSelectedClassName: optionUnSelectedClassName,
            appContent: settings.appContent,createOptionsRow: createOptionsRow,
            wrapperAddClassName: wrapperAddClassName, titleWrapperClassName: titleWrapperClassName, descWrapperClassName: descWrapperClassName,
            itemSelectedClassName: itemSelectedClassName, itemUnSelectedClassName: itemUnSelectedClassName,
            rowContainerClassName: rowContainerClassName, colContainerClassName: colContainerClassName
        };

        legendListH = new tf.TFMap.LegendList(tf.js.ShallowMerge(legendSettings, {legendStr: settings.legendH}));

        botContent.AddContent(legendListH.GetWrapper());

        if (isM2) {
            legendListM = new tf.TFMap.LegendList(tf.js.ShallowMerge(legendSettings, { legendStr: settings.legendM }));
            botContent.AddContent(legendListM.GetWrapper());
        }

        contentWrapper.AddContent(closeButton.GetButton(), topContent, botContent);
        wrapper.AddContent(contentWrapper);
    }

    function onChangeVisible(notification) {
        var decodedLegendH = legendListH.GetDecodedLegend();
        var decodedLegendM = isM2 ? legendListM.GetDecodedLegend() : decodedLegendH;
        settings.appContent.GetMap().SetDecodedLegends(decodedLegendH, decodedLegendM);
    }

    function onClickOption(notification) {
        try {
            var appContent = settings.appContent;
            var needsModeToggle = false;
            var needsResetScroll = false;
            switch (notification.callBackSettings.optionName) {
                case setAllVisibleLabelName:
                    if (!!currentLegendList) { currentLegendList.SetIsVisible(true); }
                    break;
                case setAllHiddenLabelName:
                    if (!!currentLegendList) { currentLegendList.SetIsVisible(false); }
                    break;
                case setDefaultsLabelName:
                    if (!!currentLegendList) { currentLegendList.SetDefaultVisible(); }
                    break;
                case expandAllGroupsLabel:
                    if (!!currentLegendList) { currentLegendList.ExpandCollapseAll(true); needsResetScroll = true; }
                    break;
                case collapseAllGroupsLabel:
                    if (!!currentLegendList) { currentLegendList.ExpandCollapseAll(false); needsResetScroll = true; }
                    break;
                case mapAerialLabelName:
                    needsModeToggle = !getIsShowingAerial();
                    break;
                case mapMapLabelName:
                    needsModeToggle = getIsShowingAerial();
                    break;
            }
            if (needsResetScroll) { botContent.GetHTMLElement().scrollTop = 0; }
            if (needsModeToggle) { settings.appContent.SwitchMapType(); }
        }
        catch (e) { console.log('exception while processing option click'); }
    }

    function createOptionsRow(optionNames, optionalOnClickOption) {
        var onClickOptionUse = tf.js.GetFunctionOrNull(optionalOnClickOption) ? optionalOnClickOption : onClickOption;
        var wrapper = new tf.dom.Div({ cssClass: optionsRowClassName });
        var count = tf.js.GetIsNonEmptyArray(optionNames) ? optionNames.length : 0;
        var elements = {};

        for (var i = 0; i < count; ++i) {
            var optionName = optionNames[i];
            var className = optionInRowClassName + " " + optionUnSelectedClassName;
            if (i < count - 1) { className += " " + notLastOptionInRowClassName; }
            var optionDiv = new tf.dom.Button({ cssClass: className, onClick: onClickOptionUse, onClickSettings: { optionName: optionName }, optionalScope: theThis });
            elements[optionName] = { div: optionDiv };
            optionDiv.GetHTMLElement().innerHTML = optionName;
            wrapper.AddContent(optionDiv);
        }

        return { wrapper: wrapper, elements: elements };
    }

    var cssTag, topCaptionClassName, wrapperAddClassName, titleWrapperClassName, descWrapperClassName, itemUnSelectedClassName, itemSelectedClassName;
    var rowContainerClassName, colContainerClassName;
    var optionsRowClassName, optionInRowClassName, optionSelectedClassName, optionUnSelectedClassName, notLastOptionInRowClassName;

    function createCSSClassNames() {
        topCaptionClassName = tf.TFMap.CreateClassName(cssTag, "TopCaption");
        wrapperAddClassName = tf.TFMap.CreateClassName(cssTag, "WrapperAdd");
        titleWrapperClassName = tf.TFMap.CreateClassName(cssTag, "TitleWrapper");
        descWrapperClassName = tf.TFMap.CreateClassName(cssTag, "DescWrapper");
        rowContainerClassName = tf.TFMap.CreateClassName(cssTag, "RowContainer");
        colContainerClassName = tf.TFMap.CreateClassName(cssTag, "ColContainer");
        optionsRowClassName = tf.TFMap.CreateClassName(cssTag, "OptionsRow");
        optionInRowClassName = tf.TFMap.CreateClassName(cssTag, "OptionInRow");
        notLastOptionInRowClassName = tf.TFMap.CreateClassName(cssTag, "NotLastOptionInRow");
        optionUnSelectedClassName = tf.TFMap.CreateClassName(cssTag, "OptionUnSelected");
        optionSelectedClassName = tf.TFMap.CreateClassName(cssTag, "OptionSelected");
        itemUnSelectedClassName = tf.TFMap.CreateClassName(cssTag, "ItemUnSelected");
        itemSelectedClassName = tf.TFMap.CreateClassName(cssTag, "ItemSelected");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var backgroundLivelyStyle = { backgroundColor: ls.backgroundLivelyColor };
        var directionsSelectedColor = ls.directionsSelectedColor;

        cssClasses[topCaptionClassName] = {
            inherits: [CSSClasses.positionRelative, CSSClasses.noMarginNoBorderNoPadding, backgroundLivelyStyle,
                CSSClasses.displayBlock/*, CSSClasses.robotoFontFamily*/],
            padding: "10px",
            width: "calc(100% - 20px)",
            paddingTop: ls.baseLayersPaneTopCaptionVerPaddingInt + 'px',
            paddingBottom: ls.baseLayersPaneTopCaptionVerPaddingInt + 'px',
            marginBottom: "4px",
            color: "white",
            fontSize: ls.baseLayersPaneTopCaptionFontSizeInt + 'px',
            lineHeight: ls.baseLayersPaneTopCaptionLineHeightInt + 'px'
        };

        cssClasses[wrapperAddClassName] = {
            inherits: [CSSClasses.transparentImageButton, CSSClasses.darkTextColor, CSSClasses.darkTextShadow, CSSClasses.noMarginNoBorderNoPadding,
                CSSClasses.overflowVisible, CSSClasses.positionRelative, CSSClasses.displayBlock, CSSClasses.cursorDefault],
            textAlign: "left",
            width: "calc(100% - 20px)",
            borderBottom: "1px solid #ebebeb",
            fontSize: ls.baseLayersPaneDefaultFontSizeInt + 'px',
            lineHeight: ls.baseLayersPaneDefaultLineHeightInt + 'px',
            padding: ls.baseLayersPaneTitlePaddingtInt + "px",
            paddingLeft: "10px"
        };

        cssClasses[titleWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding],
            lineHeight: ls.baseLayersPaneTitleLineHeightInt + 'px'
        };

        cssClasses[descWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding],
            paddingTop: "4px", paddingLeft: "10px", //paddingBottom: "4px",
            fontSize: ls.baseLayersPaneDescFontSizeInt + 'px',
            lineHeight: ls.baseLayersPaneDescLineHeightInt + 'px',
            color: "#555"
        };

        cssClasses[rowContainerClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap, CSSClasses.positionRelative]
        };

        cssClasses[colContainerClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.displayFlex, CSSClasses.flexFlowColumnNoWrap, CSSClasses.positionRelative, CSSClasses.transitionWithColor]
        };

        cssClasses[optionsRowClassName] = {
            inherits: [CSSClasses.displayFlex, CSSClasses.flexFlowRowNoWrap, CSSClasses.positionRelative],
            borderRadius: "2px",
            width: "calc(100% - 4px)",
            padding: "2px",
            paddingTop: "0px",
            paddingBottom: "0px",
            borderBottom: "1px solid #ebebeb",
            fontSize: ls.baseLayersOptionsRowFontSizeInt + 'px',
            lineHeight: ls.baseLayersOptionsRowLineHeightInt + 'px',
            //fontSize: "14px",
            //lineHeight: "24px",
            fontWeight: "500"
        };

        cssClasses[optionInRowClassName] = {
            inherits: [CSSClasses.transparentImageButton, CSSClasses.displayBlock, CSSClasses.flexOne],
            lineHeight: "inherit",
            fontSize: "inherit",
            fontFamily: "inherit",
            fontWeight: "inherit",
            borderRadius: "2px",
            textAlign: "center"
        };

        cssClasses[optionInRowClassName + ":hover"] = {
            textDecoration:"underline",
            cursor: "pointer"
        };

        cssClasses[notLastOptionInRowClassName] = {
            borderRight: "1px solid #ebebeb"
        };

        cssClasses[optionUnSelectedClassName] = {
            inherits: [CSSClasses.darkTextColor, CSSClasses.backgroundColorTransparent]
        };

        cssClasses[optionSelectedClassName] = {
            inherits: [backgroundLivelyStyle], color: "white"
        };

        var itemCommon = {
            inherits: [CSSClasses.positionAbsolute, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.overflowVisible, CSSClasses.displayBlock],
            left: "0px", top: "-1px",
            zIndex: '' + (ls.rootDivZIndex + ls.baseLayersItemCommonZIndexAdd),
            height: "calc(100% + 2px)", width: "1px"
        };

        cssClasses[itemUnSelectedClassName] = {
            inherits: [itemCommon],
            borderLeft: "5px solid transparent"
        };

        cssClasses[itemSelectedClassName] = {
            inherits: [itemCommon],
            borderLeft: "6px solid " + directionsSelectedColor
        };

        return cssClasses;
    }

    var itemVisibleCommand, itemHiddenCommand;
    var expandAllGroupsLabel, collapseAllGroupsLabel;
    var mapAerialLabelName, mapMapLabelName;

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }

    function calcProptNames() {
        var isSmallScreen = true;// settings.appContent.GetAppStyles().GetIsSmallScreen();
        expandAllGroupsLabel = isSmallScreen ? "Expand all" : "Expand all groups";
        collapseAllGroupsLabel = isSmallScreen ? "Collapse all" : "Collapse all groups";
        mapAerialLabelName = isSmallScreen ? "Aerial view" : "Show Aerial view groups";
        mapMapLabelName = isSmallScreen ? "Map view" : "Show Map view groups";

        setAllVisibleLabelName = isSmallScreen ? "All " + itemVisibleCommand : "Set all " + itemVisibleCommand;
        setAllHiddenLabelName = isSmallScreen ? "All " + itemHiddenCommand : "Set all " + itemHiddenCommand;
        setDefaultsLabelName = isSmallScreen ? "Defaults" : "Default Settings";
    }

    function onLayoutChange(notification) {
        calcProptNames();
        registerCSSClasses();
    }

    var lcl;

    function initialize() {
        isM2 = settings.mapEngine != tf.consts.mapnikEngine;
        itemVisibleCommand = "On";
        itemHiddenCommand = "Off";
        cssTag = 'baseLayersPanel';
        panelName = "Map Layers";
        panelNameShort = "Layers";
        closePanelStr = "Close " + panelName;
        openPanelStr = "Select " + panelName;
        isShowing = undefined;
        createCSSClassNames();
        calcProptNames();
        registerCSSClasses();
        createControl();
        theThis.SetVisible(false);
        theThis.UpdateForMapType();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
