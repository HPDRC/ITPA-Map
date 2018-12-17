"use strict";

tf.GTFS.TripTimesMapFeatures = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.TripTimesMapFeatures)) { return new tf.GTFS.TripTimesMapFeatures(settings); }
    var curTripItem;
    var getTripStopTimesAndShapes;

    this.SetGetStopTimesAndShapes = function (getTripStopTimesAndShapesSet) {
        getTripStopTimesAndShapes = getTripStopTimesAndShapesSet;
    };

    this.Show = function (show) { settings.layer.SetVisible(show); };

    this.SetTrip = function (newTripItem) {
        if (newTripItem != curTripItem) {
            removeMapFeatures();
            if (curTripItem = newTripItem) {
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

        if (curTripItem && getTripStopTimesAndShapes) {
            var tripStopTimesAndShapes = getTripStopTimesAndShapes();
            var tripStopTimes = tripStopTimesAndShapes.stopTimes;
            if (tripStopTimes) {
                var ctid = curTripItem.GetData();
                var stopTimesId = ctid.stimes_id;
                var st = tripStopTimes[stopTimesId];
                if (st != undefined) {
                    var aho = st.arrival_hms_offsets;
                    var stop_arrival_hms = aho[stopIndex] + ctid.start_hms;
                    var hms = tf.js.TranslateHourMinSec(stop_arrival_hms);

                    label += ' - ' + hms.HMS;
                }
            }
        }

        if (isHover) {
            label += ' - ' + tf.GTFS.GetStopTitle(stopItemData);
            style = {
                marker: true, label: label, zindex: 10, font_height: font_height, line_opacity: 50, snaptopixel: false, border_width: stopInSeqBorderWidth,
                marker_horpos: "center",
                marker_verpos: "bottom"
            };
        }
        else {
            style = {
                opacity: opacity, marker: true, label: label, zindex: zindex, marker_color: marker_color, font_color: font_color,
                font_height: font_height, line_color: line_color, line_width: 1, line_opacity: 50, snaptopixel: false, border_width: stopInSeqBorderWidth,
                marker_horpos: "center",
                marker_verpos: "bottom"
            };
        }
        return style;
    };

    function onClick(notification) {
        //console.log('clicked stop sequence stop feature');
        if (settings.onClick) { settings.onClick(notification); }
    };

    function createMapFeatureForTime(stopItem, stopIndex, nStops) {
        var stopItemData = stopItem.GetData();
        var featureSettings = { type: 'point', coordinates: [stopItemData.stop_lon, stopItemData.stop_lat], style: getStopStyle, hoverStyle: getStopStyle };
        var itemSettings = { sender: theThis, stopItem: stopItem, stopItemData: stopItemData, stopIndex: stopIndex, nStops: nStops };
        return new tf.map.Feature(tf.js.ShallowMerge(featureSettings, itemSettings, { onCustomAppClick: onClick }));
    };

    function addMapFeatures() {
        if (curTripItem) {
            var tripItemData = curTripItem.GetData();
            var stopSequencesListEditor = settings.getEditor("stop_sequences");
            var ssqkl = stopSequencesListEditor.GetAssetListEditor().GetKL();
            var stopSequenceItem = ssqkl.GetItem(tripItemData.sseq_id);
            if (stopSequenceItem) {
                var ssqData = stopSequenceItem.GetData();
                var stopIds = ssqData.stop_ids, nStops = ssqData.stop_count;
                var stopsListEditor = settings.getEditor("stops");
                var stopskl = stopsListEditor.GetAssetListEditor().GetKL();
                for (var i = 0; i < nStops; ++i) {
                    var stopId = stopIds[i];
                    var stopItem = stopskl.GetItem(stopId);
                    if (stopItem) {
                        var mapFeature = createMapFeatureForTime(stopItem, i, nStops);
                        settings.layer.AddMapFeature(mapFeature, true);
                    }
                }
                settings.layer.AddWithheldFeatures();
            }
        }
    };

    function removeMapFeatures() {
        if (curTripItem) {
            curTripItem = undefined;
            settings.layer.RemoveAllFeatures();
        }
    };

    function initialize() {

    };

    initialize();
};

tf.GTFS.TripsSelectedContent = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.TripsSelectedContent)) { return new tf.GTFS.TripsSelectedContent(settings); }
    var myI, allContent;
    var tripShapesLayer;
    var tripTimesLayer, tripTimesMapFeatures;

    this.SetGetStopTimesAndShapes = function (getTripStopTimesAndShapes) {
        tripTimesMapFeatures.SetGetStopTimesAndShapes(getTripStopTimesAndShapes);
    };

    this.SetLayers = function (tripShapesLayerSet, tripTimesLayerSet) {
        tripShapesLayer = tripShapesLayerSet;
        tripTimesLayer = tripTimesLayerSet;
        tripTimesMapFeatures = tf.GTFS.TripTimesMapFeatures(tf.js.ShallowMerge(settings, { layer: tripTimesLayer, onClick: onClickTripTimesFeature }));
    };

    function onClickTripTimesFeature(notification) {
        console.log('clicked trip times map feature');
        /*var mapFeature = notification.mapFeature, mapFeatureSettings = mapFeature.GetSettings();
        var stopItem = mapFeatureSettings.stopItem;
        var stopsListEditor = settings.getEditor("stops");
        var stopsAssetListEditor = stopsListEditor.GetAssetListEditor();
        stopsAssetListEditor.SetSelectedItem(stopItem);
        settings.checkSetCurrentEditor(stopsListEditor);*/
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

    function translateBikesAllowed(itemData) {
        var arrayToUse = tf.GTFS.TripBikesAllowedArray;
        var bikesAllowed = arrayToUse[itemData.bikes_allowed];
        if (!bikesAllowed) { bikesAllowed = "invalid bikes allowed value"; }
        else { bikesAllowed = itemData.bikes_allowed + ' - ' + bikesAllowed.desc; }
        return bikesAllowed;
    };

    function translateWheelchairAccessible(itemData) {
        var arrayToUse = tf.GTFS.TripWheelChairAccessibleArray;
        var wheelchairAccessible = arrayToUse[itemData.wheelchair_accessible];
        if (!wheelchairAccessible) { wheelchairAccessible = "invalid wheelchair accessibility"; }
        else { wheelchairAccessible = itemData.wheelchair_accessible + ' - ' + wheelchairAccessible.desc; }
        return wheelchairAccessible;
    };

    function createControl() {
        allContent = theThis.GetAllContent();
        var tripItemAttributes = {
            //"route_id": { desc: "the route to which this trip belongs" },
            "trip_id": { desc: "uniquely identifies the trip within its agency" },
            //"service_id": { desc: "determines calendar date availability of the trip" },
            "trip_headsign": { desc: "trip headsign displayed to riders" },
            "trip_short_name": { desc: "optional trip name" },
            //"direction_id": { desc: "trip direction within its route" },
            //"block_id": { desc: "optional block to which the trip belongs" },
            "shape_id": { desc: "optional shape of the trip" },
            "wheelchair_accessible": { desc: "optional information about wheelchair accessibility on the trip", translateData: translateWheelchairAccessible },
            "bikes_allowed": { desc: "optional information about bicycle accomodations on the trip", translateData: translateBikesAllowed }
        };
        (allContent.attributesListEditor = tf.GTFS.AttributesListEditor(tf.js.ShallowMerge(settings, { itemAttributes: tripItemAttributes }))).Show(true);
        allContent.wrapper.InsertContentAfter(allContent.attributesListEditor.GetAllContent().wrapper, allContent.titleWrapper);
    }

    function getVerbs() {
        var verbs = {};
        return verbs;
    };

    function onContentChange() {
        var currentContent = theThis.GetCurrentContent();
        var item = settings.getItemFromContent(currentContent);
        if (!!item) {
            var buttons = allContent.buttons;
            var itemData = item.GetData();
            allContent.attributesListEditor.UpdateContent(itemData);
            tripTimesMapFeatures.SetTrip(item);
            var stopSequencesListEditor = settings.getEditor("stop_sequences");
            var stopSequencesAssetListEditor = stopSequencesListEditor.GetAssetListEditor();
            var ssqkl = stopSequencesAssetListEditor.GetKL();
            var stopSequenceItem = ssqkl.GetItem(itemData.sseq_id);
            if (stopSequenceItem) {
                stopSequencesAssetListEditor.SetSelectedItem(stopSequenceItem, true, true);
            }
        }
    };

    function onAttachDetach(notification) {
        //if (!notification.isAttached) { hideDirectionShape(); }
        tripTimesMapFeatures.Show(notification.isAttached);
    };

    function initialize() {
        tf.GTFS.ListSelectedContent.call(theThis, tf.js.ShallowMerge(settings, {
            verbs: getVerbs(), onModify: onModify, setInterface: function (theInterface) { myI = theInterface; }, onContentChange: onContentChange,
            onAttachDetach: onAttachDetach
        }));
        createControl();
        theThis.GetAllContent = function () { return allContent; };
    }
    initialize();
};
tf.js.InheritFrom(tf.GTFS.TripsSelectedContent, tf.GTFS.ListSelectedContent);

