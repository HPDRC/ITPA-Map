"use strict";

tf.GeoFenceApp = {};

tf.GeoFenceApp.Content = function (settings) {
    var theThis, busRTAndHistoryContent, geoFencesListViewTargetListsCombo;
    var rtTargetListName, historyTargetListName;

    this.OnCreated = function (notification) { return geoFencesListViewTargetListsCombo.OnCreated(notification); }

    this.OnVisibilityChange = function (notification) {
        if (!!geoFencesListViewTargetListsCombo) { geoFencesListViewTargetListsCombo.OnVisibilityChange(notification); }
        if (!!busRTAndHistoryContent) { busRTAndHistoryContent.OnVisibilityChange(notification); }
    }

    this.UpdateForMapType = function () {
        if (!!geoFencesListViewTargetListsCombo) { geoFencesListViewTargetListsCombo.UpdateForMapType(); }
        if (!!busRTAndHistoryContent) { busRTAndHistoryContent.UpdateForMapType(); }
    }

    function createControl() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var customAppContentI = settings.customAppContentI;
        var ls = tf.TFMap.LayoutSettings;
        var topCaption = customAppContentI.createTitleDescSVGLogo(settings.panelName, settings.appDesc, appStyles.GetPoweredByTerraFlySVGForMap());
        var topContent = customAppContentI.createNonScrollContent();
        topContent.AddContent(topCaption.wrapper);
        customAppContentI.getContentWrapper().AddContent(topContent);
    }

    function updateCurrentTargetList() { geoFencesListViewTargetListsCombo.SetCurrentTargetList(busRTAndHistoryContent.GetIsShowingRT() ? rtTargetListName : historyTargetListName); }

    function onChangeBusList(notification) { updateCurrentTargetList(); }

    function initialize() {
        rtTargetListName = "rttargets";
        historyTargetListName = "historytargets";
        createControl();
        geoFencesListViewTargetListsCombo = new tf.GeoFences.ListViewTargetListsCombo(settings);
        busRTAndHistoryContent = new tf.Transit.BusRTAndHistoryContent(tf.js.ShallowMerge(settings, {
            startWithHistory: settings.startWithHistory,
            showRT: settings.showRT,
            showHistory: settings.showHistory,
            layerZIndex: settings.layerZIndex
        }));
        geoFencesListViewTargetListsCombo.AddTargetList(rtTargetListName, busRTAndHistoryContent.GetRTContent());
        geoFencesListViewTargetListsCombo.AddTargetList(historyTargetListName, busRTAndHistoryContent.GetHistoryContent());
        busRTAndHistoryContent.AddListChangeListener(onChangeBusList);
        updateCurrentTargetList();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GeoFenceApp.App = function (settings) {
    var theThis, appName, appDesc, customApp, geoFenceAppContent;

    function onCreated(notification) {
        geoFenceAppContent.OnCreated(notification);
    }

    function onParametersParsed(notification) {
        var mapSettings = notification.mapSettings;
        mapSettings.panels = tf.urlapi.AddStringsWithSeparatorsIfAbsent(mapSettings.panels, [tf.consts.panelNameMeasure, tf.consts.panelNameDownload]);
    }

    function onContentSetInterface(theInterface) {
        geoFenceAppContent = new tf.GeoFenceApp.Content({
            appContent: customApp.GetTFMapApp().GetContent(), customAppContentI: theInterface, panelName: appName, appDesc: appDesc,
            startWithHistory: settings.startWithHistory,
            showHistory: settings.showHistory,
            showRT: settings.showRT
        });
    }

    function updateForMapType() { if (!!geoFenceAppContent) { geoFenceAppContent.UpdateForMapType(); } }

    function onVisibilityChange(notification) { if (!!geoFenceAppContent) { geoFenceAppContent.OnVisibilityChange(notification); } }

    function initialize() {
        appName = "GeoFences";
        if (!settings.showHistory) { settings.showRT = true; }
        appDesc = "Applied to Miami Dade Transit<br/>Real time and Recent vehicle activity";
        customApp = new tf.TFMap.CustomApp(tf.js.ShallowMerge(settings, {
            onVisibilityChange: onVisibilityChange,
            updateForMapType: updateForMapType,
            appName: appName, sidePanelWidthInt: 340, sidePanelWidthSmallInt: 240,
            onContentSetInterface: onContentSetInterface, onCreated: onCreated, onParametersParsed: onParametersParsed
        }));
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
