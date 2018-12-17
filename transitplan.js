"use strict";

tf.Transit.PlanTripSteps = {
    fromStartLocation: 0,
    walkFromStartToStop: 1,
    takeTripAtStop: 2,
    leaveTripAtStop: 3,
    walkFromStopToNearbyStop: 4,
    walkFromStopToEndLocation: 5,
    walkFromStartToEndLocation: 6,
    arriveAtEndLocation: 1000
};

tf.Transit.PlanService = function (settings) {
    var theThis, planSettings, defaultErrorMessage, instructionsAndRouteGeom, superCancel, onFullDirectionsLoadedCB, defaultFoundMessage;

    this.GetInstructionsAndRouteGeom = function () { return instructionsAndRouteGeom; }

    this.GetPlan = function (from, to) {
        var dateRequested = new Date(), dateRequestedTimeStamp = tf.js.GetTimeStampFromDate(dateRequested);
        planSettings.date = dateRequestedTimeStamp;
        //planSettings.date = '2018-05-04 10:30:00.0';
        //planSettings.date = '2018-05-08 13:29:00.0';
        //planSettings.date = '2018-05-09 08:34:00.0';
        planSettings.x1 = from[0];
        planSettings.y1 = from[1];
        planSettings.x2 = to[0];
        planSettings.y2 = to[1];
        theThis.RefreshNow(planSettings);
    }

    function preparePlan(data, planIndex, polyCode) {
        var extent;
        var instructions = [], routeGeom = [];
        var plan = data.plans[planIndex];
        var steps = plan.steps, nSteps = steps.length;
        var lastStep = steps[nSteps - 1], prevStep;
        var lastLengthInMeters = 0;
        var total_time = plan.endHMS - plan.startHMS;
        var total_distance = (lastStep.tripkm + lastStep.walkkm) * 1000;
        for (var i = 0; i < nSteps; ++i) {
            var step = steps[i], coords = step.coords;
            var lengthInMeters = (step.tripkm + step.walkkm) * 1000;
            var instructionData = {
                index: i,
                step: step,
                geometry: { type: 'point', coordinates: coords },
                properties: { instructionCode: step.type, streetName: "", instruction: step.desc, lengthMeters: lengthInMeters - lastLengthInMeters, postTurnDirection: 0 }
            };
            //var walkingInstructions = !!step.wi ? tf.js.JSONParse(step.wi) : undefined;
            lastLengthInMeters = lengthInMeters;
            var startHMS = tf.js.TranslateHourMinSec(plan.startHMS);
            var hms = tf.js.TranslateHourMinSec(step.hms);
            switch (step.type) {
                case tf.Transit.PlanTripSteps.walkFromStartToEndLocation:
                    total_time = plan.endHMS - step.hms_start_walk_from_start_to_end;
                    instructionData.fromCoords = data.startCoords;
                    instructionData.toCoords = coords;
                    instructionData.properties.instruction = tf.js.TranslateHourMinSec(step.hms_start_walk_from_start_to_end).HM + " - " + instructionData.properties.instruction;
                    break;
                case tf.Transit.PlanTripSteps.walkFromStartToStop:
                    instructionData.fromCoords = data.startCoords;
                    instructionData.toCoords = coords;
                    instructionData.properties.instruction = startHMS.HM + " - " + instructionData.properties.instruction;
                    break;
                case tf.Transit.PlanTripSteps.walkFromStopToNearbyStop:
                    instructionData.fromCoords = prevStep.coords;
                    instructionData.toCoords = coords;
                    instructionData.properties.instruction = hms.HM + " - " + instructionData.properties.instruction;
                    break;
                case tf.Transit.PlanTripSteps.walkFromStopToEndLocation:
                    instructionData.fromCoords = prevStep.coords;
                    instructionData.toCoords = coords;
                    instructionData.properties.instruction = hms.HM + " - " + instructionData.properties.instruction;
                    break;
                case tf.Transit.PlanTripSteps.leaveTripAtStop:
                case tf.Transit.PlanTripSteps.takeTripAtStop:
                    instructionData.properties.instruction = hms.HM + " - " + instructionData.properties.instruction;
                    break;
            }
            instructions.push(instructionData);
            extent = tf.js.UpdateMapExtent(extent, coords);
            if (tf.js.GetIsNonEmptyString(step.tripCls)) {
                var coords = polyCode.DecodeLineString(JSON.parse(step.tripCls), 6);
                //var startIndex = prevStep.sindex > 0 ? prevStep.sindex - 1 : 0;
                var startIndex = prevStep.sindex;
                var endIndex = step.sindex + 2 <= coords.length ? step.sindex + 2 : coords.length;
                coords = coords.slice(startIndex, endIndex);
                if (startIndex < endIndex) {
                    coords[0] = prevStep.coords;
                    coords[coords.length - 1] = step.coords;
                }
                var colorStr = tf.js.GetIsNonEmptyString(step.colorStr) ? '#' + step.colorStr : '#f00';
                routeGeom.push({ coords: coords, isWalk: false, colorStr: colorStr });
            }
            if (tf.js.GetIsNonEmptyArray(step.wg)) {
                routeGeom.push({ coords: step.wg, isWalk: true });

            }
            prevStep = step;
        }
        return {
            plan: plan, transitInstructions: true, total_distance: total_distance, total_time: total_time,
            instructions: instructions, message: "Found route between points", routeGeom: routeGeom, success: true, extent: extent
        };
    };

    function getReturnInstructions(success, allPlans) {
        return {
            allPlans: allPlans, message: success ? defaultFoundMessage : defaultErrorMessage, success: success
        };
    };

    function getInstructionsAndRouteGeom(data) {
        if (tf.js.GetIsValidObject(data) && (data.success) && (data.nPlans > 0)) {
            var polyCode = new tf.map.PolyCode();
            var allPlans = [];
            for(var i = 0; i < data.nPlans; ++i) {
                allPlans.push(preparePlan(data, i, polyCode));
            }
            //allPlans[0].allPlans = allPlans;
            return getReturnInstructions(true, allPlans);
        }
        else {
            return getReturnInstructions(false, []);
        }
    };

    function preProcessServiceData(data) {
        instructionsAndRouteGeom = getInstructionsAndRouteGeom(data);
        checkFullDirectionsLoaded();
        return undefined;
    }

    function cancelHook() {
        superCancel.apply(theThis, arguments);
    }

    function checkFullDirectionsLoaded() { onFullDirectionsLoaded(); };

    function onFullDirectionsLoaded() { if (!!onFullDirectionsLoadedCB) { onFullDirectionsLoadedCB({ sender: theThis }); } }

    function initialize() {
        onFullDirectionsLoadedCB = tf.js.GetFunctionOrNull(settings.onFullDirectionsLoaded);
        defaultFoundMessage = "Found route between points";
        defaultErrorMessage = "Transit server not available ";
        planSettings = {
            use_stage_agencies: !!settings.useStageBusDirections,
            includetg: true,
            includewi: true,
            x1: 0, y1: 0, x2: 0, y2: 0,
            r1: 3,    // km
            r2: 3,    // km
            //r1: 1,    // km
            //r2: 1,    // km
            //maxmins: 240,
            //maxmins: 240,
            maxmins: 360,
            //maxmins: 180,
            maxtrips: 9,
            //maxtrips: 3,
            //maxstopr: 2,  //km
            maxstopr: 1,  //km
            //maxplans: 1,
            //maxplans: 200,
            maxplans: 2000,
            //maxplans: 20000,
            //maxplans: 20000000,
            returnfirst: true,
            //returnfirst: false,
            mintripdist: 0.4    //km
            //mintripdist: 0.1    //km
        };
        instructionsAndRouteGeom = getInstructionsAndRouteGeom(undefined);
        tf.Transit.BackendService.call(theThis, tf.js.ShallowMerge({ serviceName: "plans", preProcessServiceData: preProcessServiceData, skipAgency: true }, settings));
        superCancel = theThis.Cancel;
        theThis.Cancel = cancelHook;
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.Transit.PlanService, tf.Transit.BackendService);


//-80.12769, lat 26.02380

//http://localhost/map/debug.html?fmap=m2&directionsbus=1&type=map&Lat=26.02380&Lon=-80.12769&res=&Legendh=$$http://n00.cs.fiu.edu/defaultmapWMFL$$&DLayerSelect1=true&dlayerfield1=L&DLayerColor1=&DLayerLegend1=Restaurants&DLayerData1=http%3A//acorn.cs.fiu.edu/cgi-bin/arquery.cgi%3Fcategory%3Dus_companies_2013%26tfaction=shortdisplayflash&numfind=5%26arcriteria=1%26Industry=Eating%26filetype=.json&Panels=type+zoom+nav+overview+measure+download+legend+fullscreen&vid=itpa&tf_passtrough=%26tfaction%3Ddispense%26sreq%3Dgnisstr