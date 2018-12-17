"use strict";

tf.TFMap.IconButton = function(settings) {
    var theThis, button, onClickCB, onHoverCB;
    var hoverListener;

    this.GetSettings = function() { return settings; }
    this.GetButton = function() { return button; }

    function onClickButton(event) { onClickCB({ sender: theThis, event: event }); }
    function onHoverButton(notification) { onHoverCB({ sender: theThis, notification: notification }); }

    function initialize() {
        onClickCB = tf.js.GetFunctionOrNull(settings.onClick);
        onHoverCB = tf.js.GetFunctionOrNull(settings.onHover);
        button = document.createElement('button');
        button.className = tf.js.GetNonEmptyString(settings.cssClass, "");
        if (tf.js.GetIsNonEmptyString(settings.svgHTML)) { button.innerHTML = settings.svgHTML; }
        if (!!onClickCB) { button.addEventListener("click", onClickButton); }
        if (!!onHoverCB) { hoverListener = new tf.events.DOMHoverListener({ target: button, callBack: onHoverButton, optionalScope: theThis, callBackSettings: null }); }
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

