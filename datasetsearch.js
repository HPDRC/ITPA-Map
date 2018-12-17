"use strict";

tf.TFMap.DataSetSearch = function(settings) {
    var theThis, urlStart, searchAjaxRequest, searchResults, addedSearchResults, deletedSearchResults, maxRecords, isSearching;
    var dataSetTitle;
    var gen;
    var lastSearchCompletedOK;
    var searchCenter, searchRes;
    var lastSearchCenter, lastSearchRes;
    var nDLayerExtent, initialExtent;
    var startURLPart, endURLPart;

    this.GetInitialExtent = function() { return initialExtent; }
    this.GetDataSetTitle = function() { return dataSetTitle; }
    this.GetColor = function() { return settings.color; }
    this.GetTitle = function() { return settings.title; }
    this.GetUpdateVerb = function() { return settings.updateVerb; }
    this.GetCount = function() { return searchResults.GetCount(); }
    this.GetSettings = function() { return settings; }
    this.Search = function() { if (checkNeedsSearch()) { changeContext(true); doSearchQuery(); } }
    this.GetIsSearching = function() { return isSearching; }
    this.GetLastSearchCompletedOK = function() { return lastSearchCompletedOK; }
    //this.GetIsSearching = function () { return !!searchAjaxRequest; }
    this.GetAddedAndDeletedSearchResults = function() { return { addedResults: addedSearchResults, deletedResults: deletedSearchResults }; }
    this.GetSearchItems = function() { return searchResults.GetHeap(); }

    function checkNeedsSearch() {
        var needsSearch = (lastSearchCenter == undefined);
        if (!needsSearch) {
            var autoRefreshes = settings.appContent.GetAppCtx().GetCtxAttribute(settings.autoRefreshVerb);
            if (autoRefreshes) {
                var map = settings.appContent.GetMap();
                var center = map.GetCenter(), res = map.GetResolution();
                needsSearch = res != lastSearchRes || center[0] != lastSearchCenter[0] || center[1] != lastSearchCenter[1];
            }
        }
        return needsSearch;
    }

    function changeContext(isSearchingSet) {
        settings.appContent.GetAppCtx().SetCtxAttribute(settings.updateVerb, isSearching = isSearchingSet);
    }

    function getKey(result) { var props = result.properties; return props.Display_Label + '|' + props.lon + '|' + props.lat; }

    function compareSearchResults(a, b) { return a.priority - b.priority; }

    function getKeyFromResult(result) { return result.key; }

    function onEndSearch(notification) {
        //settings.appContent.GetAppCtx().SetCtxAttribute(tf.TFMap.CAN_selectedToolTipSender, undefined);
        //settings.appContent.ShowMapFeatureProps(undefined);
        searchAjaxRequest = undefined;
        addedSearchResults = [];
        deletedSearchResults = [];
        lastSearchCompletedOK = false;
        if (notification.requestProps.gen == gen) {
            if (!tf.js.GetIsValidObject(notification) || !tf.js.GetIsValidObject(notification.data)) {
                if (tf.TFMap.UseCachedDataSets) {
                    try {
                        switch (dataSetTitle) {
                            case "Hotels":
                                notification = { data: hotels };
                                break;
                            case "Sights":
                                notification = { data: geoImages };
                                break;
                            case "Restaurants":
                                notification = { data: restaurants };
                                break;
                            case "MLS":
                                notification = { data: callReal };
                                break;
                        }
                    } catch (e) { }
                }
            }

            if (tf.js.GetIsValidObject(notification) && tf.js.GetIsValidObject(notification.data)) {
                var dataSetProps = notification.data;
                var results = dataSetProps.features;
                if (lastSearchCompletedOK = tf.js.GetIsArray(results)) {
                    lastSearchCenter = searchCenter;
                    lastSearchRes = searchRes;
                    if (tf.js.GetIsNonEmptyArray(results)) {
                        //setDataSetTitle(tf.js.GetNonEmptyString(dataSetProps.title, settings.title));
                        var timeNow = new Date().getTime();
                        var nRecentResults = results.length;
                        var prefix = "http://", len_of_prefix = prefix.length;

                        for (var i = nRecentResults - 1; i >= 0; --i) {
                            var result = results[i], resultProps = result.properties;
                            var existingItem = searchResults.GetItem(result.key = getKey(result));
                            if (!!existingItem) { existingItem.priority = timeNow - nRecentResults - 2; searchResults.Update(existingItem); }
                            else {
                                var nameValue = tf.js.GetNonEmptyString(resultProps[settings.markerNameField], dataSetTitle);
                                var isImageMarker = nameValue.trim().toLowerCase().substring(0, len_of_prefix) == prefix;
                                if (isImageMarker) { result.mapFeatureImageSrc = nameValue; }
                                result.compassDirectionAngle = tf.js.CompassDirectionToAngle(resultProps.compass_direction);
                                result.mapFeatureText = nameValue;
                                result.priority = timeNow + (nRecentResults - i);
                                addedSearchResults.push(result);
                                searchResults.Insert(result);
                            }
                        }

                        if (nDLayerExtent != undefined && initialExtent == undefined) {
                            //if (nDLayerExtent < nRecentResults) { nDLayerExtent = nRecentResults; }
                            if (nDLayerExtent > nRecentResults) { nDLayerExtent = nRecentResults; }
                            for (var i = 0; i < nDLayerExtent; ++i) {
                                var coord = results[i].geometry.coordinates.slice(0);
                                initialExtent = tf.js.UpdateMapExtent(initialExtent, coord);
                            }
                            nDLayerExtent = undefined;
                        }

                        if (maxRecords != undefined) {
                            var selectedSearch = settings.appContent.GetAppCtx().GetCtxAttribute(tf.TFMap.CAN_selectedSearch);
                            if (!!selectedSearch) {
                                var searchResult = tf.TFMap.GetSearchFeature(selectedSearch);
                                if (!!searchResult) { searchResult.priority = timeNow - nRecentResults - 3; searchResults.Update(searchResult); }
                            }
                            var maxRecordsUse = maxRecords;
                            if (maxRecordsUse < nRecentResults) { maxRecordsUse = nRecentResults }
                            var count = searchResults.GetCount(), nRecordsDelete = count - maxRecordsUse;
                            if (nRecordsDelete > 0) { for (var j = 0; j < nRecordsDelete; ++j) { deletedSearchResults.push(searchResults.PopRoot()); } }
                        }
                    }
                }
            }
            changeContext(false);
        }
        //else { console.log('skipping stale search response'); }
    }

    function buildSearchURL() {
        var map = settings.appContent.GetMap();
        var center = map.GetCenter(), res = map.GetResolution();
        var locationPart = "&x1=" + center[0] + "&y1=" + center[1] + "&cres=" + res;
        var searchURL = startURLPart + locationPart + endURLPart + "&filetype=.json";
        searchCenter = center;
        searchRes = res;
        //console.log(searchURL);
        return searchURL;
    }

    function buildSearchURL2() {
        var map = settings.appContent.GetMap();
        var center = map.GetCenter(), res = map.GetResolution(), url = urlStart + "&x1=" + center[0] + "&y1=" + center[1] + "&cres=" + res;
        searchCenter = center;
        searchRes = res;
        url += "&filetype=.json";
        return url;
    }

    function doSearchQuery() {
        var serviceURL = buildSearchURL();
        if (!!searchAjaxRequest) { searchAjaxRequest.Cancel(); }
        addedSearchResults = [];
        deletedSearchResults = [];
        searchAjaxRequest = new tf.ajax.JSONGet().Request(serviceURL, function(notification) { onEndSearch(notification); }, theThis, { gen: ++gen }, false, undefined, undefined, undefined);
        changeContext(true);
    }

    function setDataSetTitle(newTitle) {
        dataSetTitle = newTitle;
    }

    function buildURLParts(fromURL) {
        var brokenURL = tf.urlapi.BreakUrlParamString(fromURL);
        var paramsPart = brokenURL.paramsPart;
        var startPart = brokenURL.urlPart + brokenURL.tag, endPart = "";
        var paramStringArray = paramsPart.split("&");
        var paramStringArrayLen = paramStringArray.length;
        if (paramStringArrayLen) {
            var numFindParamName = "numfind", arCriteriaParamName = "arcriteria", fileTypeParamName = "filetype";
            var inStartPart = true, hadPrev = false, hadStartParams = false;
            for (var i = 0; i < paramStringArrayLen; ++i) {
                var equalIndex = paramStringArray[i].indexOf("=");
                if (equalIndex != -1) {
                    var key = paramStringArray[i].substring(0, equalIndex), keyLower = key.toLowerCase();
                    var value = paramStringArray[i].substring(equalIndex + 1, paramStringArray[i].length);
                    var isArCriteria = false, skipParam = false;
                    switch (keyLower) {
                        case numFindParamName: case fileTypeParamName: skipParam = true; break;
                        case arCriteriaParamName: isArCriteria = true; break;
                    }
                    if (!skipParam) {
                        if (isArCriteria) { hadPrev = true; inStartPart = false; }
                        if (inStartPart) { if (hadPrev) { startPart += '&'; } startPart += key + '=' + value; hadStartParams = true; }
                        else { if (hadPrev) { endPart += '&'; } endPart += key + '=' + value; }
                        hadPrev = true;
                    }
                }
            }
            if (inStartPart) {
                endPart += "&" + arCriteriaParamName + "=1";
            }
            endPart += "&numfind=20";
        }
        //console.log("START: " + startPart);
        //console.log("END: " + endPart);
        return { startPart: startPart, endPart: endPart };
    }

    function initialize() {
        nDLayerExtent = settings.nDLayerExtent;
        lastSearchCompletedOK = true;
        gen = 0;
        setDataSetTitle(settings.title);
        isSearching = false;
        maxRecords = settings.maxRecords;
        searchResults = new tf.js.BinaryHeap({ compareFunction: compareSearchResults, getItemKeyFunction: getKeyFromResult });
        addedSearchResults = [];
        deletedSearchResults = [];
        var urlParts = buildURLParts(tf.js.GetNonEmptyString(settings.urlStart, "http://acorn.cs.fiu.edu/cgi-bin/arquery.cgi?category=itpall&vid=itpa&numfind=20&tfaction=shortdisplayflash"));

        startURLPart = urlParts.startPart;
        endURLPart = urlParts.endPart;

        urlStart = tf.js.GetNonEmptyString(settings.urlStart, "http://acorn.cs.fiu.edu/cgi-bin/arquery.cgi?category=itpall&vid=itpa&numfind=20&tfaction=shortdisplayflash");
        settings.searchMapFeatures.SetDataSet(theThis);
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

