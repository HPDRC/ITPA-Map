"use strict";

tf.GTFS.EditorAttributeTypes = {
    url: "url"
};

tf.GTFS.CalendarDatesExceptionTypeAvailable = 1;
tf.GTFS.CalendarDatesExceptionTypeUnavailable = 2;

tf.GTFS.StopWheelChairBordingArray = [
    { desc: 'There is no accessibility information' },
    { desc: 'At least some vehicles can be boarded by a rider in a wheelchair' },
    { desc: 'Wheelchair boarding is not possible' }
];

tf.GTFS.TripWheelChairAccessibleArray = [
    { desc: 'Information about wheelchair accomodations is not provided' },
    { desc: 'Accomodations are available for at least one rider in a wheelchair' },
    { desc: 'No riders with wheelchairs can be accomodated' }
];

tf.GTFS.TripBikesAllowedArray = [
    { desc: 'Information about bicycle accomodations is not provided' },
    { desc: 'At least one bicycle can be accomodated' },
    { desc: 'No bicycles are allowed' }
];

tf.GTFS.StopInStationWheelChairBordingArray = [
    { desc: 'Accessibility information available in parent station' },
    { desc: 'There exists some accessible path from outside the station' },
    { desc: 'There exists no accessible path from outside the station' }
];

tf.GTFS.RouteTypesArray = [
    { name: 'Tram', desc: 'Streetcar, Light rail.Any light rail or street level system within a metropolitan area' },
    { name: 'Subway, Metro', desc: 'Any underground rail system within a metropolitan area' },
    { name: 'Rail', desc: 'Used for intercity or long distance travel' },
    { name: 'Bus', desc: 'Used for short and long distance bus routes' },
    { name: 'Ferry', desc: 'Used for short and long distance boat service' },
    { name: 'Cable car', desc: 'Used for street level cable cars where the cable runs beneath the car' },
    { name: 'Gondola, Suspended cable car', desc: 'Typically used for aerial cable cars where the car is suspended from the cable' },
    { name: 'Funicular', desc: 'Any rail system designed for steep inclines' }
];

tf.GTFS.StopLocationTypesArray = [
    { name: 'Stop', desc: 'A location where passengers board or disembark from a transit vehicle' },
    { name: 'Station', desc: 'A physical structure or area that contains one or more stops' }
];

