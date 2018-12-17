"use strict";

tf.TFMap.PhotoList = function(settings) {
    var theThis, photoNames, onClick, toolTipText;
    var lastContentSettings;

    this.GetLastContentSettings = function() { return lastContentSettings; }
    this.GetPhotoNames = function() { return photoNames; }
    this.GetOnClick = function() { return onClick; }
    this.GetToolTipText = function() { return toolTipText; }

    this.SetContent = function(contentSettings) {
        makeEmpty();
        lastContentSettings = contentSettings;
        var photoNamesA, nPhotoNames;
        if (tf.js.GetIsNonEmptyString(contentSettings.photoNamesStr)) {
            photoNamesA = contentSettings.photoNamesStr.split(' ');
        }
        else if (tf.js.GetIsNonEmptyArray(contentSettings.photoNames)) {
            photoNamesA = contentSettings.photoNames;
        }
        nPhotoNames = tf.js.GetIsNonEmptyArray(photoNamesA) ? photoNamesA.length : 0;
        for (var i = 0; i < nPhotoNames; ++i) {
            var photoName = photoNamesA[i].trim();
            if (photoName.length > 0) { photoNames.push(photoName); }
        }
        onClick = contentSettings.onClick;
        toolTipText = contentSettings.toolTipText;
    }

    function makeEmpty() { lastContentSettings = undefined; photoNames = []; }

    function initialize() {
        makeEmpty();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