tf.GTFS.TripsListEditor = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.TripsListEditor)) { return new tf.GTFS.TripsListEditor(settings); }
    var assetListEditor, agencyItem;
    var routesMultiSelectControl;
    var tripShapes, tripStopTimes;

    this.GetAssetListEditor = function () { return assetListEditor; };

    this.GetTLF = function () { return settings.TLF; };

    this.RefreshForAgency = function (agencyItemRefresh, then) {
        if (agencyItemRefresh != agencyItem) {
            agencyItem = agencyItemRefresh;
            resetShapesAndStopTimes();
            refreshFromAPI(then);
        }
    };

    this.Show = function (agencyItemShow) {
        if (agencyItemShow != agencyItem) { agencyItem = agencyItemShow; refreshFromAPI(); }
        showHide(true);
    };

    this.RemoveAllItems = function () {
        agencyItem = undefined;
        assetListEditor.RemoveAllItems();
    };

    this.Hide = function () { showHide(false); };

    function showHide(show) {
        assetListEditor.ShowHide(show);
        routesMultiSelectControl.Show(show);
        //console.log('trips are ' + show);
    };

    function compareContent(a, b) {
        //console.log('comparing');
        var da = a.itemData;
        var db = b.itemData;
        return da.start_hms - db.start_hms;
        //return 0;
    };

    function prepareSpareContent(content, forItem) { return content; }

    function onContentBecameSpare(content, prevItem) { }

    function getTripName(tripItemData) {
        var tripName;
        if (tripItemData.trip_short_name) {
            tripName = tripItemData.trip_short_name;
            if (tripItemData.trip_headsign) { tripName += ' ' + tripItemData.trip_headsign; }
        }
        else if (tripItemData.trip_headsign) { tripName = tripItemData.trip_headsign; }
        else { tripName = 'unnamed trip'; }
        return tripName;
    };

    function getTripTitle(tripItemData) { return tripItemData.trip_id + ' - ' + getTripName(tripItemData); };

    function updateContentForItem(item) {
        var content = assetListEditor.GetContentFromItem(item);
        if (!!content) {
            var itemData = item.GetData();
            var titleStr = getTripTitle(itemData);
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

    /*
{
  "id": 1, "prefix": "MDT", "tripIds": [1], "tripIdsInAgency": ["001"], "routeId": 1,"routeIdInAgency": "001","routeTypeList": [3],"routeDirectionId": 1,"serviceIds": [1],
  "serviceIdsInAgency": ["001"],
  "stopSequenceId": 1,"stopIds": [1],
  "stopIdsInAgency": ["001"],
  "onDate": "20170904",
  "minStartHMS": 3600,
  "maxStartHMS": 3600,
  "minEndHMS": 3600,
  "maxEndHMS": 3600,
  "includeStopSequences": false,
  "includeStopTimes": false,
  "includeStopDistances": false,
  "includeStops": false,
  "includeRoutes": false,
  "includeShapes": false,
  "includeOriginal": false,
  "excludeSimplified": false,
  "decodeData": false,
  "returnGeoJSON": false
}    */

    function resetShapesAndStopTimes() {
        tripShapes = {};
        tripStopTimes = {};
    };

    function refreshFromAPI(then) {
        var ad = agencyItem.GetData(), layer = assetListEditor.GetLayer();
        var selections = routesMultiSelectControl.GetSelections();

        if (!!selections.routeItem) {
            var formData = {
                id: ad.id,
                includeStopTimes: true, includeStopSequences: false, includeShapes: true, decodeData: true
            };
            formData.routeId = selections.routeItem.GetData().id;
            if (selections.serviceItem) { formData.serviceIds = [selections.serviceItem.GetData().id]; }
            if (selections.routeDirectionId !== undefined) { formData.routeDirectionId = selections.routeDirectionId; }
            if (selections.routeStopSequenceItem) { formData.stopSequenceId = selections.routeStopSequenceItem.GetData().id; }
            assetListEditor.RemoveAllItems();
            assetListEditor.ShowEditorLoadingToast();
            settings.apiClient.DesignTripsPost(
                function (results) {
                    var isOK = false;
                    if (results.responseJSON) {
                        if (results.responseJSON.ok) {
                            var result = results.responseJSON.result;
                            for (var i in result.stopTimes) { var r = result.stopTimes[i]; var rid = r.id; tripStopTimes[rid + ''] = r; }
                            for (var i in result.shapes) { var r = result.shapes[i]; var rid = r.id; tripShapes[rid + ''] = r; }
                            assetListEditor.UpdateFromNewData(result.trips); isOK = true;
                        }
                    }
                    if (!isOK) { console.log('trips api call failed'); }
                    assetListEditor.CloseEditorLoadingToast();
                    if (then) { then({ sender: theThis }); }
                }, formData);
        }
    };

    function getToolTip(notification) { return getTripTitle(assetListEditor.GetItemFromMapFeature(notification.mapFeature).GetData()); };

    function onKLChange(notification) {
        //console.log('trips KL change notification received');
    };

    function onRoutesChange(notification) {
        refreshFromAPI();
    };

    function getTripStopTimesAndShapes() { return { stopTimes: tripStopTimes, shapes: tripShapes }; }

    function initialize() {
        var TLF = theThis.GetTLF();
        var topToolBar = TLF.Get().topToolBar;
        var tripShapesLayerName = "tripShapes";
        var tripTimesLayerName = "tripTimes";
        resetShapesAndStopTimes();
        assetListEditor = new tf.GTFS.AssetListEditor(tf.js.ShallowMerge(settings, {
            editor: theThis,
            TLF: TLF,
            //onRemoveAllItems: function () { agencyItem = undefined; },
            attachedSelectedContentType: tf.GTFS.TripsSelectedContent,
            createNewContent: createNewContent,
            prepareSpareContent: prepareSpareContent,
            onContentBecameSpare: onContentBecameSpare,
            updateContentForItem: updateContentForItem,
            compareContent: compareContent,
            itemNameSingle: "trip",
            itemNamePlural: "trips",
            assetName: "trips",
            contentInItemAttributeName: "tripContent",
            itemInContentAttributeName: "tripItem",
            onKLChange: onKLChange,
            createLayer: false,
            useClusters: false,
            additionalLayers: [{
                name: tripShapesLayerName,
                useClusters: false,
                use3D: false
            }, {
                name: tripTimesLayerName,
                useClusters: false,
                use3D: false
            }]
        }));
        routesMultiSelectControl = tf.GTFS.RoutesMultiSelectControl(tf.js.ShallowMerge(settings, {
            routesTitle: "Select<br/>Route", servicesTitle: "Select<br/>Service", stopSequencesTitle: "Select<br/>Sequence",
            onChange: onRoutesChange
        }));
        assetListEditor.GetTopToolBar().AddContent(routesMultiSelectControl.GetAllContent().wrapper);
        var attachedSelectedContent = assetListEditor.GetAttachedSelectedContent();
        attachedSelectedContent.SetLayers(
            assetListEditor.GetAdditionalLayer(tripShapesLayerName),
            assetListEditor.GetAdditionalLayer(tripTimesLayerName)
        );
        attachedSelectedContent.SetGetStopTimesAndShapes(getTripStopTimesAndShapes);
    };

    initialize();
};
