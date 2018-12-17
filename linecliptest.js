"use strict";

tf.TFMap.LineClipTestTool = function (settings) {
    var theThis, lsEdI;

    function onLSEdInited(notification) { var myInterface = { sender: theThis }; settings.setInterface(tf.js.ShallowMerge(lsEdI = notification, myInterface)); }

    function initialize() {
        if (tf.js.GetFunctionOrNull(settings.setInterface)) {
            var commonSettings = tf.js.ShallowMerge(settings, {
                requestCloseSender: theThis,
                scaleExtent: 0.7,
                showMeasures: true,
                showArea: true,
                setInterface: onLSEdInited
            });
            new tf.TFMap.LSEd(commonSettings);
        }
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
