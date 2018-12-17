"use strict";

tf.GTFS.GetRouteSelectedServiceId = function (routeItemData) {
    return routeItemData ? (routeItemData.selectedServiceId !== undefined ? routeItemData.selectedServiceId : undefined) : undefined;
};

tf.GTFS.SetRouteSelectedServiceId = function (routeItemData, selectedServiceId) {
    if (routeItemData) {
        routeItemData.selectedServiceId = routeItemData.serviceIdsMap[selectedServiceId] !== undefined ? selectedServiceId : undefined;
    }
};

tf.GTFS.GetRouteSelectedDirectionIndex = function (routeItemData) {
    return routeItemData ? (routeItemData.selectedDirectionIndex !== undefined ? routeItemData.selectedDirectionIndex : undefined) : undefined;
};

tf.GTFS.SetRouteSelectedDirectionIndex = function (routeItemData, selectedDirectionIndex) {
    if (routeItemData) {
        routeItemData.selectedDirectionIndex = selectedDirectionIndex;
    }
};

tf.GTFS.GetRouteSelectedStopSequenceId = function (routeItemData) {
    return routeItemData ? (routeItemData.selectedStopSequenceId !== undefined ? routeItemData.selectedStopSequenceId : undefined) : undefined;
};

tf.GTFS.SetRouteSelectedStopSequenceId = function (routeItemData, selectedStopSequenceId) {
    if (routeItemData) {
        routeItemData.selectedStopSequenceId = routeItemData.stopSequenceIdsMap[selectedStopSequenceId] !== undefined ? selectedStopSequenceId : undefined;
    }
};

tf.GTFS.GetRouteName = function(routeItemData) {
    var routeName;
    if (routeItemData.route_short_name) {
        routeName = routeItemData.route_short_name;
        if (routeItemData.route_long_name) { routeName += ' ' + routeItemData.route_long_name }
    }
    else if (routeItemData.route_long_name) { routeName = routeItemData.route_long_name; }
    else { routeName = 'unnamed route'; }
    return routeName;
};

tf.GTFS.GetRouteTitle = function(routeItemData) { return routeItemData.route_id + ' - ' + tf.GTFS.GetRouteName(routeItemData); };

