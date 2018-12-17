"use strict";

tf.GeoFences = {};

tf.GeoFences.fenceTypes = {
    //circle: "circle",
    extent: "extent",
    polygon: "polygon"
};

tf.GeoFences.instantFenceKeys = {
    mtInstantFence: "mtInstantFence",
    dtInstantFence: "dtInstantFence",
    propsInstantFence: "propsInstantFence"
};

tf.GeoFences.TargetPointFeatures = function (settings) {
    var theThis, pointFeatures;

    this.GetPointFeatures = function () { return pointFeatures; }

    this.UpdateForMapType = function (KL) { pointFeatures.RefreshStyles(KL); }

    function getStyles() {
        function getStyle(keyedFeature, mapFeature) {
            var isAerial = settings.appContent.GetIsShowingAerial();
            var isHover = mapFeature.GetIsDisplayingInHover();
            var mapFeatureSettings = mapFeature.GetSettings();
            var nFences = mapFeatureSettings.nFences;
            var zindex = isHover ? 50 : 50;
            var colorStroke = isHover ? "#f00" : (isAerial ? "#f00" : "#f00");
            var shapeRadius = nFences > 0 ? (isHover ? 26 : 24) : 0;
            var lineWidth = isHover ? 3 : 2;
            var frameStyle = {
                shape: true, shape_points: 4, shape_radius: shapeRadius, line: true, line_width: lineWidth, line_color: colorStroke, zindex: zindex, rotation_rad: Math.PI / 4
            };
            if (nFences < 2) { return frameStyle; }
            else {
                var textStyle = { marker: true, label: ' ' + nFences + ' ', marker_arrowlength: 20, zindex: zindex + 1 };
                return [frameStyle, textStyle];
            }
        }
        return { style: getStyle, hoverStyle: getStyle };
    }

    function getMapFeatureToolTip(notification) {
        var mapFeature = notification.mapFeature, mapFeatureSettings = mapFeature.GetSettings();
        var nFences = mapFeatureSettings.nFences;
        var fenceFences = nFences == 1 ? "fence" : "fences";
        return "Inside " + nFences + " " + fenceFences;
    }

    function onClickMapFeature(notification) { if (tf.js.GetFunctionOrNull(settings.onClick)) { settings.onClick(notification); } }

    function initialize() {
        var mapFeatureInItemAttributeName = "fenceMapFeature";
        var itemInMapFeatureAttributeName = "pointItem";
        pointFeatures = new tf.TFMap.KeyedListMapFeatures({
            getOptionalSettings: settings.getOptionalSettings,
            refreshStyleOnUpdate: false,
            onClick: onClickMapFeature,
            mapFeatureInItemAttributeName: mapFeatureInItemAttributeName,
            itemInMapFeatureAttributeName: itemInMapFeatureAttributeName,
            styles: getStyles(),
            toolTipProps: { toolTipText: getMapFeatureToolTip, keepOnHoverOutTarget: false, offsetX: 24 },
            layer: settings.layer,
            appContent: settings.appContent
        });
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GeoFences.TargetList = function (settings) {
    var theThis, pointFeatures, targetUpdateListener, targetsByFence, isCurrent, targetsChangeListener;

    this.SetIsCurrent = function (newIsCurrent) { return isCurrent = !!newIsCurrent; }
    this.GetIsCurrent = function () { return isCurrent; }
    this.UpdateForMapType = function () { if (!!pointFeatures) { pointFeatures.UpdateForMapType(settings.targetList.GetKL()); } }
    this.OnFencesChanged = function () { return calcGeoFenceState(); }
    this.GetTargetsByFence = function () { return targetsByFence; }

    function onTargetsUpdated() { pointFeatures.GetPointFeatures().RefreshPositions(settings.targetList.GetKL()); calcGeoFenceState(); }
    function onTargetsKLChange(notification) { pointFeatures.GetPointFeatures().OnKLChange(notification); calcGeoFenceState(); }
    function calcGeoFenceState() {
        targetsByFence = settings.list.CalcGeoFenceState(settings.targetList.GetKL(), pointFeatures);
        if (isCurrent) { settings.onCurrentCountChange(); }
    }

    function getTargetMapFeatureSettings(notification) { return { nFences: 0, fences: [] }; }

    function initialize() {
        var appContent = settings.appContent;
        var targetList = settings.targetList;
        var layer = targetList.GetLayer();
        var KL = targetList.GetKL();
        pointFeatures = new tf.GeoFences.TargetPointFeatures({
            layer: layer, appContent: appContent,
            //onClick: onMapFeatureClick, 
            getOptionalSettings: getTargetMapFeatureSettings
        });
        targetUpdateListener = settings.targetList.AddUpdateListener(onTargetsUpdated);
        targetsChangeListener = KL.AddAggregateListener(onTargetsKLChange);
        onTargetsUpdated();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GeoFences.TargetLists = function (settings) {
    var theThis, targets, currentTargetList, changeListener;
    var allEventDispatchers, countChangeEventName;

    this.UpdateForMapType = function () { for (var i in targets) { targets[i].UpdateForMapType(); } }

    this.AddCountChangeListener = function (callBack) { return allEventDispatchers.AddListener(countChangeEventName, callBack); }

    this.GetCurrentTargetsByFence = function () { return currentTargetList ? currentTargetList.GetTargetsByFence() : undefined; }

    this.AddTargetList = function (targetListName, targetListToAdd) {
        if (tf.js.GetIsNonEmptyString(targetListName) && !!targetListToAdd) {
            targets[targetListName] = new tf.GeoFences.TargetList(tf.js.ShallowMerge(settings, { targetList: targetListToAdd, onCurrentCountChange: onCurrentCountChange }));
        }
    }

    this.GetTargetList = function (targetListName) { return targets[targetListName]; }

    this.SetCurrentTargetList = function (targetListName) { 
        var newCurrentTargetList = theThis.GetTargetList(targetListName);
        if (newCurrentTargetList != currentTargetList) {
            if (!!currentTargetList) { currentTargetList.SetIsCurrent(false); }
            if (!!(currentTargetList = newCurrentTargetList)) { currentTargetList.SetIsCurrent(true); }
        }
    }

    this.GetCurrentTargetList = function () { return currentTargetList; }

    function notify(eventName, props) { allEventDispatchers.Notify(eventName, tf.js.ShallowMerge(props, { sender: theThis, eventName: eventName })); }

    function onCurrentCountChange() { notify(countChangeEventName); }

    function onGeoFenceListChanged() { for (var i in targets) { targets[i].OnFencesChanged(); } }

    function initialize() {
        allEventDispatchers = new tf.events.MultiEventNotifier({ eventNames: [countChangeEventName = "cnt"] });
        targets = {};
        changeListener = settings.list.AddChangeListener(onGeoFenceListChanged);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GeoFences.CompareFences = function (a, b) { return a.itemData.GetOrder() - b.itemData.GetOrder(); }

tf.GeoFences.Fence = function (settings) {
    var theThis, isInList;
    var type, fromStr, order, key, isInstant, editorNameStr;

    this.OnMapPostCompose = function (notification) { return settings.onMapPostCompose(notification); }
    this.GetMapFeature = function () { return settings.getMapFeature(); }
    this.GetKey = function () { return key; }
    this.SetKey = function (newKey) { key = newKey; }
    this.GetType = function () { return type; }
    this.GetIsInstant = function () { return isInstant; }
    this.SetOrder = function(newOrder) { order = newOrder; }
    this.GetOrder = function () { return order; }
    this.GetFromStr = function () { return fromStr; }
    this.GetEditorNameStr = function () { return editorNameStr; }
    this.GetIsInList = function () { return isInList; }
    this.SetIsInList = function (newIsInList) { if (isInList != (newIsInList = !!newIsInList)) { isInList = newIsInList; } }
    this.CreateCopy = function() { return settings.createCopy(); }
    this.CheckCoordsInside = function (coords) { return settings.checkCoordsInside(coords); }
    this.SetMapExtent = function () { return settings.setMapExtent(); }

    function initialize() {
        theThis.SetIsInList(!!settings.isInList);
        type = settings.type;
        fromStr = settings.fromStr;
        order = settings.order;
        key = settings.key;
        isInstant = !!settings.isInstant;
        editorNameStr = settings.editorNameStr;
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GeoFences.PolyFence = function (settings) {
    var theThis, polyFeature;

    this.GetPolyFeature = function () { return polyFeature; }
    this.SetPolyFeature = function (newPolyFeature) {
        if (theThis.GetIsInstant()) {
            polyFeature = newPolyFeature;
        }
        else if (!!newPolyFeature) {
            var polyFeatureCoords = newPolyFeature.GetGeom().GetCoordinates();
            var lineStringCoords = tf.js.CopyLineStringCoords(polyFeatureCoords[0]);
            var polyFeatureGeom = {
                type: 'polygon',
                coordinates: [lineStringCoords]
            };
            polyFeatureGeom.style = polyFeatureGeom.hoverStyle = settings.getStyle;
            polyFeature = new tf.map.Feature(polyFeatureGeom);
        }
        else {
            polyFeature = undefined;
        }
    }

    function onMapPostCompose(notification) {
        if (!settings.isInstant) {
            if (!!polyFeature) {
                notification.showFeatureImmediately(polyFeature);
            }
        }
    }

    function checkCoordsInside(coords) { return !!polyFeature ? polyFeature.GetGeom().GetContainsCoords(coords) : false; }

    function createCopy() {
        var copy = new tf.GeoFences.PolyFence(tf.js.ShallowMerge(settings, { isInstant: false }));
        copy.SetPolyFeature(polyFeature);
        return copy;
    }

    function setMapExtent() { if (!!polyFeature) { settings.appContent.SetMapExtent(polyFeature.GetGeom().GetExtent()); } }

    function getMapFeature() { return theThis.GetPolyFeature(); }

    function initialize() {
        //console.log('settings.isInstant: ' + settings.isInstant);
        tf.GeoFences.Fence.call(theThis, tf.js.ShallowMerge({
            onMapPostCompose: onMapPostCompose, getMapFeature: getMapFeature,
            checkCoordsInside: checkCoordsInside, type: tf.GeoFences.fenceTypes.polygon, createCopy: createCopy, setMapExtent: setMapExtent
        }, settings));
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.GeoFences.PolyFence, tf.GeoFences.Fence);

tf.GeoFences.ExtentFence = function (settings) {
    var theThis, extent, lineString;

    this.GetLineString = function () { return lineString; }

    this.GetExtent = function () { return extent; }
    this.SetExtent = function (newExtent, newLineString) {
        extent = theThis.GetIsInstant() ? newExtent : (newExtent != undefined ? newExtent.slice(0) : undefined);
        if (!!extent) {
            var polyFeatureGeom = tf.js.GetPolyGeomFromExtent(extent);
            polyFeatureGeom.style = settings.getStyle;
            theThis.SetPolyFeature(new tf.map.Feature(polyFeatureGeom));
            lineString = newLineString != undefined ? tf.js.CopyLineStringCoords(newLineString) : undefined;
        }
        else {
            theThis.SetPolyFeature(undefined);
            lineString = undefined;
        }
    }

    function checkCoordsInside(coords) { return !!extent ? tf.js.GetExtentContainsCoord(extent, coords) : false; }

    function createCopy() {
        var copy = new tf.GeoFences.ExtentFence(tf.js.ShallowMerge(settings, { isInstant: false }));
        copy.SetExtent(extent, lineString);
        return copy;
    }

    function setMapExtent() { if (!!extent) { settings.appContent.SetMapExtent(extent); } }

    function initialize() {
        tf.GeoFences.PolyFence.call(theThis, tf.js.ShallowMerge(settings, {
            checkCoordsInside: checkCoordsInside, type: tf.GeoFences.fenceTypes.extent, createCopy: createCopy, setMapExtent: setMapExtent
        }));
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.GeoFences.PolyFence, tf.GeoFences.Fence);

tf.GeoFences.FenceList = function (settings) {
    var theThis, KL, mtGeomUpdateListener, mtActivationListener, dtGeomUpdateListener, dtActivationListener, propsDisplayerVisivbilityListener;
    var mtInstantFence, dtInstantFence, propsInstantFence;
    var allEventDispatchers, changeEventName;
    var order;
    var nNonInstantFences;

    this.AddChangeListener = function (callBack) { return allEventDispatchers.AddListener(changeEventName, callBack); }

    this.GetKL = function () { return KL; }

    this.AddFence = function (theFence) { addFence(theFence, true); notifyGeoFenceChange(); }
    this.RemoveFence = function (fenceItem) { removeFence(fenceItem); notifyGeoFenceChange(); }

    this.GetHasNonInstantFences = function () { return theThis.GetNonInstantFenceCount() > 0; }
    this.GetNonInstantFenceCount = function () { return nNonInstantFences; }

    this.RemoveNonInstantFences = function () {
        if (theThis.GetHasNonInstantFences()) {
            var fenceItems = KL.GetKeyedItemList();
            for (var i in fenceItems) {
                var fi = fenceItems[i], fiObj = fi.GetData(), isInstant = fiObj.GetIsInstant();
                if (!isInstant) {
                    removeFence(fi);
                }
            }
            notifyGeoFenceChange();
        }
    }

    this.SetMapExtentFromItem = function (item) {
        if (!!item) {
            var itemObj = item.GetData();
            itemObj.SetMapExtent();
        }
    }

    this.CalcGeoFenceState = function (targetKL, targetPointFeatures) {
        var targetsByFence = {};
        if (!!targetKL) {
            var nFencePolys = KL.GetItemCount();
            var pointFeatures = targetPointFeatures.GetPointFeatures();
            var items = targetKL.GetKeyedItemList();
            var fenceItems = KL.GetKeyedItemList();
            //for (var j in fenceItems) { targetsByFence[fenceItems[i].GetKey()] = {}; }
            for (var i in items) {
                var item = items[i];
                var mapFeature = pointFeatures.GetMapFeatureFromItem(item);
                if (!!mapFeature) {
                    var mapFeatureSettings = mapFeature.GetSettings();
                    var nFencesBefore = mapFeatureSettings.nFences;
                    var coordsNow = mapFeature.GetPointCoords();

                    mapFeatureSettings.fences = [];

                    for (var j in fenceItems) {
                        var fenceItem = fenceItems[j], fenceKey = fenceItem.GetKey();
                        var fenceTargets = targetsByFence[fenceKey];
                        if (fenceTargets == undefined) { fenceTargets = targetsByFence[fenceKey] = { count: 0, targets: {} }; }
                        if (fenceItem.GetData().CheckCoordsInside(coordsNow)) {
                            mapFeatureSettings.fences.push({ fenceItem: fenceItem });
                            ++fenceTargets.count;
                            fenceTargets.targets[item.GetKey()] = item;
                        }
                    }

                    mapFeatureSettings.nFences = mapFeatureSettings.fences.length;

                    if (nFencesBefore != mapFeatureSettings.nFences) { mapFeature.RefreshStyle(); }
                }
            }
        }
        return targetsByFence;
    };

    function notify(eventName, props) { allEventDispatchers.Notify(eventName, tf.js.ShallowMerge(props, { sender: theThis, eventName: eventName })); }

    function notifyGeoFenceChange() { notify(changeEventName); }

    function forceMapRender() { settings.appContent.GetMap().Render(); }

    function addFence(theFence, setOrderAndKey) {
        if (!!theFence) {
            if (setOrderAndKey) {
                ++nNonInstantFences;
                var newOrder = order++;
                theFence.SetOrder(newOrder);
                theFence.SetKey('' + newOrder);
            }
            KL.AddOrGetItem(theFence);
        }
    }
    function removeFence(fenceItem) {
        if (!!fenceItem) {
            if (!fenceItem.GetData().GetIsInstant()) { --nNonInstantFences; }
            KL.RemoveItemByKey(fenceItem.GetKey(), false, false);
        }
    }

    function addRemoveInstantFence(instantFence, needAdd, needRemove) {
        var needNotify = false;
        if (needAdd) { addFence(instantFence, false); instantFence.SetIsInList(true); needNotify = true; }
        else if (needRemove) { removeFence(KL.GetItem(instantFence.GetKey())); instantFence.SetIsInList(false); needNotify = true; }
        return needNotify;
    }

    function checkMTInstantFenceStatus(needNotify) {
        var mti = settings.appContent.GetMeasureToolInterface(), mtiActive = mti.getIsActive(), instantIsInList = mtInstantFence.GetIsInList();
        var needAdd = false, needRemove = false;

        if (mtiActive) {
            var mtiInfo = mti.getInfo(), hasArea = mtiInfo.nPoints > 2;
            if (instantIsInList) { needRemove = !hasArea; } else { needAdd = hasArea; }
            if (hasArea) { mtInstantFence.SetPolyFeature(mti.getAreaFeature()); }
        }
        else { needRemove = true; }

        needNotify |= addRemoveInstantFence(mtInstantFence, needAdd, needRemove);

        if (needNotify) { notifyGeoFenceChange(); }
    }

    function onMTUpdated(notification) { checkMTInstantFenceStatus(true); }
    function onMTActivation(notification) { checkMTInstantFenceStatus(); }

    function checkDTInstantFenceStatus(needNotify) {
        var dti = settings.appContent.GetDownloadToolInterface(), dtiActive = dti.getIsActive(), instantIsInList = dtInstantFence.GetIsInList();
        var needAdd = false, needRemove = false;

        if (dtiActive) {
            var dtiInfo = dti.getInfo(), extent = dtiInfo.nPoints >= 2 ? dtiInfo.lastExtentDrawResult.vertexExtent : undefined, hasExtent = extent != undefined;
            if (instantIsInList) { needRemove = !hasExtent; } else { needAdd = hasExtent; }
            if (hasExtent) { dtInstantFence.SetExtent(extent, dtiInfo.lineString); }
        }
        else { needRemove = true; }

        needNotify |= addRemoveInstantFence(dtInstantFence, needAdd, needRemove);

        if (needNotify) { notifyGeoFenceChange(); }
    }

    function onDTUpdated(notification) { checkDTInstantFenceStatus(true); }
    function onDTActivation(notification) { checkDTInstantFenceStatus(); }

    function onMapFeaturePropsDisplayChange(notification) {
        var needNotify = false, needAdd = false, needRemove = false;
        var instantIsInList = propsInstantFence.GetIsInList();
        var appContent = settings.appContent, mapFeaturePropsDisplayer = appContent.GetMapFeaturePropsDisplayer();
        var mapFeatureWithProps = mapFeaturePropsDisplayer.GetIsVisible() ? mapFeaturePropsDisplayer.GetLastMapFeature() : undefined;
        var polyMapFeature = !!mapFeatureWithProps ? mapFeatureWithProps.GetSettings().polyMapFeature : undefined;
        var hasPolyMapFeature = polyMapFeature != undefined;

        if (hasPolyMapFeature) { needAdd = !instantIsInList; propsInstantFence.SetPolyFeature(polyMapFeature); } else { needRemove = instantIsInList; }

        needNotify |= addRemoveInstantFence(propsInstantFence, needAdd, needRemove);

        if (needNotify) { notifyGeoFenceChange(); }
    }

    function setListeners() {
        var appContent = settings.appContent;
        var mti = appContent.GetMeasureToolInterface();
        var dti = appContent.GetDownloadToolInterface();
        mtGeomUpdateListener = mti.addUpdateGeomListener(onMTUpdated);
        mtActivationListener = mti.addActivationListener(onMTActivation);
        dtGeomUpdateListener = dti.addUpdateGeomListener(onDTUpdated);
        dtActivationListener = dti.addActivationListener(onDTActivation);
        propsDisplayerVisivbilityListener = appContent.GetMapFeaturePropsDisplayer().AddVisibilityChangeListener(onMapFeaturePropsDisplayChange);
        //settings.customAppContentI.setOnMapPostCompose(onMapPostCompose);
    }

    function createKL() {
        KL = new tf.js.KeyedList({
            name: tf.js.GetNonEmptyString(settings.KLName, "geoFencesKL"),
            getKeyFromItemData: function (fence) { return fence.GetKey(); },
            needsUpdateItemData: function (updateObj) { return true },
            filterAddItem: function (itemData) { return true; }
        });
    }

    function createInstantFences() {
        var measureToolStr = "measure tool";
        var downloadToolStr = "download tool"
        order = 1;
        var commonSettings = tf.js.ShallowMerge(settings, { isInstant: true, getStyle: settings.getStyle });
        mtInstantFence = new tf.GeoFences.PolyFence(tf.js.ShallowMerge(commonSettings, { key: tf.GeoFences.instantFenceKeys.mtInstantFence, fromStr: measureToolStr, editorNameStr: measureToolStr, order: order++ }));
        dtInstantFence = new tf.GeoFences.ExtentFence(tf.js.ShallowMerge(commonSettings, { key: tf.GeoFences.instantFenceKeys.dtInstantFence, fromStr: downloadToolStr, editorNameStr: downloadToolStr, order: order++ }));
        propsInstantFence = new tf.GeoFences.PolyFence(tf.js.ShallowMerge(commonSettings, { key: tf.GeoFences.instantFenceKeys.propsInstantFence, fromStr: "marker", editorNameStr: measureToolStr, order: order++ }));
    }

    function onMapPostCompose(notification) { var fenceItems = KL.GetKeyedItemList(); for (var i in fenceItems) { fenceItems[i].GetData().OnMapPostCompose(notification); } }

    function initialize() {
        allEventDispatchers = new tf.events.MultiEventNotifier({ eventNames: [changeEventName = "chg"] });
        createKL();
        createInstantFences();
        setListeners();
        nNonInstantFences = 0;
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GeoFences.FencesMapFeatures = function (settings) {
    var theThis, fenceFeatures, fenceUpdateSeq, changeListener, selectedMapFeature;

    this.OnVisibilityChange = function (notification) {
        settings.appContent.GetBottomCustomAppLayer().SetVisible(notification.isVisible);
    }

    this.UpdateForMapType = function (KL) { for (var i in fenceFeatures) { fenceFeatures[i].mapFeature.RefreshStyle(); } }

    this.GetMapFeatureFromItem = function (fenceItem) {
        var fenceFeature = !!fenceItem ? fenceFeatures[fenceItem.GetKey()] : udnefined;
        return !!fenceFeature ? fenceFeature.mapFeature : undefined;
    }
    this.GetItemFromMapFeature = function (mapFeature) { return !!mapFeature ? mapFeature.GetSettings().fenceItem : undefined; }

    this.GetSelectedMapFeature = function () { return selectedMapFeature; }

    this.GetSelectedItem = function () { return theThis.GetItemFromMapFeature(selectedMapFeature); }
    this.SetSelectedItem = function (fenceItem) {
        var selectedItem = theThis.GetSelectedItem();
        if (fenceItem != selectedItem) {
            if (!!selectedItem) {
                var savedSelectedMapFeature = selectedMapFeature;
                selectedMapFeature = undefined;
                savedSelectedMapFeature.SetIsAlwaysInHover(false);
                //savedSelectedMapFeature.RefreshStyle();
            }
            if (!!fenceItem) {
                var mapFeature = theThis.GetMapFeatureFromItem(fenceItem);
                if (!!mapFeature) {
                    (selectedMapFeature = mapFeature).SetIsAlwaysInHover(true);
                    //selectedMapFeature.RefreshStyle();
                }
            }
        }
    }

    function onClickFenceMapFeature(notification) {
        if (tf.js.GetFunctionOrNull(settings.onMapFeatureClick)) {
            settings.onMapFeatureClick({ sender: theThis, item: notification.mapFeature.GetSettings().fenceItem });
        }
    }

    function updateFenceFeatures() {
        var layer = settings.appContent.GetBottomCustomAppLayer(), KL = settings.list.GetKL(), fenceItems = KL.GetKeyedItemList();
        ++fenceUpdateSeq;
        for (var i in fenceItems) {
            var fi = fenceItems[i], fik = fi.GetKey();
            var existingFeature = fenceFeatures[fik];
            if (!!existingFeature) {
                existingFeature.fenceUpdateSeq = fenceUpdateSeq;
            }
            else {
                var fObj = fi.GetData();
                if (!fObj.GetIsInstant()) {
                    var mapFeature = fObj.GetMapFeature();
                    if (!!mapFeature) {
                        var mapFeatureSettings = mapFeature.GetSettings();
                        mapFeatureSettings.onCustomAppClick = onClickFenceMapFeature;
                        mapFeatureSettings.fenceItem = fi;
                        fenceFeatures[fik] = { fenceUpdateSeq: fenceUpdateSeq, mapFeature: mapFeature, fenceItem: fi };
                        layer.AddMapFeature(mapFeature, true);
                    }
                }
            }
        }

        for (var i in fenceFeatures) {
            var ff = fenceFeatures[i];
            if (ff.fenceUpdateSeq != fenceUpdateSeq) {
                if (selectedMapFeature == ff.mapFeature) { selectedMapFeature = undefined; }
                layer.DelMapFeature(ff.mapFeature, true);
                delete fenceFeatures[i];
            }
        }

        layer.AddWithheldFeatures();
        layer.DelWithheldFeatures();
    }

    function onGeoFenceListChanged() { updateFenceFeatures(); }

    function initialize() {
        fenceUpdateSeq = 0;
        fenceFeatures = {};
        changeListener = settings.list.AddChangeListener(onGeoFenceListChanged);
        updateFenceFeatures();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GeoFences.CSSClasses = function (settings) {
    var theThis, cssTag, classNames, layoutChangeListener;

    this.GetClassNames = function () { return classNames; }

    this.GetContentWrapperDisplayVisibleVerb = function () { return "block"; }

    this.SetListVisible = function (theTLF, isVisible) {
        if (!!theTLF) {
            var verbVisible = 'flex', verbHidden = 'none';
            theTLF.wrapper.GetHTMLElement().style.display = !!isVisible ? verbVisible : verbHidden;
        }
    }

    this.CreateToolBarListFooter = function (createSettings) {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var customAppContentI = settings.customAppContentI;
        var ls = tf.TFMap.LayoutSettings;
        var delayMillis = 0;
        var toolTipClass = "*start";
        var toolTipArrowClass = "top";
        var buttonSettings = {
            offsetY: 0, onClick: undefined, onHover: undefined, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        //isRT = false;

        var theTLF = createToolBarListFooter();

        var mainToolBarButtonClassNames = customAppContentI.getMainToolBarButtonClasses();
        var mainToolBarSpanClassNames = customAppContentI.getMainToolBarSpanClasses();

        theTLF.titleButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
            wrapper: theTLF.toolBar.wrapper,
            onClick: createSettings.onClickTitleButton
        }), appStyles.GetFenceSVG(), mainToolBarButtonClassNames, createSettings.titleButtonToolTipText, undefined, "titleButton");

        theTLF.clearButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
            wrapper: theTLF.toolBar.wrapper,
            onClick: createSettings.onClickClearButton
        }), appStyles.GetDustBinSVG(), mainToolBarButtonClassNames, "Remove all added fences", undefined, "titleButton");

        theTLF.listTitleSpan = document.createElement('span');
        theTLF.listTitleSpan.className = mainToolBarSpanClassNames;

        theTLF.toolBar.content.AddContent(theTLF.titleButton.GetButton(), theTLF.listTitleSpan, theTLF.clearButton.GetButton());

        theTLF.listItemsPlaceHolder = new tf.dom.Div({ cssClass: classNames.listItemsPlaceHolderClassName });

        var listItemsPlaceHolderE = theTLF.listItemsPlaceHolder.GetHTMLElement(), listItemsPlaceHolderES = listItemsPlaceHolderE.style;

        theTLF.measureAId = tf.dom.CreateDomElementID('fenceLink');
        theTLF.downloadAId = tf.dom.CreateDomElementID('fenceLink');

        listItemsPlaceHolderE.innerHTML = 'Design custom fences with<br><a id="' + theTLF.measureAId + '">Measure ' + appStyles.GetMeasureSVG() +
            '</a> or <a id="' + theTLF.downloadAId + '">Download ' + appStyles.GetDownloadSVG() + '</a>';

        //theTLF.scrollContent.AddContent(theTLF.listItemsPlaceHolder);
        theTLF.scrollWrapper.AddContent(theTLF.listItemsPlaceHolder);

        //theTLF.scrollContent.GetHTMLElement().style.backgroundColor = 'black';

        return theTLF;
    }

    function createCSSClassNames() {
        classNames = {
            itemWrapperClassName: tf.TFMap.CreateClassName(cssTag, "ItemWrapper"),
            itemWrapperSelectedClassName: tf.TFMap.CreateClassName(cssTag, "ItemWrapperSelected"),
            itemContentWrapperClassName: tf.TFMap.CreateClassName(cssTag, "ItemContentWrapper"),
            itemTitleClassName: tf.TFMap.CreateClassName(cssTag, "ItemTitle"),
            itemCountClassName: tf.TFMap.CreateClassName(cssTag, "itemCount"),
            itemButtonClassName: tf.TFMap.CreateClassName(cssTag, "ItemButton"),
            itemToolBarClassName: tf.TFMap.CreateClassName(cssTag, "ItemToolBar"),
            itemToolBarTextButton: tf.TFMap.CreateClassName(cssTag, "ItemToolBarTextButton"),
            itemToolBarFixWidthTextButton: tf.TFMap.CreateClassName(cssTag, "ItemToolBarAddDelTextButton"),
            listItemsPlaceHolderClassName: tf.TFMap.CreateClassName(cssTag, "listItemsPlaceHolder")
        };
    }

    function createToolBarListFooter() {
        var ls = tf.TFMap.LayoutSettings;
        var customAppContentI = settings.customAppContentI;
        var customAppClassNames = customAppContentI.getClassNames();
        var wrapper = customAppContentI.createNonScrollVariableHeightContent(customAppClassNames.minHeightPaneClassName);
        var toolBar = customAppContentI.createMainToolBar();
        var footer = customAppContentI.createFooter();
        var scrollWrapperAndContent = customAppContentI.createVertScrollWrapperAndContentWithFade();
        wrapper.AddContent(toolBar.wrapper);
        wrapper.AddContent(scrollWrapperAndContent.scrollWrapper, footer.wrapper);
        return {
            wrapper: wrapper, toolBar: toolBar,
            scrollWrapper: scrollWrapperAndContent.scrollWrapper, scrollContent: scrollWrapperAndContent.scrollContent, footer: footer
        };
    }

    function createCSSClasses() {
        var customAppContentI = settings.customAppContentI;
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var isSmallScreen = appStyles.GetIsSmallScreen();
        var cssClasses = [];
        var ls = tf.TFMap.LayoutSettings;
        var paddingHorTitleInt = 2;//isSmallScreen ? 4 : 8, paddingHorTitlePx = paddingHorTitleInt + 'px';
        var widthDirectionDivInt = isSmallScreen ? 20 : 30;
        var marginLeftTitleDivInt = widthDirectionDivInt + 2;
        var stdTextOverflow = { inherits: [CSSClasses.pointerEventsNone], overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", verticalAlign: "middle" };
        var maxWidthNameInt = isSmallScreen ? 36 : 56;
        var widthTitleSubInt = isSmallScreen ? 110 : 156;
        var displayType = CSSClasses.displayInlineBlock;

        cssClasses[classNames.itemWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.displayBlock, CSSClasses.overflowHidden],
            padding: "1px", borderRadius: "0px", width: "calc(100% - 2px)"
        };

        cssClasses[classNames.itemWrapperClassName + ":hover"] = { backgroundColor: "rgba(0, 0, 0, 0.1)" };

        cssClasses[classNames.itemWrapperSelectedClassName] = { backgroundColor: "red" };

        cssClasses[classNames.itemWrapperSelectedClassName + ":hover"] = { backgroundColor: "red" };

        cssClasses[classNames.itemButtonClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.transparentImageButton, CSSClasses.backgroundColorTransparent, CSSClasses.displayBlock, CSSClasses.positionAbsolute],
            backgroundColor: "white",
            borderRadius: "0px", left: "4px", top: "1px", width: "calc(100% - 8px)", height: "calc(100% - 2px)"
        };

        cssClasses[classNames.itemContentWrapperClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, CSSClasses.transparentImageButton, CSSClasses.backgroundColorTransparent,
                CSSClasses.displayBlock, CSSClasses.pointerEventsNone],
            marginLeft: "2px", marginRight: "2px",
            borderRadius: "2px", lineHeight: "0px", width: "calc(100% - 4px)"
        };

        cssClasses[classNames.itemTitleClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.positionRelative, displayType, CSSClasses.darkTextShadow, stdTextOverflow],
            textAlign: "left",
            paddingLeft: "4px",
            paddingRight: "4px",
            //margin: "auto",
            width: "auto",
            color: "#444",
            background: "white",
            fontSize: ls.itemInListTitletFontSizeInt + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt + 1) + 'px'
        };

        cssClasses[classNames.itemCountClassName] = {
            inherits: [cssClasses[classNames.itemTitleClassName]]
        };

        cssClasses[classNames.itemToolBarClassName] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.backgroundColorTransparent, displayType],
            borderRadius: "0px", left: "0px", top: "0px", width: "auto",
            paddingLeft: "4px",
            paddingRight: "4px",
            lineHeight: ls.itemInListTitleLineHeightInt + 'px',
            //backgroundColor: "blue",
            "float": "right"
        };

        cssClasses[classNames.itemToolBarTextButton] = {
            inherits: [CSSClasses.noMarginNoBorderNoPadding, CSSClasses.transparentImageButton, CSSClasses.backgroundColorTransparent, displayType, CSSClasses.pointerEventsAll],
            borderRadius: "2px",
            border: "1px solid " + ls.darkTextColor,
            marginLeft: "2px", marginRight: "2px",
            padding: "2px",
            fontSize: (ls.itemInListTitletFontSizeInt - 3) + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt - 5) + 'px'
        };

        var widthAddDelTextButtonInt = isSmallScreen ? 36 : 56;

        cssClasses[classNames.itemToolBarFixWidthTextButton] = {
            width: widthAddDelTextButtonInt + "px",
            backgroundColor: "#f0f8ff"
        };

        var borderInt = 6;
        var paddingInt = 4;

        cssClasses[classNames.listItemsPlaceHolderClassName] = {
            position: 'absolute',
            fontSize: ls.itemInListTitletFontSizeInt + 'px',
            lineHeight: (ls.itemInListTitleLineHeightInt + 10) + 'px',
            backgroundColor: "white",
            borderRadius: borderInt + "px",
            color: ls.darkTextColor,
            textShadow: ls.darkTextShadow,
            left: "0px",
            top: "0px",
            margin: borderInt + "px",
            marginTop: "4px",
            padding: paddingInt + "px",
            width: "calc(100% - " + (borderInt * 2 + paddingInt * 2) + "px)",
            textAlign: "center"
        };

        cssClasses[classNames.listItemsPlaceHolderClassName + " svg"] = {
            verticalAlign: "center",
            fill: ls.darkTextColor,
            width: ls.itemInListTitleLineHeightInt + 'px',
            height: ls.itemInListTitleLineHeightInt + 'px'
        }

        cssClasses[classNames.listItemsPlaceHolderClassName + " a"] = {
            borderRadius: "4px",
            padding: "4px",
            paddingTop: "6px",
            backgroundColor: "rgba(0, 0, 80, 0.1)",
            cursor: "pointer",
            textDecoration: "none"
        }

        /*cssClasses[classNames.listItemsPlaceHolderClassName + " a svg"] = {
            verticalAlign: "center",
            fill: ls.darkTextColor,
            width: ls.itemInListTitleLineHeightInt + 'px',
            height: ls.itemInListTitleLineHeightInt + 'px'
        }*/

        cssClasses[classNames.listItemsPlaceHolderClassName + " a:hover"] = {
            textDecoration: "underline"
        }

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    function initialize() {
        cssTag = 'geoFenceClasses';
        createCSSClassNames();
        registerCSSClasses();
        layoutChangeListener = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GeoFences.FenceListView = function (settings) {
    var theThis, tlf, isVisible, keyedListContent, selectedContent, klListener;

    this.UpdateCounts = function (currentTargetsByFence) {
        var KL = settings.list.GetKL(), fenceItems = KL.GetKeyedItemList();
        for (var i in fenceItems) {
            var fi = fenceItems[i], fiContent = getContentFromItem(fi);
            if (!!fiContent) {
                var fik = fi.GetKey(), fiCount = currentTargetsByFence[fik];
                var targetCount = fiCount != undefined ? fiCount.count : 0;
                fiContent.count.GetHTMLElement().innerHTML = '[ ' + targetCount + ' ]';
            }
        }
    }

    this.OnCreated = function (notification) {
        assignMeasureDownloadLinks();
    }

    this.OnVisibilityChange = function (notification) { theThis.SetIsVisible(notification.isVisible); }

    this.SetIsVisible = function (newIsVisible) {
        if (isVisible != (newIsVisible = !!newIsVisible)) {
            isVisible = newIsVisible;
            settings.cssClasses.SetListVisible(tlf, isVisible);
        }
    }

    this.GetTLF = function () { return tlf; }

    this.GetSelectedContent = function () { return selectedContent; }

    this.SetSelectedContent = function (newSelectedContent) {
        if (newSelectedContent != selectedContent) {
            if (!!selectedContent) {
                var savedSelectedContent = selectedContent;
                selectedContent = undefined;
                setSelectedStyle(savedSelectedContent, false);
            }
            if (!!(selectedContent = newSelectedContent)) { setSelectedStyle(selectedContent, true); }
        }
    }

    this.SetSelectedItem = function (item) { return theThis.SetSelectedContent(getContentFromItem(item)); }
    this.GetSelectedItem = function () { return getItemFromContent(theThis.GetSelectedContent()); }

    this.EnsureContentVisible = function (content) {
        if (!!content) {
            tf.dom.ScrollVerticallyToEnsureVisible(settings.contentWrapper, content.wrapper, settings.customAppContentI.getVerListWithFadePaddingTopBotInt());
        }
    }

    function getContentFromItem(item) { return keyedListContent.GetContentFromItem(item); }
    function getItemFromContent(content) { return keyedListContent.GetItemFromContent(content); }

    function updateFooterText(theText) { tlf.footer.content.GetHTMLElement().innerHTML = theText; }

    function updateFooterCount() {
        var count = settings.list.GetKL().GetItemCount();
        var footerStr;
        if (count == 0) { footerStr = "fence list is empty" }
        else {
            var fenceFences = count == 1 ? "fence is" : "fences are";
            footerStr = count + " " + fenceFences + " active";
        }
        updateFooterText(footerStr);
        var listItemsPlaceHolderDisplayVerb = count == 0 ? 'block' : 'none';
        tlf.listItemsPlaceHolder.GetHTMLElement().style.display = listItemsPlaceHolderDisplayVerb;
        assignMeasureDownloadLinks();
    }

    function onKLChange(notification) {
        keyedListContent.OnKLChange(notification);
        if (!!selectedContent) {
            if (!keyedListContent.GetItemFromContent(selectedContent)) {
                selectedContent = undefined;
                //console.log('fences kl content: deselected deleted content');
            }
        }
        updateClearButtonStatus();
        setTimeout(updateFooterCount, 0);
    }

    function updateClearButtonStatus() {
        var clearButtonDisplayVerb = settings.list.GetHasNonInstantFences() ? 'inline-block' : 'none';
        tlf.clearButton.GetButton().style.display = clearButtonDisplayVerb;
    }

    function activateDownloadTool() { var appContent = settings.appContent; if (!appContent.IsDownloadToolOn()) { appContent.ToggleDownloadTool(); } }
    function activateMeasureTool() { var appContent = settings.appContent; if (!appContent.IsMeasureToolOn()) { appContent.ToggleMeasureTool(); } }

    function onDownloadAClicked(evt) { activateDownloadTool(); }
    function onMeasureAClicked(evt) { activateMeasureTool(); }

    function assignMeasureDownloadLinks() {
        if (!tlf.measureA) { if (!!(tlf.measureA = document.getElementById(tlf.measureAId))) { tlf.measureA.addEventListener('click', onMeasureAClicked); } }
        if (!tlf.downloadA) { if (!!(tlf.downloadA = document.getElementById(tlf.downloadAId))) { tlf.downloadA.addEventListener('click', onDownloadAClicked); } }
    }

    function onClickClearButton(notification) { settings.list.RemoveNonInstantFences(); }

    function createTLF() {
        var tlfSettings = {
            onClickTitleButton: function () { settings.customAppContentI.setVisible(false); },
            onClickClearButton: onClickClearButton,
            titleButtonToolTipText: "Collapse panel"
        };

        tlf = settings.cssClasses.CreateToolBarListFooter(tlfSettings);
        var titleStr = "Fences";
        tlf.listTitleSpan.innerHTML = titleStr;

        theThis.SetIsVisible(settings.startVisible != undefined ? !!settings.startVisible : true);
        updateFooterCount();
        settings.customAppContentI.getContentWrapper().AddContent(tlf.wrapper);
        klListener = settings.list.GetKL().AddAggregateListener(onKLChange);
        updateClearButtonStatus();
        assignMeasureDownloadLinks();
    }

    function onItemClick(notification) {
        var clickCB = tf.js.GetFunctionOrNull(settings.onItemClick);
        if (!!clickCB) {
            var button = !!notification ? notification.domObj : undefined;
            if (!!button) {
                var content = button.content;
                var item = keyedListContent.GetItemFromContent(content);
                if (!!item) { clickCB({ sender: theThis, item: item }); }
            }
        }
    }

    function updateContentForItem(item) {
        var content = keyedListContent.GetContentFromItem(item);
        if (!!content) {
            var itemObj = item.GetData(), type = itemObj.GetType(), titleStr = type, isInstant = itemObj.GetIsInstant(), addDelButtonStr;
            var editButtonDisplayVerb;
            if (isInstant) {
                titleStr = itemObj.GetFromStr() + " " + titleStr; addDelButtonStr = "ADD";
                editButtonDisplayVerb = 'none';
            }
            else {
                //titleStr += " " + item.GetKey() + " " + itemObj.GetKey();
                addDelButtonStr = "DEL";
                editButtonDisplayVerb = 'inline-block';
            }
            content.title.GetHTMLElement().innerHTML = titleStr;
            content.toolBarAddDelButton.GetButton().innerHTML = addDelButtonStr;
            content.toolBarEditButton.GetButton().style.display = editButtonDisplayVerb;
        }
    }

    function setSelectedStyle(content, isSelected) {
        var classNames = settings.cssClasses.GetClassNames();
        if (isSelected) { tf.dom.AddCSSClass(content.wrapper, classNames.itemWrapperSelectedClassName); }
        else { tf.dom.RemoveCSSClass(content.wrapper, classNames.itemWrapperSelectedClassName); }
    }

    function prepareSpareContent(content, forItem) {
        content.toolBarAddDelButton.fenceItem = forItem;
        content.toolBarEditButton.fenceItem = forItem;
        setSelectedStyle(content, false);
        return content;
    }

    function getItemAddDelToolTip(notification) {
        var toolTipText = "Add or remove";
        var fenceItem = notification.fenceItem;
        if (!!fenceItem) {
            var itemObj = fenceItem.GetData();
            var isInstant = itemObj.GetIsInstant();
            var topLine, botLine;
            if (isInstant) {
                topLine = "Fence only active while being edited";
                botLine = "Add its current shape to the list";
            }
            else {
                topLine = "Fence always active";
                botLine = "Remove it from the list";
            }
            toolTipText = tf.TFMap.MapTwoLineSpan(topLine, botLine);
        }
        return toolTipText;
    }

    function onAddDelButtonClicked(notification) {
        var fenceItem = notification.sender.fenceItem;
        if (!!fenceItem) {
            var fenceObj = fenceItem.GetData(), isInstant = fenceObj.GetIsInstant();
            if(isInstant) { settings.list.AddFence(fenceObj.CreateCopy()); } else { settings.list.RemoveFence(fenceItem); }
        }
    }

    function getItemEditToolTip(notification) {
        var toolTipText = "Redesign";
        var fenceItem = notification.fenceItem;
        if (!!fenceItem) {
            var itemObj = fenceItem.GetData();
            var isInstant = itemObj.GetIsInstant();
            if (!isInstant) {
                toolTipText = "Redesign fence with the " + itemObj.GetEditorNameStr();
            }
        }
        return toolTipText;

    }
    function onEditButtonClicked(notification) {
        var fenceItem = notification.sender.fenceItem;
        if (!!fenceItem) {
            var fenceObj = fenceItem.GetData(), isInstant = fenceObj.GetIsInstant();
            if (!isInstant) {
                var appContent = settings.appContent, editorUseI, activateEditorCB, lineStringCoords;
                switch (fenceObj.GetType()) {
                    case tf.GeoFences.fenceTypes.polygon:
                        editorUseI = appContent.GetMeasureToolInterface();
                        activateEditorCB = activateMeasureTool;
                        var polyFeature = fenceObj.GetPolyFeature();
                        if (!!polyFeature) {
                            var appContent = settings.appContent;
                            var polyFeatureCoords = polyFeature.GetGeom().GetCoordinates()[0];
                            var nPolyFeatureCoords = polyFeatureCoords.length;
                            lineStringCoords = polyFeatureCoords.slice(0, nPolyFeatureCoords - 1);
                        }
                        break;
                    case tf.GeoFences.fenceTypes.extent:
                        editorUseI = appContent.GetDownloadToolInterface();
                        activateEditorCB = activateDownloadTool;
                        lineStringCoords = fenceObj.GetLineString();
                        break;
                }
                if (editorUseI != undefined) {
                    editorUseI.setLineString(lineStringCoords);
                    activateEditorCB();
                    settings.list.RemoveFence(fenceItem);
                }
            }
        }
    }

    function createNewContent(forItem) {
        var appContent = settings.appContent;
        var classNames = settings.cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: classNames.itemWrapperClassName });
        var contentWrapper = new tf.dom.Div({ cssClass: classNames.itemContentWrapperClassName });
        var button = new tf.dom.Button({ cssClass: classNames.itemButtonClassName, onClick: onItemClick });
        var toolBar = new tf.dom.Div({ cssClass: classNames.itemToolBarClassName });
        var title = new tf.dom.Div({ cssClass: classNames.itemTitleClassName });
        var count = new tf.dom.Div({ cssClass: classNames.itemCountClassName });
        var delayMillis = 0, toolTipClass = "*start", toolTipArrowClass = "top";
        var buttonSettings = {
            wrapper: tlf.toolBar.wrapper, offsetY: 0, onClick: undefined, onHover: undefined, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };

        var toolBarEditButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
            onClick: onEditButtonClicked
        }), undefined, classNames.itemToolBarTextButton + " " + classNames.itemToolBarFixWidthTextButton, getItemEditToolTip, undefined, "toolBarEdit");

        var toolBarAddDelButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
            onClick: onAddDelButtonClicked
        }), undefined, classNames.itemToolBarTextButton + " " + classNames.itemToolBarFixWidthTextButton, getItemAddDelToolTip, undefined, "toolBarAddDel");

        toolBarEditButton.GetButton().innerHTML = "EDIT";

        toolBar.AddContent(toolBarEditButton.GetButton(), toolBarAddDelButton.GetButton());

        contentWrapper.AddContent(title, count, toolBar);
        wrapper.AddContent(button, contentWrapper);

        toolBarEditButton.fenceItem = forItem;
        toolBarAddDelButton.fenceItem = forItem;

        var content = {
            wrapper: wrapper, button: button, contentWrapper: contentWrapper, toolBar: toolBar, title: title, count: count,
            toolBarAddDelButton: toolBarAddDelButton, toolBarEditButton: toolBarEditButton
        };

        button.content = content;

        return content;
    }

    function createListContent() {
        var contentInItemAttributeName = tf.js.GetNonEmptyString(settings.contentInItemAttributeName, "fenceContent");
        var itemInContentAttributeName = tf.js.GetNonEmptyString(settings.itemInContentAttributeName, "fenceItem");
        keyedListContent = new tf.TFMap.KeyedListContent({
            KL: settings.list.GetKL(), wrapper: tlf.scrollWrapper, contentWrapper: tlf.scrollContent,
            contentWrapperDisplayVisibleVerb: settings.cssClasses.GetContentWrapperDisplayVisibleVerb(),
            contentInItemAttributeName: contentInItemAttributeName, itemInContentAttributeName: itemInContentAttributeName,
            createNewContent: createNewContent, prepareSpareContent: prepareSpareContent, updateContentForItem: updateContentForItem,
            compareContent: tf.GeoFences.CompareFences
        });
    }

    function initialize() {
        if (settings.cssClasses == undefined) { settings.cssClasses = new tf.GeoFences.CSSClasses(settings); }
        createTLF();
        createListContent();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GeoFences.ListViewTargetListsCombo = function (settings) {
    var theThis, list, listFeatures, view, targetLists, cssClasses, countChangeListener;

    this.OnCreated = function (notification) { return view.OnCreated(notification); }
    this.UpdateForMapType = function () { targetLists.UpdateForMapType(); listFeatures.UpdateForMapType(); }
    this.OnVisibilityChange = function (notification) { view.OnVisibilityChange(notification); listFeatures.OnVisibilityChange(notification); }
    this.AddTargetList = function (targetListName, targetListToAdd) { return targetLists.AddTargetList(targetListName, targetListToAdd); }
    this.SetCurrentTargetList = function (targetListName) { targetLists.SetCurrentTargetList(targetListName); updateListViewCounts(); }

    function selectFenceItem(fenceItem, setExtent) {
        listFeatures.SetSelectedItem(fenceItem);
        view.SetSelectedItem(fenceItem);
        if (!!setExtent) { list.SetMapExtentFromItem(fenceItem); }
    }
    function deSelectFenceItem() { selectFenceItem(undefined); }

    function onViewItemClick(notification) {
        var clickedItem = notification.item; if (view.GetSelectedItem() == clickedItem) { deSelectFenceItem(); } else { selectFenceItem(clickedItem, true); }
    }

    function onFenceMapFeatureClick(notification) {
        var clickedItem = notification.item; if (listFeatures.GetSelectedItem() == clickedItem) { deSelectFenceItem(); } else { selectFenceItem(clickedItem, false); }
    }

    function updateListViewCounts() { view.UpdateCounts(targetLists.GetCurrentTargetsByFence()); }

    function onListCountChange(notification) { updateListViewCounts(); }

    function getGeoFenceLineStyle(keyedFeature, mapFeature) {
        var isAerial = settings.appContent.GetIsShowingAerial();
        var isHover = mapFeature.GetIsDisplayingInHover();
        var isSelected = listFeatures.GetSelectedMapFeature() == mapFeature;
        var line_width_solid = isHover ? 5 : 5;
        var colorLight = "#FFDEAD", colorDark = "#F0C789";
        var line_color_solid, line_color;
        var selColor = "#f00";
        line_color = isSelected ? selColor : colorLight;
        line_color_solid = isHover ? selColor : colorDark;
        var line_width = 13;
        var dashWidth = 4;
        var displace_solid = 2;
        var displace = 2;
        var outlineColor = tf.TFMap.LayoutSettings.darkTextColor;
        var zIndex = isSelected ? 10 : (isHover ? 20 : 0);
        return [
            { fill: false, line: true, line_width: line_width_solid + displace_solid, line_color: outlineColor, zindex: zIndex++ },
            { fill: false, line: true, line_width: line_width_solid, line_color: line_color_solid, zindex: zIndex++ },
            { fill: false, line: true, line_width: line_width + displace, line_color: outlineColor, line_join: "bevel", line_cap: "butt", line_dash: [dashWidth + displace, line_width - displace], zindex: zIndex++ },
            { fill: false, line: true, line_width: line_width, line_color: line_color, line_join: "bevel", line_cap: "butt", line_dash: [dashWidth, line_width], zindex: zIndex++ }
        ];
    }

    function initialize() {
        cssClasses = new tf.GeoFences.CSSClasses(settings);
        list = new tf.GeoFences.FenceList(tf.js.ShallowMerge(settings, { getStyle: getGeoFenceLineStyle }));
        listFeatures = new tf.GeoFences.FencesMapFeatures(tf.js.ShallowMerge(settings, { list: list, onMapFeatureClick: onFenceMapFeatureClick }));
        view = new tf.GeoFences.FenceListView(tf.js.ShallowMerge(settings, { list: list, cssClasses: cssClasses, onItemClick: onViewItemClick }));
        targetLists = new tf.GeoFences.TargetLists(tf.js.ShallowMerge(settings, { list: list }));
        countChangeListener = targetLists.AddCountChangeListener(onListCountChange);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

