"use strict";

tf.GTFS.GetStopSequenceName = function (stopSequenceItemData) {
    var routeId = stopSequenceItemData.route_id_in_agency ? stopSequenceItemData.route_id_in_agency : "unnamed ";
    var stopSequenceName;
    if (stopSequenceItemData.trip_headsign) { stopSequenceName = stopSequenceItemData.trip_headsign; }
    else { stopSequenceName = 'headsign not defined'; }
    return routeId + ' - ' + stopSequenceName + ' (' + stopSequenceItemData.stop_count + ')';
};

tf.GTFS.GetStopSequenceTitle = function (stopSequenceItemData) {
    //return stopSequenceItemData.id + ' - ' + tf.GTFS.GetStopSequenceName(stopSequenceItemData);
    return tf.GTFS.GetStopSequenceName(stopSequenceItemData);
};

tf.GTFS.StopSequencesSelectControl = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.StopSequencesSelectControl)) { return new tf.GTFS.StopSequencesSelectControl(settings); }

    function getOption(item) {
        var value, id, innerHTML;
        var itemData = !!item ? item.GetData() : undefined;
        if (itemData) { id = itemData.id; value = '' + id; innerHTML = tf.GTFS.GetStopSequenceTitle(itemData); }
        return { value: value, id: id, innerHTML: innerHTML };
    };

    function getValue(item) { return getOption(item).value; };

    function onSelect(notification) {
        if (settings.onSelect) { settings.onSelect(notification); }
    };

    function initialize() {
        var listEditor = settings.getEditor("stop_sequences");
        var kl = listEditor.GetAssetListEditor().GetKL();
        tf.GTFS.AssetSelectControl.call(theThis, tf.js.ShallowMerge(settings, {
            KL: kl, getOption: getOption, getValue: function (item) { return getOption(item).value; }, onSelect: onSelect,
            listEditor: listEditor
        }));
    };
    initialize();
};
tf.js.InheritFrom(tf.GTFS.StopSequencesSelectControl, tf.GTFS.AssetSelectControl);

tf.GTFS.StopSequenceStopsMapFeatures = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.StopSequenceStopsMapFeatures)) { return new tf.GTFS.StopSequenceStopsMapFeatures(settings); }
    var curStopSequenceItem;

    this.Show = function (show) { settings.layer.SetVisible(show); };

    this.SetStopSequence = function (newStopSequenceItem) {
        if (newStopSequenceItem != curStopSequenceItem) {
            removeMapFeatures();
            if (curStopSequenceItem = newStopSequenceItem) {
                addMapFeatures();
            }
        }
    };

    function getStopStyle(keyedFeature, mapFeature) {
        var isHover = mapFeature.GetIsDisplayingInHover();
        var mapFeatureSettings = mapFeature.GetSettings();
        var stopItemData = mapFeatureSettings.stopItemData;
        var stopIndex = mapFeatureSettings.stopIndex;
        var nStops = mapFeatureSettings.nStops;
        var isExtremity = stopIndex === 0 || stopIndex === nStops - 1;
        var isSelected = false;
        var marker_color = isSelected ? "#90ee90" : (isExtremity ? "#c5a00f" : '#61788c');
        var line_color = isSelected ? "#fff" : "#000";
        var font_color = isSelected ? "#000" : (isExtremity ? "#ffffff" : '#f5f5dc');
        var font_height = (isSelected || isExtremity) ? 15 : 14;
        var zindex = isSelected ? 3 : (isExtremity ? 2 : 1);
        var style;
        var opacity = 1;
        var label = '' + (stopIndex + 1);
        var stopInSeqBorderWidth = 2;

        if (isHover) {
            label += ' - ' + tf.GTFS.GetStopTitle(stopItemData);
            style = { marker: true, label: label, zindex: 10, font_height: font_height, line_opacity: 50, snaptopixel: false, border_width: stopInSeqBorderWidth };
        }
        else {
            style = {
                opacity: opacity, marker: true, label: label, zindex: zindex, marker_color: marker_color, font_color: font_color,
                font_height: font_height, line_color: line_color, line_width: 1, line_opacity: 50, snaptopixel: false, border_width: stopInSeqBorderWidth
            };
        }
        return style;
    };

    function onClick(notification) {
        //console.log('clicked stop sequence stop feature');
        if (settings.onClick) { settings.onClick(notification); }
    };

    function createMapFeatureForStop(stopItem, stopIndex, nStops) {
        var stopItemData = stopItem.GetData();
        var featureSettings = { type: 'point', coordinates: [stopItemData.stop_lon, stopItemData.stop_lat], style: getStopStyle, hoverStyle: getStopStyle };
        var itemSettings = { sender: theThis, stopItem: stopItem, stopItemData: stopItemData, stopIndex: stopIndex, nStops: nStops };
        return new tf.map.Feature(tf.js.ShallowMerge(featureSettings, itemSettings, { onCustomAppClick: onClick }));
    };

    function addMapFeatures() {
        if (curStopSequenceItem) {
            var itemData = curStopSequenceItem.GetData();
            var stopIds = itemData.stop_ids, nStops = itemData.stop_count;
            var listEditor = settings.getEditor("stops");
            var kl = listEditor.GetAssetListEditor().GetKL();
            for (var i = 0; i < nStops; ++i) {
                var stopId = stopIds[i];
                var stopItem = kl.GetItem(stopId);
                if (stopItem) {
                    var mapFeature = createMapFeatureForStop(stopItem, i, nStops);
                    settings.layer.AddMapFeature(mapFeature, true);
                }
            }
            settings.layer.AddWithheldFeatures();
        }
    };

    function removeMapFeatures() {
        if (curStopSequenceItem) {
            curStopSequenceItem = undefined;
            settings.layer.RemoveAllFeatures();
        }
    };

    function initialize() {
        
    };

    initialize();
};

