"use strict";

tf.TFMap.InputBox = function(settings) {
    var theThis, inputBox, changeCB, changeVerb, goCB, goVerb, maxLength;

    this.GetInputBox = function() { return inputBox; }

    this.SetText = function(text, skipNotify) {
        inputBox.value = (tf.js.GetNonEmptyString(text, "").substring(0, maxLength)).trim();
        if (!skipNotify) { onInputChange(false); }
    }
    this.GetText = function() { return inputBox.value.trim(); }
    this.GetUnTrimText = function() { return inputBox.value; }

    function notify(cb, verb, addProps) { if (!!cb) { cb(tf.js.ShallowMerge(addProps, { sender: theThis, verb: verb })); } }

    function onInputChange(byUser) { notify(changeCB, changeVerb, { byUser: byUser }); }

    function onInputChangeEvent() { return onInputChange(true); }
    function onInputKeyPressEvent(event) {
        var eventCode = tf.js.GetKeyCodeFromEvent(event);
        if (eventCode == 13) { notify(goCB, goVerb); }
        else { onInputChangeEvent(true); }
    }

    function onInputKeyDownEvent(event) {
        var eventCode = tf.js.GetKeyCodeFromEvent(event);
        if (eventCode == 9) {
            var focusTarget = event.shiftKey ? settings.nextFocusTarget : settings.prevFocusTarget;
            if (!!focusTarget) {
                focusTarget.focus();
                if (event.preventDefault) {
                    event.preventDefault();
                }
                return false;
            }
        }
    }

    function createControl(className, placeHolder, type, style, id, autocomplete) {
        inputBox = document.createElement('input');
        if (id !== undefined) { inputBox.id = '' + id; }
        if (autocomplete != undefined) { inputBox.autocomplete = autocomplete; }
        inputBox.type = tf.js.GetNonEmptyString(type, 'text');
        if (tf.js.GetIsNonEmptyString(className)) { inputBox.className = className; }
        if (tf.js.GetIsNonEmptyString(style)) { inputBox.style = style; }
        inputBox.maxLength = maxLength;
        inputBox.placeholder = tf.js.GetNonEmptyString(placeHolder, "");
        inputBox.addEventListener("keydown", onInputKeyDownEvent);
        inputBox.addEventListener("keypress", onInputKeyPressEvent);
        inputBox.addEventListener("change", onInputChangeEvent);
        inputBox.addEventListener("paste", onInputChangeEvent);
        inputBox.addEventListener("input", onInputChangeEvent);
    }

    function initialize() {
        changeCB = tf.js.GetFunctionOrNull(settings.onChange);
        changeVerb = tf.js.GetNonEmptyString(settings.changeVerb, "change");
        goCB = tf.js.GetFunctionOrNull(settings.onGo);
        goVerb = tf.js.GetNonEmptyString(settings.goVerb, "change");
        maxLength = tf.js.GetIntNumberInRange(settings.maxLength, 1, 1000, 200);
        createControl(settings.className, settings.placeHolder, settings.type, settings.style, settings.id, settings.autocomplete);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

