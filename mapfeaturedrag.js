"use strict";

tf.TFMap.MapFeatureDrag = function (settings) {
    var theThis, map, isDragging, mapFeatureToDrag, deltaPixDrag, curDragProps, checkCanStartDragCB, checkCanDragToCB, onStartDragCB, onDragCB, onEndDragCB;

    function makeVerbProps(verb) { return { verb: verb }; }
    function makeNotifyProps() { return { sender: theThis, isDragging: isDragging, dragProps: curDragProps, mapFeatureToDrag: mapFeatureToDrag }; }
    function notify(CB, props) { if (!!CB) { CB(tf.js.ShallowMerge(props, makeNotifyProps())); } }

    function checkCanStartDrag(mapFeature) { return !!checkCanStartDragCB ? checkCanStartDragCB({ sender: theThis, mapFeature: mapFeature }) : {}; }

    function getIsDragging() { return isDragging; }

    function startDrag(mapFeature, pointCoords, dragProps, skipNotify) {
        onEndDrag();
        if (!!mapFeature && tf.js.GetIsValidObject(dragProps)) {
            curDragProps = dragProps;
            mapFeatureToDrag = mapFeature;
            map.RemoveDragPan();
            //console.log('removed drag pan');
            var dragDownPixelCoords = map.MapToPixelCoords(pointCoords);
            var dragDownStartCoords = map.MapToPixelCoords(mapFeatureToDrag.GetPointCoords());
            deltaPixDrag = [dragDownPixelCoords[0] - dragDownStartCoords[0], dragDownPixelCoords[1] - dragDownStartCoords[1]];
            isDragging = true;
            if (!skipNotify) { notify(onStartDragCB, makeVerbProps("start")); }
        }
        return isDragging;
    }

    function onDrag(notification) {
        var mapFeatureCandidate = notification.mapFeature, pointCoords = notification.eventCoords;
        if (!isDragging) { startDrag(mapFeatureCandidate, pointCoords, checkCanStartDrag(mapFeatureCandidate), false); }
        return isDragging;
    }

    function onDragMove(notification) {
        if (isDragging) {
            var pointCoords = notification.eventCoords;
            var canDrag = !!checkCanDragToCB ? checkCanDragToCB(tf.js.ShallowMerge(makeNotifyProps(), { pointCoords: pointCoords })) : true;
            if (canDrag) {
                var draggingPixelCoords = map.ActualMapToPixelCoords(pointCoords);
                draggingPixelCoords[0] -= deltaPixDrag[0];
                draggingPixelCoords[1] -= deltaPixDrag[1];
                var newCoords = map.ActualPixelToMapCoords(draggingPixelCoords);
                mapFeatureToDrag.SetPointCoords(newCoords);
                notify(onDragCB, makeVerbProps("drag"));
            }
        }
        return isDragging;
    }

    function onEndDrag() {
        var wasDragging = isDragging;
        if (isDragging) {
            isDragging = false; mapFeatureToDrag = undefined; map.AddDragPan(); notify(onEndDragCB, makeVerbProps("end"));
        }
        return wasDragging;
    }

    function initialize() {
        if (tf.js.GetFunctionOrNull(settings.setInterface)) {
            checkCanStartDragCB = tf.js.GetFunctionOrNull(settings.checkCanStartDrag);
            onStartDragCB = tf.js.GetFunctionOrNull(settings.onStartDrag);
            onDragCB = tf.js.GetFunctionOrNull(settings.onDrag);
            onEndDragCB = tf.js.GetFunctionOrNull(settings.onEndDrag);
            checkCanDragToCB = tf.js.GetFunctionOrNull(settings.checkCanDragTo);
            map = settings.map;
            isDragging = false;
            settings.setInterface({ sender: theThis, getIsDragging: getIsDragging, onDrag: onDrag, onDragMove: onDragMove, onEndDrag: onEndDrag, startDrag: startDrag });
        }
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