tf.GTFS.StopSequencesSelectedContent = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.StopSequencesSelectedContent)) { return new tf.GTFS.StopSequencesSelectedContent(settings); }
    var myI, allContent;
    var stopSequenceStopsLayer, stopSequenceStopsMapFeatures;

    this.SetLayers = function (stopSequenceStopsLayerSet) {
        stopSequenceStopsLayer = stopSequenceStopsLayerSet;
        stopSequenceStopsMapFeatures = tf.GTFS.StopSequenceStopsMapFeatures(tf.js.ShallowMerge(settings, { layer: stopSequenceStopsLayer, onClick: onClickStopFeature }));
    };

    function onClickStopFeature(notification) {
        var mapFeature = notification.mapFeature, mapFeatureSettings = mapFeature.GetSettings();
        var stopItem = mapFeatureSettings.stopItem;
        var stopsListEditor = settings.getEditor("stops");
        var stopsAssetListEditor = stopsListEditor.GetAssetListEditor();
        stopsAssetListEditor.SetSelectedItem(stopItem);
        settings.checkSetCurrentEditor(stopsListEditor);
    };

    function onModify(notification) {
        var goBackToToolBar = true;
        if (notification.confirmed) {
            if (tf.js.GetFunctionOrNull(settings.getItemFromContent)) {
                var currentContent = theThis.GetCurrentContent();
                var item = settings.getItemFromContent(currentContent);
                if (!!item) {
                    var showStatus = allContent.autoHideStatus.Show;
                    var itemData = item.GetData();
                    goBackToToolBar = false;
                    switch (myI.getCurrentVerb()) {
                        default:
                            goBackToToolBar = true;
                            break;
                    }
                }
            }
        }
        else { allContent.autoHideStatus.HideNow(); }

        if (goBackToToolBar) { myI.backToToolBar(); }
    };

    function createControl() {
        allContent = theThis.GetAllContent();
        var stopSequenceItemAttributes = {
            //"id": { desc: "uniquely identifies the stop sequence within its agency" },
            "route_id_in_agency": { name: "route_id", desc: "the route associated with this stop sequence" },
            "trip_headsign": { desc: "trip headsign displayed to riders" },
            "stop_count": { desc: "number of stops in the sequence" },
            "gtfs_direction_name": { name: "direction", desc: "direction calculated from stops in the sequence" }
        };
        (allContent.attributesListEditor = tf.GTFS.AttributesListEditor(tf.js.ShallowMerge(settings, { itemAttributes: stopSequenceItemAttributes }))).Show(true);
        allContent.wrapper.InsertContentAfter(allContent.attributesListEditor.GetAllContent().wrapper, allContent.titleWrapper);
    }

    function getStopSequenceDirectionStyle(keyedFeature, mapFeature) {
        var currentContent = theThis.GetCurrentContent();
        var item = settings.getItemFromContent(currentContent);
        if (!!item) {
            var itemData = item.GetData();
            var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
            var isAerial = appContent.GetIsShowingAerial();
            var isHover = mapFeature.GetIsDisplayingInHover();
            var zindex = 6, line_width = 4;
            var line_color = '#' + itemData.stopSequence_color;
            if (isHover) {
                line_width += 2;
                zindex += 2;
            }
            var style = [
                { line: true, line_color: "#ffffff", line_width: line_width, line_opacity: 100, zindex: zindex, snaptopixel: false },
                { line: true, line_color: "#000000", line_width: line_width, line_opacity: 100, zindex: zindex + 1, snaptopixel: false, line_cap: "square", line_dash: [line_width, line_width * 1.4, line_width / 2, line_width * 1.4] }
            ];
            return style;
        }
        else {
            console.log('stopSequence item is not defined');
        }
    };

    function getVerbs() {
        var verbs = {};
        return verbs;
    };

    function onContentChange() {
        var currentContent = theThis.GetCurrentContent();
        var item = settings.getItemFromContent(currentContent);
        var stopSequencesListEditor = settings.getEditor("stop_sequences");
        var stopSequencesAssetListEditor = stopSequencesListEditor.GetAssetListEditor();
        var isVisible = stopSequencesAssetListEditor.GetIsVisible();
        allContent.attributesListEditor.UpdateContent(item.GetData());
        stopSequenceStopsMapFeatures.SetStopSequence(item);
        if (isVisible && !!item) {
            var routesListEditor = settings.getEditor("routes");
            var routesAssetListEditor = routesListEditor.GetAssetListEditor();
            var kl = routesAssetListEditor.GetKL();
            var routeItem = kl.GetItem(item.GetData().route_id);
            if (routeItem) {
                var stopSequenceData = item.GetData();
                tf.GTFS.SetRouteSelectedDirectionIndex(routeItem.GetData(), stopSequenceData.direction_id);
                routesAssetListEditor.SetSelectedItem(routeItem, true, true);
                routesListEditor.UpdateCurrentRouteDirections(undefined);
            }
        }
    };

    function onAttachDetach(notification) {
        //console.log('stopSequences selected content attached? ' + (notification.isAttached ? "YES" : "NO"));
        stopSequenceStopsMapFeatures.Show(notification.isAttached);
    }

    function initialize() {
        tf.GTFS.ListSelectedContent.call(theThis, tf.js.ShallowMerge(settings, {
            verbs: tf.js.ShallowMerge(/*stopSequenceDirectionButtons.GetVerbs()*/undefined, getVerbs()), onModify: onModify, setInterface: function (theInterface) { myI = theInterface; }, onContentChange: onContentChange,
            onAttachDetach: onAttachDetach
        }));
        createControl();
        theThis.GetAllContent = function () { return allContent; };
    }
    initialize();
};
tf.js.InheritFrom(tf.GTFS.StopSequencesSelectedContent, tf.GTFS.ListSelectedContent);

