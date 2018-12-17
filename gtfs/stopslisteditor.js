"use strict";

tf.GTFS.GetStopName = function(stopItemData) { return stopItemData.stop_name ? stopItemData.stop_name : 'unnamed stop'; };

tf.GTFS.GetStopTitle = function(stopItemData) { return stopItemData.stop_id + ' - ' + tf.GTFS.GetStopName(stopItemData); };

tf.GTFS.StopsSelectedContent = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.StopsSelectedContent)) { return new tf.GTFS.StopsSelectedContent(settings); }
    var myI, allContent;

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

    function translateLocationType(itemData) {
        var locationType = tf.GTFS.StopLocationTypesArray[itemData.location_type];
        if (!locationType) { locationType = "invalid location type"; }
        else { locationType = itemData.location_type + ' - ' + locationType.name + ' (' + locationType.desc + ')'; }
        return locationType;
    };

    function translateWheelchairBoarding(itemData) {
        var arrayToUse = itemData.location_type == 0 && !!itemData.parent_station ? tf.GTFS.StopInStationWheelChairBordingArray : tf.GTFS.StopWheelChairBordingArray;
        var wheelchairBoarding = arrayToUse[itemData.wheelchair_boarding];
        if (!wheelchairBoarding) { wheelchairBoarding = "invalid wheelchair boarding"; }
        else { wheelchairBoarding = itemData.location_type + ' - ' + wheelchairBoarding.desc; }
        return wheelchairBoarding;
    };

    function createControl() {
        allContent = theThis.GetAllContent();
        var stopItemAttributes = {
            "stop_id": { desc: "uniquely identifies the stop" },
            "stop_code": { desc: "optional short text or number for display" },
            "stop_name": { desc: "the name of the stop in local and tourist vernacular" },
            "stop_desc": { desc: "optional detailed description of the stop" },
            "stop_lat": { desc: "stop latitude coordinate" },
            "stop_lon": { desc: "stop longitude coordinate" },
            "zone_id": { desc: "optional stop zone id, used for fare calculations" },
            "stop_url": { desc: "optional url to stop web page (other than route and agency urls)", type: tf.GTFS.EditorAttributeTypes.url },
            "location_type": { desc: "optional location type (stop or station)", translateData: translateLocationType },
            "parent_station": { desc: "optional parent station id" },
            "stop_timezone": { desc: "optional stop timezone may be different than agency_timezone" },
            "wheelchair_boarding": { desc: "optional information about wheelchair bording availability", translateData: translateWheelchairBoarding }
        };
        (allContent.attributesListEditor = tf.GTFS.AttributesListEditor(tf.js.ShallowMerge(settings, { itemAttributes: stopItemAttributes }))).Show(true);
        allContent.wrapper.InsertContentAfter(allContent.attributesListEditor.GetAllContent().wrapper, allContent.titleWrapper);
    };

    function getVerbs() {
        var verbs = {};
        return verbs;
    };

    function onContentChange() {
        var currentContent = theThis.GetCurrentContent();
        var item = settings.getItemFromContent(currentContent);
        if (!!item) {
            var itemData = item.GetData();
            allContent.attributesListEditor.UpdateContent(itemData);
        }
    };

    function initialize() {
        tf.GTFS.ListSelectedContent.call(theThis, tf.js.ShallowMerge(settings, { verbs: getVerbs(), onModify: onModify, setInterface: function (theInterface) { myI = theInterface; }, onContentChange: onContentChange }));
        createControl();
        theThis.GetAllContent = function () { return allContent; };
    }
    initialize();
};
tf.js.InheritFrom(tf.GTFS.StopsSelectedContent, tf.GTFS.ListSelectedContent);

