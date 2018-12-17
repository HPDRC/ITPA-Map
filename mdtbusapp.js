"use strict";

tf.MDTBusesApp = {};

tf.MDTBusesApp.Content = function (settings) {
    var theThis, busRTAndHistoryContent;

    this.OnVisibilityChange = function (notification) { if (!!busRTAndHistoryContent) { busRTAndHistoryContent.OnVisibilityChange(notification); } }

    this.UpdateForMapType = function () { if (!!busRTAndHistoryContent) { busRTAndHistoryContent.UpdateForMapType(); } }

    function createControl() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var customAppContentI = settings.customAppContentI;
        var ls = tf.TFMap.LayoutSettings;
        var topCaption = customAppContentI.createTitleDescSVGLogo(settings.panelName, settings.appDesc, appStyles.GetPoweredByTerraFlySVGForMap());
        var topContent = customAppContentI.createNonScrollContent();

        topContent.AddContent(topCaption.wrapper);
        customAppContentI.getContentWrapper().AddContent(topContent);
    }

    function initialize() {
        createControl();
        busRTAndHistoryContent = new tf.Transit.BusRTAndHistoryContent(tf.js.ShallowMerge(settings, {
            startWithHistory: settings.startWithHistory,
            showRT: settings.showRT,
            showHistory: settings.showHistory,
            layerZIndex: settings.layerZIndex
        }));
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.MDTBusesApp.App = function (settings) {
    var theThis, appName, appDesc, customApp, mdtBusesAppContent;

    function onCreated(notification) {
        //console.log('on created');
    }

    function onParametersParsed(notification) {
        //var params = notification.params; console.log('on parameters parsed');
    }

    function onContentSetInterface(theInterface) {
        mdtBusesAppContent = new tf.MDTBusesApp.Content({
            appContent: customApp.GetTFMapApp().GetContent(), customAppContentI: theInterface, panelName: appName, appDesc: appDesc,
            startWithHistory: settings.startWithHistory, showRT: settings.showRT, showHistory: settings.showHistory,
            transitServerURL: settings.transitServerURL
        });
    }

    function updateForMapType() { if (!!mdtBusesAppContent) { mdtBusesAppContent.UpdateForMapType(); } }

    function onVisibilityChange(notification) { if (!!mdtBusesAppContent) { mdtBusesAppContent.OnVisibilityChange(notification); } }

    function initialize() {
        appName = "MDT Buses";
        if (!settings.showHistory) { settings.showRT = true; }
        appDesc = "Miami Dade Transit authority";
        customApp = new tf.TFMap.CustomApp(tf.js.ShallowMerge(settings, {
            onVisibilityChange: onVisibilityChange,
            updateForMapType: updateForMapType,
            appName: appName, sidePanelWidthInt: 340, sidePanelWidthSmallInt: 240,
            onContentSetInterface: onContentSetInterface, onCreated: onCreated, onParametersParsed: onParametersParsed
        }));
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
