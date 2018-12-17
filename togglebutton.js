"use strict";

tf.TFMap.ToggleButton = function(settings) {
    var theThis, classToggled, classNotToggled, button, autoToggle, isToggled, onClickCB, onHoverCB;
    var hoverListener;

    this.GetButton = function() { return button; }

    this.GetIsToggled = function() { return isToggled; }
    this.SetIsToggled = function(bool) { return setIsToggled(bool); }

    this.SetClassToggled = function(newClassToggled) {
        if (isToggled) { tf.dom.ReplaceCSSClassCondition(button, true, newClassToggled, classToggled); }
        classToggled = newClassToggled;
    }

    this.SetClassNotToggled = function(newClassNotToggled) {
        if (!isToggled) { tf.dom.ReplaceCSSClassCondition(button, true, newClassNotToggled, classNotToggled); }
        classNotToggled = newClassNotToggled;
    }

    function setCSSClasses() {
        tf.dom.ReplaceCSSClassCondition(button, isToggled, classToggled, classNotToggled);
    }

    function setIsToggled(bool) {
        if (isToggled != (bool = !!bool)) {
            isToggled = bool;
            setCSSClasses();
        }
    }

    function onClickToggleButton(event) { if (!!autoToggle) { setIsToggled(!isToggled); } if (!!onClickCB) { onClickCB({ sender: theThis }); } }
    function onHoverToggleButton(notification) { onHoverCB({ sender: theThis, notification: notification }); }

    function initialize() {
        onClickCB = tf.js.GetFunctionOrNull(settings.onClick);
        onHoverCB = tf.js.GetFunctionOrNull(settings.onHover);
        autoToggle = settings.autoToggle != undefined ? !!settings.autoToggle : true;
        classToggled = settings.classToggled;
        classNotToggled = settings.classNotToggled;
        button = document.createElement('button');
        button.className = settings.buttonClassName;
        if (tf.js.GetIsNonEmptyString(settings.svgHTML)) {
            button.innerHTML = settings.svgHTML;
        }
        var isToggleInit = settings.isToggled != undefined ? !!settings.isToggled : false;
        isToggled = !isToggleInit;
        setIsToggled(isToggleInit);
        button.addEventListener("click", onClickToggleButton);
        if (!!onHoverCB) { hoverListener = new tf.events.DOMHoverListener({ target: button, callBack: onHoverToggleButton, optionalScope: theThis, callBackSettings: null }); }
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