tf.GTFS.AssetListEditor = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.AssetListEditor)) { return new tf.GTFS.AssetListEditor(settings); }
    var KL, klContent, klListener;
    var selectedContent, attachedSelectedContent;
    var layer, mapFeatures, onClickMapFeatureCB;
    var additionalLayers;
    var topToolBar;
    var editorLoadingToast;
    var isVisible;

    this.GetIsVisible = function () { return isVisible; };

    this.GetTopToolBar = function () { return topToolBar; };

    this.GetKL = function () { return KL; };

    this.AddEditorToSettings = function (toSettings) {
        var thisEditor = {};
        thisEditor[settings.assetName.replace(" ", "_")] = settings.editor;
        toSettings.editors = tf.js.ShallowMerge(toSettings.editors, thisEditor);
    };

    this.GetEditor = function () { return settings.editor; };

    this.GetAssetName = function () { return settings.assetName; };

    this.ShowEditorLoadingToast = function () {
        theThis.CloseEditorLoadingToast();
        editorLoadingToast = settings.showToast("Loading " + theThis.GetAssetName() + " data...");
    };

    this.CloseEditorLoadingToast = function () { if (editorLoadingToast) { editorLoadingToast.Close(); editorLoadingToast = undefined; } };

    this.GetAttachedSelectedContent = function () { return attachedSelectedContent; };
    this.GetAdditionalLayer = function (layerName) { return additionalLayers[layerName]; };

    this.ShowHide = function (showHide) {
        isVisible = showHide;
        var scrollDisplay, scrollZIndex;
        if (showHide) {
            settings.TLF.Get().topToolBar.AddContent(topToolBar);
            scrollDisplay = "flex";
            scrollZIndex = "5";
            updateFooterCount();
        }
        else {
            settings.TLF.Get().topToolBar.RemoveContent(topToolBar);
            scrollDisplay = "none";
            scrollZIndex = "1";
        }
        //console.log('set display ' + scrollDisplay);
        //settings.scrollWrapper.GetHTMLElement().style.display = scrollDisplay;
        settings.scrollWrapper.GetHTMLElement().style.display = "flex";
        settings.scrollWrapper.GetHTMLElement().style.zIndex = scrollZIndex;
        if (showHide) {
            theThis.EnsureSelectedContentVisible();
            updateFooterCount();
        }
        if (settings.onShowHide) { settings.onShowHide(showHide); }
    };

    this.GetKL = function () { return KL; }

    this.GetLayer = function () { return layer; };

    this.RemoveAllItems = function () {
        attachedSelectedContent.DetachIfAttached();
        theThis.SetSelectedContent(undefined);
        if (mapFeatures) { mapFeatures.Clear(KL); }
        theThis.UpdateFromNewData([]);
        //if (settings.onRemoveAllItems) { settings.onRemoveAllItems(); }
    };

    this.UpdateFromNewData = function (newData) { KL.UpdateFromNewData(newData); }

    this.EnsureContentVisible = function (content) {
        if (!!content) {
            tf.dom.ScrollVerticallyToEnsureVisible(settings.scrollContent, content.wrapper, settings.customAppContentI.getVerListWithFadePaddingTopBotInt());
            //setTimeout(function () { tf.dom.ScrollVerticallyToEnsureVisible(settings.scrollContent, content.wrapper, settings.customAppContentI.getVerListWithFadePaddingTopBotInt()); }, 200); 
        }
    };

    this.EnsureSelectedContentVisible = function () { return theThis.EnsureContentVisible(selectedContent); };

    this.MakeSelectedMapFeatureVisible = function () {
        if (!!mapFeatures) {
            var selectedMapFeature = getSelectedMapFeature();
            if (selectedMapFeature) {
                if (mapFeatures.GetIsPoint()) {
                    settings.appContent.MakeSureMapCoordsAreVisible(selectedMapFeature.GetPointCoords(), 150);
                }
                else {
                    settings.appContent.SetMapExtent(selectedMapFeature.GetGeom().GetExtent());
                }
            }
        }
    };

    this.OnContentSelectToggle = function (newSelectedContent) {
        if (newSelectedContent) {
            var contentToSelect = newSelectedContent == selectedContent ? undefined : newSelectedContent;
            theThis.SetSelectedContent(contentToSelect);
            theThis.MakeSelectedMapFeatureVisible();
        }
    };

    this.SetSelectedContent = function (newSelectedContent) {
        if (newSelectedContent != selectedContent) {
            if (!!selectedContent) {
                var savedSelectedContent = selectedContent;
                selectedContent = undefined;
                setSelectedStyle(savedSelectedContent, false);
                setSelectedMapFeature(undefined);
                if (!!attachedSelectedContent) { attachedSelectedContent.DetachIfAttached(); }
            }
            if (!!(selectedContent = newSelectedContent)) {
                if (!!mapFeatures) { setSelectedMapFeature(theThis.GetMapFeatureFromItem(theThis.GetItemFromContent(selectedContent))); }
                setSelectedStyle(selectedContent, true);
                if (!!attachedSelectedContent) { attachedSelectedContent.AttachTo(selectedContent); }
                theThis.EnsureContentVisible(selectedContent);
            }
        }
    };

    this.SetSelectedItem = function (newSelectedItem, ensureSelectedContentVisible, makeMapFeatureIsVisible) {
        theThis.SetSelectedContent(theThis.GetContentFromItem(newSelectedItem));
        if (selectedContent) {
            if (ensureSelectedContentVisible) { theThis.EnsureSelectedContentVisible(); }
            if (makeMapFeatureIsVisible) { theThis.MakeSelectedMapFeatureVisible(); }
        }
    };

    this.SelectFirstItem = function () { var ki = KL.GetFirstKeyedItem(); theThis.SetSelectedItem(ki); return ki };

    this.GetSelectedContent = function () { return selectedContent; }

    this.GetSelectedItem = function () { return theThis.GetItemFromContent(selectedContent); }
    this.GetSelectedMapFeature = function () { return getSelectedMapFeature(); }

    this.GetItemFromContent = function (content) { return klContent.GetItemFromContent(content); }
    this.GetContentFromItem = function (item) { return klContent.GetContentFromItem(item); }

    this.GetItemFromMapFeature = function (mapFeature) { return mapFeatures ? mapFeatures.GetItemFromMapFeature(mapFeature) : undefined; };
    this.GetMapFeatureFromItem = function (mapFeature) { return mapFeatures ? mapFeatures.GetMapFeatureFromItem(mapFeature) : undefined; };

    function setSelectedStyle(content, isSelected) {
        var classNames = settings.cssClasses.GetClassNames();
        if (isSelected) { tf.dom.AddCSSClass(content.wrapper, classNames.itemWrapperSelectedClassName); }
        else { tf.dom.RemoveCSSClass(content.wrapper, classNames.itemWrapperSelectedClassName); }
        if (tf.js.GetFunctionOrNull(settings.onSelectedStyleChange)) {
            settings.onSelectedStyleChange({ sender: theThis, content: content, isSelected: isSelected });
        }
    };

    function getSelectedMapFeature() { return mapFeatures ? mapFeatures.GetSelectedMapFeature() : undefined; };
    function setSelectedMapFeature(mapFeature) { if (mapFeatures) { mapFeatures.SetSelectedMapFeature(mapFeature); } };

    function updateFooterText(theText) { settings.TLF.Get().footer.content.GetHTMLElement().innerHTML = theText; }

    function updateFooterCount() {
        var count = KL.GetItemCount(), footerStr;
        if (count == 0) { footerStr = "empty list" }
        else {
            var itemItems = count == 1 ? settings.itemNameSingle : settings.itemNamePlural;
            footerStr = count + " " + itemItems;
        }
        updateFooterText(footerStr);
    };

    function onKLChange(notification) {
        var selectedItemId, curUserSel;
        if (!!selectedContent) {
            if (selectedItem = theThis.GetItemFromContent(selectedContent)) { selectedItemId = selectedItem.GetData().id; }
            curUserSel = !!attachedSelectedContent ? attachedSelectedContent.GetCurrentContent() : undefined;
            theThis.SetSelectedContent(undefined);
        }
        if (!!attachedSelectedContent) { attachedSelectedContent.DetachIfAttached(); }
        klContent.OnKLChange(notification);
        if (selectedItemId != undefined) {
            var selectedItem = KL.GetItem(selectedItemId);
            theThis.SetSelectedContent(theThis.GetContentFromItem(selectedItem));
            if (!!curUserSel && !!selectedContent && !!attachedSelectedContent) { attachedSelectedContent.AttachTo(selectedContent); }
        }
        if (mapFeatures) { mapFeatures.OnKLChange(notification); }
        if (settings.onKLChange) { settings.onKLChange(notification); }
        if (isVisible) { setTimeout(updateFooterCount, 0); }
    };

    function onClickMapFeature(notification) {
        if (getSelectedMapFeature() != notification.mapFeature) {
            var item = mapFeatures.GetItemFromMapFeature(notification.mapFeature);
            if (!!item) { setSelectedMapFeature(notification.mapFeature); }
        }
        //else { setSelectedMapFeature(undefined); }

        var item = mapFeatures.GetItemFromMapFeature(notification.mapFeature);

        if (!!item) {
            var content = theThis.GetContentFromItem(item);
            if (!!content) {
                if (settings.checkSetCurrentEditor && settings.editor) {
                    settings.checkSetCurrentEditor(settings.editor);
                }
                if (theThis.GetSelectedContent() != content) {
                    theThis.SetSelectedContent(content);
                }
                else {
                    theThis.EnsureContentVisible(content);
                }
            }
        }
        if (!!onClickMapFeatureCB) { onClickMapFeatureCB(notification); }
    };

    function onLayerToggle() { layer.SetVisible(!layer.GetIsVisible()); };

    function onClustersToggle() { layer.SetUseClusters(!layer.GetUsesClusters()); };

    function startVerb(verb) {
        switch (verb) {
            case "layer": onLayerToggle(); break;
            case "clusters": onClustersToggle(); break;
        }
    };

    function prepareSpareContent(content) { setSelectedStyle(content, false); return settings.prepareSpareContent ? settings.prepareSpareContent(content) : content; };

    function initialize() {
        var appContent = settings.appContent;
        var cssClasses = settings.cssClasses, cssClassNames = cssClasses.GetClassNames();
        var customAppContentI = settings.customAppContentI;
        //var mainToolBarButtonClassNames = customAppContentI.getToolBarButtonClasses();
        var mainToolBarSpanClassNames = customAppContentI.getToolBarSpanClasses();
        var toolTipWrapper = settings.customAppContentI.getContentWrapper();
        var verbs = {};

        settings.scrollWrapper.GetHTMLElement().style.display = "none";

        KL = new tf.js.KeyedList({
            name: settings.assetName,
            getKeyFromItemData: function (d) { return d.id; },
            needsUpdateItemData: function (u) { return true },
            filterAddItem: function (d) { return true; }
        });

        //settings.scrollWrapper.GetHTMLElement().title = settings.assetName;

        klContent = new tf.TFMap.KeyedListContent({
            KL: KL, wrapper: settings.scrollWrapper, contentWrapper: settings.scrollContent,
            contentWrapperDisplayVisibleVerb: 'block',
            contentInItemAttributeName: settings.contentInItemAttributeName, itemInContentAttributeName: settings.itemInContentAttributeName,
            createNewContent: settings.createNewContent, prepareSpareContent: prepareSpareContent,
            onContentBecameSpare: settings.onContentBecameSpare,
            updateContentForItem: settings.updateContentForItem, compareContent: settings.compareContent
        });
        klListener = KL.AddAggregateListener(onKLChange);

        if (settings.createLayer) {
            var layerSettings = {
                name: settings.assetName, isVisible: true, isHidden: true,
                useClusters: settings.useClusters,
                clusterFeatureDistance: settings.clusterFeatureDistance,
                clusterStyle: settings.clusterStyle,
                clusterLabelStyle: settings.clusterLabelStyle,
                zIndex: settings.layerZIndex++
            };
            var use3D = false;
            //var use3D = true;
            verbs["layer"] = { text: "Layer", toolTip: "Toggle map layer visibility", onClick: onLayerToggle };
            if (settings.useClusters) {
                verbs["clusters"] = { text: "Clusters", toolTip: "Toggle map feature clusters", onClick: onClustersToggle };
            }
            layer = settings.appContent.CreateCustomMapLayer(layerSettings, use3D);
            if (settings.mapFeaturesSettings) {
                onClickMapFeatureCB = tf.js.GetFunctionOrNull(settings.mapFeaturesSettings.onClick);
                mapFeatures = new tf.TFMap.KeyedListMapFeatures(tf.js.ShallowMerge(settings.mapFeaturesSettings, { layer: layer, onClick: onClickMapFeature }));
            }
        }

        additionalLayers = {};

        if (settings.additionalLayers) {
            for (var i in settings.additionalLayers) {
                var als = settings.additionalLayers[i], layerName = als.name;
                var layerSettings = {
                    name: layerName, isVisible: true, isHidden: true,
                    useClusters: als.useClusters,
                    clusterFeatureDistance: als.clusterFeatureDistance,
                    clusterStyle: als.clusterStyle,
                    clusterLabelStyle: als.clusterLabelStyle,
                    zIndex: settings.layerZIndex++
                };
                additionalLayers[layerName] = settings.appContent.CreateCustomMapLayer(layerSettings, als.use3D);
            }
        };

        if (!!settings.attachedSelectedContentType) {
            attachedSelectedContent = new settings.attachedSelectedContentType(tf.js.ShallowMerge(settings, {
                //toolTipWrapper: theTLF.toolBar.wrapper,
                toolTipWrapper: toolTipWrapper,
                getItemFromContent: theThis.GetItemFromContent
            }));
        }

        topToolBar = new tf.dom.Div({ cssClass: cssClassNames.itemRowToolBarClassName + " " + cssClassNames.emptyBlockDivClassName });

        var rtbe = topToolBar.GetHTMLElement(), rtbes = rtbe.style;
        rtbes.backgroundColor = "white";
        rtbes.color = "black";
        //rtbes.display = 'inline-block';

        var listTitleSpan = new tf.dom.Div({ cssClass: mainToolBarSpanClassNames });
        var listTitleSpanE = listTitleSpan.GetHTMLElement();

        listTitleSpanE.innerHTML = " List of " + settings.itemNamePlural + " ";
        listTitleSpanE.style.display = 'inline-block';

        topToolBar.AddContent(listTitleSpan);

        var delayMillis = 0, toolTipClass = "*start", toolTipArrowClass = "top";
        var buttonSettings = {
            wrapper: toolTipWrapper, offsetY: -4, onClick: undefined, onHover: undefined, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        var buttons = {};

        for (var i in verbs) {
            var verb = verbs[i];
            var newButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
                onClick: function (verbName) { return function () { return startVerb(verbName); } }(i)
            }), undefined, cssClassNames.itemToolBarTextButton + " " + cssClassNames.itemToolBarFixWidthTextButton, verb.toolTip, undefined, "toolBarEdit");
            newButton.GetButton().innerHTML = verb.text;
            topToolBar.AddContent(newButton.GetButton());
            buttons[i] = { verb: verb, button: newButton };
        }

        theThis.ShowHide(false);
        updateFooterCount();
    };

    initialize();
};

