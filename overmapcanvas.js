"use strict";

tf.TFMap.OverMapCanvas = function(settings) {
    var theThis, cssTag, wrapper, canvas;
    var ocmTypeLine;
    var modified, nextId, features, nFeatures;
    var lastCenterDraw;

    this.Clear = function () {
        var ctx = canvas.getContext("2d");
        var sizeCanvas = getCheckCanvasSize();
        //ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.clearRect(0, 0, sizeCanvas[0], sizeCanvas[1]);
        return sizeCanvas;
    }

    this.DrawCircle = function (center, radius, color) {
        var pixelRatio = tf.browser.GetDevicePixelRatio();
        var ctx = canvas.getContext("2d");
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = color;
        //ctx.strokeStyle = undefined;
        ctx.beginPath();
        ctx.arc(center[0] * pixelRatio, center[1] * pixelRatio, radius * pixelRatio, 0, 2 * Math.PI, false);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    this.GetIsModified = function() { return checkIsModified(); }

    this.Draw = function() { return draw(); }

    this.GetCount = function() { return nFeatures; }

    this.AddOMCLine = function(startCoord, endCoord, startPixelCoord) {
        var omcKey = getNextOMCKey();
        var omcLine = { key: omcKey, type: ocmTypeLine, startCoord: startCoord, endCoord: endCoord, startPixelCoord: startPixelCoord };
        features[omcKey] = omcLine;
        setModified();
        ++nFeatures;
        return omcLine;
    }

    this.DelOMCLine = function(omcLine) {
        if (tf.js.GetIsValidObject(omcLine)) {
            if (features[omcLine.key] != undefined) {
                --nFeatures;
                delete features[omcLine.key];
                setModified();
            }
        }
    }

    this.GetWrapper = function() { return wrapper; }

    function checkIsModified() {
        if (!modified) {
            if (nFeatures > 0) {
                var nowCenter = settings.appContent.GetMap().GetCenter();
                modified = lastCenterDraw == undefined || lastCenterDraw[0] != nowCenter[0] || lastCenterDraw[1] != nowCenter[1];
            }
        }
        return modified;
    }

    function clearModified() { modified = false; }
    function setModified() { modified = true; }

    function getNextOMCKey() { return '' + (nextId++); }

    function roundCoord(coord) { return [Math.round(coord[0]), Math.round(coord[1])]; }

    function drawLine(ctx, sizeCanvas, feature) {
        var appContent = settings.appContent, map = appContent.GetMap();
        var startPixelCoord = roundCoord(feature.startPixelCoord);
        var endPixelCoord = roundCoord(map.MapToPixelCoords(feature.endCoord));
        var lineWidth = 3;
        var radius = 10, radiusStart = lineWidth + 2;
        var lineDX = endPixelCoord[0] - startPixelCoord[0], lineDY = endPixelCoord[1] - startPixelCoord[1];
        var lineLen = Math.sqrt(lineDX * lineDX + lineDY * lineDY) - radius - 1;
        var newLineLen = lineLen - radius - 1;
        if (newLineLen < 0) { newLineLen = 0; }
        var lineRatio = newLineLen / lineLen;
        var lineEndCoords = roundCoord([startPixelCoord[0] + lineDX * lineRatio, startPixelCoord[1] + lineDY * lineRatio]);
        var theColor = tf.TFMap.LayoutSettings.backgroundLivelyColor;
        var pixelRatio = tf.browser.GetDevicePixelRatio();

        ctx.save();

        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";

        ctx.beginPath();
        ctx.strokeStyle = theColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineDashOffset = 0;
        //ctx.setLineDash([10, 10]);
        ctx.moveTo(startPixelCoord[0] * pixelRatio, startPixelCoord[1] * pixelRatio);
        ctx.lineTo(lineEndCoords[0] * pixelRatio, lineEndCoords[1] * pixelRatio);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(endPixelCoord[0] * pixelRatio, endPixelCoord[1] * pixelRatio, radius * pixelRatio, 0, 2 * Math.PI, false);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = theColor;
        ctx.arc(startPixelCoord[0] * pixelRatio, startPixelCoord[1] * pixelRatio, radiusStart * pixelRatio, 0, 2 * Math.PI, false);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        ctx.restore();
    }

    function getCheckCanvasSize() {
        var sizeCanvas = [Math.round(canvas.clientWidth), Math.round(canvas.clientHeight)];
        if (canvas.width != sizeCanvas[0] || canvas.height != sizeCanvas[1]) {
            canvas.width = sizeCanvas[0];
            canvas.height = sizeCanvas[1];
        }
        return sizeCanvas;
    }

    function draw() {
        if (modified || true) {
            lastCenterDraw = settings.appContent.GetMap().GetCenter();
            var sizeCanvas = theThis.Clear();
            var ctx = canvas.getContext("2d");
            for (var i in features) {
                var feature = features[i];
                switch (feature.type) {
                    case ocmTypeLine:
                        drawLine(ctx, sizeCanvas, feature);
                        break;
                    default:
                        break;
                }
            }
            //console.log('nFeatures: ' + nFeatures);
            clearModified();
        }
    }

    function createControl() {
        wrapper = new tf.dom.Div({ cssClass: wrapperClassName });
        canvas = document.createElement('canvas');
        canvas.className = canvasClassName;
        wrapper.AddContent(canvas);
    }

    var wrapperClassName, canvasClassName;

    function createCSSClassNames() {
        wrapperClassName = tf.TFMap.CreateClassName(cssTag, "Wrapper");
        canvasClassName = tf.TFMap.CreateClassName(cssTag, "Canvas");
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var ls = tf.TFMap.LayoutSettings;
        var cssClasses = [];

        cssClasses[wrapperClassName] = {
            inherits: [CSSClasses.displayBlock, CSSClasses.overflowHidden, CSSClasses.backgroundColorTransparent, CSSClasses.cursorDefault, CSSClasses.noMarginNoBorderNoPadding,
            CSSClasses.positionAbsolute, CSSClasses.leftTopZero, CSSClasses.pointerEventsNone],
            zIndex: '' + (ls.rootDivZIndex + ls.overMapCanvasZIndexAdd),
            height: "100%", width: "100%"
        };

        cssClasses[canvasClassName] = {
            inherits: [CSSClasses.displayBlock, CSSClasses.overflowHidden, CSSClasses.backgroundColorTransparent, CSSClasses.cursorDefault, CSSClasses.noMarginNoBorderNoPadding,
            CSSClasses.positionAbsolute, CSSClasses.leftTopZero, CSSClasses.zIndex1],
            height: "100%", width: "100%"
        };

        return cssClasses;
    }

    /*function paintCanvas() {
        var ctx = canvas.getContext("2d");
        var sizeCanvas = [canvas.offsetWidth, canvas.offsetHeight];
        var radius = sizeCanvas[1] / 2;
        ctx.canvas.width = sizeCanvas[0];
        ctx.canvas.height = sizeCanvas[1];
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        //ctx.clearRect(0, 0, sizeCanvas[0], sizeCanvas[1]);
        ctx.fillStyle = "rgba(0,0,255,0.3)";
        ctx.strokeStyle = "rgba(0,0,255,1)";
        ctx.strokeWidth = 5;
        ctx.beginPath();
        ctx.arc(radius, radius, radius, 0, 2 * Math.PI, false);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    }*/

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }
    function onLayoutChange(notification) { registerCSSClasses(); }

    var lcl;

    function initialize() {
        cssTag = "overMapCanvas";
        ocmTypeLine = 'line';
        nFeatures = 0;
        modified = false;
        nextId = 1;
        features = {};
        createCSSClassNames();
        registerCSSClasses();
        createControl();
        lcl = settings.appContent.GetAppStyles().AddOnLayoutChangeListener(onLayoutChange);
        //setTimeout(function () { paintCanvas(); }, 1000);
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

