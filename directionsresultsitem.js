"use strict";

tf.TFMap.DirectionsResultsItem = function(settings) {
    var theThis, wrapper, subDirections, content, iconButton, itemDistance, lastInstruction, selectedDiv;
    var clickListener, subDirectionsClickListener;
    var mapFeature, mapFeatureInLayer;
    var subDirectionsFrom, subDirectionsTo;

    this.GetMapFeature = function() { return mapFeature; }

    this.SetSelected = function (bool) { tf.dom.ReplaceCSSClassCondition(selectedDiv, !!bool, settings.itemClassNames.wrapperVisibleClassName, settings.itemClassNames.wrapperHiddenClassName); }

    this.GetWrapper = function() { return wrapper; }

    this.UpdateDistance = function() { return updateDistance(); }

    this.Update = function(instructionsAndRoute, index) {
        var appContent = settings.appContent;
        var appStyles = appContent.GetAppStyles();
        var instructions = instructionsAndRoute.instructions;
        var instruction = instructions[index];
        var props = instruction.properties;
        var code = props.instructionCode;
        var codeSVG;
        var directionSVGs = appStyles.GetDirectionsStepsSVGs();
        var instructionHTML;
        var needsWalkSubDirections;
        if (instructionsAndRoute.transitInstructions) {
            switch (code) {
                //case tf.Transit.PlanTripSteps.arriveAtEndLocation:
                //case tf.Transit.PlanTripSteps.fromStartLocation:
                case tf.Transit.PlanTripSteps.walkFromStartToStop:
                case tf.Transit.PlanTripSteps.walkFromStopToNearbyStop:
                case tf.Transit.PlanTripSteps.walkFromStopToEndLocation:
                case tf.Transit.PlanTripSteps.walkFromStartToEndLocation:
                    codeSVG = appStyles.GetWalkSVG();
                    needsWalkSubDirections = true;
                    subDirectionsFrom = instruction.fromCoords;
                    subDirectionsTo = instruction.toCoords;
                    break;
                case tf.Transit.PlanTripSteps.takeTripAtStop:
                    codeSVG = appStyles.GetBusSVG();
                    break;
                case tf.Transit.PlanTripSteps.leaveTripAtStop:
                    codeSVG = appStyles.GetBusStopSVG();
                    break;
            }
            var instructionStr = props.instruction;
            instructionHTML = instructionStr;
            //instructionHTML = code + ' ' + instruction;
        }
        else {
            codeSVG = directionSVGs[code];
            instructionHTML = props.instruction + " " + props.streetName;
        }
        //var innerHTML = (index + 1) + ' ' + instructionHTML;
        subDirections.GetHTMLElement().style.display = needsWalkSubDirections ? "block" : "none";
        var innerHTML = instructionHTML;
        theThis.SetSelected(false);
        lastInstruction = instruction;
        iconButton.GetHTMLElement().innerHTML = codeSVG;
        content.GetHTMLElement().innerHTML = innerHTML;
        updateDistance();
        updateMapFeature();
    }

    this.Hide = function() {
        if (!!mapFeature) {
            if (mapFeatureInLayer) {
                mapFeatureInLayer = false;
                settings.itemsLayer.DelMapFeature(mapFeature);
            }
        }
    }

    function updateMapFeature() {
        if (lastInstruction != undefined) {
            var instruction = lastInstruction;
            var geom = tf.js.ShallowMerge(instruction.geometry);
            var props = instruction.properties;
            var toolTipProps = { toolTipText: props.instruction + " " + props.streetName, keepOnHoverOutTarget: false, offsetX: 20 };
            var angle = props.postTurnDirection * Math.PI / 180;
            if (mapFeature == undefined) {
                mapFeature = new tf.map.Feature(tf.js.ShallowMerge(geom, settings.itemMapFeatureStyles));
                mapFeature.GetSettings().directionsResultsItem = theThis;
            }
            else {
                mapFeature.SetPointCoords(geom.coordinates);
            }
            mapFeature.GetSettings().directionsAngle = angle;
            mapFeature.RefreshStyle();
            tf.TFMap.SetMapFeatureToolTipProps(mapFeature, toolTipProps);
            settings.itemsLayer.AddMapFeature(mapFeature);
            mapFeatureInLayer = true;
        }
    }

    function updateDistance() {
        if (lastInstruction != undefined) {
            var instruction = lastInstruction;
            var props = instruction.properties;
            var useUSScaleUnits = settings.appContent.GetMap().GetIsUSScaleUnits();
            var distanceText = tf.TFMap.GetDirectionsDistanceText(props.lengthMeters, useUSScaleUnits);
            /*if (!!instruction.step) {
                distanceText += " (" + tf.TFMap.GetWalkRideDistanceStr(instruction.step.walkkm, instruction.step.tripkm, useUSScaleUnits) + ")";
            }*/
            itemDistance.GetHTMLElement().innerHTML = distanceText;
        }
    }

    function onClickWrapper(notification) { if (tf.js.GetFunctionOrNull(settings.onClick)) { settings.onClick({ sender: theThis }); } }

    function onClickSubDirections() {
        //console.log('From: ' + subDirectionsFrom + ' to: ' + subDirectionsTo);
        settings.appContent.GetDirectionsPanel().PushDirections({
            fromCoords: subDirectionsFrom,
            toCoords: subDirectionsTo,
            mode: tf.TFMap.directionModeWalk
        });
    }

    function createControl() {
        var itemClassNames = settings.itemClassNames;
        wrapper = new tf.dom.Div({ cssClass: itemClassNames.wrapperClassName });
        subDirections = new tf.dom.Div({ cssClass: itemClassNames.subDirectionsClassName });
        content = new tf.dom.Div({ cssClass: itemClassNames.contentClassName });
        iconButton = new tf.dom.Div({ cssClass: itemClassNames.iconClassName });
        itemDistance = new tf.dom.Div({ cssClass: itemClassNames.itemDistanceClassName });
        selectedDiv = new tf.dom.Div({ cssClass: itemClassNames.itemSelectedClassName });
        wrapper.AddContent(iconButton, subDirections, content, itemDistance, selectedDiv);
        clickListener = new tf.events.DOMClickListener({ target: wrapper, callBack: onClickWrapper, optionalScope: theThis, callBackSettings: null });
        subDirectionsClickListener = new tf.events.DOMClickListener({ target: subDirections, callBack: onClickSubDirections, optionalScope: theThis, callBackSettings: null });
    }

    function initialize() {
        createControl();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