tf.GTFS.RouteDirectionsButtons = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.RouteDirectionsButtons)) { return new tf.GTFS.RouteDirectionsButtons(settings); }
    var allContent, verbs;
    var dir0Name, dir1Name;
    var gtfsDirectionMap;
    var gtfsDirectionArray;
    var currentRouteItem;

    this.GetRouteDirectionToolTip = function (notification) {
        var toolTip = "direction";
        if (currentRouteItem) {
            var itemData = currentRouteItem.GetData();
            toolTip = itemData.directions[itemData.selectedDirectionIndex].gtfs_direction_name + " " + toolTip;
        }
        return toolTip;
    };

    this.GetVerbs = function () { return verbs; }

    this.SetRouteItem = function (newRouteItem) { currentRouteItem = newRouteItem; onContentChange(); };

    this.GetSelectedDirectionIndex = function () { return currentRouteItem ? tf.GTFS.GetRouteSelectedDirectionIndex(currentRouteItem.GetData()) : undefined; };

    this.GetSelectedGTFSDirectionIndex = function () {
        var gtfsDirectionIndex = currentRouteItem ? tf.GTFS.GetRouteSelectedDirectionIndex(currentRouteItem.GetData()) : undefined;
        if (gtfsDirectionIndex !== undefined) {
            gtfsDirectionIndex = gtfsDirectionArray[gtfsDirectionIndex];
        }
        return gtfsDirectionIndex;
    };

    this.SetAllContent = function (newAllContent) { allContent = newAllContent; };

    this.GetAllContent = function () { return allContent; }

    this.GetDirectionButton = function (dirName) { return allContent.buttons[dirName]; }

    this.ShowDirectionIndex = function (directionIndex, dontHideSame) { showDirectionIndex(directionIndex, dontHideSame); };

    this.ShowGTFSDirectionIndex = function (gtfsDirectionIndex, dontHideSame) {
        theThis.ShowDirectionIndex(gtfsDirectionMap[gtfsDirectionIndex], dontHideSame);
    };

    this.UpdateFromRouteItem = function () {
        onContentChange(true);
    };

    function onContentChange(skipNotify) {
        var buttons = allContent.buttons;
        var item = currentRouteItem;
        var itemData = item ? item.GetData() : undefined;
        var directions = itemData ? itemData.directions : undefined;
        var nDirections = directions ? directions.length : 0;
        var b0 = buttons[dir0Name].button.GetButton(), b0s = b0.style;
        var b1 = buttons[dir1Name].button.GetButton(), b1s = b1.style;
        var selectedDirectionIndex = theThis.GetSelectedDirectionIndex();
        b0s.display = nDirections > 0 ? "inline-block" : "none";
        b1s.display = nDirections > 1 ? "inline-block" : "none";
        if (nDirections > 0) {
            b0.innerHTML = directions[0].gtfs_direction_name;
            gtfsDirectionMap['' + directions[0].gtfs_direction] = 0;
            gtfsDirectionArray[0] = directions[0].gtfs_direction;
            if (nDirections > 1) {
                gtfsDirectionMap['' + directions[1].gtfs_direction] = 1;
                gtfsDirectionArray[1] = directions[1].gtfs_direction;
                b1.innerHTML = directions[1].gtfs_direction_name;
            }
        }
        setSelectedStyleToButtonDirName(dir0Name, selectedDirectionIndex == 0);
        setSelectedStyleToButtonDirName(dir1Name, selectedDirectionIndex == 1);
        if (!skipNotify) {
            if (!settings.noNotifyOnContentChange) {
                notifyChange();
            }
        }
    };

    function setItemSelectedDirectionIndex(item, index) { if (!!item) { tf.GTFS.SetRouteSelectedDirectionIndex(item.GetData(), index); } };
    function setCurrentItemSelectedDirectionIndex(index) { setItemSelectedDirectionIndex(currentRouteItem, index); };

    function notifyChange(options) { if (settings.onChange) { settings.onChange(tf.js.ShallowMerge({ sender: theThis }, options)); } };

    function setSelectedStyleToButton(button, isSelected) {
        var b = button.button.GetButton(), bs = b.style;
        bs.backgroundColor = isSelected ? "navajowhite" : "white";
    };

    function setSelectedStyleToButtonDirName(dirName, isSelected) { setSelectedStyleToButton(theThis.GetDirectionButton(dirName), isSelected); };

    function hideDirectionShape(isHiding, isShowing) {
        var selectedDirectionIndex = theThis.GetSelectedDirectionIndex();
        if (selectedDirectionIndex !== undefined) {
            console.log('hiding direction index: ' + selectedDirectionIndex);
            setSelectedStyleToButtonDirName(selectedDirectionIndex == 0 ? dir0Name : dir1Name, false);
            setCurrentItemSelectedDirectionIndex(undefined);
            notifyChange({ isHiding: isHiding, isShowing: isShowing });
        }
    };

    function showDirectionIndex(index, dontHideSame) {
        var selectedDirectionIndex = theThis.GetSelectedDirectionIndex();
        if (selectedDirectionIndex !== index) {
            var item = currentRouteItem;
            hideDirectionShape(!item || index === undefined, false);
            if (!!item) {
                var itemData = item.GetData();
                if (index !== undefined) {
                    var directions = itemData.directions;
                    var nDirections = directions ? directions.length : 0;
                    if (index < nDirections) {
                        //console.log('selecting direction index: ' + index);
                        setCurrentItemSelectedDirectionIndex(selectedDirectionIndex = index);
                        setSelectedStyleToButtonDirName(selectedDirectionIndex == 0 ? dir0Name : dir1Name, true);
                        notifyChange({ isHiding: false, isShowing: true });
                    }
                    else {
                        console.log('trying to select invalid direction index: ' + index);
                    }
                }
                else {
                    //console.log('hiding direction case 2');
                    setCurrentItemSelectedDirectionIndex(undefined);
                }
            }
        }
        else if(!dontHideSame) {
            //console.log('hiding direction case 1');
            hideDirectionShape(true, false);
            setCurrentItemSelectedDirectionIndex(undefined);
        }
    };

    function onDirection0() { showDirectionIndex(0); };
    function onDirection1() { showDirectionIndex(1); };

    function setVerbs() {
        verbs = {};
        var showOrHideRouteDirectionToolTip = tf.js.GetNonEmptyString(settings.toolTip, "Show or hide this route direction");
        verbs[dir0Name] = { text: "Direction 0", toolTip: showOrHideRouteDirectionToolTip, onClick: onDirection0, isAdmin: false };
        verbs[dir1Name] = { text: "Direction 1", toolTip: showOrHideRouteDirectionToolTip, onClick: onDirection1, isAdmin: false };
    };

    function initialize() {
        dir0Name = "dir0";
        dir1Name = "dir1";
        gtfsDirectionMap = {};
        gtfsDirectionMap[dir0Name] = 0;
        gtfsDirectionMap[dir1Name] = 1;
        gtfsDirectionArray = [0, 1];
        setVerbs();
    };

    initialize();
};

