"use strict";

tf.TFMap.DataSetsBar = function(settings) {
    var theThis, paneWrapper, paneContent, toggleButton, isVisible, dataSetRows, clusterButton;
    var toolBarWrapper;
    var cssTag, wrapperClassName, contentClassName, toolBarWrapperClassName, dataSetWrapperClassName, clusterButtonClassName, clusterBkClassName, noClusterBkClassName,
        dataSetTitleLabelWrapperClassName, dataSetTitleLabelClassName, dataSetColorLabelClassName;
    var onOffButtonClassName, onOffButtonOnClassName, onOffButtonOffClassName;
    var loadedOKClassName, failedToLoadClassName, refreshingLoadClassName, dataSetLoadingButtonClassName;
    var darkenBackgroundClassName;
    var buttonInactiveTextClassName, buttonInactiveClassName, buttonActiveClassName;
    var paneCollapsedClassName, paneVisibleClassName;

    this.GetContentPane = function() { return paneContent; }
    this.GetWrapper = function() { return paneWrapper; }
    this.CheckIsVisible = function() { return checkIsVisible(); }

    this.UpdateAll = function() { return updateAll(); }
    this.Update = function(dataSetName) { return update(dataSetName); }

    function onToggleButtonClick(notification) { settings.appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_dataSetsPanelVisible, toggleButton.GetIsToggled()); }

    function getToggleButtonToolTipText() { var verbStr = isVisible ? "Collapse" : "Expand"; return verbStr + " markers panel"; }

    function getShouldBeVisible() { return settings.appContent.GetAppCtx().GetCtxAttribute(tf.TFMap.CAN_dataSetsPanelVisible); }

    function setVisible(isVisibleSet) { tf.dom.ReplaceCSSClassCondition(paneWrapper, isVisible = isVisibleSet, paneVisibleClassName, paneCollapsedClassName); }

    function checkIsVisible() { var shouldBeVisible = getShouldBeVisible(); if (isVisible != shouldBeVisible) { setVisible(shouldBeVisible); } }

    function updateAll() { for (var i in dataSetRows) { update(i); } }

    function update(dataSetName) {
        var dataSetRow = dataSetRows[dataSetName];
        if (!!dataSetRow) {
            //console.log('updating ' + dataSetName);
            var dataSet = dataSetRow.dataSet;
            var dataSetSettings = dataSet.GetSettings();
            var searchingButton = dataSetRow.searchingButton;
            dataSetRow.colorLabel.GetButton().style.backgroundColor = dataSetRow.searchSetting.color;
            dataSetRow.titleLabel.GetButton().innerHTML = dataSetName;
            updateARToggleOfRow(dataSetRow);
            updateVToggleOfRow(dataSetRow);
        }
    }

    function updateVisibilityClass(dataSetRow, isVisible) {
        tf.dom.ReplaceCSSClassCondition(dataSetRow.visibilityToggle.GetButton(), isVisible, onOffButtonOnClassName, onOffButtonOffClassName);
    }

    function updateVToggleOfRow(dataSetRow) {
        if (!!dataSetRow) {
            var searchSetting = dataSetRow.searchSetting;
            var isVisible = settings.appContent.GetAppCtx().GetCtxAttribute(searchSetting.visibilityVerb);
            updateVisibilityClass(dataSetRow, isVisible);
        }
    }

    function updateARToggleOfRow(dataSetRow) {
        if (!!dataSetRow) {
            var searchSetting = dataSetRow.searchSetting;
            var dataSet = dataSetRow.dataSet;
            var searchingButton = dataSetRow.searchingButton;
            var isSearching = dataSet.GetIsSearching();
            if (!isSearching) {
                var autoRefreshes = settings.appContent.GetAppCtx().GetCtxAttribute(searchSetting.autoRefreshVerb);
                var completedOK = dataSet.GetLastSearchCompletedOK();
                var classNotToggled = autoRefreshes ? (completedOK ? loadedOKClassName : failedToLoadClassName) : refreshingLoadClassName;
                searchingButton.SetClassNotToggled(classNotToggled);
            }
            searchingButton.SetIsToggled(isSearching);
            updateVisibilityClass(dataSetRow, isVisible);
        }
    }

    function updateVisibilityToggle(title) { updateVToggleOfRow(dataSetRows[title]); }
    function updateAutoRefreshToggle(title) { updateARToggleOfRow(dataSetRows[title]); }

    function toggleCtxAttribute(notification, verb) {
        var sender = !!notification.toolTipSender ? notification.toolTipSender : notification.sender;
        var searchSetting = sender.searchSetting, verb = searchSetting[verb];
        if (tf.js.GetIsNonEmptyString(verb)) {
            var appCtx = settings.appContent.GetAppCtx();
            appCtx.SetCtxAttribute(verb, !appCtx.GetCtxAttribute(verb));
        }
    }

    function onVisibilityButtonClicked(notification) { toggleCtxAttribute(notification, "visibilityVerb"); }

    function onSearchingButtonClicked(notification) { toggleCtxAttribute(notification, "autoRefreshVerb"); }

    function getMarkerColorToolTip(sender) {
        var searchSetting = sender.searchSetting, verb = searchSetting.visibilityVerb;
        var dataSetRow = dataSetRows[searchSetting.title];
        var dataSet = dataSetRow.dataSet;
        var dataSetTitle = dataSet.GetDataSetTitle();
        return "\'" + dataSetTitle + "\' color";
    }

    function getSearchStatusToolTip(sender) {
        var searchSetting = sender.searchSetting, verb = searchSetting.autoRefreshVerb;
        var ls = tf.TFMap.LayoutSettings;
        var dataSetRow = dataSetRows[searchSetting.title];
        var dataSet = dataSetRow.dataSet;
        var completedOK = dataSet.GetLastSearchCompletedOK();
        var dataSetTitle = dataSet.GetDataSetTitle();
        var spanStartStr = "<span class='" + ls.defaultHorMarginsClassName + "'>";
        var spanRedStartStr = "<span class='" + ls.defaultHorMarginsClassName + " " + ls.smallerTextClassName + " " + ls.redFontColorShadowClassName + "'>", spanEndStr = "</span>";
        var isSearched = settings.appContent.GetAppCtx().GetCtxAttribute(verb);
        var notStr = isSearched ? " " : " <u>not</u>"
        var isSearchedNotSearched = "is" + notStr + " searched ";
        var isSearchedStr = spanStartStr + "\'" + dataSetTitle + "\' " + isSearchedNotSearched + "<br/>when the map view changes" + spanEndStr;
        var startHTML = "<div class='" + ls.defaultHorMarginsClassName + "' style='text-align:center;'>";
        var completedOKStr = completedOK ? "" : "<br/>" + spanRedStartStr + "last search failed" + spanEndStr;
        var switchVerbStr = isSearched ? "Off" : "On";
        var switchItStr = "Switch it " + switchVerbStr;
        var commandStr = "<span class='" + ls.defaultHorMarginsClassName + "'>" + switchItStr + spanEndStr;
        startHTML += isSearchedStr;
        startHTML += completedOKStr;
        startHTML += "</div>";
        startHTML += tf.TFMap.MakeHRDivHTML();
        startHTML += commandStr;
        return startHTML;
    }

    function getVisibilityToolTip(sender) {
        var searchSetting = sender.searchSetting, verb = searchSetting.visibilityVerb;
        var isVisible = settings.appContent.GetAppCtx().GetCtxAttribute(verb);
        var dataSetRow = dataSetRows[searchSetting.title];
        var dataSet = dataSetRow.dataSet;
        var dataSetTitle = dataSet.GetDataSetTitle();
        var notStr = isVisible ? " " : " <u>not</u> "
        var isVisibleNotVisible = "is" + notStr + "visible";
        var onOffStr = isVisible ? "Off" : "On";
        return tf.TFMap.MapTwoLineSpan("'" + dataSetTitle + "' " + isVisibleNotVisible, "Switch it " + onOffStr);
    }

    function createDataSetRow(searchSetting, index) {
        var appContent = settings.appContent;
        var searchTitle = searchSetting.title;
        var dataSet = settings.getDataSet(searchTitle);
        var wrapper = new tf.dom.Div({ cssClass: dataSetWrapperClassName });
        var delayMillis = tf.TFMap.toolTipDataSetDelayMillis;
        var toolTipClass = "*start";
        var toolTipArrowClass = "left";
        var toolTipStyle = undefined;
        var buttonSettings = { wrapper: wrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass, toolTipStyle: toolTipStyle, offsetX: 4 };
        var colorLabel = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, { buttonClass: dataSetColorLabelClassName + " " + buttonInactiveClassName, toolTipText: getMarkerColorToolTip }));

        colorLabel.searchSetting = searchSetting;

        var visibilityToggle = appContent.CreateButton(tf.js.ShallowMerge(buttonSettings, {
            svgHTML: appContent.GetAppStyles().GetOnOffSVG(),
            onClick: onVisibilityButtonClicked, buttonClass: onOffButtonClassName + " " + buttonActiveClassName, toolTipText: getVisibilityToolTip
        }));
        visibilityToggle.searchSetting = searchSetting;

        var titleLabelWrapper = new tf.dom.Div({ cssClass: dataSetTitleLabelWrapperClassName });

        var titleLabel = appContent.CreateDataSetListButton(paneWrapper, titleLabelWrapper, dataSetTitleLabelClassName + " " + buttonInactiveTextClassName, dataSet);
        titleLabel.searchSetting = searchSetting;
        titleLabelWrapper.AddContent(titleLabel.GetButton());

        var searchingButton = appContent.CreateToggleButton(tf.js.ShallowMerge(buttonSettings, {
            onClick: onSearchingButtonClicked,
            buttonClass: buttonActiveClassName, classToggled: dataSetLoadingButtonClassName, classNotToggled: loadedOKClassName, toolTipText: getSearchStatusToolTip, isToggled: true, autoToggle: false
        }));
        searchingButton.searchSetting = searchSetting;
        searchingButton.isSearchingButton = true;

        if ((index % 2) == 1) { tf.dom.AddCSSClass(wrapper, darkenBackgroundClassName); }
        wrapper.AddContent(colorLabel.GetButton(), searchingButton.GetButton(), visibilityToggle.GetButton(), /*titleLabel.GetButton()*/ titleLabelWrapper);
        return {
            title: searchTitle, searchSetting: searchSetting, dataSet: dataSet, wrapper: wrapper, colorLabel: colorLabel,
            titleLabel: titleLabel, searchingButton: searchingButton,
            visibilityToggle: visibilityToggle
        };
    }

    function createDataSetRows() {
        var getDataSet = settings.getDataSet;
        var searchSettings = settings.searchSettings;
        var nSettings = tf.js.GetIsNonEmptyArray(searchSettings) ? searchSettings.length : 0;
        dataSetRows = {};
        for (var i = 0; i < nSettings; ++i) {
            var searchSetting = searchSettings[i];
            var dataSetRow = createDataSetRow(searchSetting, i);
            paneContent.AddContent((dataSetRows[dataSetRow.title] = dataSetRow).wrapper);
            updateVisibilityToggle(searchSetting.title);
        }
    }

    function onToggleClusters() {
        //settings.appContent.GetBaseLayersPanel().SetVisible(true);
        settings.appContent.ToggleClusters();
    }

    function getClustersToolTip(notification) {
        var usingClusters = settings.appContent.GetUsesClusters();
        var notStr = usingClusters ? "" : "<u>not</u> ";
        var usingClustersStr = "Markers are " + notStr + "clustered";
        var switchVerbStr = usingClusters ? "Off" : "On";
        return tf.TFMap.MapTwoLineSpan(usingClustersStr, "switch it " + switchVerbStr);
    }

    function createControl() {
        var shouldBeVisible = getShouldBeVisible();
        var ls = tf.TFMap.LayoutSettings;

        paneWrapper = new tf.dom.Div({ cssClass: wrapperClassName });
        paneContent = new tf.dom.Div({ cssClass: contentClassName });

        var toggleButtonWrapper = new tf.dom.Div({ cssClass: toggleButtonWrapperClassName });

        var appContent = settings.appContent;
        var delayMillis = 0;
        var toolTipClass = "center";
        var toolTipArrowClass = "left";
        var buttonSettings = {
            onClick: onToggleButtonClick, onHover: undefined, wrapper: toggleButtonWrapper, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        toggleButton = appContent.CreateToggleButton(tf.js.ShallowMerge(buttonSettings, {
            offsetX: 4,
            buttonClass: toggleButtonClassName + " ripple", classToggled: ls.arrowLeftBackgroundClassName, classNotToggled: ls.arrowRightBackgroundClassName,
            isToggled: shouldBeVisible, toolTipText: getToggleButtonToolTipText
        }));

        toggleButtonWrapper.AddContent(toggleButton.GetButton());

        createDataSetRows();

        toolBarWrapper = new tf.dom.Div({ cssClass: toolBarWrapperClassName });

        buttonSettings.wrapper = toolBarWrapper;

        buttonSettings.onClick = onToggleClusters;

        clusterButton = appContent.CreateToggleButton(tf.js.ShallowMerge(buttonSettings, {
            buttonClass: clusterButtonClassName + " ripple", classToggled: clusterBkClassName, classNotToggled: noClusterBkClassName,
            isToggled: settings.appContent.GetUsesClusters(), toolTipText: getClustersToolTip
        }));

        toolBarWrapper.AddContent(clusterButton.GetButton());

        paneContent.AddContent(toolBarWrapper, toggleButtonWrapper);
        paneWrapper.AddContent(paneContent);

        setVisible(shouldBeVisible);
    }

    var toggleButtonWrapperClassName, toggleButtonClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        contentClassName = tf.TFMap.CreateClassName(cssTag, "Content");
        toolBarWrapperClassName = tf.TFMap.CreateClassName(cssTag, "ToolBarWrapper");
        dataSetWrapperClassName = tf.TFMap.CreateClassName(cssTag, "DataSetWrapper");
        buttonInactiveTextClassName = tf.TFMap.CreateClassName(cssTag, "ButtonInactiveText");
        buttonInactiveClassName = tf.TFMap.CreateClassName(cssTag, "ButtonInactive");
        buttonActiveClassName = tf.TFMap.CreateClassName(cssTag, "ButtonActive");
        clusterButtonClassName = tf.TFMap.CreateClassName(cssTag, "ClusterButton");
        clusterBkClassName = tf.TFMap.CreateClassName(cssTag, "Cluster");
        noClusterBkClassName = tf.TFMap.CreateClassName(cssTag, "NoCluster");
        dataSetTitleLabelWrapperClassName = tf.TFMap.CreateClassName(cssTag, "TitleLabelWrapper");
        dataSetTitleLabelClassName = tf.TFMap.CreateClassName(cssTag, "TitleLabel");
        dataSetColorLabelClassName = tf.TFMap.CreateClassName(cssTag, "ColorLabel");
        onOffButtonClassName = tf.TFMap.CreateClassName(cssTag, "OnOffButton");
        onOffButtonOnClassName = tf.TFMap.CreateClassName(cssTag, "OnOffButtonOn");
        onOffButtonOffClassName = tf.TFMap.CreateClassName(cssTag, "OnOffButtonOff");
        loadedOKClassName = tf.TFMap.CreateClassName(cssTag, "LoadedOK");
        failedToLoadClassName = tf.TFMap.CreateClassName(cssTag, "FailedToLoad");
        refreshingLoadClassName = tf.TFMap.CreateClassName(cssTag, "RefreshingLoad");
        paneCollapsedClassName = tf.TFMap.CreateClassName(cssTag, "Collapsed");
        paneVisibleClassName = tf.TFMap.CreateClassName(cssTag, "Visible");
        darkenBackgroundClassName = tf.TFMap.CreateClassName(cssTag, "DarkenBackground");
        toggleButtonWrapperClassName = tf.TFMap.CreateClassName(cssTag, "ToggleButtonWrapper");
        toggleButtonClassName = tf.TFMap.CreateClassName(cssTag, "ToggleButton");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var lightBackground = ls.lightBackground;
        var darkTextColor = ls.darkTextColor, darkTextShadow = ls.darkTextShadow;
        var leftMarginInt = ls.leftMarginInt, leftMarginPx = leftMarginInt + 'px';
        var toggleButtonHeightPx = ls.toggleButtonHeightInt + 'px';
        var wrapperMarginTopPx = ls.dataSetsWrapperMarginTopInt + 'px';

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.transitionPoint2s, CSSClasses.displayBlock, CSSClasses.overflowVisible, CSSClasses.cursorDefault,
            CSSClasses.pointerEventsNone, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionAbsolute, CSSClasses.zIndex2],
            marginTop: wrapperMarginTopPx
        };

        cssClasses[contentClassName] = {
            inherits: [CSSClasses.borderRadius2px, CSSClasses.boxShadow01403, CSSClasses.transitionPoint2s, CSSClasses.displayBlock, CSSClasses.overflowVisible,
            CSSClasses.cursorDefault, CSSClasses.pointerEventsAll, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.zIndex2],
            background: lightBackground
        };

        var dimDataSetButtonPx = ls.dataSetsRowHeightInt + "px";

        var dataSetRow = {
            inherits: [CSSClasses.overflowVisible, CSSClasses.whiteSpaceNoWrap, CSSClasses.displayBlock, CSSClasses.positionRelative, CSSClasses.displayFlex],
            borderRadius: "4px",
            lineHeight: "20px",
            fontSize: "18px",
            height: dimDataSetButtonPx,
            fontWeight: "400", alignItems: "center"
        };

        var dimToolBarButtonPx = ls.dataSetsToolBarHeightInt + "px";

        cssClasses[toolBarWrapperClassName] = {
            inherits: [dataSetRow, CSSClasses.positionAbsolute, CSSClasses.flexFlowRowReverseNoWrap, CSSClasses.boxShadow01403],
            /*boxShadow: "4px 1px 6px rgba(0,0,0,0.3)", */left: "0px", top: "calc(100% + 1px)",
            width: "calc(100%)",
            height: dimToolBarButtonPx,
            borderRadius: "2px", background: lightBackground
        };

        cssClasses[dataSetWrapperClassName] = { inherits: [dataSetRow, , CSSClasses.flexFlowRowNoWrap] };

        cssClasses[buttonInactiveTextClassName] = {
            inherits: [CSSClasses.robotoFontFamily, CSSClasses.noBorder, CSSClasses.noMargin, CSSClasses.cursorDefault, CSSClasses.outline0, CSSClasses.verticalAlignMiddle,
            CSSClasses.listStyleNone, CSSClasses.overflowVisible, CSSClasses.backgroundColorTransparent],
            color: 'inherit', boxShadow: 'none'
        };

        var buttonBase = {
            inherits: [CSSClasses.robotoFontFamily, CSSClasses.noMarginNoBorderNoPadding, CSSClasses.cursorDefault, CSSClasses.outline0, CSSClasses.verticalAlignMiddle,
            CSSClasses.listStyleNone, CSSClasses.overflowVisible, CSSClasses.displayInlineBlock],
            marginLeft: "2px", marginTop: "1px", marginBottom: "1px", borderRadius: "4px",
            width: dimToolBarButtonPx,
            height: dimToolBarButtonPx,
            boxShadow: 'none'
        };

        cssClasses[buttonInactiveClassName] = { inherits: [buttonBase, CSSClasses.cursorNormal] };
        cssClasses[buttonActiveClassName] = { inherits: [buttonBase, CSSClasses.cursorPointer] };

        var dataSetHorMarginInt = 8, dataSetHorMarginPx = dataSetHorMarginInt + 'px';

        cssClasses[clusterButtonClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.cursorPointer, CSSClasses.outline0, CSSClasses.verticalAlignMiddle,
            CSSClasses.listStyleNone, CSSClasses.overflowVisible, CSSClasses.displayInlineBlock],
            borderRadius: "4px",
            width: dimToolBarButtonPx,
            height: dimToolBarButtonPx,
            //width: "24px", 
            //height: "24px", 
            boxShadow: 'none', marginRight: dataSetHorMarginPx
        };

        cssClasses[clusterBkClassName] = { inherits: [CSSClasses.clusterBackground] };
        cssClasses[noClusterBkClassName] = { inherits: [CSSClasses.noClusterBackground] };

        var dataSetVerticalAlign = "text-bottom";

        cssClasses[dataSetTitleLabelClassName] = {
            inherits: [CSSClasses.flexGrowOne, CSSClasses.displayInlineBlock],
            color: darkTextColor, textShadow: darkTextShadow,
            fontSize: "14px",
            fontWeight: "400",
            padding: "2px", paddingRight: "10px",
            maxWidth: "20rem", verticalAlign: dataSetVerticalAlign,
            overflow: "hidden", textOverflow: "ellipsis"
        };

        cssClasses[dataSetTitleLabelWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.flexGrowOne, CSSClasses.flexShrinkZero, CSSClasses.positionRelative, CSSClasses.displayInlineBlock],
            verticalAlign: dataSetVerticalAlign
        };

        var dataSetColorLabelWidthInt = 14, dataSetColorLabelWidthPx = dataSetColorLabelWidthInt + "px";

        cssClasses[dataSetColorLabelClassName] = {
            inherits: [CSSClasses.displayInlineBlock, CSSClasses.overflowHidden, CSSClasses.textOverflowEllipsis],
            verticalAlign: dataSetVerticalAlign,
            width: dataSetColorLabelWidthPx, height: dataSetColorLabelWidthPx,
            marginLeft: dataSetHorMarginPx, marginRight: dataSetHorMarginPx,
            borderRadius: "27%",
            border: "1px solid rgba(0,0,0,0.3)"
        };

        cssClasses[onOffButtonClassName] = { background: "transparent", marginRight: dataSetHorMarginPx };
        cssClasses[onOffButtonOnClassName] = { fill: "green" };
        cssClasses[onOffButtonOffClassName] = { fill: "goldenrod" };

        var commonLoading = { marginRight: dataSetHorMarginPx };

        cssClasses[loadedOKClassName] = { inherits: [commonLoading, CSSClasses.loadedOKBackgroundTransparent] };
        cssClasses[failedToLoadClassName] = { inherits: [commonLoading, CSSClasses.failedToLoadBackground] };
        cssClasses[refreshingLoadClassName] = { inherits: [commonLoading, CSSClasses.refreshGrayBackground] };

        dataSetLoadingButtonClassName = "LoadingButton";

        cssClasses[dataSetLoadingButtonClassName] = { inherits: [CSSClasses.loadingBackgroundTransparent], marginRight: dataSetHorMarginPx };

        cssClasses[paneCollapsedClassName] = { transform: "translateX(-100%)", "-webkit-transform": "translateX(-100%)" };
        cssClasses[paneVisibleClassName] = { transform: "translateX(" + leftMarginPx + ")", "-webkit-transform": "translateX(" + leftMarginPx + ")" };

        cssClasses[darkenBackgroundClassName] = { background: "rgba(0,0,0,0.03)" };

        cssClasses[toggleButtonWrapperClassName] = {
            inherits: [CSSClasses.borderRadius2px, CSSClasses.pointerEventsAll, CSSClasses.whiteSpaceNoWrap, CSSClasses.displayBlock, CSSClasses.overflowVisible,
            CSSClasses.cursorDefault, CSSClasses.noMargin, CSSClasses.noPadding, CSSClasses.positionAbsolute, CSSClasses.zIndex1],
            top: "0px", left: "calc(100% + 1px)", background: lightBackground
        };

        cssClasses[toggleButtonClassName] = {
            inherits: [CSSClasses.borderRadius2px, CSSClasses.baseImageButton, CSSClasses.borderLeftD4, CSSClasses.boxShadow01403, CSSClasses.overflowHidden],
            width: "23px", height: toggleButtonHeightPx
        };

        cssClasses[toggleButtonClassName + ":hover"] = { border: "1px solid rgba(0,48,118,0.4)" };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    function initialize() {
        cssTag = 'dataSets';
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        updateAll();
        settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
        //setTimeout(function () { settings.appContent.GetBaseLayersPanel().SetVisible(true); }, 1000);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
