"use strict";

tf.GTFS.AgencyEditor = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.AgencyEditor)) { return new tf.GTFS.AgencyEditor(settings); }
    var TLF, agencyItem;
    var currentEditor;
    var routesListEditor, stopsListEditor, subAgenciesListEditor, servicesListEditor, tripsListEditor, stopSequencesListEditor;
    var isEditing;
    var lastToast;
    var buttonsToolBar;

    this.SetCurrentEditor = function (newEditor) { return setCurrentEditor(newEditor); };

    this.OnVisibilityChange = function (notification) { theThis.SetIsVisible(notification.isVisible); };
    this.SetIsVisible = function (newIsVisible) { TLF.SetIsVisible(newIsVisible); };

    this.SetIsHidden = function (newIsHidden) {
        isEditing = !!newIsHidden;
        TLF.SetIsHidden(newIsHidden);
    };

    this.SetIsExpanded = function (newIsExpanded) { TLF.SetIsExpanded(newIsExpanded); };

    this.Edit = function (agencyItemEdit) {
        var isNewAgency = agencyItem != agencyItemEdit;
        if (isNewAgency) {
            removeAllItems();
        }
        if (agencyItem = agencyItemEdit) {
            startEdit(isNewAgency);
            theThis.SetIsHidden(false);
            theThis.SetIsExpanded(true);
        } else {
            theThis.SetIsHidden(true);
        }
    };

    function showButtons(show) {
        buttonsToolBar.GetHTMLElement().style.display = show ? "inline-block" : "none";
    };

    function onToggleExpanded(notification) { };

    function removeAllItems() {
        closeCurrentEditor();
        subAgenciesListEditor.RemoveAllItems();
        servicesListEditor.RemoveAllItems();
        stopsListEditor.RemoveAllItems();
        routesListEditor.RemoveAllItems();
        tripsListEditor.RemoveAllItems();
        stopSequencesListEditor.RemoveAllItems();
    };

    function keepRefreshing(notification) {
        var nextEditor;
        switch (notification.sender) {
            case subAgenciesListEditor:
                nextEditor = servicesListEditor;
                break;
            case servicesListEditor:
                nextEditor = routesListEditor;
                break;
            case routesListEditor:
                nextEditor = stopsListEditor;
                break;
            case stopsListEditor:
                nextEditor = stopSequencesListEditor;
                break;
            case stopSequencesListEditor:
            case tripsListEditor:
                break;
            default:
                break;
        }
        if (nextEditor) {
            doRefreshEditors(nextEditor);
        }
        else {
            showToast("All data loaded", 1000);
            showButtons(true);
            onSubAgencies();
        }
    };

    function doRefreshEditors(editor) {
        showButtons(false);
        editor.RefreshForAgency(agencyItem, keepRefreshing);
    };

    function startEdit(isNewAgency) {
        var ad = agencyItem.GetData();
        var theTLF = TLF.Get();
        theTLF.listTitleSpan.innerHTML = "<< " + ad.prefix;
        isEditing = true;
        if (isNewAgency) {
            doRefreshEditors(subAgenciesListEditor);
        }
    };

    function getEditor(editorName) {
        return settings.editors[editorName];
    };

    function closeCurrentEditor() { if (currentEditor) { currentEditor.Hide(); currentEditor = undefined; } };

    function setCurrentEditor(newEditor) { closeCurrentEditor(); if (currentEditor = newEditor) { currentEditor.Show(agencyItem); } };

    function checkSetCurrentEditor(newEditor) { if (newEditor !== currentEditor) { closeCurrentEditor(); if (currentEditor = newEditor) { currentEditor.Show(agencyItem); } }; };

    function onSubAgencies() { setCurrentEditor(subAgenciesListEditor); };

    function onRoutes() { setCurrentEditor(routesListEditor); };

    function onStops() { setCurrentEditor(stopsListEditor); };

    function onStopSequences() { setCurrentEditor(stopSequencesListEditor); };

    function onServices() { setCurrentEditor(servicesListEditor); };

    function onTrips() { setCurrentEditor(tripsListEditor); }

    function getVerbs() {
        var verbs = {};
        verbs["agencies"] = { text: "Agencies", toolTip: "View list of sub agencies", onClick: onSubAgencies };
        verbs["services"] = { text: "Services", toolTip: "View list of services", onClick: onServices };
        verbs["stops"] = { text: "Stops", toolTip: "View list of stops", onClick: onStops };
        verbs["routes"] = { text: "Routes", toolTip: "View list of routes", onClick: onRoutes };
        verbs["sequences"] = { text: "Sequences", toolTip: "View list of stop sequences", onClick: onStopSequences };
        verbs["trips"] = { text: "Trips", toolTip: "View list of trips", onClick: onTrips };
        return verbs;
    };

    function startVerb(verb) {
        switch (verb) {
            case "agencies": onSubAgencies(); break;
            case "services": onServices(); break;
            case "stops": onStops(); break;
            case "sequences": onStopSequences(); break;
            case "routes": onRoutes(); break;
            case "trips": onTrips(); break;
        }
    };

    function onCloseEditor() { settings.onCloseAgencyEditor(agencyItem); };

    function onKLChange() { if (isEditing) { onCloseEditor(); removeAllItems(); } };

    function showToast(str, timeout) {
        var toast, toaster = settings.appContent.GetToaster();
        if (timeout == undefined) { timeout = 0; }
        toast = toaster.Toast({ text: str, timeout: timeout });
        return toast;
    };

    function initialize() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var cssClasses = settings.cssClasses;
        var cssClassNames = cssClasses.GetClassNames();
        var customAppContentI = settings.customAppContentI;
        var mainToolBarSpanClassNames = customAppContentI.getToolBarSpanClasses();
        var toolTipWrapper = customAppContentI.getContentWrapper();

        TLF = new tf.GTFS.TLF(tf.js.ShallowMerge(settings, { isVisible: true, isExpanded: true, isHidden: true, onToggleExpanded: onToggleExpanded, noScrollWrapperVisibility: true, absoluteScrollers: true }));

        var theTLF = TLF.Get();

        tf.dom.AddCSSClass(theTLF.wrapper, cssClassNames.fullEditorClassName);

        theTLF.listTitleSpan = document.createElement('div');
        theTLF.listTitleSpan.className = mainToolBarSpanClassNames;

        theTLF.toolBar.content.AddContent(theTLF.listTitleSpan);

        theTLF.cellButton.SetOnClick(onCloseEditor);

        buttonsToolBar = new tf.dom.Div({ cssClass: cssClassNames.itemRowToolBarClassName });
        var delayMillis = 0, toolTipClass = "*start", toolTipArrowClass = "top";
        var buttonSettings = {
            wrapper: toolTipWrapper, offsetY: -4, onClick: undefined, onHover: undefined, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        var buttons = {}, verbs = getVerbs();

        var buttonsToolBarE = buttonsToolBar.GetHTMLElement(), buttonsToolBarES = buttonsToolBarE.style;
        buttonsToolBarES.maxWidth = "60%";
        buttonsToolBarES.paddingTop = buttonsToolBarES.paddingBottom = "2px";

        for (var i in verbs) {
            var verb = verbs[i];
            var newButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
                onClick: function (verbName) { return function () { return startVerb(verbName); } }(i)
            }), undefined, cssClassNames.itemToolBarTextButton + " " + cssClassNames.itemToolBarFixWidthTextButtonWide, verb.toolTip, undefined, "toolBarEdit");
            var newButtonButton = newButton.GetButton(), newButtonButtonS = newButtonButton.style;
            newButtonButton.innerHTML = verb.text;
            newButtonButtonS.marginTop = newButtonButton.style.marginBottom = "2px";
            //newButtonButtonS.minWidth = "65px";
            buttonsToolBar.AddContent(newButtonButton);
            buttons[i] = { verb: verb, button: newButton };
        }

        settings.showToast = showToast;
        settings.checkSetCurrentEditor = checkSetCurrentEditor;
        settings.getEditor = getEditor;

        theTLF.toolBar.content.AddContent(buttonsToolBar);

        var topToolBar = new tf.dom.Div({ cssClass: cssClassNames.emptyBlockDivClassName });

        theTLF.topToolBar = topToolBar;

        theTLF.wrapper.InsertContentAfter(topToolBar, theTLF.toolBar.wrapper);

        routesListEditor = tf.GTFS.RoutesListEditor(tf.js.ShallowMerge(settings, { TLF: TLF, scrollContent: theTLF.scrollContent, scrollWrapper: theTLF.scrollWrapper }));
        routesListEditor.GetAssetListEditor().AddEditorToSettings(settings);

        var subAgenciesScrollArea = TLF.AddScrollArea();

        subAgenciesListEditor = tf.GTFS.SubAgenciesListEditor(tf.js.ShallowMerge(settings, { TLF: TLF, scrollContent: subAgenciesScrollArea.scrollContent, scrollWrapper: subAgenciesScrollArea.scrollWrapper }));
        subAgenciesListEditor.GetAssetListEditor().AddEditorToSettings(settings);

        var servicesScrollArea = TLF.AddScrollArea();

        servicesListEditor = tf.GTFS.ServicesListEditor(tf.js.ShallowMerge(settings, { TLF: TLF, scrollContent: servicesScrollArea.scrollContent, scrollWrapper: servicesScrollArea.scrollWrapper }));
        servicesListEditor.GetAssetListEditor().AddEditorToSettings(settings);

        var stopsScrollArea = TLF.AddScrollArea();

        stopsListEditor = tf.GTFS.StopsListEditor(tf.js.ShallowMerge(settings, { TLF: TLF, scrollContent: stopsScrollArea.scrollContent, scrollWrapper: stopsScrollArea.scrollWrapper }));
        stopsListEditor.GetAssetListEditor().AddEditorToSettings(settings);

        var stopSequencesScrollArea = TLF.AddScrollArea();

        stopSequencesListEditor = tf.GTFS.StopSequencesListEditor(tf.js.ShallowMerge(settings, { TLF: TLF, scrollContent: stopSequencesScrollArea.scrollContent, scrollWrapper: stopSequencesScrollArea.scrollWrapper }));
        stopSequencesListEditor.GetAssetListEditor().AddEditorToSettings(settings);

        var tripsScrollArea = TLF.AddScrollArea();

        tripsListEditor = tf.GTFS.TripsListEditor(tf.js.ShallowMerge(settings, { TLF: TLF, scrollContent: tripsScrollArea.scrollContent, scrollWrapper: tripsScrollArea.scrollWrapper }));
        tripsListEditor.GetAssetListEditor().AddEditorToSettings(settings);

        settings.customAppContentI.getContentWrapper().AddContent(theTLF.wrapper);

        var kl = settings.agenciesList.GetKL();
        kl.AddAggregateListener(onKLChange);
    };

    initialize();
};
