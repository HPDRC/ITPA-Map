"use strict";

tf.TFMap.AppSizer = function(settings) {
    var theThis, onResizeCB;

    this.OnResize = function() { return onResize(); }

    function onResize() {
        //var winDims = tf.dom.GetWindowDims();
        //document.body.style.width = winDims[0] + "px";
        //document.body.style.height = winDims[1] + "px";
        if (!!onResizeCB) { onResizeCB(); }
    }

    function initialize() {
        onResizeCB = tf.js.GetFunctionOrNull(settings.onResize);
        tf.events.AddDOMEventListener(window, tf.consts.DOMEventNamesResize, onResize);
        new tf.events.DOMFullScreenChangeListener({ callBack: onResize, optionalScope: theThis });
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