tf.GTFS.RoutesSelectControl = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.RoutesSelectControl)) { return new tf.GTFS.RoutesSelectControl(settings); }

    function getOption(item) {
        var value, id, innerHTML;
        var itemData = !!item ? item.GetData() : undefined;
        if (itemData) { id = itemData.id; value = '' + id; innerHTML = tf.GTFS.GetRouteTitle(itemData); }
        return { value: value, id: id, innerHTML: innerHTML };
    };

    function getValue(item) { return getOption(item).value; };

    function onSelect(notification) {
        if (settings.onSelect) { settings.onSelect(notification); }
    };

    function initialize() {
        var listEditor = settings.getEditor("routes");
        var kl = listEditor.GetAssetListEditor().GetKL();
        tf.GTFS.AssetSelectControl.call(theThis, tf.js.ShallowMerge(settings, {
            KL: kl, getOption: getOption, getValue: function (item) { return getOption(item).value; }, onSelect: onSelect,
            listEditor: listEditor
        }));
    };

    initialize();
};
tf.js.InheritFrom(tf.GTFS.RoutesSelectControl, tf.GTFS.AssetSelectControl);

tf.GTFS.RoutesMultiSelectControl = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.RoutesMultiSelectControl)) { return new tf.GTFS.RoutesMultiSelectControl(settings); }
    var allContent;

    this.GetAllContent = function () { return allContent; }

    this.GetSelections = function () {
        return {
            routeItem: allContent.routesSelectControl.GetSelectedItem(),
            routeDirectionId: allContent.directionButtons.GetSelectedDirectionIndex(),
            serviceItem: allContent.servicesSelectControl.GetSelectedItem(),
            routeStopSequenceItem: allContent.stopSequencesSelectControl.GetSelectedItem()
        };
    };

    this.Show = function (show) {
        if (show) { selectCurrentRoute(); }
        allContent.wrapper.GetHTMLElement().style.display = !!show ? "block" : "none";
    };

    this.SelectRoute = function (routeItem, fromUserControl) {
        var routeItemData = routeItem ? routeItem.GetData() : undefined;
        var serviceIds = routeItemData ? routeItemData.serviceIds : [];
        var stopSequenceIds = routeItemData ? routeItemData.stopSequenceIds : [];
        var servicesControl = allContent.servicesSelectControl;
        var stopSequencesSelectControl = allContent.stopSequencesSelectControl;

        servicesControl.SetFilter(serviceIds);
        var routeSelectedServiceId = tf.GTFS.GetRouteSelectedServiceId(routeItemData);
        if (routeSelectedServiceId !== undefined) { servicesControl.SetSelectedItem(servicesControl.GetKL().GetItem(routeSelectedServiceId)); } else { servicesControl.SetDefaultOption(); }

        stopSequencesSelectControl.SetFilter(stopSequenceIds);
        var routeSelectedStopSequenceId = tf.GTFS.GetRouteSelectedStopSequenceId(routeItemData);
        if (routeSelectedStopSequenceId !== undefined) { stopSequencesSelectControl.SetSelectedItem(stopSequencesSelectControl.GetKL().GetItem(routeSelectedStopSequenceId)); } else { stopSequencesSelectControl.SetDefaultOption(); }

        if (!fromUserControl) { allContent.routesSelectControl.SetSelectedItem(routeItem); }
        allContent.directionButtons.SetRouteItem(routeItem);
        notifyChange();
    };

    function selectCurrentRoute() {
        var routesListEditor = settings.getEditor("routes");
        var routesAssetListEditor = routesListEditor.GetAssetListEditor();
        var currentRoute = routesAssetListEditor.GetSelectedItem();
        var needSelectRoute;
        if (currentRoute === undefined) { currentRoute = routesAssetListEditor.SelectFirstItem(); needSelectRoute = true; }
        if (!needSelectRoute) {
            if (currentRoute !== allContent.routesSelectControl.GetSelectedItem()) { needSelectRoute = true; }
        }
        if (!needSelectRoute) {
            if (currentRoute !== undefined) {
                var currentRouteData = currentRoute.GetData();
                var routeSelectedDirectionIndex = tf.GTFS.GetRouteSelectedDirectionIndex(currentRouteData);
                var directionButtonsSelectedDirectionIndex = allContent.directionButtons.GetSelectedDirectionIndex();
                needSelectRoute = routeSelectedDirectionIndex != directionButtonsSelectedDirectionIndex;
                if (!needSelectRoute) {
                    var stopSequenceItem = allContent.stopSequencesSelectControl.GetSelectedItem();
                    if (stopSequenceItem) {
                        var stopSequenceItemData = stopSequenceItem.GetData();
                        if (allContent.directionButtons.GetSelectedGTFSDirectionIndex() !== stopSequenceItemData.gtfs_direction) {
                            tf.GTFS.SetRouteSelectedStopSequenceId(currentRouteData, undefined);
                            needSelectRoute = true;
                        }
                    }
                }
            }
        }
        if (needSelectRoute) { theThis.SelectRoute(currentRoute, false); }
    };

    function notifyChange() {
        if (settings.onChange) { settings.onChange({ sender: theThis }) };
    };

    function onRouteSelect(notification) {
        var routeItem = allContent.routesSelectControl.GetSelectedItem();
        return theThis.SelectRoute(routeItem, true);
    };

    function onServiceSelect(notification) {
        var routeItem = allContent.routesSelectControl.GetSelectedItem();
        var routeItemData = routeItem ? routeItem.GetData() : undefined;
        var serviceItem = allContent.servicesSelectControl.GetSelectedItem();
        var serviceItemData = serviceItem ? serviceItem.GetData() : undefined;
        var serviceId = serviceItemData ? serviceItemData.id : undefined;
        tf.GTFS.SetRouteSelectedServiceId(routeItemData, serviceId);
        notifyChange();
    };

    function onStopSequencesSelect(notification) {
        var routeItem = allContent.routesSelectControl.GetSelectedItem();
        var routeItemData = routeItem ? routeItem.GetData() : undefined;
        var stopSequenceItem = allContent.stopSequencesSelectControl.GetSelectedItem();
        var stopSequenceItemData = stopSequenceItem ? stopSequenceItem.GetData() : undefined;
        var stopSequenceId = stopSequenceItemData ? stopSequenceItemData.id : undefined;
        tf.GTFS.SetRouteSelectedStopSequenceId(routeItemData, stopSequenceId);
        if (stopSequenceItemData) {
            if (allContent.directionButtons.GetSelectedGTFSDirectionIndex() !== stopSequenceItemData.gtfs_direction) {
                allContent.directionButtons.ShowGTFSDirectionIndex(stopSequenceItemData.gtfs_direction, true);
            }
            else { notifyChange(); }
        }
        else { notifyChange(); }
    };

    function updateEditorRouteDirections(notification) {
        settings.getEditor("routes").UpdateCurrentRouteDirections(notification);
    };

    function onRouteDirectionChanged(notification) {
        if (notification.isHiding || notification.isShowing) {
            updateEditorRouteDirections();
            var stopSequenceItem = allContent.stopSequencesSelectControl.GetSelectedItem();
            if (stopSequenceItem) {
                var stopSequenceItemData = stopSequenceItem.GetData();
                if (allContent.directionButtons.GetSelectedGTFSDirectionIndex() !== stopSequenceItemData.gtfs_direction) {
                    allContent.stopSequencesSelectControl.SetDefaultOption();
                }
            };
            notifyChange();
        }
    };

    function createControl() {
        var classNames = settings.cssClasses.GetClassNames();
        allContent = {};
        allContent.wrapper = new tf.dom.Div({ cssClass: classNames.topBotPaddedRowWrapper });
        allContent.routesSelectControl = tf.GTFS.RoutesSelectControl(tf.js.ShallowMerge(settings, { onSelect: onRouteSelect, title: settings.routesTitle, updateListEditor: true }));
        allContent.directionButtons = tf.GTFS.RouteDirectionsButtons(tf.js.ShallowMerge(settings, { onChange: onRouteDirectionChanged, toolTip: "Select direction", noNotifyOnContentChange: true }));
        allContent.directionButtonsRow = tf.GTFS.ButtonRow(tf.js.ShallowMerge(settings, { getVerbs: allContent.directionButtons.GetVerbs, title: "Select direction" }));
        allContent.directionButtons.SetAllContent(allContent.directionButtonsRow.GetAllContent());
        allContent.servicesSelectControl = tf.GTFS.ServicesSelectControl(tf.js.ShallowMerge(settings, { onSelect: onServiceSelect, title: settings.servicesTitle, anyAllTitle: "All scheduled route services", updateListEditor: true }));
        allContent.stopSequencesSelectControl = tf.GTFS.StopSequencesSelectControl(tf.js.ShallowMerge(settings, { onSelect: onStopSequencesSelect, title: settings.stopSequencesTitle, anyAllTitle: "All stop sequences in route", updateListEditor: true }));
        allContent.wrapper.AddContent(allContent.routesSelectControl.GetAllContent().wrapper);
        allContent.wrapper.AddContent(allContent.directionButtonsRow.GetAllContent().wrapper);
        allContent.wrapper.AddContent(allContent.servicesSelectControl.GetAllContent().wrapper);
        allContent.wrapper.AddContent(allContent.stopSequencesSelectControl.GetAllContent().wrapper);
        var wrapperE = allContent.wrapper.GetHTMLElement(), wrapperES = wrapperE.style;
        wrapperES.backgroundColor = "beige";
        theThis.Show(false);
    };

    function initialize() {
        createControl();
    };

    initialize();
};