tf.GTFS.StopSequencesListEditor = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.StopSequencesListEditor)) { return new tf.GTFS.StopSequencesListEditor(settings); }
    var assetListEditor, agencyItem;

    this.UpdateCurrentStopSequenceDirections = function (notification) {
        assetListEditor.GetAttachedSelectedContent().OnStopSequenceDirectionChanged(notification);
    };

    this.GetAssetListEditor = function () { return assetListEditor; };

    this.GetTLF = function () { return settings.TLF; };

    this.RefreshForAgency = function (agencyItemRefresh, then) {
        if (agencyItemRefresh != agencyItem) {
            agencyItem = agencyItemRefresh;
            refreshFromAPI(then);
        }
    };

    this.Show = function (agencyItemShow) {
        if (agencyItemShow != agencyItem) { agencyItem = agencyItemShow; refreshFromAPI(); }
        assetListEditor.ShowHide(true);
    };

    this.RemoveAllItems = function () {
        agencyItem = undefined;
        assetListEditor.RemoveAllItems();
    };

    this.Hide = function () { assetListEditor.ShowHide(false); };

    //function compareContent(a, b) { return 0; }

    function prepareSpareContent(content, forItem) { return content; }

    function onContentBecameSpare(content, prevItem) { }

    function updateContentForItem(item) {
        var content = assetListEditor.GetContentFromItem(item);
        if (!!content) {
            var itemData = item.GetData();
            var titleStr = tf.GTFS.GetStopSequenceTitle(itemData);
            content.title.GetHTMLElement().innerHTML = titleStr;
        }
    };

    function onItemClick(notification) {
        var button = !!notification ? notification.domObj : undefined;
        if (!!button) {
            assetListEditor.OnContentSelectToggle(button.content);
        }
    };

    function createNewContent(forItem) {
        var theTLF = theThis.GetTLF().Get();
        var itemData = forItem.GetData();
        var appContent = settings.appContent;
        var classNames = settings.cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: classNames.itemWrapperClassName });
        var contentWrapper = new tf.dom.Div({ cssClass: classNames.itemContentWrapperClassName });
        var title = new tf.dom.Div({ cssClass: classNames.itemTitleClassName });
        var itemButton = new tf.dom.Button({ cssClass: classNames.itemButtonClassName, onClick: onItemClick });
        var content = { itemButton: itemButton, wrapper: wrapper, contentWrapper: contentWrapper, title: title };

        contentWrapper.AddContent(title);
        wrapper.AddContent(itemButton, contentWrapper);
        itemButton.content = content;

        return content;
    };

    function refreshFromAPI(then) {
        var ad = agencyItem.GetData(), layer = assetListEditor.GetLayer();
        assetListEditor.RemoveAllItems();
        assetListEditor.ShowEditorLoadingToast();
        settings.apiClient.DesignStopSequencesPost(
            function (results) {
                var isOK = false;
                if (results.responseJSON) {
                    if (results.responseJSON.ok) {
                        var newData = results.responseJSON.result;
                        /*var routesListEditor = settings.getEditor("routes");
                        var routesAssetListEditor = routesListEditor.GetAssetListEditor();
                        var kl = routesAssetListEditor.GetKL();
                        for (var i in newData) {
                            var stopSeqData = newData[i], routeId = stopSeqData.route_id;
                            var routeItem = kl.GetItem(routeId);
                            var routeItemData = routeItem ? routeItem.GetData() : undefined;
                            stopSeqData.routeIdInAgency = routeItemData ? routeItemData.route_id : undefined;
                        }*/
                        assetListEditor.UpdateFromNewData(newData); isOK = true;
                    }
                }
                if (!isOK) { console.log('stopSequences api call failed'); }
                assetListEditor.CloseEditorLoadingToast();
            if (then) { then({ sender: theThis }); }
            }, { id: ad.id, decodeData: true });
    };

    function getStopSequenceStyles() {
        function getStyle(keyedFeature, mapFeature) {
            var item = assetListEditor.GetItemFromMapFeature(mapFeature);
            if (item) {
                var itemData = item.GetData();
                var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
                var isAerial = appContent.GetIsShowingAerial();
                var isHover = mapFeature.GetIsDisplayingInHover();
                var zindex = 3, line_width = 2;
                var line_color = '#' + itemData.stopSequence_color;
                var style = { line: true, line_color: line_color, line_width: line_width, line_opacity: 100, zindex: zindex, snaptopixel: false };
                var hoverStyle = [
                    { line: true, line_color: "#ffaaaa", line_width: line_width + 16, line_opacity: 50, zindex: zindex - 1, snaptopixel: false },
                    { line: true, line_color: line_color, line_width: line_width + 0, line_opacity: 100, zindex: zindex + 1, snaptopixel: false }
                ];
                return isHover ? hoverStyle : style;
            }
            else {
                console.log('stopSequence item is not defined');
            }
        }
        return { style: getStyle, hoverStyle: getStyle };
    };

    function getToolTip(notification) { return tf.GTFS.GetStopSequenceTitle(assetListEditor.GetItemFromMapFeature(notification.mapFeature).GetData()); };

    function onClickMapFeature(notification) { console.log('stopSequence map feature clicked'); };

    function onKLChange(notification) {
        //console.log('stopSequences KL change notification received');
    };

    function initialize() {
        var stopSequenceShapeLayerName = "stopSequenceShapes";
        var stopSequenceStopsLayerName = "stopSequenceStops";
        assetListEditor = new tf.GTFS.AssetListEditor(tf.js.ShallowMerge(settings, {
            editor: theThis,
            TLF: theThis.GetTLF(),
            //onRemoveAllItems: function () { agencyItem = undefined; },
            attachedSelectedContentType: tf.GTFS.StopSequencesSelectedContent,
            createNewContent: createNewContent,
            prepareSpareContent: prepareSpareContent,
            onContentBecameSpare: onContentBecameSpare,
            updateContentForItem: updateContentForItem,
            //compareContent: compareContent,
            itemNameSingle: "stop sequence",
            itemNamePlural: "stop sequences",
            assetName: "stop sequences",
            contentInItemAttributeName: "stopSequenceContent",
            itemInContentAttributeName: "stopSequenceItem",
            onKLChange: onKLChange,
            createLayer: true,
            useClusters: false,
            additionalLayers: [{
                name: stopSequenceStopsLayerName,
                useClusters: false,
                use3D: false
            }]
        }));
        assetListEditor.GetAttachedSelectedContent().SetLayers(
            assetListEditor.GetAdditionalLayer(stopSequenceStopsLayerName)
        );
    };

    initialize();
};