tf.GTFS.AttributesRowEditor = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.AttributesRowEditor)) { return new tf.GTFS.AttributesRowEditor(settings); }
    var allContent;

    this.Show = function (show) { allContent.wrapper.GetHTMLElement().style.display = !!show ? "block" : "none"; }

    this.GetAllContent = function () { return allContent; }

    this.UpdateContent = function (itemData) {
        var name = tf.js.GetNonEmptyString(settings.itemAttribute.name, settings.key);
        var value = settings.itemAttribute.translateData ? settings.itemAttribute.translateData(itemData) : itemData[settings.key];
        var hasValue = !!value;

        if (!hasValue) { value = "not defined"; }

        allContent.attrName.GetHTMLElement().innerHTML = name;

        if (hasValue) {
            switch (settings.itemAttribute.type) {
                default: break;
                case tf.GTFS.EditorAttributeTypes.url:
                    value = "<a target='_blank' href='" + value + "' title='browse: " + value + "'>" + value + "</a>";
                    break;
            }
        }
        allContent.attrValue.GetHTMLElement().innerHTML = value;
        allContent.attrDesc.GetHTMLElement().innerHTML = settings.itemAttribute.desc;
    };

    function createControl() {
        var cssClasses = settings.cssClasses;
        var cssClassNames = cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: cssClassNames.emailPasswordWrapper });

        allContent = { wrapper: wrapper };
        allContent.attrName = new tf.dom.Div({ cssClass: cssClassNames.attributeNameClassName });
        allContent.attrValue = new tf.dom.Div({ cssClass: cssClassNames.attributeValueClassName });
        allContent.attrDesc = new tf.dom.Div({ cssClass: cssClassNames.attributeDescClassName });
        allContent.wrapper.AddContent(allContent.attrName, allContent.attrDesc, allContent.attrValue);

        theThis.Show(false);
    };

    function initialize() {
        createControl();
    };

    initialize();
};