tf.GTFS.RoutesSelectedContent = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.RoutesSelectedContent)) { return new tf.GTFS.RoutesSelectedContent(settings); }
    var myI, allContent;
    var directionShapeLayer, directionShapeFeature;
    
    this.SetDirectionShapeLayer = function (layer) { directionShapeLayer = layer; };
    this.OnRouteDirectionChanged = function (notification) {
        allContent.routeDirectionButtons.UpdateFromRouteItem();
        showHideDirectionShapeOnLayer();
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

    function translateRouteType(itemData) {
        var routeType = tf.GTFS.RouteTypesArray[itemData.route_type];
        if (!routeType) { routeType = "invalid route type"; }
        else { routeType = itemData.route_type + ' - ' + routeType.name + ' (' + routeType.desc + ')'; }
        return routeType;
    };

    function translateRouteDirections(itemData) {
        var routeDirections = itemData.directions;
        var routeDirectionsStr = "";
        for (var i in routeDirections) {
            var rd = routeDirections[i];
            var id = rd.direction_id;
            var name = rd.gtfs_direction_name;
            if (routeDirectionsStr) { routeDirectionsStr += " and "; }
            routeDirectionsStr += id + ': ' + name;
        }
        return routeDirectionsStr;
    };

    function createControl() {
        allContent = theThis.GetAllContent();
        var routeItemAttributes = {
            "agency_id_in_agency": { name: "agency_id", desc: "the agency to which the route belongs" },
            "route_id": { desc: "uniquely identifies the route within its agency" },
            "route_short_name": { desc: "short name (2-5 characters) for the route" },
            "route_long_name": { desc: "full name of the route, more descriptive than route_short_name" },
            "route_desc": { desc: "optional detailed description of the route" },
            "route_type": { desc: "GTFS route type", translateData: translateRouteType },
            "route_url": { desc: "optional URL to route web page (other than agency_url)", type: tf.GTFS.EditorAttributeTypes.url },
            "route_color": { desc: "optional color of the route (6 HEX digit format)" },
            "route_text_color": { desc: "optional color of the name of the route (6 HEX digit format)" },
            "route_directions": { desc: "directions calculated from trips in the route", translateData: translateRouteDirections }
        };
        (allContent.attributesListEditor = tf.GTFS.AttributesListEditor(tf.js.ShallowMerge(settings, { itemAttributes: routeItemAttributes }))).Show(true);
        allContent.wrapper.InsertContentAfter(allContent.attributesListEditor.GetAllContent().wrapper, allContent.titleWrapper);
    }

    function getRouteDirectionStyle(keyedFeature, mapFeature) {
        var currentContent = theThis.GetCurrentContent();
        var item = settings.getItemFromContent(currentContent);
        if (!!item) {
            var itemData = item.GetData();
            var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
            var isAerial = appContent.GetIsShowingAerial();
            var isHover = mapFeature.GetIsDisplayingInHover();
            var zindex = 6, line_width = 4;
            var line_color = '#' + itemData.route_color;
            if (isHover) {
                line_width += 2;
                zindex += 2;
            }
            var style = [
                { line: true, line_color: "#ffffff", line_width: line_width, line_opacity: 100, zindex: zindex, snaptopixel: false },
                { line: true, line_color: "#000000", line_width: line_width, line_opacity: 100, zindex: zindex + 1, snaptopixel: false, line_cap: "square", line_dash: [line_width, line_width * 2, line_width / 2, line_width * 2] }
            ];
            return style;
        }
        else {
            console.log('route item is not defined');
        }
    };

    function onClickDirectionShape(notification) {
        /*var currentContent = theThis.GetCurrentContent();
        var routeItem = settings.getItemFromContent(currentContent);
        var routesListEditor = settings.getEditor("routes");
        var routesAssetListEditor = routesListEditor.GetAssetListEditor();
        routesAssetListEditor.SetSelectedItem(routeItem, true, true);*/
        //allContent.routeDirectionButtons.ShowDirectionIndex(allContent.routeDirectionButtons.GetSelectedDirectionIndex());
    };

    function showHideDirectionShapeOnLayer(forceHide) {
        if (directionShapeLayer) {
            var directionIndex = allContent.routeDirectionButtons.GetSelectedDirectionIndex();
            if (!forceHide && (directionIndex !== undefined)) {
                var currentContent = theThis.GetCurrentContent();
                var item = settings.getItemFromContent(currentContent);
                if (!!item) {
                    var itemData = item.GetData();
                    var maxDirectionIndex = itemData.directions.length - 1;
                    if (maxDirectionIndex < directionIndex) { directionIndex = maxDirectionIndex; }
                    var directionShapeSettings = {
                        type: "multilinestring",
                        coordinates: itemData.directions[directionIndex].direction_shape,
                        style: getRouteDirectionStyle,
                        hoverStyle: getRouteDirectionStyle,
                        toolTipProps: { toolTipText: allContent.routeDirectionButtons.GetRouteDirectionToolTip, keepOnHoverOutTarget: false, offsetX: 24 },
                        onCustomAppClick: onClickDirectionShape
                    };
                    directionShapeFeature = new tf.map.Feature(directionShapeSettings);
                    directionShapeLayer.AddMapFeature(directionShapeFeature);
                }
            }
            else {
                if (directionShapeFeature) {
                    directionShapeLayer.DelMapFeature(directionShapeFeature);
                    directionShapeFeature = undefined;
                }
            }
        }
    };

    function getVerbs() {
        var verbs = {};
        return verbs;
    };

    function onContentChange() {
        var currentContent = theThis.GetCurrentContent();
        var item = settings.getItemFromContent(currentContent);
        allContent.routeDirectionButtons.SetRouteItem(item);
        allContent.attributesListEditor.UpdateContent(item.GetData());
    };

    function onAttachDetach(notification) {
        //console.log('routes selected content attached? ' + (notification.isAttached ? "YES" : "NO"));
        if (!notification.isAttached) {
            showHideDirectionShapeOnLayer(true);
        }
    }

    function initialize() {
        var routeDirectionButtons = tf.GTFS.RouteDirectionsButtons(tf.js.ShallowMerge(settings, { onChange: theThis.OnRouteDirectionChanged }));
        tf.GTFS.ListSelectedContent.call(theThis, tf.js.ShallowMerge(settings, {
            verbs: tf.js.ShallowMerge(routeDirectionButtons.GetVerbs(), getVerbs()), onModify: onModify, setInterface: function (theInterface) { myI = theInterface; }, onContentChange: onContentChange,
            onAttachDetach: onAttachDetach
        }));
        createControl();
        allContent.routeDirectionButtons = routeDirectionButtons;
        allContent.routeDirectionButtons.SetAllContent(allContent);
        theThis.GetAllContent = function () { return allContent; };
    }
    initialize();
};
tf.js.InheritFrom(tf.GTFS.RoutesSelectedContent, tf.GTFS.ListSelectedContent);

