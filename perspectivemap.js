"use strict";

tf.consts.perspectiveMapLostDeviceEvent = "lostdevice";
tf.consts.perspectiveMapRestoredDeviceEvent = "restoreddevice";
tf.consts.perspectiveMapVisibilityChangeEvent = "visibilityChange";

tf.consts.allPerspectiveMapEventNames = [
    tf.consts.perspectiveMapLostDeviceEvent,
    tf.consts.perspectiveMapRestoredDeviceEvent,
    tf.consts.perspectiveMapVisibilityChangeEvent
];

tf.webgl.PerspectiveMap = function (settings) {
    var theThis, allEventDispatchers, map, webGL, context, ctx, canvas, mapTexture, wrapper;
    var scene, mapSceneObject, objectCreationSettings;
    var viewRadius, viewAngle, mapSize, mapAspect;
    var renderCount, pickFrameBufferRenderCount, pickFrameBufferDim, pickFrameBuffer, pickedColor;
    var inversePerspective, ptOrigin, vYAxisUnit, cameraPos, cameraDir;
    var renderMap, renderMapXScale, renderMapYScale, renderAspect, forceUpdatePerspective;
    var isVisible, onDelaySetMapSize, mapLeftInt, mapTopInt, sceneAspect, sceneNear, tempVec3;

    this.PixelActualToVirtual = function (coords) { return pixelActualToVirtual(coords); }
    this.PixelVirtualToActual = function (coords) { return pixelVirtualToActual(coords); }

    this.GetMapSize = function () { return mapSize; }

    this.AddListener = function (eventName, callBack) { return allEventDispatchers.AddListener(eventName, callBack); }

    this.GetIsVisible = function () { return getIsVisible(); }
    this.SetIsVisible = function (bool) { return setIsVisible(bool); }

    this.IsDeleted = function () { return isDeleted(); }
    this.OnDelete = function () { return onDelete(); }

    this.GetContext = function () { return context; }
    this.GetMap = function () { return map; }
    this.GetScene = function () { return scene; }

    function onDelete() { if (!isDeleted()) { webGL = undefined; } }
    function isDeleted() { return webGL == undefined; }

    function getIsVisible() { return !isDeleted() && isVisible; }

    function setIsVisible(bool) {
        if (!isDeleted()) {
            if (getIsVisible() != (bool = !!bool)) {
                isVisible = bool;
                checkControlVisible();
                notifyListeners(tf.consts.perspectiveMapVisibilityChangeEvent);
                if (bool) { if (context.IsContextLost()) { context.RestoreContext(); } else { onFrame(); } }
                checkMapSize();
            }
        }
    }

    function checkControlVisible() {
        //wrapper.GetHTMLElement().style.zIndex = isVisible ? '11' : '9';
        wrapper.GetHTMLElement().style.opacity = isVisible ? '1' : '0';
    }

    function checkMapSize() {
        var mapContainer = settings.appContent.GetMapDiv(), mapContainerE = mapContainer.GetHTMLElement();
        var mapMapContainer = settings.appContent.GetMapMapDiv(), mapMapContainerE = mapMapContainer.GetHTMLElement(), mapMapContainerES = mapMapContainerE.style;
        var wMapContainer = mapContainerE.clientWidth, hMapContainer = mapContainerE.clientHeight;
        var left, top, width, height, widthStr, heightStr;
        var needChange;
        if (isVisible) {
            width = Math.round(wMapContainer * renderMapXScale);
            height = Math.round(hMapContainer * renderMapYScale);
            mapLeftInt = (wMapContainer - width) / 2;
            mapTopInt = (hMapContainer - height) / 2;
            widthStr = width + 'px';
            heightStr = height + 'px';
            needChange = parseInt(mapMapContainerES.width, 10) != width || parseInt(mapMapContainerES.height, 10) != height;
        }
        else {
            mapLeftInt = mapTopInt = 0;
            widthStr = heightStr = "100%";
            width = wMapContainer;
            height = wMapContainer;
            needChange = mapMapContainerES.width != widthStr;
        }
        if (!!needChange) {
            //console.log('changed map size');
            forceUpdatePerspective = true;
            mapMapContainerES.left = mapLeftInt + "px";
            mapMapContainerES.top = mapTopInt + "px";
            mapMapContainerES.width = widthStr;
            mapMapContainerES.height = heightStr;
            onDelaySetMapSize.DelayCallBack();
        }
    }

    function delayedSetMapSize() { map.OnResize(); forceUpdatePerspective = true; updateMapSettings(); }

    function updateInversePerspective() {
        if (!isDeleted()) {
            inversePerspective.CopyFrom(scene.GetPerspective()); inversePerspective.ToInverse();
            if (!!mapSceneObject) {
                var dim = 0.5;
                var x = dim / (mapAspect), y = 0, z = dim;
                var vertices = new Float32Array([x, y, -z, -x, y, -z, -x, y, z, x, y, z]);
                mapSceneObject.GetAttributes().GetPos().Update(vertices);
            }
        }
    }

    function updateMapSettings() {
        mapSize = map.GetActualPixelSize();
        //console.log('map pixel size: ' + mapSize);
        if (mapSize[0] <= 0) { mapSize[0] = 1; }
        if (mapSize[1] <= 0) { mapSize[1] = 1; }
        mapAspect = mapSize[1] / mapSize[0];
        if (canvas.clientWidth != canvas.width || canvas.clientHeight != canvas.height || forceUpdatePerspective) {
            forceUpdatePerspective = false;
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            var scenePersp = !!canvas.height && !!canvas.width ? canvas.width / canvas.height : 1;
            sceneAspect = scenePersp;
            scene.GetPerspective().UpdateAspect(scenePersp);
            updateInversePerspective();
            //console.log('updated perspective ' + scenePersp);
        }
    }

    function mapQuadCoordsToPerspectiveMapPixelCoords(mapQuadCoords) {
        var coords = mapQuadCoordsToMapPixelCoords(mapQuadCoords);
        return !!coords ? [coords[0] + mapLeftInt, coords[1] + mapTopInt] : coords;
    }

    function intersectRayPlane(rayOrigin, rayDirection, planeOrigin, planeNormal) {
        var ptIntersect, planeNormalDotRayDirection = planeNormal.Dot(rayDirection);
        if (Math.abs(planeNormalDotRayDirection) > 0.0000001) {
            var diffV = new tf.math.Vector3({ vector: planeOrigin }); diffV.Sub(rayOrigin);
            var planeNormalDotDiffV = planeNormal.Dot(diffV);
            var distance = planeNormalDotDiffV / planeNormalDotRayDirection;
            var rayDir = new tf.math.Vector3({ vector: rayDirection });
            rayDir.MultByScalar(distance);
            ptIntersect = new tf.math.Vector3({ vector: rayOrigin });
            ptIntersect.Add(rayDir);
        }
        return ptIntersect;
    }

    function quadCoordsToPerspectiveMapQuadCoords(quadCoords) {
        var view = scene.GetView();
        cameraPos.Update(view.GetView().vFrom);
        cameraDir.Update({ x: quadCoords[0], y: quadCoords[1], z: 1 });
        cameraDir.MultByMatrix(inversePerspective);
        cameraDir.MultByMatrix(view.GetInverse());
        cameraDir.Sub(cameraPos);
        cameraDir.Normalize();
        return intersectRayPlane(cameraPos, cameraDir, ptOrigin, vYAxisUnit);
    }

    function canvasPixelCoordsToPerspectiveMapQuadCoords(canvasPixelCoords) {
        var x = (2 * canvasPixelCoords[0]) / canvas.width - 1;
        var y = 1 - (2 * canvasPixelCoords[1] / canvas.height);
        return quadCoordsToPerspectiveMapQuadCoords([x, y]);
    }

    function mapPixelCoordsToMapPixelCoordsLeftTopZero(mapPixelCoords) { return [mapPixelCoords[0] + mapLeftInt, mapPixelCoords[1] + mapTopInt]; }

    function mapPixelCoordsToPerspectiveMapQuadCoords(mapPixelCoords) {
        return !!mapPixelCoords ?
            canvasPixelCoordsToPerspectiveMapQuadCoords(mapPixelCoordsToMapPixelCoordsLeftTopZero(mapPixelCoords)) :
            mapPixelCoords;
    }

    function mapQuadCoordsToMapPixelCoords(mapQuadCoords) { return [((mapQuadCoords[0] * mapAspect) + 0.5) * mapSize[0], (mapQuadCoords[2] + 0.5) * mapSize[1] ]; }

    function mapActualPixelToMapTransformedPixel(mapPixelCoords) {
        var mapQuadCoords = mapPixelCoordsToPerspectiveMapQuadCoords(mapPixelCoords);
        if (!!mapQuadCoords) { return mapQuadCoordsToMapPixelCoords(mapQuadCoords); }
    }

    function pixelActualToVirtual(pixelCoords) { if (getIsVisible()) { return mapActualPixelToMapTransformedPixel(pixelCoords); } }

    function mapPixelCoordsTransformedToMapPixelCoordsLeftTopZero(mapPixelCoords) { return [mapPixelCoords[0] - mapLeftInt, mapPixelCoords[1] - mapTopInt]; }

    this.PointCoordsToQuadCoords = function (pointCoords) { return mapCanvasPixelToMapQuadCoords(pointCoords); }

    function mapCanvasPixelToMapQuadCoords(canvasPixelCoords) {
        var pX = canvasPixelCoords[0], w = mapSize[0], w2 = w / 2
        var pY = canvasPixelCoords[1], h = mapSize[1], h2 = h / 2
        pX -= w2; pX /= w * mapAspect;
        pY -= h2; pY /= h;
        return [pX, pY];
    }

    function mapQuadCoordsToCanvasTransformedPixelCoords(mapQuadCoords) {
        tempVec3.Update({ x: mapQuadCoords[0], y: 0, z: mapQuadCoords[1] });
        tempVec3.MultByMatrix(scene.GetViewProj());
        return [(tempVec3[0] + 1) * canvas.width / 2, canvas.height - (tempVec3[1] + 1) * canvas.height / 2];
    }

    function mapCanvasPixelToCanvasTransformedPixel(canvasPixelCoords) { return mapQuadCoordsToCanvasTransformedPixelCoords(mapCanvasPixelToMapQuadCoords(canvasPixelCoords)); }

    function pixelVirtualToActual(pixelCoords) { if (getIsVisible()) { return mapCanvasPixelToCanvasTransformedPixel(pixelCoords); } }

    function drawFrame(onContext) {
        var mapCanvas = map.GetCanvas();;

        if (!!mapCanvas) {
            updateMapSettings();

            mapTexture.UpdateFromImage(mapCanvas, true);
            scene.OnPreRender();

            var renderOptions = {
                onPostCompose: onScenePostCompose,
                viewportWidth: canvas.width, viewportHeight: canvas.height,
                isForPick: false, frameBuffer: undefined, clearColor: [0, 0, 0, 0]/* undefined*/, useProgram: undefined
            };

            scene.RenderOn(renderOptions);

            if (((++renderCount) % pickFrameBufferRenderCount) == 0) {
                renderOptions.viewportWidth = renderOptions.viewportHeight = pickFrameBufferDim;
                renderOptions.isForPick = true;
                renderOptions.frameBuffer = pickFrameBuffer.GetFrameBuffer();
                renderOptions.clearColor = [0, 0, 0, 0];
                renderOptions.useProgram = context.GetTextureColorPickProgram();
                scene.RenderOn(renderOptions);
            }
        }
    }

    function restoreContext() { if (!!context) { context.RestoreContext(); } }
    function onFrame(notification) { if (getIsVisible()) { checkMapSize(); drawFrame(context); context.RequestAnimFrame(); } }
    function onLost(notification) { notifyListeners(tf.consts.perspectiveMapLostDeviceEvent); if (getIsVisible()) { setIsVisible(false); } }
    function onRestored(notification) { if (!!webGL) { forceUpdatePerspective = true; notifyListeners(tf.consts.perspectiveMapRestoredDeviceEvent); setTimeout(function () { return onFrame(notification); }, 100); } }
    function notifyListeners(eventName, moreArgs) { allEventDispatchers.Notify(eventName, tf.js.ShallowMerge(moreArgs, { sender: theThis, eventName: eventName })); }
    function onScenePostCompose(notification) { notifyListeners(tf.consts.perspectiveMapPostComposeEvent, { sender: theThis, sceneNotification: notification }); }

    function initContext(onContext) {
        var sceneFar = 100;
        var viewY = Math.sin(viewAngle) * viewRadius;
        var viewZ = Math.cos(viewAngle) * viewRadius;
        var vFrom = [0, viewY, viewZ], vTo = [0, 0, 0];
        var view = { vFrom: vFrom, vTo: vTo, vUp: [0, 1, 0] };
        var ambientComponent = 1, lightComponent = 0.75;
        var normals = new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]);
        var program = onContext.GetTextureColorProgram(), quad = new tf.webgl.QuadXY({ context: onContext });

        scene = new tf.webgl.Scene({
            context: onContext, clearColor: [1, 1, 1, 1], clearDepth: 1,
            ambientColor: [ambientComponent, ambientComponent, ambientComponent],
            lightDir: [0, 0, 1], lightColor: [lightComponent, lightComponent, lightComponent],
            view: view, perspective: { fovy: 30 * Math.PI / 180, near: sceneNear, far: sceneFar }
        });

        updateInversePerspective();

        mapSceneObject = new tf.webgl.SceneObject({ context: onContext, attributes: quad, texture: mapTexture, program: program });
        mapSceneObject.GetAttributes().GetNor().Update(normals);
        scene.AddObject(mapSceneObject);

        //createTests(onContext);
    }

    var cssTag, cssClassNames;

    function createCSSClassNames() {
        cssClassNames = {
            wrapperClassName: tf.TFMap.CreateClassName(cssTag, "Wrapper"),
            canvasClassName: tf.TFMap.CreateClassName(cssTag, "Canvas")
        };
    }

    function createCSSClasses() {
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles(), CSSClasses = appStyles.GetCSSClasses();
        var cssClasses = [];
        //var ls = tf.TFMap.LayoutSettings;

        var commonSettings = {
            inherits: [CSSClasses.robotoFontFamily, CSSClasses.fontSize16px, CSSClasses.overflowHidden, CSSClasses.noMarginNoBorderNoPadding,
            CSSClasses.WHOneHundred, CSSClasses.displayBlock, CSSClasses.cursorDefault, CSSClasses.positionAbsolute, CSSClasses.leftTopZero, CSSClasses.pointerEventsNone],
            background: "white"
        };

        cssClasses[cssClassNames.wrapperClassName] = {
            inherits: [commonSettings, CSSClasses.transitionPoint2s],
            zIndex: "11"
        };

        cssClasses[cssClassNames.canvasClassName] = {
            inherits: [commonSettings]
        };

        return cssClasses;
    }

    function registerCSSClasses() { tf.styles.CreateCSSClasses(createCSSClasses()); }

    function getDisplayPixelSize() { return getIsVisible() ? [canvas.width, canvas.height] : undefined; }

    function initialize() {

        cssTag = 'perspectiveMap';
        createCSSClassNames();
        registerCSSClasses();

        settings = tf.js.GetValidObjectFrom(settings);

        //viewAngle = 90 * Math.PI / 180;

        //viewRadius = 2.5;
        //viewRadius = 2;
        //viewRadius = 1.5;

        viewRadius = 0.66;
        viewAngle = 35 * Math.PI / 180;

        sceneNear = viewRadius / 2;

        var scaleScale = 1.4;

        renderMapXScale = 1 * scaleScale;
        renderMapYScale = 1.5 * scaleScale;
        renderAspect = renderMapXScale / renderMapYScale;

        mapSize = [100, 100];
        mapAspect = 1;
        inversePerspective = new tf.math.Matrix4({ noInit: true });
        ptOrigin = new tf.math.Vector3({ x: 0, y: 0, z: 0 });
        vYAxisUnit = new tf.math.Vector3({ x: 0, y: 1, z: 0 });
        tempVec3 = new tf.math.Vector3({ x: 0, y: 1, z: 0 });
        cameraPos = new tf.math.Vector3();
        cameraDir = new tf.math.Vector3();
        allEventDispatchers = new tf.events.MultiEventNotifier({ eventNames: tf.consts.allPerspectiveMapEventNames });
        sceneAspect = 1;

        if (map = tf.js.GetMapFrom(settings.map)) {
            webGL = tf.webgl.GetWebGL();
            if (webGL.GetHasWebGL()) {

                onDelaySetMapSize = new tf.events.DelayedCallBack(50, delayedSetMapSize, theThis);
                context = new tf.webgl.Context({ optionalAttributes: { antialias: true }, onFrame: onFrame, onLost: onLost, onRestored: onRestored });
                objectCreationSettings = { map: map, context: context, perspectiveMap: theThis };
                mapTexture = new tf.webgl.Texture2({ context: context, img: map.GetCanvas() });
                ctx = context.GetContext();
                canvas = context.GetCanvas();

                canvas.className = cssClassNames.canvasClassName;

                pickedColor = new Uint8Array(4);

                renderCount = 0;
                pickFrameBufferRenderCount = 10;
                pickFrameBufferDim = 512;
                pickFrameBuffer = new tf.webgl.FrameBuffer({ context: context, width: pickFrameBufferDim, height: pickFrameBufferDim });

                wrapper = new tf.dom.Div({ cssClass: cssClassNames.wrapperClassName });
                wrapper.AddContent(canvas);

                initContext(context);

                forceUpdatePerspective = true;

                updateMapSettings();

                map.SetActualToVirtualPixelTranslateCallBacks(pixelActualToVirtual, pixelVirtualToActual, getDisplayPixelSize);

                onFrame();

                setIsVisible(!tf.js.GetIsFalseNotUndefined(settings.isVisible));

                settings.appContent.GetMapDiv().AddContent(wrapper);
            }
            else { webGL = map = undefined; }
        }
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.webgl.AssociateMapFeatureAndPerspectivePointFeature = function (mapFeature, perspectivePointFeature) {
    var OK = false;
    if (!!mapFeature && !!perspectivePointFeature) {
        if (mapFeature.GetIsPoint()) {
            var mfs = mapFeature.GetSettings();
            mfs.perspectiveFeature = perspectivePointFeature;
            perspectivePointFeature.mapFeature = mapFeature;
            OK = true;
        }
    }
    return OK;
};

tf.webgl.DessociateMapFeatureAndPerspectivePointFeature = function (mapFeature, perspectivePointFeature) {
    var OK = false;
    if (!!mapFeature && !!perspectivePointFeature) {
        if (mapFeature.GetIsPoint()) {
            var mfs = mapFeature.GetSettings();
            delete mfs.perspectiveFeature;
            delete perspectivePointFeature.mapFeature;
            OK = true;
        }
    }
    return OK;
};

tf.webgl.PerspectivePointFeatureFromMapFeature = function (mapFeature) { return !!mapFeature ? mapFeature.GetSettings().perspectiveFeature : undefined; }
tf.webgl.MapFeatureFromPerspectivePointFeature = function (perspectivePointFeature) { return !!perspectivePointFeature ? perspectivePointFeature.mapFeature : undefined; }

tf.webgl.PerspectivePointFeature = function (settings) {
    var theThis, sceneObj, objTexture, objCanvas;

    this.GetIsDeleted = function () { return sceneObj == undefined; }

    this.OnDelete = function () {
        deleteSceneObj();
        tf.webgl.DessociateMapFeatureAndPerspectivePointFeature(settings.mapFeature, theThis);
        settings.mapFeature = undefined;
    }

    function deleteSceneObj() {
        if (!!sceneObj) {
            var pLayer = settings.perspectiveLayer, pMap = pLayer.GetPerspectiveMap(), scene = pMap.GetScene();
            var sceneObjSaved = sceneObj;
            sceneObj = undefined;
            scene.DelObject(sceneObjSaved);
        }
        if (!!objTexture) { objTexture.OnDelete(); objTexture = undefined; }
        if (!!objCanvas) { objCanvas = undefined; }
    }

    function updateObj() {
        var mapFeature = tf.webgl.MapFeatureFromPerspectivePointFeature(theThis);
        if (!!mapFeature) {
            var pLayer = settings.perspectiveLayer;
            pLayer.UpdatePosition(mapFeature, sceneObj)
            pLayer.UpdateTexture(mapFeature, objTexture);
        }
    }

    function onPreRender() {
        updateObj();
    }

    function createObj(mapFeature) {
        if (!!mapFeature) {
            var pLayer = settings.perspectiveLayer, pMap = pLayer.GetPerspectiveMap(), scene = pMap.GetScene(), onContext = pMap.GetContext();
            var program = onContext.GetTextureColorProgram(), quad = new tf.webgl.QuadXY({ context: onContext });
            var normals = new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]);

            objTexture = new tf.webgl.Texture2({ context: onContext });

            sceneObj = new tf.webgl.SceneObject({ context: onContext, attributes: quad, texture: objTexture, program: program, onPreRender: onPreRender });

            var objAttr = sceneObj.GetAttributes();

            objAttr.GetNor().Update(normals);

            updateObj();
            scene.AddObject(sceneObj);
        }
    }

    function initialize() {
        if (tf.webgl.AssociateMapFeatureAndPerspectivePointFeature(settings.mapFeature, theThis)) { createObj(settings.mapFeature); }
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.webgl.PerspectiveLayer = function (settings) {
    var theThis, superAddMapFeature, superDelMapFeature, canvasDimInt, vectorContext, pointFeature, objCanvas;

    this.UpdateTexture = function (mapFeature, texture) {
        if (!!mapFeature) {
            var ctx = objCanvas.getContext("2d");
            ctx.save();
            ctx.clearRect(0, 0, canvasDimInt, canvasDimInt);
            var APIStyle = mapFeature.getAPIStyle(); for (var i in APIStyle) { vectorContext.drawFeature(pointFeature, APIStyle[i]); }
            ctx.restore();
            texture.UpdateFromImage(objCanvas, true);
        }
    };

    this.UpdatePosition = function (mapFeature, sceneObj) {
        if (!!mapFeature && !!sceneObj) {
            var mapFeatureMapCoords = mapFeature.GetPointCoords();
            var mapFeaturePixelCoords = theThis.GetMap().ActualMapToPixelCoords(mapFeatureMapCoords);
            var mapFeatureQuadCoords = theThis.GetPerspectiveMap().PointCoordsToQuadCoords(mapFeaturePixelCoords);
            //mapFeatureQuadCoords = [0, 0];
            var scaleUse = 0.05;
            sceneObj.GetObjectToSceneMatrix().UpdateWorld({
                //rotate: { angle: 45 * Math.PI / 180, axisx: 0, axisy: 1, axisz: 0 },
                translate: { tx: mapFeatureQuadCoords[0], ty: 0 * scaleUse, tz: mapFeatureQuadCoords[1] },
                scale: { sx: scaleUse, sy: scaleUse, sz: scaleUse }
            });

            /*var dim = 0.05;
            var x = dim, y = 0.001, z = dim;
            var vertices = new Float32Array([
                x + mapFeatureQuadCoords[0], y, -z + mapFeatureQuadCoords[1],
                -x + mapFeatureQuadCoords[0], y, -z + mapFeatureQuadCoords[1],
                -x + mapFeatureQuadCoords[0], y, z + mapFeatureQuadCoords[1],
                x + mapFeatureQuadCoords[0], y, z + mapFeatureQuadCoords[1]
            ]);
            var attr = sceneObj.GetAttributes();
            attr.GetPos().Update(vertices);*/
        }
    };

    this.GetMapFromContent = function () { return settings.appContent.GetMap(); }
    this.GetCanvasDimInt = function () { return canvasDimInt; }
    this.GetPerspectiveMap = function() { return settings.appContent.GetPerspectiveMap(); }
    this.GetScene = function () { var pm = theThis.GetPerspectiveMap(); return !!pm ? pm.GetScene() : undefined; }
    this.GetSettings = function () { return settings; }

    function addMapFeature() {
        new tf.webgl.PerspectivePointFeature({ mapFeature: arguments[0], perspectiveLayer: theThis });
        superAddMapFeature.apply(theThis, arguments);
    }

    function delMapFeature() {
        var perspectivePointFeature = tf.webgl.PerspectivePointFeatureFromMapFeature(arguments[0]);
        if (!!perspectivePointFeature) { perspectivePointFeature.OnDelete(); }
        superDelMapFeature.apply(theThis, arguments);
    }

    function createObjCanvas() {
        objCanvas = document.createElement('canvas');
        objCanvas.height = objCanvas.width = canvasDimInt;
    }

    function initialize() {
        canvasDimInt = 80;
        createObjCanvas();
        vectorContext = ol.render.toContext(objCanvas.getContext('2d'), { size: [canvasDimInt, canvasDimInt] });
        pointFeature = new ol.Feature({ geometry: new ol.geom.Point([canvasDimInt / 2, canvasDimInt / 2]) });
        tf.map.FeatureLayer.call(theThis, settings);
        superAddMapFeature = theThis.AddMapFeature;
        superDelMapFeature = theThis.DelMapFeature;
        theThis.AddMapFeature = addMapFeature;
        theThis.DelMapFeature = delMapFeature;
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.webgl.PerspectiveLayer, tf.map.FeatureLayer);