tf.GTFS.AttributesListEditor = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.AttributesListEditor)) { return new tf.GTFS.AttributesListEditor(settings); }
    var allContent;

    this.Show = function (show) {
        allContent.wrapper.GetHTMLElement().style.display = !!show ? "block" : "none";
        for (var i in allContent.rowEditors) { allContent.rowEditors[i].Show(show); }
    };

    this.GetAllContent = function () { return allContent; }

    this.UpdateContent = function (itemData) { for (var i in allContent.rowEditors) { allContent.rowEditors[i].UpdateContent(itemData); } };

    function createControl() {
        var cssClasses = settings.cssClasses;
        var cssClassNames = cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: cssClassNames.emailPasswordWrapper });

        allContent = { wrapper: wrapper, rowEditors: {} };

        for (var key in settings.itemAttributes) {
            allContent.wrapper.AddContent((allContent.rowEditors[key] = tf.GTFS.AttributesRowEditor(tf.js.ShallowMerge(settings, { key: key, itemAttribute: settings.itemAttributes[key] }))).GetAllContent().wrapper);
        }

        theThis.Show(false);
    };

    function initialize() {
        createControl();
    };

    initialize();
};

tf.GTFS.AssetSelectControl = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.AssetSelectControl)) { return new tf.GTFS.AssetSelectControl(settings); }
    var klListener, allContent, filterMap;
    var defaultOption;

    this.GetKL = function () { return settings.KL; };

    this.SetFilter = function (filterIdList) {
        //console.log('set filter: ' + JSON.stringify(filterIdList));
        if (filterIdList) {
            filterMap = {};
            for (var i in filterIdList) { filterMap['' + filterIdList[i]] = true; }
        }
        else {
            filterMap = undefined;
        }
        onRePolulate();
    };

    this.GetAllContent = function () { return allContent; }

    this.SetTitle = function (newTitle) {
        var displayVerb, titleE = allContent.title.GetHTMLElement();
        if (!!newTitle) { titleE.innerHTML = newTitle; displayVerb = "block"; } else { displayVerb = "none"; }
        titleE.style.display = displayVerb;
    };

    this.Show = function (show) { allContent.wrapper.GetHTMLElement().style.display = !!show ? "flex" : "none"; }

    this.GetSelected = function () { var id, currentOption = theThis.GetSelectedOption(); if (!!currentOption) { id = currentOption.settings.id; } return { id: id }; };

    this.GetSelectedOption = function () { return allContent.selectUI.GetCurrentOption(); };

    this.SetSelectedOption = function (newSelectedOption) {
        if (newSelectedOption) { allContent.selectUI.SetCurrentOption(newSelectedOption.value); };
    };

    this.GetSelectedItem = function () { var currentOption = theThis.GetSelectedOption(); return currentOption ? settings.KL.GetItem(currentOption.settings.id) : undefined; };

    this.SetDefaultOption = function () { return theThis.SetSelectedOption(defaultOption); };

    this.SetSelectedItem = function (newSelectedItem) {
        theThis.SetSelectedOption(settings.getOption(newSelectedItem));
    };

    function addOrUpdateOptions(items) { for (var i in items) { allContent.selectUI.AddOrSetOption(settings.getOption(items[i])); } };

    function delOptions(items) { for (var i in items) { allContent.selectUI.DelOption(settings.getValue(items[i])); } };

    function getInFilter(items) {
        if (filterMap) {
            var inFilter = [];
            for (var i in items) {
                var item = items[i], itemKey = '' + item.GetData().id;
                if (filterMap[itemKey]) { inFilter.push(item); }
            }
            items = inFilter;
        }
        return items;
    };

    function onRePolulate() {
        var curOption = theThis.GetSelectedOption();
        allContent.selectUI.Clear();
        checkAddDefaultSelection();
        onPopulate();
        theThis.SetSelectedOption(curOption.settings);
    };

    function onPopulate() {
        settings.KL.NotifyItemsAdded(function (notification) {
            onKLChange({ added: true, addedItems: notification.items, addedKeys: notification.keys });
        });
    };

    function onKLChange(notification) {
        addOrUpdateOptions(getInFilter(notification.addedItems));
        addOrUpdateOptions(getInFilter(notification.updatedItems));
        delOptions(notification.deletedItems);
        if (settings.compare) { allContent.selectUI.Sort(settings.compare); }
    };

    function onChange(notification) {
        if (settings.updateListEditor && settings.listEditor) { settings.listEditor.GetAssetListEditor().SetSelectedItem(theThis.GetSelectedItem(), true, true); }
        if (tf.js.GetFunctionOrNull(settings.onSelect)) {
            var option = allContent.selectUI.GetCurrentOption();
            settings.onSelect({ sender: theThis, notification: notification, option: option });
        }
    };

    function createControl() {
        var cssClasses = settings.cssClasses;
        var classNames = cssClasses.GetClassNames();
        allContent = {};
        allContent.wrapper = cssClasses.CreateFullRowControlWrapper();
        allContent.title = new tf.dom.Div({ cssClass: classNames.rowPromptClassName });
        allContent.selectUI = new tf.ui.Select({ cssClass: classNames.agenciesSelectClassName, optionsCSSClass: classNames.agenciesSelectClassName, onChange: onChange });
        allContent.wrapper.AddContent(allContent.title, allContent.selectUI.GetHTMLElement());
        theThis.SetTitle(settings.title);
    };

    function checkAddDefaultSelection() {
        if (settings.anyAllTitle) {
            allContent.selectUI.AddOrSetOption(defaultOption = { id: 0, innerHTML: settings.anyAllTitle, value: "0" });
        }
    };

    function initialize() {
        createControl();
        checkAddDefaultSelection();
        var kl = settings.KL;
        klListener = kl.AddAggregateListener(onKLChange);
        onPopulate();
    };

    initialize();
};