tf.GTFS.RoutesListEditor = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.RoutesListEditor)) { return new tf.GTFS.RoutesListEditor(settings); }
    var assetListEditor, agencyItem;

    this.UpdateCurrentRouteDirections = function (notification) {
        assetListEditor.GetAttachedSelectedContent().OnRouteDirectionChanged(notification);
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
            var titleStr = tf.GTFS.GetRouteTitle(itemData);
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

    //"id": 1, "prefix": "MDT", "subAgencyIds": [1], "subAgencyIdsInAgency": ["001"], "routeIds": [1], "routeIdsInAgency": ["001"], "includeDirections": false, "includeDirectionShape": false, "includeRouteShape": false, "decodeData": false, "returnGeoJSON": false
    /*
    {"id":14," route_id":"BCT01", "agency_id":1, "route_short_name":"01", "route_long_name":null, "route_desc":null, "route_type":3, "route_url":"http://www.broward.org/BCT/SCHEDULES/Pages/default.aspx", "route_color":"FBB040",
    "route_text_color":"FFFFFF",
    "directions":[{"direction_id":0,"gtfs_direction":0,"gtfs_direction_name":"Northbound","direction_shape":..
    */
    function refreshFromAPI(then) {
        var ad = agencyItem.GetData(), layer = assetListEditor.GetLayer();
        assetListEditor.RemoveAllItems();
        assetListEditor.ShowEditorLoadingToast();
        settings.apiClient.DesignRoutesPost(
            function (results) {
                var isOK = false;
                if (results.responseJSON) { if (results.responseJSON.ok) { assetListEditor.UpdateFromNewData(results.responseJSON.result); isOK = true; } }
                if (!isOK) { console.log('routes api call failed'); }
                assetListEditor.CloseEditorLoadingToast();
            if (then) { then({ sender: theThis }); }
            }, { id: ad.id, includeDirections: true, includeDirectionShape: true, includeRouteShape: true, includeServiceIds: true, includeStopSequenceIds: true, decodeData: true });
    };

    function getRouteStyles() {
        function getStyle(keyedFeature, mapFeature) {
            var item = assetListEditor.GetItemFromMapFeature(mapFeature);
            if (item) {
                var itemData = item.GetData();
                var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
                var isAerial = appContent.GetIsShowingAerial();
                var isHover = mapFeature.GetIsDisplayingInHover();
                var zindex = 3, line_width = 2;
                var line_color = '#' + itemData.route_color;
                var style = { line: true, line_color: line_color, line_width: line_width, line_opacity: 100, zindex: zindex, snaptopixel: false };
                var hoverStyle = [
                    { line: true, line_color: "#ffaaaa", line_width: line_width + 16, line_opacity: 50, zindex: zindex - 1, snaptopixel: false },
                    { line: true, line_color: line_color, line_width: line_width + 0, line_opacity: 100, zindex: zindex + 1, snaptopixel: false }
                ];
                return isHover ? hoverStyle : style;
            }
            else {
                console.log('route item is not defined');
            }
        }
        return { style: getStyle, hoverStyle: getStyle };
    };

    function getToolTip(notification) { return tf.GTFS.GetRouteTitle(assetListEditor.GetItemFromMapFeature(notification.mapFeature).GetData()); };

    function onClickMapFeature(notification) { console.log('route map feature clicked'); };

    function onKLChange(notification) {
        //console.log('routes KL change notification received');
    };

    function initialize() {
        var directionLayerName = "routeDirections";
        assetListEditor = new tf.GTFS.AssetListEditor(tf.js.ShallowMerge(settings, {
            editor: theThis,
            TLF: theThis.GetTLF(),
            //onRemoveAllItems: function () { agencyItem = undefined; },
            attachedSelectedContentType: tf.GTFS.RoutesSelectedContent,
            createNewContent: createNewContent,
            prepareSpareContent: prepareSpareContent,
            onContentBecameSpare: onContentBecameSpare,
            updateContentForItem: updateContentForItem,
            //compareContent: compareContent,
            itemNameSingle: "route",
            itemNamePlural: "routes",
            assetName: "routes",
            contentInItemAttributeName: "routeContent",
            itemInContentAttributeName: "routeItem",
            onKLChange: onKLChange,
            createLayer: true,
            useClusters: false,
            mapFeaturesSettings: {
                itemDataFieldNameWithCoords: function (itemData) { return itemData.route_shape ? itemData.route_shape.route_shape : undefined; },
                mapFeatureType: "multilinestring",
                refreshStyleOnUpdate: false,
                onClick: onClickMapFeature,
                mapFeatureInItemAttributeName: "routeFullMapFeature",
                itemInMapFeatureAttributeName: "routeItem",
                styles: getRouteStyles(),
                toolTipProps: { toolTipText: getToolTip, keepOnHoverOutTarget: false, offsetX: 24 },
                appContent: settings.appContent
            },
            additionalLayers: [{
                name: directionLayerName,
                useClusters: false,
                use3D: false
            }]
        }));
        assetListEditor.GetAttachedSelectedContent().SetDirectionShapeLayer(assetListEditor.GetAdditionalLayer(directionLayerName)/*, assetListEditor.GetItemFromMapFeature*/);
    };

    initialize();
};
