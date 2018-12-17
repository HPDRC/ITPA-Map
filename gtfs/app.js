"use strict";

tf.GTFS.Content = function (settings) {
    var theThis, cssClasses, apiClient, allContent;

    this.OnCreated = function(notification) { iterateContentCall('OnCreated', notification); }
    this.OnVisibilityChange = function(notification) { iterateContentCall('OnVisibilityChange', notification); }
    this.UpdateForMapType = function() { iterateContentCall('UpdateForMapType', undefined); }

    function iterateContent(cb) { if (tf.js.GetFunctionOrNull(cb)) { for (var i in allContent) { cb(allContent[i]); }; } }
    function iterateContentCall(callName, callParam) { iterateContent(function(c) { if (tf.js.GetFunctionOrNull(c[callName])) { c[callName](callParam); } }); }

    function onEditAgency(agencyItem) {
        allContent.agencyEditor.Edit(agencyItem);
    };

    function onCloseAgencyEditor(agencyItem) {
        allContent.agencyEditor.SetIsHidden(true);
        allContent.agenciesContent.GetTLF().SetIsExpanded(true);
        allContent.agenciesContent.SetSelectedItem(agencyItem);
    };

    function createControl() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var customAppContentI = settings.customAppContentI;
        var ls = tf.TFMap.LayoutSettings;
        var topCaption = customAppContentI.createTitleDescSVGLogo(settings.panelName, settings.appDesc, appStyles.GetPoweredByTerraFlySVGForMap());
        var topContent = customAppContentI.createNonScrollContent();
        topContent.AddContent(topCaption.wrapper);
        customAppContentI.getContentWrapper().AddContent(topContent);
        var contentSettings = tf.js.ShallowMerge(settings, { contentId: 0, onEditAgency: onEditAgency, onCloseAgencyEditor: onCloseAgencyEditor });
        var contentNameTypes = {
            cssClasses: tf.GTFS.CSSClasses,
            apiClient: tf.GTFS.APIClient,
            notify: tf.GTFS.Notify,
            signInContent: tf.GTFS.SignInContent,
            usersList: tf.GTFS.UsersList,
            agenciesList: tf.GTFS.AgenciesList,
            agenciesContent: tf.GTFS.AgenciesContent,
            usersContent: tf.GTFS.UsersContent,
            agencyEditor: tf.GTFS.AgencyEditor/*,
            usersContent2: tf.GTFS.UsersContent,
            agenciesContent2: tf.GTFS.AgenciesContent,*/
        };
        allContent = {};
        var id = 0;
        for (var i in contentNameTypes) {
            ++contentSettings.contentId;
            allContent[i] = contentSettings[i] = new contentNameTypes[i](contentSettings);
        }
    }

    function initialize() {
        createControl();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.App = function (settings) {
    var theThis, appName, appDesc, customApp, appContent;

    function onCreated(notification) {
        appContent.OnCreated(notification);
    }

    function onParametersParsed(notification) {
        var mapSettings = notification.mapSettings;
        mapSettings.panels = tf.urlapi.AddStringsWithSeparatorsIfAbsent(mapSettings.panels, [tf.consts.panelNameMeasure, tf.consts.panelNameDownload]);
        mapSettings.mapType = tf.consts.typeNameMap;
    }

    function onContentSetInterface(theInterface) {
        appContent = new tf.GTFS.Content(tf.js.ShallowMerge(settings, {
            appContent: customApp.GetTFMapApp().GetContent(), customAppContentI: theInterface, panelName: appName, appDesc: appDesc
        }));
    };

    function updateForMapType() { if (!!appContent) { appContent.UpdateForMapType(); } }

    function onVisibilityChange(notification) { if (!!appContent) { appContent.OnVisibilityChange(notification); } }

    function initialize() {
        appName = "GTFS Architect";
        if (!settings.showHistory) { settings.showRT = true; }
        appDesc = "General Transit Feed Specification";
        customApp = new tf.TFMap.CustomApp(tf.js.ShallowMerge(settings, {
            onVisibilityChange: onVisibilityChange,
            updateForMapType: updateForMapType,
            appName: appName, sidePanelWidthInt: 340, sidePanelWidthSmallInt: 240,
            onContentSetInterface: onContentSetInterface, onCreated: onCreated, onParametersParsed: onParametersParsed
        }));
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