tf.GTFS.ButtonRow = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.ButtonRow)) { return new tf.GTFS.ButtonRow(settings); }
    var allContent;

    this.SetTitle = function (newTitle) {
        var displayVerb, titleE = allContent.title.GetHTMLElement();
        if (!!newTitle) { titleE.innerHTML = newTitle; displayVerb = "block"; } else { displayVerb = "none"; }
        titleE.style.display = displayVerb;
    };

    this.GetAllContent = function () { return allContent; };

    function startVerb(verbName) {
        var verb = allContent.verbs[verbName];
        if (verb && verb.onClick) {
            verb.onClick({ sender: theThis });
        }
    };

    function initialize() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var cssClasses = settings.cssClasses, cssClassNames = cssClasses.GetClassNames();
        var customAppContentI = settings.customAppContentI;
        var toolTipWrapper = customAppContentI.getContentWrapper();

        allContent = {};

        allContent.wrapper = cssClasses.CreateFullRowControlWrapper();

        allContent.buttonsToolBar = new tf.dom.Div({ cssClass: cssClassNames.itemRowToolBarClassName });

        var buttonsToolBarE = allContent.buttonsToolBar.GetHTMLElement(), buttonsToolBarES = buttonsToolBarE.style;
        var delayMillis = 0, toolTipClass = "*start", toolTipArrowClass = "top";
        var buttonSettings = {
            wrapper: toolTipWrapper, offsetY: -4, onClick: undefined, onHover: undefined, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        allContent.title = new tf.dom.Div({ cssClass: cssClassNames.rowPromptClassName });

        allContent.buttons = {};
        allContent.verbs = settings.getVerbs();

        buttonsToolBarES.width = "calc(100% - 8px)";
        buttonsToolBarES.paddingTop = buttonsToolBarES.paddingBottom = "2px";

        for (var i in allContent.verbs) {
            var verb = allContent.verbs[i];
            var newButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
                onClick: function (verbName) { return function () { return startVerb(verbName); } }(i)
            }), undefined, cssClassNames.itemToolBarTextButton + " " + cssClassNames.itemToolBarFixWidthTextButton, verb.toolTip, undefined, "toolBarEdit");
            var newButtonButton = newButton.GetButton();
            newButtonButton.innerHTML = verb.text;
            newButtonButton.style.marginTop = newButtonButton.style.marginBottom = "2px";
            allContent.buttonsToolBar.AddContent(newButtonButton);
            allContent.buttons[i] = { verb: verb, button: newButton };
        }
        theThis.SetTitle(settings.title);
        allContent.wrapper.AddContent(allContent.title, allContent.buttonsToolBar);
    };

    initialize();
};