tf.GTFS.StopsListEditor = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.StopsListEditor)) { return new tf.GTFS.StopsListEditor(settings); }
    var assetListEditor, agencyItem;
    var selectedContent;
    var clusterZIndex;
    var postComposeListener;

    this.GetAssetListEditor = function () { return assetListEditor; };

    this.GetTLF = function () { return settings.TLF; };

    this.RefreshForAgency = function (agencyItemRefresh, then) {
        if (agencyItemRefresh != agencyItem) {
            agencyItem = agencyItemRefresh;
            refreshFromAPI(then);
        }
    };

    this.Show = function (agencyItemShow) {
        if (agencyItemShow != agencyItem) {
            agencyItem = agencyItemShow;
            refreshFromAPI();
        }
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
            content.title.GetHTMLElement().innerHTML = tf.GTFS.GetStopTitle(itemData);
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
        var ad = agencyItem.GetData();
        assetListEditor.RemoveAllItems();
        assetListEditor.ShowEditorLoadingToast();
        settings.apiClient.DesignStopsPost(
            function (results) {
                var isOK = false;
                if (results.responseJSON) { if (results.responseJSON.ok) { assetListEditor.UpdateFromNewData(results.responseJSON.result); isOK = true; } }
                if (!isOK) { console.log('stops api call failed'); }
                assetListEditor.CloseEditorLoadingToast();
                if (then) { then({ sender: theThis }); }
            }, { id: ad.id });
    };

    function getStopStyles() {
        function getStyle(keyedFeature, mapFeature) {
            var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
            var isAerial = appContent.GetIsShowingAerial();
            var isHover = mapFeature.GetIsDisplayingInHover();
            var zindex = 1, line_width = 2;
            var radius = 4;
            var snaptopixel = false;
            var style = {
                snaptopixel: snaptopixel, zindex: zindex++,
                circle: true, circle_radius: radius, line: true, fill: true, fill_color: "#fdfdff", line_color: "#026", line_width: 2, line_opacity: 70, fill_opacity: 50
            };
            return isHover ? tf.js.ShallowMerge(style, { zindex: zindex++, circle_radius: radius + 3, line_color: "#ff0000", line_opacity: 100, fill_color: "#aaaaff" }) : style;
        }
        return { style: getStyle, hoverStyle: getStyle };
    };

    function getToolTip(notification) { return tf.GTFS.GetStopTitle(assetListEditor.GetItemFromMapFeature(notification.mapFeature).GetData()); };

    function onClickMapFeature(notification) { console.log('stop map feature clicked'); };

    function onKLChange(notification) {
        //console.log('stop kl change notification received');
    };

    function getClusterStyle() {
        var ls = tf.TFMap.LayoutSettings;
        return {
            zindex: clusterZIndex, circle: true, circle_radius: ls.clusterCircleRadius, fill: true, fill_color: "#073",
            line: true, line_color: "#fff", line_width: 2, line_opacity: 30
        }
    };

    function onMapPostCompose(notification) {
        var selStop = assetListEditor.GetSelectedMapFeature();
        if (!!selStop) {
            notification.showFeatureImmediately(selStop);
        }
    };

    function initialize() {
        postComposeListener = settings.appContent.GetMap().AddListener(tf.consts.mapPostComposeEvent, onMapPostCompose);
        clusterZIndex = 100;
        assetListEditor = new tf.GTFS.AssetListEditor(tf.js.ShallowMerge(settings, {
            editor: theThis,
            TLF: theThis.GetTLF(),
            //onRemoveAllItems: function () { agencyItem = undefined; },
            attachedSelectedContentType: tf.GTFS.StopsSelectedContent,
            createLayer: true,
            useClusters: true,
            clusterFeatureDistance: 32,
            clusterStyle: getClusterStyle(),
            clusterLabelStyle: {
                font: "600 12px Roboto",
                zindex: clusterZIndex + 1, text: true, fill: true, fill_color: "#fff", line: true, line_opacity: 70, line_color: "#000", line_width: 2
            },
            onKLChange: onKLChange,
            createNewContent: createNewContent,
            prepareSpareContent: prepareSpareContent,
            onContentBecameSpare: onContentBecameSpare,
            updateContentForItem: updateContentForItem,
            //compareContent: compareContent,
            itemNameSingle: "stop",
            itemNamePlural: "stops",
            assetName: "stops",
            contentInItemAttributeName: "stopContent",
            itemInContentAttributeName: "stopItem",
            mapFeaturesSettings: {
                itemDataFieldNameWithCoords: function (itemData) { return [itemData.stop_lon, itemData.stop_lat]; },
                mapFeatureType: "point",
                refreshStyleOnUpdate: false,
                onClick: onClickMapFeature,
                mapFeatureInItemAttributeName: "stopMapFeature",
                itemInMapFeatureAttributeName: "stopItem",
                styles: getStopStyles(),
                toolTipProps: { toolTipText: getToolTip, keepOnHoverOutTarget: true, offsetX: 16 },
                appContent: settings.appContent
            }
        }));
    };

    initialize();
};

