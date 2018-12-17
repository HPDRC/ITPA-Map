"use strict";

tf.TFMap.PinMapFeature = function(settings) {
    var theThis, mapFeature, isInLayer, lastToMapFeature;

    this.GetMapFeature = function() { return mapFeature; }
    this.GetLastToMapFeature = function() { return lastToMapFeature; }
    this.Update = function(toMapFeature) { if (!!toMapFeature) { lastToMapFeature = toMapFeature; showAt(toMapFeature.GetPointCoords()); } else { hide(); } }

    function showAt(pointCoords) {
        if (!mapFeature) { createMapFeature(); }
        var nowCoords = mapFeature.GetPointCoords();
        if (nowCoords[0] != pointCoords[0] || nowCoords[1] != pointCoords[1]) {
            mapFeature.SetPointCoords(pointCoords);
            mapFeature.RefreshStyle();
        }
        if (!isInLayer) { settings.layer.AddMapFeature(mapFeature); isInLayer = true; }
    }

    function hide() { if (isInLayer) { settings.layer.DelMapFeature(mapFeature); isInLayer = false; } }

    function createMapFeature() {
        var geom = { type: 'point', coordinates: [0, 0] };
        var toolTipProps = { toolTipText: "Get Directions", keepOnHoverOutTarget: false, offsetX: 16 };
        mapFeature = new tf.map.Feature(settings.addStyles(geom));
        tf.TFMap.SetMapFeatureToolTipProps(mapFeature, toolTipProps);
    }

    function initialize() {
        isInLayer = false;
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

