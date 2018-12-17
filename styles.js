"use strict";

tf.TFMap.Styles = function (settings) {
    var theThis, CSSClasses, allEventDispatchers, layoutChangeEventName;
    var redMarkerImage, loadingImage;
    var isShowingAerial;
    var onOffSVG, addSVG, geolocationSVG, minusSVG, compassSVG, arrowDownSVG, arrowDownFlipSVG, XMarkSVG;
    var bikeSVG, walkSVG, carSVG, searchSVG, upDownArrowSVG;
    var tapImage, mapMarkerSearchImage, geolocationImage;
    var arrowRightSVGNoColor, arrowLeftSVGNoColor;

    var busPNGImage;

    var minNonSmallScreenWidth, minNonSmallScreenHeight;
    var minNonSmallScreenWidthAddValue;

    var measuringSVG, downloadSVG, layersSVG;
    var dustBinSVG;

    var fenceSVG;

    var refreshSVG, mapCenterSVG;
    var playerSVGs;

    var refreshGrayData, goFullScreenData, restoreFullScreenData, arrowLeftData, arrowRightData, menuData;
    var inactiveSearchData, activeSearchData;
    var closeData, directionsData;
    var greenCheckMarkData, buttonXRedData;
    var loadingData;
    var fromImage, toImage;
    var directionStepsSVGs;
    var poweredByTerraFlySVG, poweredByTerraFlySVGForMap;
    var directionsMapArrowImage;
    var noClusterData, clusterData; 
    var mapMarker1SVG, mapMarker1Data, mapMarker1Image;
    var arrowSquareRightSVG, arrowSquareRightData, arrowSquareRightImage;
    var arrowSmallRightSVG, arrowSmallRightData, arrowSmallRightImage;
    var altaMarkerStyles;
    var arrowRightSVG, arrowLeftSVG;
    var isSmallScreen;

    var busSVG, busImage;
    var busStopSVG;

    this.GetFenceSVG = function () { return fenceSVG; }

    this.GetBusPNGImage = function () { return busPNGImage; }

    this.GetPlayerSVGs = function () { return playerSVGs; }

    this.GetRefreshSVG = function () { return refreshSVG; }
    this.GetMapCenterSVG = function () { return mapCenterSVG; }

    this.SetMinNonSmallScreenWidthAddValue = function (newMinNonSmallScreenWidthAddValue) {
        if (newMinNonSmallScreenWidthAddValue != minNonSmallScreenWidthAddValue) {
            minNonSmallScreenWidthAddValue = newMinNonSmallScreenWidthAddValue;
            theThis.CheckLayoutChange();
        }
    }

    this.GetPoweredByTerraFlySVGForMap = function () { return poweredByTerraFlySVGForMap; }

    this.CheckIsSmallDeviceScreen = function () {
        return window.screen.width <= minNonSmallScreenDim + minNonSmallScreenWidthAddValue || window.screen.height <= minNonSmallScreenDim;
    }
    this.CheckIsSmallScreen = function () {
        var winDims = tf.dom.GetWindowDims(); return winDims[0] <= minNonSmallScreenWidth + minNonSmallScreenWidthAddValue || winDims[1] <= minNonSmallScreenHeight;
    }
    this.GetIsSmallScreen = function () { return isSmallScreen; }
    this.CheckLayoutChange = function () {
        var nowIsSmallScreen = theThis.CheckIsSmallScreen();
        //console.log('isSmallScreen: ' + nowIsSmallScreen);
        if (nowIsSmallScreen != isSmallScreen) {
            isSmallScreen = nowIsSmallScreen; theThis.RefreshLayout();
        }
    }

    this.RefreshLayout = function () {
        var appContent = settings.appContent;
        calcLayoutSettings();
        appContent.StartLayoutChange();
        notify(layoutChangeEventName);
        appContent.EndLayoutChange();
        settings.appContent.GetMap().Render();
    }
    this.AddOnLayoutChangeListener = function (callBack) { return allEventDispatchers.AddListener(layoutChangeEventName, callBack); }

    this.GetArrowRightSVG = function () { return arrowRightSVG; }
    this.GetArrowLeftSVG = function () { return arrowLeftSVG; }

    this.GetArrowRightSVGNoColor = function () { return arrowRightSVGNoColor; }
    this.GetArrowLeftSVGNoColor = function () { return arrowLeftSVGNoColor; }

    this.GetMapMarker1SVG = function () { return mapMarker1SVG; }

    this.GetCSSClasses = function () { return CSSClasses; }

    this.GetDirectionsMapArrowImage = function () { return directionsMapArrowImage; }

    this.GetPoweredByTerraFlySVG = function () { return poweredByTerraFlySVG; }

    this.GetDirectionsStepsSVGs = function () { return directionStepsSVGs; }

    this.GetBusSVG = function () { return busSVG; }
    this.GetBusImage = function () { return busImage; }

    this.GetBusStopSVG = function () { return busStopSVG; }

    this.GetTapImage = function () { return tapImage; }
    this.GetMapMarkerSearchImage = function () { return mapMarkerSearchImage; }
    this.GetGeolocationImage = function () { return geolocationImage; }

    this.GetFromImage = function () { return fromImage; }
    this.GetToImage = function () { return toImage; }

    this.GetMapMarker1Image = function () { return mapMarker1Image; }

    this.GetUpDownArrowSVG = function () { return upDownArrowSVG; }

    this.GetSearchSVG = function () { return searchSVG; }

    this.GetBikeSVG = function () { return bikeSVG; }
    this.GetWalkSVG = function () { return walkSVG; }
    this.GetCarSVG = function () { return carSVG; }

    this.GetXMarkSVG = function () { return XMarkSVG; }
    this.GetOnOffSVG = function () { return onOffSVG; }
    this.GetAddSVG = function () { return addSVG; }
    this.GetMinusSVG = function () { return minusSVG; }
    this.GetGeolocationSVG = function () { return geolocationSVG; }
    this.GetCompassSVG = function () { return compassSVG; }
    this.GetArrowDownSVG = function () { return arrowDownSVG; }
    this.GetArrowDownFlipSVG = function () { return arrowDownFlipSVG; }

    this.GetDustBinSVG = function () { return dustBinSVG; }
    this.GetMeasureSVG = function () { return measuringSVG; };
    this.GetDownloadSVG = function () { return downloadSVG; };
    this.GetLayersSVG = function () { return layersSVG; }

    this.SetIsShowingAerial = function (isShowingAerialSet) { isShowingAerial = isShowingAerialSet; }

    this.AddMapMarker1Style = function (geom) {
        geom.style = getMapMarker1FeatureStyle
        geom.hoverStyle = getMapMarker1FeatureStyle
        return geom;
    }

    this.GetSVGMapMarkerStyle = function (imageUse, imageSize, iconAnchor, bottomMargin, zIndex) {
        return createImageCanvas(imageSize, imageUse, iconAnchor, bottomMargin, zIndex);
    }

    this.GetSVGMapMarkerGeomAndStyles = function (coords, imageUse, imageSize, iconAnchor, bottomMargin, zIndex) {
        return {
            type: 'point',
            coordinates: coords != undefined ? coords : [0, 0],
            style: createImageCanvas(imageSize, imageUse, iconAnchor, bottomMargin, zIndex),
            hoverStyle: createImageCanvas([imageSize[0] + 2, imageSize[1] + 2], imageUse, iconAnchor, bottomMargin, zIndex + 1)
        };
    }

    this.CreateImageCanvasFromSettings = function (icSettings) { return createImageCanvasFromSettings(icSettings); }

    function createImageCanvasFromSettings(icSettings) {
        var sizeCanvas = icSettings.sizeCanvas, imageToPaint = icSettings.imageToPaint, iconAnchor = icSettings.iconAnchor, bottomMargin = icSettings.bottomMargin, zindex = icSettings.zindex;
        var canvas = document.createElement('canvas'), ctx = canvas.getContext("2d");
        if (!iconAnchor) { iconAnchor = [0.5, 0.5]; }
        ctx.canvas.width = sizeCanvas[0];
        ctx.canvas.height = sizeCanvas[1] + (bottomMargin != undefined ? bottomMargin : 0);
        ctx.clearRect(0, 0, sizeCanvas[0], sizeCanvas[1]);
        if (icSettings.circleRadius != undefined) {
            ctx.fillStyle = icSettings.circleFill;
            ctx.shadowColor = "rgba(0,0,0,0.3)";
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.beginPath();
            ctx.arc(sizeCanvas[0] / 2, sizeCanvas[1] / 2, icSettings.circleRadius, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
        }
        else if (icSettings.iconShadow) {
            ctx.shadowColor = "rgba(0,0,0,0.4)";
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        var imageDims = icSettings.sizeImage != undefined ? icSettings.sizeImage : sizeCanvas;

        ctx.translate(sizeCanvas[0] / 2, sizeCanvas[1] / 2);
        ctx.drawImage(imageToPaint, -imageDims[0] / 2, -imageDims[1] / 2, imageDims[0], imageDims[1]);
        return { icon: true, icon_img: canvas, icon_size: [ctx.canvas.width, ctx.canvas.height], icon_anchor: iconAnchor, zindex: zindex, snaptopixel: true };
    }

    function createImageCanvas(sizeCanvas, imageToPaint, iconAnchor, bottomMargin, zindex) {
        return createImageCanvasFromSettings({ sizeCanvas: sizeCanvas, imageToPaint: imageToPaint, iconAnchor: iconAnchor, bottomMargin: bottomMargin, zindex: zindex });
    }

    function getMapMarker1FeatureStyle(keyedFeature, mapFeature) {
        var isHover = mapFeature.GetIsDisplayingInHover();
        var zindex = isHover ? 2 : 1;
        var snaptopixel = true;
        //var snaptopixel = false;
        var featureStyle = { zindex: zindex, snaptopixel: snaptopixel };
        var imageUse = mapMarker1Image;
        var scaleHover = 1.1;
        var baseW = 24;
        var baseH = 36;
        var imageSize = isHover ? [baseW * scaleHover, baseH * scaleHover] : [baseW, baseH];
        var imageAnchor = isHover ? [0.5, 0.92] : [0.5, 0.92];
        featureStyle = tf.js.ShallowMerge(createImageCanvas(imageSize, imageUse, imageAnchor, 0, zindex));
        return featureStyle;
    }

    this.GetLighterColor2 = function (color) {
        var rgbColor = tf.js.GetRGBFromColor(color);
        var offColor = 160;
        rgbColor.r = tf.js.GetIntNumberInRange(rgbColor.r + offColor, 0, 255, rgbColor.r);
        rgbColor.g = tf.js.GetIntNumberInRange(rgbColor.g + offColor, 0, 255, rgbColor.g);
        rgbColor.b = tf.js.GetIntNumberInRange(rgbColor.b + offColor, 0, 255, rgbColor.b);
        return "#" + rgbColor.r.toString(16) + rgbColor.g.toString(16) + rgbColor.b.toString(16);
    }

    this.GetLighterColor = function(color) {
        var rgbColor = tf.js.GetRGBFromColor(color);
        var off = 80, mult = 1.4;
        rgbColor.r = tf.js.GetIntNumberInRange(Math.floor((rgbColor.r + off) * mult), 16, 255, rgbColor.r);
        rgbColor.g = tf.js.GetIntNumberInRange(Math.floor((rgbColor.g + off) * mult), 16, 255, rgbColor.g);
        rgbColor.b = tf.js.GetIntNumberInRange(Math.floor((rgbColor.b + off) * mult), 16, 255, rgbColor.b);
        return "#" + rgbColor.r.toString(16) + rgbColor.g.toString(16) + rgbColor.b.toString(16);
    }

    function getImageFileName(fullURL) {
        var fileName;
        if (tf.js.GetIsNonEmptyString(fullURL)) {
            var pieces = fullURL.split('/'), nPieces = pieces.length;
            if (nPieces > 0) { fileName = pieces[nPieces - 1]; }
        }
        return fileName;
    }

    function onMapFeatureImageLoaded(theImage) {
        if (theImage.GetIsValid()) {
            var imgSettings = theImage.GetSettings(), img = theImage.GetImg(), imgDims = theImage.GetDimensions();
            var mapFeature = imgSettings.mapFeature;
            var zindex = imgSettings.zindex;
            var shape_radius = 6;
            var newStyle = { circle: true, shape_points: 3, shape_radius: shape_radius, fill: true, fill_color: "#fff", fill_opacity: 50, line: true, line_width: 2, line_color: "#37f", line_opacity: 50, zindex: ++zindex };
            var newHoverStyle = { circle: true, shape_points: 6, shape_radius: shape_radius + 4, fill: true, fill_color: "#fff", fill_opacity: 50, line: true, line_width: 2, line_color: "#37f", line_opacity: 50, zindex: ++zindex };
            var newStyleObj = new tf.map.FeatureStyle(newStyle);
            var newHoverStyleObj = new tf.map.FeatureStyle(newHoverStyle);
            console.log('loaded: ' + theImage.GetSrc());
            mapFeature.SetStyles(newStyleObj, newHoverStyleObj);
        }
    }

    function getSearchFeatureStyleCommon(isCurrent, isHover, color, text, imageSrc, mapDirectionAngle, showingHybrid, minZIndex) {
        var zIndexStep = 4;
        var zindex;

        if (isCurrent) { zindex = 1000; } else if (isHover) { zindex = 2000; } else { zindex = minZIndex; }

        var enlarge = isCurrent || isHover;

        var circle_radius = isHover ? 11 : 9;
        var square_radius = circle_radius - 3;
        var snaptopixel = true;
        var outerMarkerColor = showingHybrid ? "#fff" : "#494949";

        if (minZIndex != undefined) { zindex += minZIndex; }

        var featureStyle = [];
        var imageStyle;
        var addRadius;
        var subRadius;

        if (imageSrc != undefined) {
            var createIcon = true;
            var imageFileName = getImageFileName(imageSrc);
            var altaMarkerStyle = altaMarkerStyles[imageFileName];

            if (altaMarkerStyle != undefined) {
                var styleUse = enlarge ? altaMarkerStyle.hoverSettings : altaMarkerStyle.styleSettings;
                var imageStyle = createImageCanvasFromSettings(tf.js.ShallowMerge(styleUse, { zindex: ++zindex }));
                imageStyle.rotate_with_map = true;
                imageStyle.rotation_rad = altaMarkerStyle.angle;
                featureStyle.push(imageStyle);
                createIcon = false;
                //console.log(altaMarkerStyle.name + ' ' + altaMarkerStyle.angleDeg + ' ' + altaMarkerStyle.angle);
            }

            if (createIcon) {
                var scale = enlarge ? 1.2 : 1;
                featureStyle.push({ icon: true, icon_anchor: [0.5, 0.5], scale: scale, zindex: ++zindex, icon_url: imageSrc });
                /*var circle_radius = enlarge ? 8 : 5;
                featureStyle.push({ circle: true, circle_radius: circle_radius, fill: true, fill_color: "#fff", fill_opacity: 50, line: true, line_width: 2, line_color: "#37f", line_opacity: 50, zindex: ++zindex });
                if (!enlarge) {
                    new tf.dom.Img({ src: imageSrc, onLoad: onMapFeatureImageLoaded, mapFeature: mapFeature, zindex: zindex - 1 });
                }*/
            }
        }
        else if (text != undefined) {
            var textStyle;
            var layerColor = color;
            var borderWidth = 2, markerArrowLength = 16, borderOpacity = 60;
            var fontHeight = enlarge ? 14 : 12;
            var fontColor = showingHybrid ? "#fff" : "#025";
            var lineColor = showingHybrid ? "#025" : "#fff";
            var lineWidth = showingHybrid ? 3 : 2;
            var markerBoderColor = showingHybrid ? "#bfbfbf" : "#000";
            var markerOpacity = showingHybrid ? 75 : 65;
            var lineOpacity = showingHybrid ? 50 : 70;

            textStyle = {
                marker_arrowlength: markerArrowLength,
                marker: true, font_height: fontHeight, border_color: "#000", border_width: borderWidth, zindex: ++zindex, line_color: lineColor, line_opacity: lineOpacity, line_width: lineWidth,
                marker_color: layerColor, font_color: fontColor, marker_opacity: markerOpacity, border_opacity: borderOpacity, label: text
            };

            featureStyle.push(textStyle);
        }

        return featureStyle;
    }

    function getSearchFeatureStyle(keyedFeature, mapFeature) {
        var appCtx = settings.appContent.GetAppCtx();
        var isCurrent = mapFeature == appCtx.GetCtxAttribute(tf.TFMap.CAN_selectedSearch);
        var isHover = mapFeature.GetIsDisplayingInHover();
        var mapFeatureSettings = mapFeature.GetSettings();
        return getSearchFeatureStyleCommon(isCurrent, isHover, mapFeatureSettings.color, mapFeatureSettings.text,
            mapFeatureSettings.imageSrc, mapFeatureSettings.compassDirectionAngle,
            mapFeatureSettings.isForHybrid, mapFeatureSettings.minZIndex);
    }

    function getSearchFeatureStyle2(mapFeatureSettings, isHover) {
        var isCurrent = false;
        return getSearchFeatureStyleCommon(isCurrent, isHover, mapFeatureSettings.color, mapFeatureSettings.text,
            mapFeatureSettings.imageSrc, mapFeatureSettings.compassDirectionAngle,
            mapFeatureSettings.isForHybrid, mapFeatureSettings.minZIndex);
    }

    this.AddSearchFeatureStyles = function (geom, props) {
        geom.style = getSearchFeatureStyle2(props, false);
        geom.hoverStyle = getSearchFeatureStyle2(props, true);
        return geom;
    }

    this.GetSVGMapMarkerWithFrameStyle = function (zIndex, imageUse, imageSizeUse, radiusMaxUse, colorFillUse, iconAnchor, bottomMargin, actualColorFill, actualLineWidth) {
        return getSVGMapMarkerWithFrameStyle(zIndex, imageUse, imageSizeUse, radiusMaxUse, colorFillUse, iconAnchor, bottomMargin, actualColorFill, actualLineWidth);
    }

    function getSVGMapMarkerWithFrameStyle(zIndex, imageUse, imageSizeUse, radiusMaxUse, colorFillUse, iconAnchor, bottomMargin, actualColorFill, actualLineWidth) {
        var colorFill = colorFillUse != undefined ? colorFillUse : "#00f";
        var colorStroke = "#494949";
        var lineWidthUse = actualLineWidth != undefined ? actualLineWidth : 1;
        var radiusMax = radiusMaxUse != undefined ? radiusMaxUse : 14;
        var radiusDiff = lineWidthUse;
        var outlineRadius = radiusMax + radiusDiff;
        var insideRadius = radiusMax - radiusDiff;
        var snaptopixel = true;
        var imageDim = (insideRadius - radiusDiff) * 2;
        var sizeCanvas = imageSizeUse != undefined ? imageSizeUse : [imageDim, imageDim];
        var canvas = document.createElement('canvas'), ctx = canvas.getContext("2d");
        if (!iconAnchor) { iconAnchor = [0.5, 0.5]; }
        ctx.canvas.width = outlineRadius;;
        ctx.canvas.height = outlineRadius + (bottomMargin != undefined ? bottomMargin : 0);
        ctx.clearRect(0, 0, sizeCanvas[0], sizeCanvas[1]);

        var actualColorFillUse = actualColorFill != undefined ? actualColorFill : "#fff";

        ctx.fillStyle = actualColorFillUse;
        ctx.beginPath();
        tf.canvas.circle(ctx, 0, 0, outlineRadius);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = colorFill;
        ctx.lineWidth = lineWidthUse;
        ctx.beginPath();
        tf.canvas.circle(ctx, radiusDiff, radiusDiff, radiusMax - radiusDiff);
        ctx.closePath();
        //ctx.fill();
        ctx.stroke();

        ctx.fillStyle = actualColorFillUse;
        ctx.beginPath();
        tf.canvas.circle(ctx, 2 * radiusDiff, 2 * radiusDiff, radiusMax - 3 * radiusDiff);
        ctx.closePath();
        ctx.fill();

        ctx.translate(outlineRadius / 2, outlineRadius / 2);

        ctx.drawImage(imageUse, -sizeCanvas[0] / 2, -sizeCanvas[1] / 2, sizeCanvas[0], sizeCanvas[1]);

        return { icon: true, icon_img: canvas, icon_size: [ctx.canvas.width, ctx.canvas.height], icon_anchor: iconAnchor, zindex: zIndex };
    }

    this.GetSVGMapMarkerWithFrameGeom = function (coords, imageUse, imageSizeUse, radiusMaxUse, colorFillUse, iconAnchor, bottomMargin) {
        var radiusMax = radiusMaxUse != undefined ? radiusMaxUse : 14;
        var radiusDiff = 1;
        var insideRadius = radiusMax - 2;
        var imageDim = (insideRadius - radiusDiff) * 2;
        var imageSize = imageSizeUse != undefined ? imageSizeUse : [imageDim, imageDim];
        var zIndex = 0;

        var style = getSVGMapMarkerWithFrameStyle(++zIndex, imageUse, imageSize, radiusMax, colorFillUse, iconAnchor, bottomMargin);
        var hoverStyle = getSVGMapMarkerWithFrameStyle(++zIndex, imageUse, [imageSize[0]/* + 2*/, imageSize[1]/* + 2*/], radiusMax + 2, colorFillUse, iconAnchor, bottomMargin);

        return { type: 'point', coordinates: coords, style: style, hoverStyle: hoverStyle };
    }

    this.FlashCoords = function (map, coordsToFlash, color) {
        if (isShowingAerial) { color = "#fff" };
        new tf.map.PointsStyleAnimator({ maps: [map], pointProviders: coordsToFlash, duration: 800, getStyle: function flash(elapsed01) { return theThis.GetFlashStyleAtTime(elapsed01, color); } });
    }

    this.GetFlashStyleAtTime = function(elapsed01, color) {
        var radius = 4 + Math.pow(elapsed01, 1 / 2) * 16, opacity = 1 - Math.pow(elapsed01, 3), line_width = (2 - elapsed01);
        var flashStyle = { circle: true, circle_radius: radius, snapToPixel: false, line: true, line_width: line_width, line_color: color, line_opacity: opacity * 100 };
        return flashStyle;
    }

    function makeDataFromSVG(fromSVG) { return "data:image/svg+xml;utf8," + encodeURIComponent(fromSVG); }

    function makeSearchSVG(fillColor) {
        var svgStr = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="32px" height="32px" viewBox="0 0 56.966 56.966" style="enable-background:new 0 0 56.966 56.966;" xml:space="preserve"> <path ';
        if (fillColor != undefined) { svgStr += 'fill="' + fillColor + '" '; }
        svgStr += 'd="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23 s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92 c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17 s-17-7.626-17-17S14.61,6,23.984,6z"/> </svg>';
        return svgStr;
    }

    function createSVGImage(data) { var image = document.createElement('img'); image.src = data; return image; }

    function initCSSClasses() {
        var layoutSettings = tf.TFMap.LayoutSettings;

        var toolTipContentBackground = layoutSettings.toolTipContentBackground;
        var fontSizeToolTipInt = layoutSettings.fontSizeToolTipInt;
        var fontWeightToolTip = layoutSettings.fontWeightToolTip;
        var activeSVGColor = layoutSettings.activeSVGColor;
        var inactiveSVGColor = layoutSettings.inactiveSVGColor;
        var lightBackground = layoutSettings.lightBackground;
        var lightTextShadow = layoutSettings.lightTextShadow; 
        var darkTextShadow = layoutSettings.darkTextShadow; 
        var darkTextColor = layoutSettings.darkTextColor; 
        var lightTextColor = layoutSettings.lightTextColor;
        var zIndexToolTipInt = layoutSettings.zIndexToolTipInt;
        var zIndexToolTipStr = "" + zIndexToolTipInt;

        CSSClasses = {
            lightBackground: { background: lightBackground },
            lightTextShadow: { textShadow: lightTextShadow },
            darkTextShadow: { textShadow: darkTextShadow },
            lightTextColor: { color: lightTextColor },
            darkTextColor: { color: darkTextColor },
            fillActiveSVGColor: { fill: activeSVGColor },
            toolTipBackground: { background: toolTipContentBackground },
            directionsButtonBackground: { background: lightBackground + " url(" + directionsData + (isSmallScreen ? ") center/75% no-repeat" : ") center/70% no-repeat") },
            directionsButtonBackground2: { background: lightBackground + " url(" + directionsData + ") center/80% no-repeat" },
            closeButtonBackground: { background: lightBackground + " url(" + closeData + ") center/50% no-repeat" },
            activeSearchButtonBackground: { background: lightBackground + " url(" + activeSearchData + ") center/50% no-repeat" },
            inactiveSearchButtonBackground: { background: lightBackground + " url(" + inactiveSearchData + ") center/50% no-repeat" },
            menuButtonBackground: { background: lightBackground + " url(" + menuData + ") center/50% no-repeat" },
            arrowRightBackground: { background: lightBackground + " url(" + arrowRightData + ") center/38% no-repeat" },
            arrowLeftBackground: { background: lightBackground + " url(" + arrowLeftData + ") center/38% no-repeat" },
            goFullScreenBackground: { background: lightBackground + " url(" + goFullScreenData + ") center/50% no-repeat" },
            restoreFullScreenBackground: { background: lightBackground + " url(" + restoreFullScreenData + ") center/50% no-repeat" },
            loadingBackgroundTransparent: { background: "url(" + loadingData + ") center/90% no-repeat" },
            loadedOKBackgroundTransparent: { background: "url(" + greenCheckMarkData + ") center/90% no-repeat" },
            refreshGrayBackground: { background: "url(" + refreshGrayData + ") center/100% no-repeat" },
            failedToLoadBackground: { background: "url(" + buttonXRedData + ") center/90% no-repeat" },
            loadingBackground: { background: lightBackground + " url(" + loadingData + ") center/70% no-repeat" },
            noClusterBackground: { background: lightBackground + " url(" + noClusterData + ") center/100% no-repeat" },
            clusterBackground: { background: lightBackground + " url(" + clusterData + ") center/90% no-repeat" },
            borderLeftD4: { borderLeft: "1px solid #D4D4D4" },
            boxShadow002003: { boxShadow: "0px 0px 20px rgba(0,0,0,0.5)" },
            boxShadow01403: { boxShadow: "0px 1px 6px rgba(0,0,0,0.3)" },
            WHOneRem: { width: "1rem", height: "1rem" },
            WHTwoRem: { width: "2rem", height: "2rem" },
            robotoFontFamily: { fontFamily: "Roboto" },
            fontSize16px: { fontSize: "16px" },
            WHOneHundred: { width: "100%", height: "100%" },
            WOneHundred: { width: "100%" },
            HOneHundred: { height: "100%" },
            overflowHidden: { overflow: "hidden" },
            overflowVisible: { overflow: "visible" },
            textOverflowEllipsis: { textOverflow: "ellipsis" },
            displayFlex: { display: "flex" },
            displayBlock: { display: "block" },
            displayNone: { display: "none" },
            displayInlineBlock: { display: "inline-block" },
            displayInline: { display: "inline" },
            flexFlowColumnNoWrap: { flexFlow: "column nowrap" },
            flexFlowColumnWrap: { flexFlow: "column wrap" },
            flexFlowRowNoWrap: { flexFlow: "row nowrap" },
            flexFlowRowWrap: { flexFlow: "row wrap" },
            flexFlowRowReverseNoWrap: { flexFlow: "row-reverse nowrap" },
            flexOne: { flex: "1" },
            flexZero: { flex: "0" },
            flexGrowOne: { flexGrow: "1" },
            flexGrowZero: { flexGrow: "0" },
            flexShrinkOne: { flexShrink: "1" },
            flexShrinkZero: {flexShrink: "0" },
            marginAuto: { margin: "auto" },
            borderRadius2px: { borderRadius: "2px" },
            cursorText: { cursor: "text" },
            cursorPointer: { cursor: "pointer" },
            cursorDefault: { cursor: "default" },
            listStyleNone: { listStyle: "none" },
            listStyleTypeNone: { listStyleType: "none" },
            noBorder: { border: "0" },
            noMargin: { margin: "0px" },
            noPadding: { padding: "0px" },
            outline0: { outline: "0" },
            positionAbsolute: { position: "absolute" },
            positionRelative: { position: "relative" },
            leftTopZero: { left: "0px", top: "0px" },
            leftBotZero: { left: "0px", bottom: "0px" },
            fontInherit: { font: "inherit" },
            verticalAlignTop: { verticalAlign: "top" },
            verticalAlignBaseline: { verticalAlign: "baseline" },
            verticalAlignMiddle: { verticalAlign: "middle" },
            /*zIndex1: { zIndex: "1" },
            zIndex2: { zIndex: "2" },*/

            zIndex1: { zIndex: '' + (layoutSettings.rootDivZIndex + 1) },
            zIndex2: { zIndex: '' + (layoutSettings.rootDivZIndex + 2) },

            backgroundColorWhite: { backgroundColor: "white" },
            backgroundColorRed: { backgroundColor: "red" },
            backgroundColorGreen: { backgroundColor: "green" },
            backgroundColorBlue: { backgroundColor: "blue" },
            backgroundColorTransparent: { backgroundColor: "transparent" },
            visibilityHidden: { visibility: "hidden" },
            visibilityVisible: { visibility: "visible" },
            whiteSpaceNoWrap: { whiteSpace: "nowrap" },
            whiteSpaceNormal: { whiteSpace: "normal" },
            pointerEventsNone: { pointerEvents: "none" },
            pointerEventsAll: { pointerEvents: "all" },
            transitionBackground: {
                transitionProperty: "-webkit-transform,transform,opacity,visibility,left,top,right,bottom,width,height,background",
                transitionDuration: "0.5s",
                transitionTimingFunction: "cubic-bezier(0.0,0.0,0.2,1)"
            },
            transitionPoint2s: {
                transitionProperty: "-webkit-transform,transform,opacity,visibility,left,top,right,bottom,width,height",
                transitionDuration: "0.2s",
                transitionTimingFunction: "cubic-bezier(0.0,0.0,0.2,1)"
            },
            transitionWithColor: {
                transitionProperty: "-webkit-transform,transform,opacity,visibility,left,top,right,bottom,width,height,color",
                transitionDuration: "1s",
                transitionTimingFunction: "cubic-bezier(0.0,0.0,0.2,1)"
            }
        };

        CSSClasses.noMarginNoBorderNoPadding = { inherits: [CSSClasses.noMargin, CSSClasses.noBorder, CSSClasses.noPadding] };
        CSSClasses.noBorderNoPadding = { inherits: [CSSClasses.noBorder, CSSClasses.noPadding] };
        CSSClasses.baseTextButton = { inherits: [CSSClasses.robotoFontFamily, CSSClasses.cursorPointer, CSSClasses.outline0, CSSClasses.verticalAlignMiddle, CSSClasses.listStyleNone, CSSClasses.overflowVisible] };
        CSSClasses.transparentImageButton = { inherits: [CSSClasses.baseTextButton, CSSClasses.noMarginNoBorderNoPadding] };
        CSSClasses.inheritBackgroundAndColorImageButton = { inherits: [CSSClasses.transparentImageButton], background: 'inherit', color: 'inherit' };
        CSSClasses.baseImageButton = { inherits: [CSSClasses.transparentImageButton, CSSClasses.backgroundColorTransparent], border: "1px solid transparent" };
        CSSClasses.absoluteCenter = { inherits: [CSSClasses.positionAbsolute], left: "50%", top: "50%", transform: "translate(-50%, -50%)", "-webkit-transform": "translate(-50%,-50%)" };
    }

    function createElemClasses() {
        var elemClasses = {};
        var placeHolderClassNames = ["::-webkit-input-placeholder", "::-moz-placeholder", ":-ms-input-placeholder", ":-moz-placeholder"];
        for (var i in placeHolderClassNames) { elemClasses[placeHolderClassNames[i]] = { fontSize: "0.9rem", color: "rgba(0, 60, 130, 0.4)" }; }
        var selectionClassNames = ["::-moz-selection", "::selection"];
        for (var i in selectionClassNames) { elemClasses[selectionClassNames[i]] = { color: "white", background: "orange" }; }
        return elemClasses;
    }

    function createCSSClasses() {
        var styles = tf.GetStyles(tf.styles.GetGraphiteAPIStyleSpecifications());
        var styleCreator = styles.GetStyleCreator();
        var elemClasses = createElemClasses();
        var cssStyles = [];
        initCSSClasses();
        for (var i in elemClasses) { var cssStr = elemClasses[i], cssName = '' + i; cssStyles.push({ styleName: cssName, inherits: cssStr }); }
        //for (var i in CSSClasses) { var cssStr = CSSClasses[i], cssName = '.' + i; cssStyles.push({ styleName: cssName, inherits: cssStr }); }
        styleCreator.CreateStyles(cssStyles);
    }

    function onImagesCreated(notification) {
        var imgs = notification.GetImgs(), index = 0;
        var layoutSettings = tf.TFMap.LayoutSettings;
        var activeSVGColor = layoutSettings.activeSVGColor;
        var inactiveSVGColor = layoutSettings.inactiveSVGColor;

        redMarkerImage = imgs[index++].GetImg();
        loadingImage = imgs[index++].GetImg();
        mapMarker1Image = imgs[index++].GetImg();
        mapMarkerSearchImage = imgs[index++].GetImg();
        tapImage = imgs[index++].GetImg();
        geolocationImage = imgs[index++].GetImg();
        fromImage = imgs[index++].GetImg();
        toImage = imgs[index++].GetImg();
        directionsMapArrowImage = imgs[index++].GetImg();
        arrowSquareRightImage = imgs[index++].GetImg();
        arrowSmallRightImage = imgs[index++].GetImg();

        busImage = imgs[index++].GetImg();

        busPNGImage = imgs[index++].GetImg();

        var refreshGraySVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 491.236 491.236" style="fill:#ff5500;enable-background:new 0 0 491.236 491.236;" xml:space="preserve"> <g> <g> <path d="M55.89,262.818c-3-26-0.5-51.1,6.3-74.3c22.6-77.1,93.5-133.8,177.6-134.8v-50.4c0-2.8,3.5-4.3,5.8-2.6l103.7,76.2 c1.7,1.3,1.7,3.9,0,5.1l-103.6,76.2c-2.4,1.7-5.8,0.2-5.8-2.6v-50.3c-55.3,0.9-102.5,35-122.8,83.2c-7.7,18.2-11.6,38.3-10.5,59.4 c1.5,29,12.4,55.7,29.6,77.3c9.2,11.5,7,28.3-4.9,37c-11.3,8.3-27.1,6-35.8-5C74.19,330.618,59.99,298.218,55.89,262.818z M355.29,166.018c17.3,21.5,28.2,48.3,29.6,77.3c1.1,21.2-2.9,41.3-10.5,59.4c-20.3,48.2-67.5,82.4-122.8,83.2v-50.3 c0-2.8-3.5-4.3-5.8-2.6l-103.7,76.2c-1.7,1.3-1.7,3.9,0,5.1l103.6,76.2c2.4,1.7,5.8,0.2,5.8-2.6v-50.4 c84.1-0.9,155.1-57.6,177.6-134.8c6.8-23.2,9.2-48.3,6.3-74.3c-4-35.4-18.2-67.8-39.5-94.4c-8.8-11-24.5-13.3-35.8-5 C348.29,137.718,346.09,154.518,355.29,166.018z"/> </g> </g> </svg>';
        refreshGrayData = makeDataFromSVG(refreshGraySVG);

        var goFullScreenSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 28.361 28.361" style="fill:' + activeSVGColor + ';enable-background:new 0 0 28.361 28.361;" xml:space="preserve"> <g> <g> <path d="M28.36,19.595c0-0.868-0.665-1.57-1.491-1.57c-0.819,0.002-1.492,0.702-1.492,1.57v3.25l-6.018-6.021 c-0.582-0.583-1.524-0.583-2.106,0c-0.582,0.582-0.582,1.527,0,2.109l5.989,5.987h-3.235c-0.881,0.002-1.591,0.669-1.591,1.491 c0,0.824,0.71,1.49,1.591,1.49h6.761c0.881,0,1.59-0.665,1.593-1.49c-0.003-0.022-0.006-0.039-0.009-0.061 c0.003-0.028,0.009-0.058,0.009-0.087v-6.668H28.36z"/> <path d="M9,16.824l-6.015,6.021v-3.25c0-0.868-0.672-1.568-1.493-1.57c-0.824,0-1.49,0.702-1.49,1.57L0,26.264 c0,0.029,0.008,0.059,0.01,0.087c-0.002,0.021-0.006,0.038-0.008,0.061c0.002,0.825,0.712,1.49,1.592,1.49h6.762 c0.879,0,1.59-0.666,1.59-1.49c0-0.822-0.711-1.489-1.59-1.491H5.121l5.989-5.987c0.58-0.582,0.58-1.527,0-2.109 C10.527,16.241,9.584,16.241,9,16.824z"/> <path d="M19.359,11.535l6.018-6.017v3.25c0,0.865,0.673,1.565,1.492,1.568c0.826,0,1.491-0.703,1.491-1.568V2.097 c0-0.029-0.006-0.059-0.009-0.085c0.003-0.021,0.006-0.041,0.009-0.062c-0.003-0.826-0.712-1.491-1.592-1.491h-6.761 c-0.881,0-1.591,0.665-1.591,1.491c0,0.821,0.71,1.49,1.591,1.492h3.235l-5.989,5.987c-0.582,0.581-0.582,1.524,0,2.105 C17.835,12.12,18.777,12.12,19.359,11.535z"/> <path d="M5.121,3.442h3.234c0.879-0.002,1.59-0.671,1.59-1.492c0-0.826-0.711-1.491-1.59-1.491H1.594 c-0.88,0-1.59,0.665-1.592,1.491C0.004,1.971,0.008,1.991,0.01,2.012C0.008,2.038,0,2.067,0,2.097l0.002,6.672 c0,0.865,0.666,1.568,1.49,1.568c0.821-0.003,1.493-0.703,1.493-1.568v-3.25L9,11.535c0.584,0.585,1.527,0.585,2.11,0 c0.58-0.581,0.58-1.524,0-2.105L5.121,3.442z"/> </g> </g> </svg>';
        goFullScreenData = makeDataFromSVG(goFullScreenSVG);

        var restoreFullScreenSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill:' + activeSVGColor + ';enable-background:new 0 0 28.361 28.361;" viewBox="0 0 28.361 28.361" y="0px" x="0px" version="1.1"><path d="m 16.8175,24.69275 c 0,0.868 0.665,1.57 1.491,1.57 0.819,-0.002 1.492,-0.702 1.492,-1.57 l 0,-3.25 6.018,6.021 c 0.582,0.583 1.524,0.583 2.106,0 0.582,-0.582 0.582,-1.527 0,-2.109 l -5.989,-5.987 3.235,0 c 0.881,-0.002 1.591,-0.669 1.591,-1.491 0,-0.824 -0.71,-1.49 -1.591,-1.49 l -6.761,0 c -0.881,0 -1.59,0.665 -1.593,1.49 0.003,0.022 0.006,0.039 0.009,0.061 -0.003,0.028 -0.009,0.058 -0.009,0.087 l 0,6.668 10e-4,0 z" /><path d="m 2.545,27.464875 6.015,-6.021 0,3.25 c 0,0.868 0.672,1.568 1.493,1.57 0.824,0 1.49,-0.702 1.49,-1.57 l 0.002,-6.669 c 0,-0.029 -0.008,-0.059 -0.01,-0.087 0.002,-0.021 0.006,-0.038 0.008,-0.061 -0.002,-0.825 -0.712,-1.49 -1.592,-1.49 l -6.762,0 c -0.879,0 -1.59,0.666 -1.59,1.49 0,0.822 0.711,1.489 1.59,1.491 l 3.235,0 -5.989,5.987 c -0.58,0.582 -0.58,1.527 0,2.109 0.583,0.584 1.526,0.584 2.11,10e-4 z" /><path d="m 25.8175,0.89762508 -6.018,6.01700002 0,-3.25 c 0,-0.865 -0.673,-1.565 -1.492,-1.568 -0.826,0 -1.491,0.703 -1.491,1.568 l 0,6.6709999 c 0,0.029 0.006,0.059 0.009,0.085 -0.003,0.021 -0.006,0.041 -0.009,0.062 0.003,0.826 0.712,1.491 1.592,1.491 l 6.761,0 c 0.881,0 1.591,-0.665 1.591,-1.491 0,-0.8209999 -0.71,-1.4899999 -1.591,-1.4919999 l -3.235,0 5.989,-5.987 c 0.582,-0.581 0.582,-1.524 0,-2.10500002 -0.582,-0.586 -1.524,-0.586 -2.106,-0.001 z" /><path d="m 6.424,8.99075 -3.234,0 c -0.879,0.002 -1.59,0.671 -1.59,1.492 0,0.826 0.711,1.491 1.59,1.491 l 6.761,0 c 0.88,0 1.59,-0.665 1.592,-1.491 -0.002,-0.021 -0.006,-0.041 -0.008,-0.062 0.002,-0.026 0.01,-0.055 0.01,-0.085 l -0.002,-6.672 c 0,-0.865 -0.666,-1.568 -1.49,-1.568 -0.821,0.003 -1.493,0.703 -1.493,1.568 l 0,3.25 -6.015,-6.016 c -0.584,-0.585 -1.527,-0.585 -2.11,0 -0.58,0.581 -0.58,1.524 0,2.105 l 5.989,5.988 z" /></svg>'
        restoreFullScreenData = makeDataFromSVG(restoreFullScreenSVG);

        onOffSVG = '<svg style="width:100%;height:100%" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 14.573 14.573" style="enable-background:new 0 0 14.573 14.573;" xml:space="preserve"> <g> <g> <path d="M7.286,14.573c-1.736,0-3.368-0.676-4.596-1.903c-1.227-1.228-1.904-2.86-1.904-4.597 s0.677-3.369,1.904-4.597c0.391-0.391,1.023-0.391,1.414,0s0.391,1.023,0,1.414c-0.85,0.851-1.318,1.981-1.318,3.183 s0.468,2.333,1.318,3.183s1.979,1.317,3.182,1.317s2.332-0.468,3.182-1.317c0.851-0.85,1.318-1.98,1.318-3.183 S11.318,5.74,10.469,4.89c-0.391-0.391-0.391-1.023,0-1.414s1.023-0.391,1.414,0c1.227,1.229,1.904,2.861,1.904,4.597 s-0.677,3.369-1.904,4.597C10.655,13.897,9.023,14.573,7.286,14.573z"/> </g> <g> <path d="M7.286,7c-0.553,0-1-0.448-1-1V1c0-0.552,0.447-1,1-1s1,0.448,1,1v5C8.286,6.552,7.84,7,7.286,7z" /> </g> </g> </svg>';

        arrowRightSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 41.999 41.999" style="fill:' + activeSVGColor + '; enable-background:new 0 0 41.999 41.999;" xml:space="preserve"> <path d="M36.068,20.176l-29-20C6.761-0.035,6.363-0.057,6.035,0.114C5.706,0.287,5.5,0.627,5.5,0.999v40 c0,0.372,0.206,0.713,0.535,0.886c0.146,0.076,0.306,0.114,0.465,0.114c0.199,0,0.397-0.06,0.568-0.177l29-20 c0.271-0.187,0.432-0.494,0.432-0.823S36.338,20.363,36.068,20.176z"/> </svg>';
        arrowRightData = makeDataFromSVG(arrowRightSVG);

        arrowLeftSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill:' + activeSVGColor + '; enable-background:new 0 0 41.999 41.999;" viewBox="0 0 41.999 41.999" y="0px" x="0px" version="1.1"><path d="m 5.932,20.176 29,-20 c 0.307,-0.211 0.705,-0.233 1.033,-0.062 0.329,0.173 0.535,0.513 0.535,0.885 l 0,40 c 0,0.372 -0.206,0.713 -0.535,0.886 -0.146,0.076 -0.306,0.114 -0.465,0.114 -0.199,0 -0.397,-0.06 -0.568,-0.177 l -29,-20 C 5.661,21.635 5.5,21.328 5.5,20.999 5.5,20.67 5.662,20.363 5.932,20.176 Z" /></svg>';
        arrowLeftData = makeDataFromSVG(arrowLeftSVG);

        arrowRightSVGNoColor = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 41.999 41.999" enable-background:new 0 0 41.999 41.999;" xml:space="preserve"> <path d="M36.068,20.176l-29-20C6.761-0.035,6.363-0.057,6.035,0.114C5.706,0.287,5.5,0.627,5.5,0.999v40 c0,0.372,0.206,0.713,0.535,0.886c0.146,0.076,0.306,0.114,0.465,0.114c0.199,0,0.397-0.06,0.568-0.177l29-20 c0.271-0.187,0.432-0.494,0.432-0.823S36.338,20.363,36.068,20.176z"/> </svg>';
        arrowLeftSVGNoColor = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" enable-background:new 0 0 41.999 41.999;" viewBox="0 0 41.999 41.999" y="0px" x="0px" version="1.1"><path d="m 5.932,20.176 29,-20 c 0.307,-0.211 0.705,-0.233 1.033,-0.062 0.329,0.173 0.535,0.513 0.535,0.885 l 0,40 c 0,0.372 -0.206,0.713 -0.535,0.886 -0.146,0.076 -0.306,0.114 -0.465,0.114 -0.199,0 -0.397,-0.06 -0.568,-0.177 l -29,-20 C 5.661,21.635 5.5,21.328 5.5,20.999 5.5,20.67 5.662,20.363 5.932,20.176 Z" /></svg>';

        var menuSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 53 53" style="fill:' + activeSVGColor + '; enable-background:new 0 0 53 53;" xml:space="preserve"> <g> <g> <path d="M2,13.5h49c1.104,0,2-0.896,2-2s-0.896-2-2-2H2c-1.104,0-2,0.896-2,2S0.896,13.5,2,13.5z"/> <path d="M2,28.5h49c1.104,0,2-0.896,2-2s-0.896-2-2-2H2c-1.104,0-2,0.896-2,2S0.896,28.5,2,28.5z"/> <path d="M2,43.5h49c1.104,0,2-0.896,2-2s-0.896-2-2-2H2c-1.104,0-2,0.896-2,2S0.896,43.5,2,43.5z"/> </g> </g></svg>';
        menuData = makeDataFromSVG(menuSVG);

        var inactiveSearchSVG = makeSearchSVG(inactiveSVGColor);
        inactiveSearchData = makeDataFromSVG(inactiveSearchSVG);

        var activeSearchSVG = makeSearchSVG(activeSVGColor);
        activeSearchData = makeDataFromSVG(activeSearchSVG);

        searchSVG = makeSearchSVG(undefined);

        carSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/" x="0px" y="0px" width="16px" height="16px" viewBox="-1 -2.145 16 16" overflow="visible" enable-background="new -1 -2.145 16 16" xml:space="preserve"> <defs> </defs> <path d="M12.729,4.018l-1.147-2.963C11.367,0.487,10.898,0.004,10.011,0H8.392H5.626H3.979 c-0.883,0.004-1.352,0.487-1.57,1.055L1.262,4.018C0.805,4.077-0.002,4.612,0,5.626v3.773h1.12v1.204 c-0.003,1.485,2.098,1.468,2.098,0V9.399H7h3.772v1.204c0.004,1.468,2.106,1.485,2.107,0V9.399H14V5.626 C13.996,4.612,13.189,4.077,12.729,4.018z M2.483,7.702c-0.693,0.001-1.254-0.576-1.25-1.287C1.229,5.7,1.791,5.122,2.483,5.128 c0.69-0.006,1.25,0.572,1.25,1.288C3.733,7.126,3.174,7.703,2.483,7.702z M7,3.99H6.99H2.456l0.865-2.333 c0.104-0.331,0.267-0.568,0.649-0.574h3.02H7h3.03c0.377,0.006,0.539,0.243,0.648,0.574l0.865,2.333H7z M11.522,7.69 c-0.694,0.002-1.252-0.573-1.256-1.28c0.004-0.713,0.562-1.289,1.256-1.282c0.683-0.006,1.241,0.569,1.244,1.282 C12.764,7.117,12.205,7.692,11.522,7.69z"/> </svg>';
        walkSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/" x="0px" y="0px" width="16px" height="16px" viewBox="-3.466 0 16 16" overflow="visible" enable-background="new -3.466 0 16 16" xml:space="preserve"> <defs> </defs> <path d="M5.767,1.233C5.767,0.542,5.225,0,4.534,0C3.841,0,3.301,0.542,3.301,1.233c0,0.692,0.54,1.234,1.232,1.234 C5.225,2.467,5.767,1.925,5.767,1.233z M8.79,4.62c0,0-1.472-0.826-2.123-1.168C6.015,3.108,4.72,2.221,3.566,3.247 C3.042,3.713,2.438,6.096,2.438,6.096L0,7.6l0.4,0.558l2.656-0.966l0.742-0.961l0.786,1.733l-1.586,2.78l-1.252,4.674l1.295,0.436 l1.456-4.366l1.077-1.063L7.933,16l1.136-0.524L7.162,8.692c0,0,0.237-0.487,0.237-1.264c0-0.89-0.703-2.347-0.703-2.347 l1.151,0.265l0.258,2.898l0.726,0.068L8.79,4.62z"/> </svg>';
        bikeSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/" x="0px" y="0px" width="16px" height="16px" viewBox="0 -2 16 16" overflow="visible" enable-background="new 0 -2 16 16" xml:space="preserve"> <defs> </defs> <path d="M12.5,5c-0.355,0-0.691,0.068-1.014,0.168l-0.594-1.094L12.32,1l0.135-0.289 c0.072-0.154,0.061-0.336-0.031-0.48C12.332,0.088,12.172,0,12.002,0h-0.321H9.5C9.224,0,9,0.225,9,0.5C9,0.777,9.224,1,9.5,1h1.717 l-0.93,2H5.002C4.785,3,4.594,3.139,4.527,3.344L3.969,5.047C3.813,5.027,3.66,5,3.5,5C1.567,5,0,6.566,0,8.5S1.567,12,3.5,12 S7,10.434,7,8.5c0-1.422-0.852-2.639-2.068-3.188l0.213-0.65C5.273,4.268,5.641,4,6.057,4h3.635l0.07,0.131l0.598,1.09l0.201,0.367 C9.621,6.217,9,7.285,9,8.5c0,1.934,1.567,3.5,3.5,3.5S16,10.434,16,8.5S14.433,5,12.5,5z M6,8.5C6,9.879,4.879,11,3.5,11 S1,9.879,1,8.5S2.121,6,3.5,6c0.052,0,0.1,0.012,0.15,0.016L3.154,7.527C3.069,7.789,3.211,8.07,3.472,8.158 c0.126,0.041,0.264,0.031,0.383-0.027C3.973,8.07,4.062,7.965,4.104,7.84l0.512-1.564C5.434,6.688,6,7.525,6,8.5z M12.5,11 C11.121,11,10,9.879,10,8.5c0-0.834,0.416-1.57,1.047-2.025l1.274,2.328c0.13,0.234,0.421,0.326,0.661,0.207l0.002-0.002 c0.121-0.061,0.213-0.168,0.254-0.297s0.027-0.27-0.037-0.389l-1.23-2.264C12.142,6.021,12.318,6,12.5,6C13.879,6,15,7.121,15,8.5 S13.879,11,12.5,11z"/> <path d="M3.5,2H5c0.752,0,1.195-0.256,1.637-0.65c0.062-0.055,0.082-0.143,0.053-0.221S6.586,1,6.503,1H3.5 C3.224,1,3,1.225,3,1.5C3,1.777,3.224,2,3.5,2z"/> </svg>';

        upDownArrowSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="71.753px" height="71.753px" viewBox="0 0 71.753 71.753" style="enable-background:new 0 0 71.753 71.753;" xml:space="preserve"> <g> <path d="M39.798,20.736H28.172v20.738L11.625,41.47V20.736H0L19.899,0.839L39.798,20.736z M51.855,70.914l19.897-19.896H60.129 V30.282l-16.547-0.004v20.74H31.957L51.855,70.914z"/> </g> </svg>';

        //XMarkSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="64px" height="64px" enable-background="new 0 0 64 64" viewBox="0 0 63.997501 63.553501" height="63.553501" version="1.1" width="63.997501"> <path d="m 28.93825,31.7865 -28.328,28.328 c -0.787,0.787 -0.787,2.062 0,2.849 0.393,0.394 0.909,0.59 1.424,0.59 0.516,0 1.031,-0.196 1.424,-0.59 l 28.541,-28.541 28.541,28.541 c 0.394,0.394 0.909,0.59 1.424,0.59 0.515,0 1.031,-0.196 1.424,-0.59 0.787,-0.787 0.787,-2.062 0,-2.849 l -28.327,-28.328 28.346,-28.348 c 0.787,-0.787 0.787,-2.062 0,-2.849 -0.787,-0.786 -2.062,-0.786 -2.848,0 l -28.559,28.561 -28.562,-28.56 c -0.787,-0.786 -2.061,-0.786 -2.848,0 -0.787,0.787 -0.787,2.062 0,2.849 l 28.348,28.347 z" style="fill-opacity:1" /> </svg>';

        XMarkSVG = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" height="369.7908" width="369.79126" xml:space="preserve" viewBox="0 0 369.79127 369.79081" y="0px" x="0px" version="1.1"><g transform="matrix(0.70710678,-0.70710678,0.70710678,0.70710678,-162.90155,184.89552)" ><g ><path d="m 465.167,211.614 -184.922,0 0,-184.923 c 0,-8.424 -11.439,-26.69 -34.316,-26.69 -22.877,0 -34.316,18.267 -34.316,26.69 l 0,184.924 -184.923,0 C 18.267,211.614 0,223.053 0,245.929 c 0,22.876 18.267,34.316 26.69,34.316 l 184.924,0 0,184.924 c 0,8.422 11.438,26.69 34.316,26.69 22.878,0 34.316,-18.268 34.316,-26.69 l 0,-184.924 184.924,0 c 8.422,0 26.69,-11.438 26.69,-34.316 0,-22.878 -18.27,-34.315 -26.693,-34.315 z" /></g><g /></g></svg>';

        closeData = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgaWQ9InN2ZzY0MzQiCiAgIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDY0IDY0IgogICB2aWV3Qm94PSIwIDAgNjMuOTk3NTAxIDYzLjU1MzUwMSIKICAgaGVpZ2h0PSI2My41NTM1MDEiCiAgIHZlcnNpb249IjEuMSIKICAgd2lkdGg9IjYzLjk5NzUwMSI+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhNjQ0NCI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGU+PC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGRlZnMKICAgICBpZD0iZGVmczY0NDIiIC8+CiAgPHBhdGgKICAgICBkPSJtIDI4LjkzODI1LDMxLjc4NjUgLTI4LjMyOCwyOC4zMjggYyAtMC43ODcsMC43ODcgLTAuNzg3LDIuMDYyIDAsMi44NDkgMC4zOTMsMC4zOTQgMC45MDksMC41OSAxLjQyNCwwLjU5IDAuNTE2LDAgMS4wMzEsLTAuMTk2IDEuNDI0LC0wLjU5IGwgMjguNTQxLC0yOC41NDEgMjguNTQxLDI4LjU0MSBjIDAuMzk0LDAuMzk0IDAuOTA5LDAuNTkgMS40MjQsMC41OSAwLjUxNSwwIDEuMDMxLC0wLjE5NiAxLjQyNCwtMC41OSAwLjc4NywtMC43ODcgMC43ODcsLTIuMDYyIDAsLTIuODQ5IGwgLTI4LjMyNywtMjguMzI4IDI4LjM0NiwtMjguMzQ4IGMgMC43ODcsLTAuNzg3IDAuNzg3LC0yLjA2MiAwLC0yLjg0OSAtMC43ODcsLTAuNzg2IC0yLjA2MiwtMC43ODYgLTIuODQ4LDAgbCAtMjguNTU5LDI4LjU2MSAtMjguNTYyLC0yOC41NiBjIC0wLjc4NywtMC43ODYgLTIuMDYxLC0wLjc4NiAtMi44NDgsMCAtMC43ODcsMC43ODcgLTAuNzg3LDIuMDYyIDAsMi44NDkgbCAyOC4zNDgsMjguMzQ3IHoiCiAgICAgaWQ9InBhdGg2NDM4IgogICAgIHN0eWxlPSJmaWxsOiM0OTQ5NDk7ZmlsbC1vcGFjaXR5OjEiIC8+Cjwvc3ZnPgo=';

        var directionsSVG = '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill:' + activeSVGColor + '; enable-background:new 0 0 373.655 373.655;" viewBox="0 0 373.655 373.655" y="0px" x="0px" version="1.1"> <path d="m 138.84444,104.25104 c -1.07626,0.19891 -1.68142,0.89656 -1.60489,1.85368 l 5.14829,64.06458 c 0.089,1.10654 1.07189,2.36641 2.5102,3.21921 0.25541,0.15123 0.51778,0.28502 0.78073,0.39975 1.21886,0.53185 2.47781,0.66524 3.3728,0.32896 l 19.89439,-7.46431 c 20.98033,32.95554 13.88426,58.2558 6.99077,82.79226 -1.14939,4.0942 -2.3394,8.327 -3.34832,12.46395 l 37.53318,16.37742 c 0.94507,-3.87515 2.04635,-7.79431 3.21202,-11.94409 7.60663,-27.07599 16.9401,-60.34066 -13.58704,-105.53444 l 26.20507,-0.84794 c 1.37165,-0.0444 2.20417,-0.78239 2.12781,-1.88516 -0.0764,-1.10277 -1.04906,-2.36528 -2.48318,-3.22419 l -83.03496,-49.72496 c -1.23923,-0.74384 -2.63938,-1.07307 -3.71687,-0.87472 z" /><path d="M 369.261,176.221 197.434,4.394 c -5.857,-5.858 -15.355,-5.858 -21.213,0 L 4.394,176.221 c -5.858,5.858 -5.858,15.355 0,21.213 l 171.827,171.827 c 2.929,2.929 6.767,4.394 10.606,4.394 3.839,0 7.678,-1.464 10.606,-4.394 L 369.26,197.434 c 5.859,-5.858 5.859,-15.355 0.001,-21.213 z M 186.827,337.441 36.213,186.827 186.827,36.214 337.441,186.828 186.827,337.441 Z" /></svg>';
        directionsData = makeDataFromSVG(directionsSVG);

        geolocationSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" height="100%" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"> <g> <g> <path d="M256,0C114.84,0,0,114.842,0,256s114.84,256,256,256s256-114.842,256-256S397.16,0,256,0z M256,462.452 c-113.837,0-206.452-92.614-206.452-206.452S142.163,49.548,256,49.548S462.452,142.163,462.452,256S369.837,462.452,256,462.452z "/> </g> </g> <g> <g> <path d="M256,132.129c-68.302,0-123.871,55.569-123.871,123.871S187.698,379.871,256,379.871S379.871,324.302,379.871,256 S324.302,132.129,256,132.129z M256,330.323c-40.983,0-74.323-33.341-74.323-74.323c0-40.982,33.339-74.323,74.323-74.323 s74.323,33.341,74.323,74.323C330.323,296.981,296.983,330.323,256,330.323z"/> </g> </g> </svg>';

        greenCheckMarkData = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIKICAgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTg3LjkxIDU4Ny45MTsiCiAgIHZpZXdCb3g9IjAgMCA1ODcuOTEgNTg3LjkxIgogICBoZWlnaHQ9IjU4Ny45MXB4IgogICB3aWR0aD0iNTg3LjkxcHgiCiAgIHk9IjBweCIKICAgeD0iMHB4IgogICBpZD0iQ2FwYV8xIgogICB2ZXJzaW9uPSIxLjEiPjxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTcwMzgiPjxyZGY6UkRGPjxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzCiAgICAgaWQ9ImRlZnM3MDM2IiAvPjxnCiAgICAgc3R5bGU9ImZpbGw6IzAwMzM3NztmaWxsLW9wYWNpdHk6MSIKICAgICBpZD0iZzY5OTIiPjxwYXRoCiAgICAgICBzdHlsZT0iZmlsbDojMDAzMzc3O2ZpbGwtb3BhY2l0eToxIgogICAgICAgaWQ9InBhdGg2OTk0IgogICAgICAgZD0ibSA4Ni40NTEsNTAxLjQ2IGMgMjYuOTM3LDI2LjkzNiA1OC4zMTUsNDguMDg4IDkzLjI2NSw2Mi44NzEgMzYuMjA3LDE1LjMxNCA3NC42NDIsMjMuMDc4IDExNC4yMzksMjMuMDc4IDM5LjU5NiwwIDc4LjAzMiwtNy43NjQgMTE0LjIzOSwtMjMuMDc4IDM0Ljk0OSwtMTQuNzgzIDY2LjMyOCwtMzUuOTM2IDkzLjI2NiwtNjIuODcxIDI2LjkzNiwtMjYuOTM4IDQ4LjA5LC01OC4zMTYgNjIuODcxLC05My4yNjYgMTUuMzE0LC0zNi4yMDcgMjMuMDgsLTc0LjY0MyAyMy4wOCwtMTE0LjIzOCAwLC0zOS41OTggLTcuNzY2LC03OC4wMzMgLTIzLjA4LC0xMTQuMjM5IEMgNTQ5LjU1LDE0NC43NjcgNTI4LjM5NSwxMTMuMzg5IDUwMS40Niw4Ni40NTIgNDc0LjUyMiw1OS41MTUgNDQzLjE0NCwzOC4zNjIgNDA4LjE5NCwyMy41OCAzNzEuOTg2LDguMjY1IDMzMy41NTEsMC41MDEgMjkzLjk1NSwwLjUwMSAyNTQuMzU4LDAuNTAxIDIxNS45MjMsOC4yNjYgMTc5LjcxNiwyMy41OCAxNDQuNzY2LDM4LjM2MiAxMTMuMzg4LDU5LjUxNiA4Ni40NTEsODYuNDUyIDU5LjUxNCwxMTMuMzg4IDM4LjM2MSwxNDQuNzY3IDIzLjU3OCwxNzkuNzE2IDguMjY1LDIxNS45MjMgMC41LDI1NC4zNTggMC41LDI5My45NTYgYyAwLDM5LjU5NiA3Ljc2NSw3OC4wMzEgMjMuMDc5LDExNC4yMzggMTQuNzgyLDM0Ljk1IDM1LjkzNiw2Ni4zMjggNjIuODcyLDkzLjI2NiB6IE0gMjkzLjk1NSw0My4zNDEgYyAxMzguNDExLDAgMjUwLjYxNCwxMTIuMjA0IDI1MC42MTQsMjUwLjYxNSAwLDEzOC40MSAtMTEyLjIwMywyNTAuNjEzIC0yNTAuNjE0LDI1MC42MTMgQyAxNTUuNTQ0LDU0NC41NjkgNDMuMzQsNDMyLjM2NiA0My4zNCwyOTMuOTU2IDQzLjM0LDE1NS41NDUgMTU1LjU0NCw0My4zNDEgMjkzLjk1NSw0My4zNDEgWiIgLz48cGF0aAogICAgICAgc3R5bGU9ImZpbGw6IzAwMzM3NztmaWxsLW9wYWNpdHk6MSIKICAgICAgIGlkPSJwYXRoNjk5NiIKICAgICAgIGQ9Im0gMjkzLjk1NSw1ODcuOTA5IGMgLTM5LjY2NywwIC03OC4xNjcsLTcuNzc4IC0xMTQuNDM0LC0yMy4xMTcgQyAxNDQuNTExLDU0OS45ODMgMTEzLjA3OSw1MjguNzk0IDg2LjA5OCw1MDEuODEzIDU5LjExNSw0NzQuODI5IDM3LjkyNiw0NDMuMzk2IDIzLjExOSw0MDguMzg4IDcuNzc4LDM3Mi4xMTkgMCwzMzMuNjE4IDAsMjkzLjk1NiAwLDI1NC4yOTMgNy43NzgsMjE1Ljc5MSAyMy4xMTgsMTc5LjUyMSAzNy45MjUsMTQ0LjUxMyA1OS4xMTUsMTEzLjA4MSA4Ni4wOTcsODYuMDk4IDExMy4wNzksNTkuMTE1IDE0NC41MTIsMzcuOTI2IDE3OS41MiwyMy4xMTkgMjE1Ljc5LDcuNzc5IDI1NC4yOTEsMC4wMDEgMjkzLjk1NCwwLjAwMSBjIDM5LjY2NiwwIDc4LjE2Nyw3Ljc3OCAxMTQuNDMzLDIzLjExOSAzNS4wMDksMTQuODA3IDY2LjQ0MSwzNS45OTcgOTMuNDI1LDYyLjk3OSAyNi45ODQsMjYuOTg1IDQ4LjE3Myw1OC40MTcgNjIuOTc5LDkzLjQyMyAxNS4zNDEsMzYuMjcgMjMuMTE5LDc0Ljc3MSAyMy4xMTksMTE0LjQzNCAwLDM5LjY2MiAtNy43NzgsNzguMTYzIC0yMy4xMTksMTE0LjQzMyAtMTQuODA2LDM1LjAwNyAtMzUuOTk0LDY2LjQzOSAtNjIuOTc5LDkzLjQyNSAtMjYuOTgyLDI2Ljk4IC01OC40MTUsNDguMTY5IC05My40MjUsNjIuOTc5IC0zNi4yNjYsMTUuMzM4IC03NC43NjcsMjMuMTE2IC0xMTQuNDMyLDIzLjExNiB6IG0gMCwtNTg2LjkwOCBDIDI1NC40MjYsMS4wMDEgMjE2LjA1Nyw4Ljc1MiAxNzkuOTExLDI0LjA0IDE0NS4wMjIsMzguNzk3IDExMy42OTYsNTkuOTE0IDg2LjgwNSw4Ni44MDUgNTkuOTEzLDExMy42OTcgMzguNzk2LDE0NS4wMjIgMjQuMDM5LDE3OS45MSA4Ljc1MSwyMTYuMDU3IDEsMjU0LjQyNyAxLDI5My45NTYgMSwzMzMuNDgzIDguNzUxLDM3MS44NTQgMjQuMDM5LDQwOCBjIDE0Ljc1NywzNC44ODkgMzUuODc0LDY2LjIxNCA2Mi43NjYsOTMuMTA2IDI2Ljg5LDI2Ljg4OSA1OC4yMTUsNDguMDA2IDkzLjEwNiw2Mi43NjUgMzYuMTQyLDE1LjI4NyA3NC41MTIsMjMuMDM4IDExNC4wNDQsMjMuMDM4IDM5LjUzMiwwIDc3LjkwMSwtNy43NTEgMTE0LjA0NCwtMjMuMDM5IDM0Ljg5LC0xNC43NTggNjYuMjE2LC0zNS44NzUgOTMuMTA2LC02Mi43NjQgMjYuODkzLC0yNi44OTUgNDguMDA5LC01OC4yMiA2Mi43NjQsLTkzLjEwNiAxNS4yODksLTM2LjE0NiAyMy4wNDEsLTc0LjUxNiAyMy4wNDEsLTExNC4wNDQgMCwtMzkuNTI5IC03Ljc1MiwtNzcuODk5IC0yMy4wNDEsLTExNC4wNDQgQyA1NDkuMTE1LDE0NS4wMjUgNTI3Ljk5OCwxMTMuNyA1MDEuMTA1LDg2LjgwNiA0NzQuMjEzLDU5LjkxNSA0NDIuODg3LDM4Ljc5OCA0MDcuOTk5LDI0LjA0MSAzNzEuODU1LDguNzUyIDMzMy40ODUsMS4wMDEgMjkzLjk1NSwxLjAwMSBaIG0gMCw1NDQuMDY4IEMgMjI2Ljg4LDU0NS4wNjkgMTYzLjgxOSw1MTguOTQ5IDExNi4zOSw0NzEuNTIgNjguOTYxLDQyNC4wOSA0Mi44NCwzNjEuMDMxIDQyLjg0LDI5My45NTYgYyAwLC02Ny4wNzUgMjYuMTIsLTEzMC4xMzYgNzMuNTUsLTE3Ny41NjUgNDcuNDI5LC00Ny40MjkgMTEwLjQ5LC03My41NSAxNzcuNTY1LC03My41NSA2Ny4wNzUsMCAxMzAuMTM1LDI2LjEyMSAxNzcuNTY0LDczLjU1IDQ3LjQzLDQ3LjQzIDczLjU1LDExMC40OSA3My41NSwxNzcuNTY1IDAsNjcuMDc1IC0yNi4xMiwxMzAuMTM1IC03My41NSwxNzcuNTY0IC00Ny40MjksNDcuNDI5IC0xMTAuNDksNzMuNTQ5IC0xNzcuNTY0LDczLjU0OSB6IG0gMCwtNTAxLjIyOCBjIC02Ni44MDgsMCAtMTI5LjYxNywyNi4wMTcgLTE3Ni44NTgsNzMuMjU3IC00Ny4yNCw0Ny4yNDEgLTczLjI1NywxMTAuMDUgLTczLjI1NywxNzYuODU4IDAsNjYuODA4IDI2LjAxNywxMjkuNjE3IDczLjI1NywxNzYuODU2IDQ3LjI0LDQ3LjI0IDExMC4wNSw3My4yNTcgMTc2Ljg1OCw3My4yNTcgNjYuODA4LDAgMTI5LjYxNywtMjYuMDE3IDE3Ni44NTcsLTczLjI1NyA0Ny4yNCwtNDcuMjM5IDczLjI1NywtMTEwLjA0OSA3My4yNTcsLTE3Ni44NTYgMCwtNjYuODA4IC0yNi4wMTcsLTEyOS42MTggLTczLjI1NywtMTc2Ljg1OCBDIDQyMy41NzEsNjkuODU3IDM2MC43NjMsNDMuODQxIDI5My45NTUsNDMuODQxIFoiIC8+PC9nPjxnCiAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMS4xMzcxMTI5LDAsMCwxLjA3Njc0MzQsLTQwLjMxMTU3NCwtMjIuNTU4NTgxKSIKICAgICBzdHlsZT0iZmlsbDojMDAzMzc3O2ZpbGwtb3BhY2l0eToxIgogICAgIGlkPSJnNjk5OCI+PHBhdGgKICAgICAgIHN0eWxlPSJmaWxsOiMwMDMzNzc7ZmlsbC1vcGFjaXR5OjEiCiAgICAgICBpZD0icGF0aDcwMDAiCiAgICAgICBkPSJtIDIyOC45OTIsNDAwLjc5NCBjIDQuMDE3LDQuMDE4IDkuNDY1LDYuMjczIDE1LjE0Niw2LjI3MyA1LjY4MiwwIDExLjEyOSwtMi4yNTYgMTUuMTQ2LC02LjI3MyBMIDQ0Mi42NywyMTcuNDA5IGMgOC4zNjUsLTguMzY1IDguMzY1LC0yMS45MjcgMCwtMzAuMjkyIC04LjM2NSwtOC4zNjUgLTIxLjkyOCwtOC4zNjYgLTMwLjI5MywwIEwgMjQ0LjEzOCwzNTUuMzU3IDE3NS41MzIsMjg2Ljc1IGMgLTguMzY1LC04LjM2NiAtMjEuOTI3LC04LjM2NiAtMzAuMjkyLDAgLTguMzY1LDguMzY1IC04LjM2NSwyMS45MjcgMCwzMC4yOTIgbCA4My43NTIsODMuNzUyIHoiIC8+PHBhdGgKICAgICAgIHN0eWxlPSJmaWxsOiMwMDMzNzc7ZmlsbC1vcGFjaXR5OjEiCiAgICAgICBpZD0icGF0aDcwMDIiCiAgICAgICBkPSJtIDI0NC4xMzgsNDA3LjU2NyBjIC01Ljg1NSwwIC0xMS4zNiwtMi4yOCAtMTUuNSwtNi40MiBsIC04My43NTIsLTgzLjc1MiBjIC04LjU0NiwtOC41NDcgLTguNTQ2LC0yMi40NTMgMCwtMzEgNC4xNCwtNC4xNDEgOS42NDUsLTYuNDIxIDE1LjUsLTYuNDIxIDUuODU1LDAgMTEuMzU5LDIuMjggMTUuNSw2LjQyMSBsIDY4LjI1Myw2OC4yNTMgMTY3Ljg4NSwtMTY3Ljg4NiBjIDQuMTQsLTQuMTQxIDkuNjQ1LC02LjQyIDE1LjUsLTYuNDIgNS44NTQsMCAxMS4zNTksMi4yOCAxNS41LDYuNDIgNC4xNDEsNC4xNCA2LjQyMSw5LjY0NSA2LjQyMSwxNS41IDAsNS44NTUgLTIuMjgsMTEuMzU5IC02LjQyMSwxNS41IEwgMjU5LjYzOCw0MDEuMTQ3IGMgLTQuMTM5LDQuMTQgLTkuNjQ0LDYuNDIgLTE1LjUsNi40MiB6IE0gMTYwLjM4NiwyODAuOTc1IGMgLTUuNTg4LDAgLTEwLjg0MSwyLjE3NiAtMTQuNzkyLDYuMTI4IC04LjE1Niw4LjE1NyAtOC4xNTYsMjEuNDI4IDAsMjkuNTg1IGwgODMuNzUyLDgzLjc1MiBjIDMuOTUxLDMuOTUxIDkuMjA0LDYuMTI3IDE0Ljc5Miw2LjEyNyA1LjU4OSwwIDEwLjg0MiwtMi4xNzYgMTQuNzkzLC02LjEyNyBMIDQ0Mi4zMTYsMjE3LjA1NSBjIDMuOTUxLC0zLjk1MSA2LjEyOCwtOS4yMDUgNi4xMjgsLTE0Ljc5MiAwLC01LjU4NyAtMi4xNzcsLTEwLjg0MiAtNi4xMjgsLTE0Ljc5MyAtMy45NTEsLTMuOTUyIC05LjIwNSwtNi4xMjcgLTE0Ljc5MywtNi4xMjcgLTUuNTg4LDAgLTEwLjg0MiwyLjE3NiAtMTQuNzkzLDYuMTI3IGwgLTE2OC41OTIsMTY4LjU5MyAtNjguOTYsLTY4Ljk2IGMgLTMuOTUxLC0zLjk1MiAtOS4yMDQsLTYuMTI4IC0xNC43OTIsLTYuMTI4IHoiIC8+PC9nPjxnCiAgICAgaWQ9Imc3MDA0IiAvPjxnCiAgICAgaWQ9Imc3MDA2IiAvPjxnCiAgICAgaWQ9Imc3MDA4IiAvPjxnCiAgICAgaWQ9Imc3MDEwIiAvPjxnCiAgICAgaWQ9Imc3MDEyIiAvPjxnCiAgICAgaWQ9Imc3MDE0IiAvPjxnCiAgICAgaWQ9Imc3MDE2IiAvPjxnCiAgICAgaWQ9Imc3MDE4IiAvPjxnCiAgICAgaWQ9Imc3MDIwIiAvPjxnCiAgICAgaWQ9Imc3MDIyIiAvPjxnCiAgICAgaWQ9Imc3MDI0IiAvPjxnCiAgICAgaWQ9Imc3MDI2IiAvPjxnCiAgICAgaWQ9Imc3MDI4IiAvPjxnCiAgICAgaWQ9Imc3MDMwIiAvPjxnCiAgICAgaWQ9Imc3MDMyIiAvPjxwYXRoCiAgICAgaWQ9InBhdGg3NTk1IgogICAgIGQ9Ik0gMjUzLjcyMjAzLDUzOS40MjkxNyBDIDIwMS44NzU1NCw1MzAuMDEwODEgMTYxLjE2NDg5LDUwOS44OTgxNiAxMjQuNDAxNCw0NzUuNTM5NzUgMTAxLjEzNjEyLDQ1My43OTY1IDg1LjAxNTQwNCw0MzEuODcyMzQgNzAuNTYzMTM1LDQwMi4zMTk3NSA1MC45NzU3MTksMzYyLjI2NjYxIDQ3LjM4MzAxNSwzNDUuNDcxMDcgNDcuMzgzMDE1LDI5My45NTQ5OSBjIDAsLTUxLjUxNjA5IDMuNTkyNzA0LC02OC4zMTE2MyAyMy4xODAxMiwtMTA4LjM2NDc3IEMgOTEuOTE0MDUyLDE0MS45MzEgMTI0LjgxNzM2LDEwNS42NTY0MSAxNjUuMjI1NjUsODEuMjI4NTQ0IDMxMi43OTk2OSwtNy45ODM4MTc0IDUwNC44MDcwOCw3Ny4xNjA3IDUzOC4yMDMzMywyNDYuNjIzMjUgYyA0LjcyMzUxLDIzLjk2ODQ4IDQuNzIzNTEsNzAuNjk0OTggMCw5NC42NjM0NyAtMTQuNTE4NjEsNzMuNjcxNzcgLTYyLjQzODE2LDEzNy44MTMzMiAtMTI5LjI5ODg5LDE3My4wNjk5MSAtNDcuMzYyMjUsMjQuOTc0NzcgLTEwNC43MTI3NSwzNC4yNDA3NyAtMTU1LjE4MjQxLDI1LjA3MjU0IHogbSA5Ni43ODAxOCwtMjE4LjY0NTg2IGMgNTUuMDgwMTYsLTUyLjA0OTkxIDEwNC40MzE4NywtOTguODE1NzUgMTA5LjY3MDUsLTEwMy45MjQxIDEyLjU2NDM4LC0xMi4yNTE5MyAxNC45NzM0OSwtMjUuOTMxODkgNi4zMTI1MywtMzUuODQ1MSAtNy41ODkzNSwtOC42ODY2MyAtMTguNjE5NjYsLTExLjc5NTQ0IC0yOS4wMTEwMiwtOC4xNzY1MiAtNC45NTUyOCwxLjcyNTc0IC00NC4xMDE3MSwzNi45NTg3MyAtMTAyLjc0MDEsOTIuNDY5MjQgLTUyLjEwMzk1LDQ5LjMyNDY1IC05NS42NjAxNyw5MC4wMDA3NSAtOTYuNzkxNTksOTAuMzkxMzMgLTEuMTMxNDMsMC4zOTA1OSAtMTUuMzkxMzgsLTExLjk0MDU3IC0zMS42ODg3OCwtMjcuNDAyNTggLTUyLjgzODI1LC01MC4xMjk3OCAtNTEuNzM0ODQsLTQ5LjI4NzQ2IC02NC41NjUyMywtNDkuMjg3NDYgLTguNzA3ODYsMCAtMTIuNzkwNjUsMS40MTE2IC0xNy4zOTIzNiw2LjAxMzMyIC04LjA0MDY0LDguMDQwNjUgLTEwLjIwMzI0LDE3LjY5ODc0IC01LjkyNjIyLDI2LjQ2NjI5IDQuNzc2MTgsOS43OTA4IDEwMC42MTc2MiwxMDAuMTg0OTkgMTA5LjY5MzEzLDEwMy40NTg2MSAxNi40MzAyNCw1LjkyNjUgMTYuOTI2MjgsNS41NDUwMyAxMjIuNDM5MTQsLTk0LjE2MzAzIHoiCiAgICAgc3R5bGU9ImZpbGw6IzAwZmY0MjtmaWxsLW9wYWNpdHk6MTtzdHJva2U6IzAwZmY0MjtzdHJva2Utd2lkdGg6MTU7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIgLz48L3N2Zz4=';

        var buttonXRedSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" width="587.91px" height="587.91px" viewBox="0 0 587.91 587.91" style="enable-background:new 0 0 587.91 587.91;" xml:space="preserve"><g style="fill:#003377;fill-opacity:1"><path d="m 86.451,501.46 c 26.937,26.936 58.315,48.088 93.265,62.871 36.207,15.314 74.642,23.078 114.239,23.078 39.596,0 78.032,-7.764 114.239,-23.078 34.949,-14.783 66.328,-35.936 93.266,-62.871 26.936,-26.938 48.09,-58.316 62.871,-93.266 15.314,-36.207 23.08,-74.643 23.08,-114.238 0,-39.598 -7.766,-78.033 -23.08,-114.239 C 549.55,144.767 528.395,113.389 501.46,86.452 474.522,59.515 443.144,38.362 408.194,23.58 371.986,8.265 333.551,0.501 293.955,0.501 254.358,0.501 215.923,8.266 179.716,23.58 144.766,38.362 113.388,59.516 86.451,86.452 59.514,113.388 38.361,144.767 23.578,179.716 8.265,215.923 0.5,254.358 0.5,293.956 c 0,39.596 7.765,78.031 23.079,114.238 14.782,34.95 35.936,66.328 62.872,93.266 z M 293.955,43.341 c 138.411,0 250.614,112.204 250.614,250.615 0,138.41 -112.203,250.613 -250.614,250.613 C 155.544,544.569 43.34,432.366 43.34,293.956 43.34,155.545 155.544,43.341 293.955,43.341 Z" style="fill:#003377;fill-opacity:1" /><path d="m 293.955,587.909 c -39.667,0 -78.167,-7.778 -114.434,-23.117 C 144.511,549.983 113.079,528.794 86.098,501.813 59.115,474.829 37.926,443.396 23.119,408.388 7.778,372.119 0,333.618 0,293.956 0,254.293 7.778,215.791 23.118,179.521 37.925,144.513 59.115,113.081 86.097,86.098 113.079,59.115 144.512,37.926 179.52,23.119 215.79,7.779 254.291,0.001 293.954,0.001 c 39.666,0 78.167,7.778 114.433,23.119 35.009,14.807 66.441,35.997 93.425,62.979 26.984,26.985 48.173,58.417 62.979,93.423 15.341,36.27 23.119,74.771 23.119,114.434 0,39.662 -7.778,78.163 -23.119,114.433 -14.806,35.007 -35.994,66.439 -62.979,93.425 -26.982,26.98 -58.415,48.169 -93.425,62.979 -36.266,15.338 -74.767,23.116 -114.432,23.116 z m 0,-586.908 C 254.426,1.001 216.057,8.752 179.911,24.04 145.022,38.797 113.696,59.914 86.805,86.805 59.913,113.697 38.796,145.022 24.039,179.91 8.751,216.057 1,254.427 1,293.956 1,333.483 8.751,371.854 24.039,408 c 14.757,34.889 35.874,66.214 62.766,93.106 26.89,26.889 58.215,48.006 93.106,62.765 36.142,15.287 74.512,23.038 114.044,23.038 39.532,0 77.901,-7.751 114.044,-23.039 34.89,-14.758 66.216,-35.875 93.106,-62.764 26.893,-26.895 48.009,-58.22 62.764,-93.106 15.289,-36.146 23.041,-74.516 23.041,-114.044 0,-39.529 -7.752,-77.899 -23.041,-114.044 C 549.115,145.025 527.998,113.7 501.105,86.806 474.213,59.915 442.887,38.798 407.999,24.041 371.855,8.752 333.485,1.001 293.955,1.001 Z m 0,544.068 C 226.88,545.069 163.819,518.949 116.39,471.52 68.961,424.09 42.84,361.031 42.84,293.956 c 0,-67.075 26.12,-130.136 73.55,-177.565 47.429,-47.429 110.49,-73.55 177.565,-73.55 67.075,0 130.135,26.121 177.564,73.55 47.43,47.43 73.55,110.49 73.55,177.565 0,67.075 -26.12,130.135 -73.55,177.564 -47.429,47.429 -110.49,73.549 -177.564,73.549 z m 0,-501.228 c -66.808,0 -129.617,26.017 -176.858,73.257 -47.24,47.241 -73.257,110.05 -73.257,176.858 0,66.808 26.017,129.617 73.257,176.856 47.24,47.24 110.05,73.257 176.858,73.257 66.808,0 129.617,-26.017 176.857,-73.257 47.24,-47.239 73.257,-110.049 73.257,-176.856 0,-66.808 -26.017,-129.618 -73.257,-176.858 C 423.571,69.857 360.763,43.841 293.955,43.841 Z" style="fill:#003377;fill-opacity:1" /></g> <path d="M 133.43898,415.74333 415.74333,133.43898 454.471,172.16666 172.16666,454.471 Z" style="fill:#003377;fill-opacity:1;stroke:none;stroke-width:1.69799995;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /><path d="M 415.74333,454.471 C 321.64188,360.36955 227.54043,266.26811 133.43898,172.16666 c 12.90923,-12.90923 25.81845,-25.81845 38.72768,-38.72768 94.10145,94.10145 188.20289,188.2029 282.30434,282.30435 -12.90922,12.90922 -25.81845,25.81845 -38.72767,38.72767 z" style="fill:#003377;fill-opacity:1;stroke:none;stroke-width:1.69799995;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /><path d="m 265.05969,541.8598 c -44.3069,-5.09104 -86.96292,-22.55802 -123.93441,-50.74921 -10.54216,-8.03852 -31.90275,-28.97808 -40.83133,-40.02652 -79.842285,-98.79872 -73.099008,-241.91187 15.6227,-331.56201 40.84256,-41.269949 90.3185,-65.709593 148.4555,-73.332604 17.17036,-2.251404 59.02046,-0.89136 75.70279,2.460188 101.31593,20.354774 178.36171,96.552506 198.42091,196.236866 20.14751,100.12323 -22.69892,201.63693 -109.11891,258.52937 -31.13079,20.49418 -70.06742,34.31326 -108.52881,38.51817 -13.95321,1.52548 -42.19323,1.4879 -55.78844,-0.0742 z m 89.67603,-147.45441 61.02787,61.01834 19.31152,-19.28138 c 10.62134,-10.60475 19.31152,-19.85082 19.31152,-20.54683 0,-0.696 -27.18463,-28.44575 -60.41029,-61.66611 l -60.41029,-60.40066 60.71683,-60.72631 60.71684,-60.72632 -19.613,-19.61299 -19.61299,-19.61299 -60.72632,60.71683 -60.7263,60.71683 -60.40067,-60.41029 c -33.22036,-33.22566 -60.97011,-60.41029 -61.66611,-60.41029 -0.69601,0 -9.94208,8.69018 -20.54684,19.31152 l -19.28137,19.31152 61.01834,61.02787 61.01834,61.02787 -60.71698,60.72647 -60.71698,60.72647 19.61304,19.61303 19.61304,19.61304 60.72646,-60.71697 60.72647,-60.71699 61.02787,61.01834 z" style="fill:#ff0000;fill-opacity:1;stroke:none;stroke-width:1.69799995;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /></svg>';
        buttonXRedData = makeDataFromSVG(buttonXRedSVG);

        addSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 491.86 491.86" style="enable-background:new 0 0 491.86 491.86;" xml:space="preserve"> <g> <g> <path d="M465.167,211.614H280.245V26.691c0-8.424-11.439-26.69-34.316-26.69s-34.316,18.267-34.316,26.69v184.924H26.69 C18.267,211.614,0,223.053,0,245.929s18.267,34.316,26.69,34.316h184.924v184.924c0,8.422,11.438,26.69,34.316,26.69 s34.316-18.268,34.316-26.69V280.245H465.17c8.422,0,26.69-11.438,26.69-34.316S473.59,211.614,465.167,211.614z"/> </g> </g> </svg>'

        minusSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 491.858 491.858" style="enable-background:new 0 0 491.858 491.858;" xml:space="preserve"> <g> <g> <path d="M465.167,211.613H240.21H26.69c-8.424,0-26.69,11.439-26.69,34.316s18.267,34.316,26.69,34.316h213.52h224.959 c8.421,0,26.689-11.439,26.689-34.316S473.59,211.613,465.167,211.613z"/> </g> </g> </svg>';

        compassSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="enable-background:new 0 0 291.32 291.32;" viewBox="0 0 291.32 291.32" y="0px" x="0px" version="1.1"><path d="m 42.662827,42.662826 c -56.648446,56.648446 -56.648446,149.345904 0,205.994344 56.648445,56.64845 149.345903,56.64845 205.994343,0 56.64845,-56.64844 56.64845,-149.345898 0,-205.994344 -56.64844,-56.648445 -149.346605,-56.647738 -205.994343,0 z M 229.34467,229.34467 c -46.34872,46.34873 -121.02132,46.34802 -167.369343,0 C 15.627306,182.99665 15.625892,108.32335 61.97462,61.97462 c 46.34873,-46.348728 121.02133,-46.348021 167.37005,7.07e-4 46.34873,46.348723 46.34802,121.021323 0,167.369343 z" style="fill-opacity:1" /><g ><path style="fill:#ff0000;fill-opacity:1" d="m 145.66,29.426323 51.64318,108.828047 -103.286352,0 C 94.017828,138.25365 145.66,29.426323 145.66,29.426323 Z" /><path style="fill:#999999;fill-opacity:1" d="m 145.66,263.12809 51.64318,-106.35923 -103.286352,0 c 10e-4,7e-4 51.643172,106.35923 51.643172,106.35923 z" /></g></svg>';

        arrowDownSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 204.55612 510.99498"style="enable-background:new 0 0 204.55612 510.99498;" y="0px" x="0px"><path d="m 127.635,441.369 69.626,69.626 -185.685,0 0,-185.685 69.648,69.648 c 76.847,-76.825 76.847,-201.659 0,-278.484 C 57.811,93.017 29.715,76.497 -2.0158342e-7,67.788 l 0,-67.788 C 46.695,10.437 91.201,33.588 127.656,70.02 230.193,172.666 230.193,338.746 127.635,441.369 Z" /> </svg>';

        arrowDownFlipSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 204.55612 510.99498" xml:space="preserve" > <path d="m 76.921125,441.369 -69.6259998,69.626 185.6850048,0 0,-185.685 -69.648,69.648 c -76.847005,-76.825 -76.847005,-201.659 0,-278.484 23.413,-23.457 51.509,-39.977 81.224,-48.686 l 0,-67.788 c -46.695,10.437 -91.201,33.588 -127.656005,70.02 -102.537,102.646 -102.537,268.726 0.021,371.349 z" /> </svg>';

        poweredByTerraFlySVGForMap = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" enable-background="new 0 0.5 61 53" viewBox="0 0.5 61 53" height="100%" width="100%" y="0" x="0" version="1.1"><g transform="translate(-2.3621042,-1.1117523)" ><g ><path d="m 60.262,17.214 c -3.436,-2.931 -9.344,-2.097 -15.352,1.575 4.221,-1.991 8.189,-2.166 10.611,-0.042 4.215,3.7 2.146,12.954 -4.627,20.673 -6.771,7.719 -15.677,10.978 -19.894,7.278 -2.393,-2.1 -2.758,-5.987 -1.392,-10.369 -3.021,6.815 -3.053,13.151 0.52,16.2 5.237,4.471 16.229,0.186 24.552,-9.566 8.318,-9.752 10.82,-21.28 5.582,-25.749 z" style="fill:#00519e" /><g ><g ><path d="m 7.104,31.737 -2.156,0 0,-6.217 -1.948,0 0,-1.763 6.046,0 0,1.763 -1.942,0 0,6.217 z" style="fill:#00519e" /><path d="m 20.032,25.444 c 0.185,0 0.362,0.016 0.529,0.042 l 0.12,0.023 -0.19,2.014 c -0.175,-0.044 -0.416,-0.065 -0.726,-0.065 -0.466,0 -0.804,0.107 -1.015,0.319 -0.211,0.211 -0.317,0.519 -0.317,0.919 l 0,3.041 -2.133,0 0,-6.185 1.588,0 0.332,0.988 0.104,0 c 0.178,-0.327 0.426,-0.592 0.745,-0.795 0.318,-0.201 0.639,-0.301 0.963,-0.301 z" style="fill:#00519e" /><path d="m 25.276,25.444 c 0.186,0 0.362,0.016 0.529,0.042 l 0.12,0.023 -0.19,2.014 c -0.175,-0.044 -0.417,-0.065 -0.726,-0.065 -0.466,0 -0.805,0.107 -1.016,0.319 -0.21,0.211 -0.316,0.519 -0.316,0.919 l 0,3.041 -2.134,0 0,-6.185 1.588,0 0.333,0.988 0.104,0 c 0.179,-0.327 0.427,-0.592 0.745,-0.795 0.318,-0.201 0.639,-0.301 0.963,-0.301 z" style="fill:#00519e" /><path d="m 30.821,31.737 -0.41,-0.821 -0.042,0 c -0.289,0.358 -0.581,0.6 -0.879,0.732 -0.299,0.131 -0.684,0.195 -1.157,0.195 -0.582,0 -1.041,-0.173 -1.375,-0.522 -0.335,-0.35 -0.502,-0.84 -0.502,-1.473 0,-0.659 0.229,-1.15 0.688,-1.471 0.458,-0.323 1.123,-0.504 1.991,-0.544 l 1.031,-0.033 0,-0.087 c 0,-0.51 -0.25,-0.763 -0.752,-0.763 -0.451,0 -1.024,0.151 -1.719,0.457 L 27.078,26 c 0.72,-0.372 1.629,-0.556 2.729,-0.556 0.792,0 1.406,0.196 1.841,0.589 0.435,0.393 0.652,0.942 0.652,1.648 l 0,4.056 -1.479,0 z m -1.583,-1.399 c 0.259,0 0.479,-0.081 0.663,-0.246 0.184,-0.162 0.276,-0.375 0.276,-0.638 l 0,-0.481 -0.492,0.024 c -0.702,0.024 -1.053,0.282 -1.053,0.773 10e-4,0.379 0.203,0.568 0.606,0.568 z" style="fill:#00519e" /><path d="m 12.376,31.843 c -1.03,0 -1.829,-0.272 -2.398,-0.82 -0.57,-0.547 -0.854,-1.326 -0.854,-2.338 0,-1.044 0.264,-1.846 0.792,-2.404 0.528,-0.558 1.28,-0.837 2.259,-0.837 0.932,0 1.651,0.241 2.158,0.728 0.508,0.486 0.762,1.186 0.762,2.099 l 0,0.688 c 0,0 0.017,0.181 -0.056,0.234 -0.059,0.045 -0.27,0.028 -0.27,0.028 l -3.489,0 c 0.015,0.346 0.142,0.616 0.379,0.812 0.239,0.195 0.563,0.296 0.975,0.296 0.375,0 0.72,-0.038 1.034,-0.107 0.279,-0.062 0.577,-0.165 0.898,-0.308 0.014,-0.005 0.067,-0.036 0.092,-0.026 0.037,0.013 0.032,0.058 0.032,0.058 l 0,1.446 c -0.335,0.172 -0.68,0.289 -1.037,0.355 -0.357,0.065 -0.783,0.096 -1.277,0.096 z M 12.25,26.895 c -0.251,0 -0.461,0.079 -0.63,0.238 -0.168,0.157 -0.268,0.405 -0.297,0.745 l 1.834,0 C 13.149,27.58 13.064,27.34 12.902,27.161 12.741,26.984 12.523,26.895 12.25,26.895 Z" style="fill:#00519e" /></g><g ><path d="m 33.332,35.92 c -0.302,0 -0.575,-0.047 -0.82,-0.139 l 0,-0.924 c 0.28,0.096 0.524,0.145 0.734,0.145 0.332,0 0.588,-0.135 0.766,-0.406 0.178,-0.271 0.324,-0.656 0.432,-1.159 l 1.488,-7.087 -1.264,0 0.084,-0.439 1.35,-0.433 0.148,-0.654 c 0.203,-0.874 0.482,-1.491 0.838,-1.852 0.355,-0.36 0.881,-0.54 1.58,-0.54 0.176,0 0.391,0.025 0.645,0.076 0.252,0.05 0.447,0.106 0.59,0.167 L 39.62,23.52 c -0.332,-0.126 -0.631,-0.19 -0.898,-0.19 -0.379,0 -0.672,0.106 -0.875,0.318 -0.201,0.213 -0.365,0.599 -0.494,1.163 l -0.162,0.708 1.559,0 -0.164,0.832 -1.553,0 -1.52,7.191 c -0.17,0.826 -0.43,1.428 -0.785,1.809 -0.355,0.379 -0.82,0.569 -1.396,0.569 z m 6.365,-3.222 -1.102,0 2.176,-10.193 1.102,0 -2.176,10.193 z" style="fill:#00519e" /><path d="m 42.285,25.518 1.102,0 0.482,3.57 c 0.045,0.301 0.086,0.744 0.129,1.332 0.041,0.588 0.062,1.062 0.062,1.418 l 0.04,0 c 0.152,-0.379 0.342,-0.817 0.57,-1.311 0.225,-0.493 0.393,-0.832 0.504,-1.021 l 2.129,-3.989 1.166,0 -4.559,8.397 c -0.406,0.752 -0.807,1.272 -1.207,1.565 -0.395,0.294 -0.873,0.439 -1.434,0.439 -0.314,0 -0.619,-0.047 -0.918,-0.139 l 0,-0.886 c 0.275,0.081 0.561,0.119 0.859,0.119 0.357,0 0.666,-0.109 0.92,-0.331 0.254,-0.221 0.504,-0.547 0.744,-0.979 l 0.498,-0.89 -1.087,-7.294 z" style="fill:#00519e" /></g></g></g><text y="9.0472097" x="2.3282847" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:8.5px;line-height:150%;font-family:sans-serif;text-align:start;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:start;fill:#eeeeee;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" xml:space="preserve" ><tspan style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:8.5px;line-height:150%;font-family:sans-serif;text-align:start;writing-mode:lr-tb;text-anchor:start;fill:#eeeeee;fill-opacity:1" y="9.0472097" x="2.3282847" >powered by</tspan></text> <text xml:space="preserve" style="font-style:normal;font-weight:normal;font-size:8.50913048px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" x="1.9552906" y="8.3881102" ><tspan x="1.9552906" y="8.3881102" >powered by</tspan></text> </g></svg>';

        poweredByTerraFlySVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" enable-background="new 0 0 66 58" viewBox="0 0 60.000271 49.843258" height="49.843258" width="60.000271" y="0px" x="0px" version="1.1"><filter height="1.2508659" y="-0.12543292" width="1.0420316" x="-0.021015836" style="color-interpolation-filters:sRGB"><feGaussianBlur stdDeviation="0.37666626" /></filter><path d="m 57.262,12.756918 c -3.436,-2.9310001 -9.344,-2.097 -15.352,1.575 4.221,-1.991 8.189,-2.166 10.611,-0.042 4.215,3.7 2.146,12.954 -4.627,20.673 -6.771,7.719 -15.677,10.978 -19.894,7.278 -2.393,-2.1 -2.758,-5.987 -1.392,-10.369 -3.021,6.815 -3.053,13.151 0.52,16.2 5.237,4.471 16.229,0.186 24.552,-9.566 8.318,-9.752 10.82,-21.28 5.582,-25.749 z" style="fill:#00519e" /><g transform="translate(-3,-4.4570821)" ><g ><path d="m 7.104,31.737 -2.156,0 0,-6.217 -1.948,0 0,-1.763 6.046,0 0,1.763 -1.942,0 0,6.217 z" style="fill:#00519e" /><path d="m 20.032,25.444 c 0.185,0 0.362,0.016 0.529,0.042 l 0.12,0.023 -0.19,2.014 c -0.175,-0.044 -0.416,-0.065 -0.726,-0.065 -0.466,0 -0.804,0.107 -1.015,0.319 -0.211,0.211 -0.317,0.519 -0.317,0.919 l 0,3.041 -2.133,0 0,-6.185 1.588,0 0.332,0.988 0.104,0 c 0.178,-0.327 0.426,-0.592 0.745,-0.795 0.318,-0.201 0.639,-0.301 0.963,-0.301 z" style="fill:#00519e" /><path d="m 25.276,25.444 c 0.186,0 0.362,0.016 0.529,0.042 l 0.12,0.023 -0.19,2.014 c -0.175,-0.044 -0.417,-0.065 -0.726,-0.065 -0.466,0 -0.805,0.107 -1.016,0.319 -0.21,0.211 -0.316,0.519 -0.316,0.919 l 0,3.041 -2.134,0 0,-6.185 1.588,0 0.333,0.988 0.104,0 c 0.179,-0.327 0.427,-0.592 0.745,-0.795 0.318,-0.201 0.639,-0.301 0.963,-0.301 z" style="fill:#00519e" /><path d="m 30.821,31.737 -0.41,-0.821 -0.042,0 c -0.289,0.358 -0.581,0.6 -0.879,0.732 -0.299,0.131 -0.684,0.195 -1.157,0.195 -0.582,0 -1.041,-0.173 -1.375,-0.522 -0.335,-0.35 -0.502,-0.84 -0.502,-1.473 0,-0.659 0.229,-1.15 0.688,-1.471 0.458,-0.323 1.123,-0.504 1.991,-0.544 l 1.031,-0.033 0,-0.087 c 0,-0.51 -0.25,-0.763 -0.752,-0.763 -0.451,0 -1.024,0.151 -1.719,0.457 L 27.078,26 c 0.72,-0.372 1.629,-0.556 2.729,-0.556 0.792,0 1.406,0.196 1.841,0.589 0.435,0.393 0.652,0.942 0.652,1.648 l 0,4.056 -1.479,0 z m -1.583,-1.399 c 0.259,0 0.479,-0.081 0.663,-0.246 0.184,-0.162 0.276,-0.375 0.276,-0.638 l 0,-0.481 -0.492,0.024 c -0.702,0.024 -1.053,0.282 -1.053,0.773 10e-4,0.379 0.203,0.568 0.606,0.568 z" style="fill:#00519e" /><path d="m 12.376,31.843 c -1.03,0 -1.829,-0.272 -2.398,-0.82 -0.57,-0.547 -0.854,-1.326 -0.854,-2.338 0,-1.044 0.264,-1.846 0.792,-2.404 0.528,-0.558 1.28,-0.837 2.259,-0.837 0.932,0 1.651,0.241 2.158,0.728 0.508,0.486 0.762,1.186 0.762,2.099 l 0,0.688 c 0,0 0.017,0.181 -0.056,0.234 -0.059,0.045 -0.27,0.028 -0.27,0.028 l -3.489,0 c 0.015,0.346 0.142,0.616 0.379,0.812 0.239,0.195 0.563,0.296 0.975,0.296 0.375,0 0.72,-0.038 1.034,-0.107 0.279,-0.062 0.577,-0.165 0.898,-0.308 0.014,-0.005 0.067,-0.036 0.092,-0.026 0.037,0.013 0.032,0.058 0.032,0.058 l 0,1.446 c -0.335,0.172 -0.68,0.289 -1.037,0.355 -0.357,0.065 -0.783,0.096 -1.277,0.096 z M 12.25,26.895 c -0.251,0 -0.461,0.079 -0.63,0.238 -0.168,0.157 -0.268,0.405 -0.297,0.745 l 1.834,0 C 13.149,27.58 13.064,27.34 12.902,27.161 12.741,26.984 12.523,26.895 12.25,26.895 Z" style="fill:#00519e" /></g><g ><path d="m 33.332,35.92 c -0.302,0 -0.575,-0.047 -0.82,-0.139 l 0,-0.924 c 0.28,0.096 0.524,0.145 0.734,0.145 0.332,0 0.588,-0.135 0.766,-0.406 0.178,-0.271 0.324,-0.656 0.432,-1.159 l 1.488,-7.087 -1.264,0 0.084,-0.439 1.35,-0.433 0.148,-0.654 c 0.203,-0.874 0.482,-1.491 0.838,-1.852 0.355,-0.36 0.881,-0.54 1.58,-0.54 0.176,0 0.391,0.025 0.645,0.076 0.252,0.05 0.447,0.106 0.59,0.167 L 39.62,23.52 c -0.332,-0.126 -0.631,-0.19 -0.898,-0.19 -0.379,0 -0.672,0.106 -0.875,0.318 -0.201,0.213 -0.365,0.599 -0.494,1.163 l -0.162,0.708 1.559,0 -0.164,0.832 -1.553,0 -1.52,7.191 c -0.17,0.826 -0.43,1.428 -0.785,1.809 -0.355,0.379 -0.82,0.569 -1.396,0.569 z m 6.365,-3.222 -1.102,0 2.176,-10.193 1.102,0 -2.176,10.193 z" style="fill:#00519e" /><path d="m 42.285,25.518 1.102,0 0.482,3.57 c 0.045,0.301 0.086,0.744 0.129,1.332 0.041,0.588 0.062,1.062 0.062,1.418 l 0.04,0 c 0.152,-0.379 0.342,-0.817 0.57,-1.311 0.225,-0.493 0.393,-0.832 0.504,-1.021 l 2.129,-3.989 1.166,0 -4.559,8.397 c -0.406,0.752 -0.807,1.272 -1.207,1.565 -0.395,0.294 -0.873,0.439 -1.434,0.439 -0.314,0 -0.619,-0.047 -0.918,-0.139 l 0,-0.886 c 0.275,0.081 0.561,0.119 0.859,0.119 0.357,0 0.666,-0.109 0.92,-0.331 0.254,-0.221 0.504,-0.547 0.744,-0.979 l 0.498,-0.89 -1.087,-7.294 z" style="fill:#00519e" /></g></g><text xml:space="preserve" style="font-style:normal;font-weight:normal;font-size:7.5px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#bfbfbf;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;filter:url(#filter5967)" x="2.4067798" y="6.602241" ><tspan x="2.4067798" y="6.602241">powered by</tspan></text> <text y="5.8649526" x="1.9152541" style="font-style:normal;font-weight:normal;font-size:7.5px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" xml:space="preserve"><tspan y="5.8649526" x="1.9152541" >powered by</tspan></text> </svg>';

        var noClusterSVG = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="enable-background:new 0 0 31.999 31.999;" viewBox="0 0 31.999 31.999" y="0px" x="0px" version="1.1"><circle r="9.4899912" cy="15.9995" cx="10.059023" style="fill:#ff6666;fill-opacity:1;stroke:#000000;stroke-width:1.13806307;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /><circle style="fill:#6666ff;fill-opacity:1;stroke:#000000;stroke-width:1.13806307;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" cx="21.939978" cy="15.9995" r="9.4899912" /></svg>';
        noClusterData = makeDataFromSVG(noClusterSVG);

        var clusterSVG = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" height="31.778698" width="31.778698" xml:space="preserve" viewBox="0 0 31.778697 31.778697" y="0px" x="0px" version="1.1"><path d="M 30.879849,15.889349 C 31.248959,25.610589 20.628413,33.423964 11.459353,30.210321 2.0694281,27.688286 -2.2730851,15.237833 3.5171547,7.4250759 8.7016043,-0.80340189 21.878289,-1.2700274 27.631811,6.5711043 c 2.092274,2.6227336 3.256385,5.9636747 3.248038,9.3182447 z" style="fill:#003377;fill-opacity:1;stroke:#000000;stroke-width:2px;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /><path d="M 14.459033,6.2168921 C 13.000214,12.484411 11.541394,18.751931 10.082575,25.01945" style="fill:none;fill-rule:evenodd;stroke:#ffffff;stroke-width:2px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><path d="m 21.916427,6.759248 c -1.458819,6.267519 -2.917639,12.535039 -4.376458,18.802558" style="fill:none;fill-rule:evenodd;stroke:#ffffff;stroke-width:2px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><path d="m 25.987361,13.011697 c -6.435037,0.01609 -12.870073,0.03218 -19.3051097,0.04827" style="fill:none;fill-rule:evenodd;stroke:#ffffff;stroke-width:2px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><path d="M 25.3157,18.767 C 18.880645,18.7628 12.445589,18.7586 6.0105342,18.75446" style="fill:none;fill-rule:evenodd;stroke:#ffffff;stroke-width:2px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /></svg>';
        clusterData = makeDataFromSVG(clusterSVG);

        refreshSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="512px" height="512px" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve">  <path d="M92.07,256.41H50l78.344,78.019l77.536-78.019h-39.825c-0.104-61.079,49.192-111.032,110.329-111.387  c61.293-0.358,111.27,49.039,111.626,110.331c0.58,98.964-119.057,148.511-188.892,79.686l-51.929,52.687  c116.154,114.483,315.773,32.415,314.809-132.804C461.4,152.769,378.105,70.441,275.952,71.037 C173.955,71.632,91.725,154.47,92.07,256.41z"/> </svg>';

        playerSVGs = {
            play: '<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg"> <g> <path d="m85.887123,463.210999c5.776329,3.336304 12.226295,5.005554 18.674049,5.005554c6.447754,0 12.894409,-1.66925 18.674057,-5.005554l302.88092,-174.869049c11.554871,-6.670441 18.674042,-19.000458 18.674042,-32.343613c0,-13.33873 -7.119171,-25.669861 -18.674042,-32.339203l-302.885284,-174.871197c-5.778549,-3.334137 -12.221939,-5.004486 -18.674042,-5.004486c-6.446655,0 -12.893372,1.670349 -18.674057,5.004486c-11.554886,6.670479 -18.672958,18.999386 -18.672958,32.339245l0,349.741257c0.007652,13.34317 7.126823,25.674225 18.677315,32.34256z" /> </g> </svg>',
            pause: '<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg"> <g> <g> <path d="m162.590088,58.444733c-30.713196,0 -55.60907,24.895859 -55.60907,55.60907l0,283.892426c0,30.709412 24.895874,55.60907 55.60907,55.60907c30.709473,0 55.605377,-24.895935 55.605377,-55.60907l0,-283.896179c0,-30.709465 -24.895874,-55.605331 -55.605377,-55.605331l0,0l0,0.000015z" /> <path d="m349.409882,58.444733c-30.709473,0 -55.609039,24.895859 -55.609039,55.60907l0,283.892426c0,30.709412 24.895874,55.60907 55.609039,55.60907c30.713287,0 55.6091,-24.895874 55.6091,-55.60907l0,-283.896179c0,-30.709473 -24.895813,-55.605316 -55.6091,-55.605316l0,-0.000015l0,0.000015z" /> </g> </g> </svg>',
            stop: '<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg"> <g> <path d="m144.763687,462.881165l222.472702,0c48.978027,0 88.682129,-41.165588 88.682129,-91.946259l0,-229.869736c0,-50.780762 -39.704102,-91.946339 -88.682129,-91.946339l-222.472702,0c-48.978035,0 -88.682213,41.165577 -88.682213,91.946339l0,229.869736c-0.003708,50.78067 39.704178,91.946259 88.682213,91.946259z" /> </g> </svg>',
            autoRepeat: '<svg xmlns:svg="http://www.w3.org/2000/svg" viewBox="0, 0, 140.171, 140.171" version="1.1" height="140.171" width="140.171"> <g transform="matrix(1.1513325,0,0,1.4659322,-10.546327,-32.595694)" > <path d="M 42.943993,84.644196 C 35.08844,81.003685 30.166628,75.801018 30.166628,70.022408 c 0,-9.282604 12.714792,-17.06208 29.899881,-19.276253 l 0,-10.0228 c -22.74612,2.771629 -39.866505,14.835823 -39.866505,29.299053 0,8.339775 5.703241,15.858292 14.878479,21.274269 10.038441,6.136261 15.021397,-3.829651 7.865509,-6.652481 z M 102.79067,47.526574 c -5.347714,-4.910431 -12.823575,2.564716 -7.725423,6.983818 9.047253,3.654736 14.835813,9.246349 14.835813,15.512016 0,9.287582 -12.716924,17.067764 -29.900586,19.281227 l 0,10.018532 C 102.74659,96.55481 119.86697,84.491326 119.86697,70.022408 c 0,-8.981129 -6.62546,-17.020836 -17.0763,-22.495834 z m -38.320699,9.986534 16.221626,-9.713497 c 2.359932,-1.413544 2.364914,-3.715885 0.01279,-5.139381 L 64.332733,32.751909 c -2.354954,-1.421368 -4.255566,-0.347702 -4.244179,2.404018 l 0.08816,19.93325 c 0.0071,2.75243 1.930466,3.837479 4.293251,2.423931 z M 75.734948,82.58574 59.364007,92.493356 c -2.354252,1.423492 -2.349274,3.725838 0.0135,5.140099 l 16.219498,9.713485 c 2.35994,1.41071 4.28756,0.32851 4.299652,-2.42606 l 0.08533,-19.933253 c 0.0085,-2.75029 -1.894211,-3.82254 -4.24704,-2.401886 z" /> </g> </svg>',
            noAutoRepeat: '<svg xmlns:svg="http://www.w3.org/2000/svg" viewBox="0, 0, 140.171, 140.171" version="1.1" height="140.171" width="140.171"> <g transform="matrix(1.1513325,0,0,1.4659322,-10.546327,-32.595694)" > <path d="M 42.943993,84.644196 C 35.08844,81.003685 30.166628,75.801018 30.166628,70.022408 c 0,-9.282604 12.714792,-17.06208 29.899881,-19.276253 l 0,-10.0228 c -22.74612,2.771629 -39.866505,14.835823 -39.866505,29.299053 0,8.339775 5.703241,15.858292 14.878479,21.274269 10.038441,6.136261 15.021397,-3.829651 7.865509,-6.652481 z M 102.79067,47.526574 c -5.347714,-4.910431 -12.823575,2.564716 -7.725423,6.983818 9.047253,3.654736 14.835813,9.246349 14.835813,15.512016 0,9.287582 -12.716924,17.067764 -29.900586,19.281227 l 0,10.018532 C 102.74659,96.55481 119.86697,84.491326 119.86697,70.022408 c 0,-8.981129 -6.62546,-17.020836 -17.0763,-22.495834 z m -38.320699,9.986534 16.221626,-9.713497 c 2.359932,-1.413544 2.364914,-3.715885 0.01279,-5.139381 L 64.332733,32.751909 c -2.354954,-1.421368 -4.255566,-0.347702 -4.244179,2.404018 l 0.08816,19.93325 c 0.0071,2.75243 1.930466,3.837479 4.293251,2.423931 z M 75.734948,82.58574 59.364007,92.493356 c -2.354252,1.423492 -2.349274,3.725838 0.0135,5.140099 l 16.219498,9.713485 c 2.35994,1.41071 4.28756,0.32851 4.299652,-2.42606 l 0.08533,-19.933253 c 0.0085,-2.75029 -1.894211,-3.82254 -4.24704,-2.401886 z" /> </g> <path d="M 103.20978,17.999925 36.845247,122.07159" style="fill:none;fill-rule:evenodd;stroke:#ff0000;stroke-width:10;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> </svg>',
            noAutoRepeat3: '<svg xmlns:svg="http://www.w3.org/2000/svg" viewBox="0, 0, 140.171, 140.171" version="1.1" height="140.171" width="140.171"> <g transform="matrix(1.1513325,0,0,1.4659322,-10.546327,-32.595694)" > <path d="M 42.943993,84.644196 C 35.08844,81.003685 30.166628,75.801018 30.166628,70.022408 c 0,-9.282604 12.714792,-17.06208 29.899881,-19.276253 l 0,-10.0228 c -22.74612,2.771629 -39.866505,14.835823 -39.866505,29.299053 0,8.339775 5.703241,15.858292 14.878479,21.274269 10.038441,6.136261 15.021397,-3.829651 7.865509,-6.652481 z M 102.79067,47.526574 c -5.347714,-4.910431 -12.823575,2.564716 -7.725423,6.983818 9.047253,3.654736 14.835813,9.246349 14.835813,15.512016 0,9.287582 -12.716924,17.067764 -29.900586,19.281227 l 0,10.018532 C 102.74659,96.55481 119.86697,84.491326 119.86697,70.022408 c 0,-8.981129 -6.62546,-17.020836 -17.0763,-22.495834 z m -38.320699,9.986534 16.221626,-9.713497 c 2.359932,-1.413544 2.364914,-3.715885 0.01279,-5.139381 L 64.332733,32.751909 c -2.354954,-1.421368 -4.255566,-0.347702 -4.244179,2.404018 l 0.08816,19.93325 c 0.0071,2.75243 1.930466,3.837479 4.293251,2.423931 z M 75.734948,82.58574 59.364007,92.493356 c -2.354252,1.423492 -2.349274,3.725838 0.0135,5.140099 l 16.219498,9.713485 c 2.35994,1.41071 4.28756,0.32851 4.299652,-2.42606 l 0.08533,-19.933253 c 0.0085,-2.75029 -1.894211,-3.82254 -4.24704,-2.401886 z" /> </g> <path d="M 14.651911,18.861802 125.61859,121.20971" style="fill:none;fill-rule:evenodd;stroke:#ff0000;stroke-width:10;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> </svg>',
            noAutoRepeat2: '<svg viewBox="0 0 140.171 140.171" width="140.171" height="140.171" xmlns="http://www.w3.org/2000/svg"> <g> <path d="m42.943989,84.644203c-7.855549,-3.640526 -12.777359,-8.843185 -12.777359,-14.621796c0,-9.282608 12.71479,-17.062077 29.899879,-19.276257l0,-10.0228c-22.74612,2.771629 -39.866508,14.835831 -39.866508,29.299057c0,8.339775 5.703249,15.858292 14.878479,21.274269c10.038441,6.136261 15.0214,-3.829643 7.865509,-6.652473zm59.846684,-37.117634c-5.34771,-4.910431 -12.823586,2.56472 -7.725426,6.983822c9.047241,3.654739 14.8358,9.246349 14.8358,15.512016c0,9.287582 -12.716919,17.067764 -29.900574,19.281219l0,10.018539c22.746117,-2.767357 39.866493,-14.830833 39.866493,-29.299759c0,-8.981129 -6.625458,-17.020836 -17.076294,-22.495838zm-38.320702,9.986542l16.221626,-9.713501c2.359932,-1.41354 2.364914,-3.715881 0.012794,-5.139381l-16.371658,-9.908318c-2.354954,-1.421371 -4.255562,-0.347702 -4.244183,2.404018l0.088169,19.93325c0.007111,2.75243 1.93047,3.837479 4.293251,2.423931zm11.264977,25.072628l-16.370937,9.907608c-2.354259,1.4235 -2.349281,3.725845 0.0135,5.140106l16.219498,9.713486c2.35994,1.410713 4.28756,0.328514 4.299652,-2.426056l0.085327,-19.93325c0.008522,-2.75029 -1.894203,-3.82254 -4.24704,-2.401894z" /> <path d="m20.722425,51.273846c0,0 2.217535,-4.027969 2.217535,-4.027969c0,0 96.508617,41.474796 96.508617,41.474796c0,0 -1.80687,4.204453 -1.80687,4.204453c0,0 -96.919283,-41.651279 -96.919283,-41.651279z" fill="#FF0000"/> </g> </svg>'
        };

        mapCenterSVG = '<svg viewBox="0 0 390 390" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"> <g> <path d="m340.384766,173.735092l31.219025,0c-4.673218,-39.459625 -22.307343,-75.974045 -50.835632,-104.503242c-28.529175,-28.528301 -65.04274,-46.162409 -104.50325,-50.83563l0,31.21903c64.030197,9.325581 114.794266,60.089661 124.119858,124.119843z" /> <path d="m173.735092,49.61525l0,-31.21903c-39.459625,4.673222 -75.974045,22.307329 -104.503242,50.83563c-28.528301,28.529198 -46.162409,65.042717 -50.83563,104.503242l31.21903,0c9.325581,-64.030182 60.089661,-114.794262 124.119843,-124.119843z" /> <path d="m216.264908,340.384766l0,31.219025c39.45871,-4.673218 75.974075,-22.307343 104.50325,-50.835632c28.52829,-28.529175 46.162415,-65.04274 50.835632,-104.50325l-31.219025,0c-9.325592,64.030197 -60.089661,114.794266 -124.119858,124.119858z" /> <path d="m49.61525,216.264908l-31.21903,0c4.673222,39.45871 22.307329,75.974075 50.83563,104.50325c28.529198,28.52829 65.042717,46.162415 104.503242,50.835632l0,-31.219025c-64.030182,-9.325592 -114.794262,-60.089661 -124.119843,-124.119858z" /> <path d="m116.634109,173.735092c7.527847,-27.709595 29.391388,-49.573135 57.100983,-57.100983l0,-31.732529c-44.80574,8.638191 -80.19532,44.027771 -88.833511,88.833511l31.732529,0z" /> <path d="m116.634109,216.264908l-31.732529,0c8.638191,44.80574 44.027771,80.195328 88.833511,88.832596l0,-31.731598c-27.709595,-7.526947 -49.574036,-29.391403 -57.100983,-57.100998z"/> <path d="m273.365906,216.264908c-7.527863,27.709595 -29.391434,49.57225 -57.100998,57.100998l0,31.731598c44.80574,-8.637268 80.195328,-44.026855 88.833511,-88.832596l-31.732513,0z" /> <path d="m273.365906,173.735092l31.732513,0c-8.638184,-44.80574 -44.027771,-80.19532 -88.833511,-88.833488l0,31.732506c27.709595,7.526947 49.574051,29.391388 57.100998,57.100983z" /> </g> </svg>';

        fenceSVG = '<svg  xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="enable-background:new 0 0 512 512;" viewBox="0 0 512 512" width="512px" height="512px" y="0px" x="0px" version="1.1"><g ><g ><path d="M471.469,84.155l-47.75-79.22C421.874,1.873,418.56,0,414.985,0s-6.89,1.873-8.735,4.934l-47.75,79.22 c-0.958,1.589-1.465,3.41-1.465,5.265v42.977H314.13V89.419c0-1.875-0.516-3.713-1.492-5.312l-48.329-79.22 C262.457,1.851,259.157,0,255.602,0c-0.008,0-0.016,0-0.023,0c-3.565,0.008-6.865,1.877-8.708,4.928l-47.821,79.22 c-0.96,1.591-1.468,3.414-1.468,5.271v42.977h-42.616V89.419c0-1.855-0.506-3.676-1.465-5.265l-47.749-79.22 C103.906,1.873,100.592,0,97.017,0s-6.89,1.873-8.735,4.934l-47.751,79.22c-0.958,1.589-1.465,3.41-1.465,5.265v412.381 c0,5.632,4.566,10.199,10.199,10.199h95.499c5.633,0,10.199-4.567,10.199-10.199v-61.426h42.616v61.426 c0,5.632,4.566,10.199,10.199,10.199h96.15c5.633,0,10.199-4.567,10.199-10.199v-61.426h42.906v61.426 c0,5.632,4.566,10.199,10.199,10.199h95.498c5.633,0,10.199-4.567,10.199-10.199V89.419 C472.932,87.564,472.427,85.743,471.469,84.155z M134.568,491.602L134.568,491.602H59.467V92.256l37.55-62.3l37.55,62.3V491.602z M197.581,419.977h-42.616v-52.311h42.616V419.977z M197.581,347.269h-42.616V225.504h42.616V347.269z M197.581,205.106h-42.616 v-52.311h42.616V205.106z M293.731,491.602H217.98V92.259l37.668-62.401l38.084,62.426V491.602z M357.036,419.977H314.13v-52.311 h42.906V419.977z M357.036,347.269H314.13V225.504h42.906V347.269z M357.036,205.106H314.13v-52.311h42.906V205.106z M452.534,491.602h-75.1V92.256l37.55-62.3l37.549,62.299V491.602z" /></g></g></svg>';

        createAltaMarkers();
        createCSSClasses();

        if (tf.js.GetFunctionOrNull(settings.onLoaded)) { setTimeout(function reportOnLoaded() { settings.onLoaded(theThis); }, 0); }
    }

    function createAltaMarkers() {
        var ls = tf.TFMap.LayoutSettings;
        var altaLargeImageNamePrefix = "Alta.Icon.Square.18px.";
        var altaSmallImageNamePrefix = "ALTA-Balloon.tiny.";
        var altaDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"], nAltaDirections = altaDirections.length;
        var altaAngles = [-90, -45, 0, 45, 90, 135, 180, 225];
        var altaImageNameSuffix = ".png";
        var toRad = Math.PI / 180;
        var baseStyleSettings = { iconShadow: true, iconAnchor: [0.5, 0.5], bottomMargin: 0, circleRadius: undefined, circleFill: undefined };
        var smallCanvasDim = ls.altaSmallCanvasDim, largeCanvasDim = ls.altaLargeCanvasDim;
        var hoverAdd = 4;
        var touchAdd = 6;
        var baseSmallStyleSettings = {
            circleRadius: (smallCanvasDim + touchAdd) / 2,
            circleFill: "rgba(255,255,255,0.1)",
            sizeCanvas: [smallCanvasDim + touchAdd, smallCanvasDim + touchAdd],
            sizeImage: [smallCanvasDim - 1, smallCanvasDim - 1],
            imageToPaint: arrowSmallRightImage
        };
        var baseLargeStyleSettings = {
            circleRadius: (largeCanvasDim + touchAdd) / 2,
            circleFill: "rgba(255,255,255,0.1)",
            sizeCanvas: [largeCanvasDim + touchAdd, largeCanvasDim + touchAdd],
            sizeImage: [largeCanvasDim - 1, largeCanvasDim - 1],
            imageToPaint: arrowSquareRightImage
        };

        altaMarkerStyles = {};

        for (var i = 0; i < nAltaDirections; ++i) {
            var altaDirection = altaDirections[i];
            var angleDeg = altaAngles[i], angle = angleDeg * toRad;
            var largeImageName = altaLargeImageNamePrefix + altaDirection + altaImageNameSuffix;
            var smallImageName = altaSmallImageNamePrefix + altaDirection + altaImageNameSuffix;
            var smallStyleSettings = tf.js.ShallowMerge(baseStyleSettings, baseSmallStyleSettings);
            var largeStyleSettings = tf.js.ShallowMerge(baseStyleSettings, baseLargeStyleSettings);
            var smallStyleSettingsHover = tf.js.ShallowMerge(smallStyleSettings);
            var largeStyleSettingsHover = tf.js.ShallowMerge(largeStyleSettings);

            smallStyleSettingsHover.sizeCanvas = [smallStyleSettingsHover.sizeCanvas[0] + hoverAdd, smallStyleSettingsHover.sizeCanvas[1] + hoverAdd];
            smallStyleSettingsHover.sizeImage = [smallStyleSettingsHover.sizeImage[0] + hoverAdd, smallStyleSettingsHover.sizeImage[1] + hoverAdd];

            largeStyleSettingsHover.sizeCanvas = [largeStyleSettingsHover.sizeCanvas[0] + hoverAdd, largeStyleSettingsHover.sizeCanvas[1] + hoverAdd];
            largeStyleSettingsHover.sizeImage = [largeStyleSettingsHover.sizeImage[0] + hoverAdd, largeStyleSettingsHover.sizeImage[1] + hoverAdd];

            altaMarkerStyles[smallImageName] = { name: smallImageName, angle: angle, angleDeg: angleDeg, styleSettings: smallStyleSettings, hoverSettings: smallStyleSettingsHover };
            altaMarkerStyles[largeImageName] = { name: largeImageName, angle: angle, angleDeg: angleDeg, styleSettings: largeStyleSettings, hoverSettings: largeStyleSettingsHover };
        }
    }

    function createDirectionStepsSVGs() {
        var aheadDirectionSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="enable-background:new 0 0 493.353 493.352;" viewBox="0 0 493.353 493.352" height="493.352px" width="493.353px" y="0px" x="0px" version="1.1"><path d="m 280.67541,490.7864 c 5.18209,-15.93359 1.64794,-33.17014 2.568,-49.75618 0,-104.37428 0,-208.74855 0,-313.12282 23.31063,-3.60326 53.14368,7.39213 72.44513,-5.85076 C 355.9896,108.75392 341.96497,101.66876 334.73763,91.849905 307.39022,62.184403 280.04282,32.518901 252.69541,2.8533988 238.55186,-5.5406649 230.55338,14.818517 221.09328,22.801927 193.84466,52.697751 166.59603,82.593576 139.34741,112.4894 c -8.49444,17.99737 16.96577,15.99433 28.44383,15.419 14.12005,0 28.24011,0 42.36017,0 0,118.77167 0,237.54333 0,356.315 9.35248,18.04925 37.08404,5.34374 54.42902,9.19141 5.27061,-0.72455 11.76942,1.12842 16.09498,-2.62841 z" /><g id="g7727" /></svg>';
        var turnRightDirectionSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="502.049px" height="502.049px" viewBox="0 0 502.049 502.049" style="enable-background:new 0 0 502.049 502.049;" xml:space="preserve"> <g> <polygon points="420.692,74.923 290.938,0 290.938,37.359 81.356,37.359 81.356,502.049 156.486,502.049 156.486,112.49  290.938,112.49 290.938,149.849 "/> </g> </svg>';
        var turnRightSlightDirectionSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="enable-background:new 0 0 494.221 494.221;" viewBox="0 0 494.221 494.221" height="494.221px" width="494.221px" y="0px" x="0px" version="1.1"><path d="m 175.84853,495.02314 c 0,-90.893 0,-181.786 0,-272.679 37.34575,-35.00175 74.6915,-70.00351 112.03725,-105.00526 17.77104,16.33281 35.54208,32.66563 53.31312,48.99844 C 350.42727,110.19349 359.65565,54.049669 368.88402,-2.0941565 309.40113,8.8662707 249.91824,19.826698 190.43535,30.787125 204.7165,42.233902 218.99766,53.680679 233.27881,65.127456 185.43132,107.43969 137.58383,149.75193 89.73634,192.06416 c 0,101.417 0,202.834 0,304.251 28.70406,-0.43067 57.40813,-0.86135 86.11219,-1.29202 z" /><g id="g5976" /></svg>';
        var turnRightSharpDirectionSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="enable-background:new 0 0 494.221 494.221;" viewBox="0 0 494.221 494.221" height="494.221px" width="494.221px" y="0px" x="0px" version="1.1"><path d="m 172.61536,491.93915 -88.981338,0 L 85.114594,4.4108408 358.39118,216.25447 l 49.2229,-43.50647 2.96158,148.93 -161.40175,-0.96438 46.16514,-44.3922 -120.73678,-97.52933 z" style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:1.31939518px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /></svg>';
        var turnLeftDirectionSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="502.049px" height="502.049px" viewBox="0 0 502.049 502.049" style="enable-background:new 0 0 502.049 502.049;" xml:space="preserve"> <g> <polygon points="81.356,74.923 211.11,0 211.11,37.359 420.692,37.359 420.692,502.049 345.562,502.049 345.562,112.49  211.11,112.49 211.11,149.849"/> </g> </svg>';
        var turnLeftSlightDirectionSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="enable-background:new 0 0 494.221 494.221;" viewBox="0 0 494.221 494.221" height="494.221px" width="494.221px" y="0px" x="0px" version="1.1"><path d="m 293.754,494.221 0,-272.679 L 196.00525,118.21774 149.49134,168.01609 125.337,0 281.02749,30.203849 243.648,65.187 368.884,189.97 l 0,304.251 z" transform="matrix(1.1461758,0.01719715,0,1,-53.921896,-4.2495957)" /></svg>';
        var turnLeftSharpDirectionSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="enable-background:new 0 0 494.221 494.221;" viewBox="0 0 494.221 494.221" height="494.221px" width="494.221px" y="0px" x="0px" version="1.1"><path d="m 321.60564,491.93915 88.98134,0 L 409.10641,4.4108408 135.82982,216.25447 86.606925,172.748 l -2.96158,148.93 161.401745,-0.96438 -46.16514,-44.3922 120.73678,-97.52933 z" style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:1.31939518px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /></svg>';
        var uTurnDirectionSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="enable-background:new 0 0 495.002 495.002;" viewBox="0 0 495.002 495.002" y="0px" x="0px" version="1.1"><path d="m 467.73329,207.77586 c -19.04538,-0.77757 -54.63394,0.0643 -77.80829,-0.50786 l 0,-43.182 C 389.925,73.605 316.319,0 225.838,0 135.357,0 61.751,73.605 61.751,164.087 l 0,330.915 83.319,0 0,-330.915 c 0,-44.532 36.226,-80.767 80.768,-80.767 44.54,0 80.765,36.234 80.765,80.767 l 0,43.182 c -8.76231,0.65024 -56.72081,0.95691 -75.17046,1.03223 C 265.79536,250.5871 331.3256,330.71396 348.264,354.237 387.14667,306.35389 429.74251,252.29518 467.73329,207.77586 Z" /></svg>';
        var circularArrowsDirectionSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 297.249 297.249" style="enable-background:new 0 0 297.249 297.249;" xml:space="preserve"> <g> <path d="M67.851,120.957H53.267c8.152-28,28.685-51.807,55.359-63.768L95.645,27.605c-38.193,16.976-66.903,51.352-75.728,93.352H0 l33.435,55.413L67.851,120.957z"/> <path d="M175.624,53.268c28,8.152,52.14,28.685,64.101,55.359l29.418-12.981c-16.976-38.193-51.519-66.903-93.519-75.728V0 l-55.413,33.436l55.413,34.414V53.268z"/> <path d="M263.813,120.544l-34.414,55.413h14.582c-8.152,28-28.685,51.973-55.359,63.934l12.982,29.502 c38.193-16.975,66.903-51.435,75.727-93.435h19.918L263.813,120.544z"/> <path d="M120.624,243.981c-28-8.152-51.639-28.685-63.6-55.358l-29.668,12.98c16.976,38.193,51.268,66.903,93.268,75.727v19.918 l55.414-33.436l-55.414-34.415V243.981z"/> </g> </svg>';

        directionStepsSVGs = [
            aheadDirectionSVG,      // no turn
            aheadDirectionSVG,      // straight
            turnRightSlightDirectionSVG,    // slight right turn
            turnRightDirectionSVG,  // right turn
            turnRightSharpDirectionSVG, // sharp right turn
            uTurnDirectionSVG,  // uturn
            turnLeftSharpDirectionSVG,  // sharp left turn
            turnLeftDirectionSVG,   // left turn
            turnLeftSlightDirectionSVG, // slight left turn
            aheadDirectionSVG,  // reach via location
            aheadDirectionSVG,  // head on
            circularArrowsDirectionSVG, // enter round about
            circularArrowsDirectionSVG, // leave round about
            circularArrowsDirectionSVG, // stay in round about
            aheadDirectionSVG,  // start at end of street
            aheadDirectionSVG,  // leave against allowed direction
            aheadDirectionSVG   // enter against allowed direction
        ];
    }

    function createImages() {

        createDirectionStepsSVGs();

        var redMarkerData = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0ic3ZnNTI5MSIKICAgdmlld0JveD0iMCAwIDY4MS40Mjg1NyA2ODEuNDI4NTciCiAgIGhlaWdodD0iMTkyLjMxNDI5bW0iCiAgIHdpZHRoPSIxOTIuMzE0MjltbSI+CiAgPGRlZnMKICAgICBpZD0iZGVmczUyOTMiIC8+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhNTI5NiI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGU+PC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTcuODU3MTQ3LC0yMTMuMDc2NDgpIgogICAgIGlkPSJsYXllcjEiPgogICAgPGNpcmNsZQogICAgICAgcj0iMzE1LjcxNDI5IgogICAgICAgY3k9IjU1My43OTA3NyIKICAgICAgIGN4PSIzOTguNTcxNDQiCiAgICAgICBpZD0icGF0aDU4MzkiCiAgICAgICBzdHlsZT0iZmlsbDojZmYwMDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTojODg4ODg4O3N0cm9rZS13aWR0aDo1MDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIiAvPgogICAgPHJlY3QKICAgICAgIHk9IjQxMy43OTA3NyIKICAgICAgIHg9IjI1OC41NzE0NCIKICAgICAgIGhlaWdodD0iMjgwIgogICAgICAgd2lkdGg9IjI4MCIKICAgICAgIGlkPSJyZWN0NTg0MyIKICAgICAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjUwO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+CiAgPC9nPgo8L3N2Zz4K';
        loadingData = 'data:image/gif;base64,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';

        var busPNGData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAoCAYAAAB5ADPdAAAABmJLR0QA/wD/AP+gvaeTAAAEW0lEQVRYhc2Ya0wcVRTHfzOzu7zfXVhetiBCCiJQSjWR+kATRYqpwZgoVtOg0TRSi02Mpg0mxhh8favWpnGDmpoUFQumSVtIxUZRKVaxUAgqYkMFypuFZXnt+AEYdnd2eS3t8v809+Tcub85995z5x5BlmUZF5qYnKb1n+u0dfbR0tFLW2cfvQMmRsYsDJssjIxZMJkn0Wok/H11APh56wjy9yZKH4ghLIDITQHEGoLISIomPTESPx+dq+EWlCk4QpnMkxirGjlZ00RDcxezVutyL1mxJFFka5yeezPjeSZvGztSYpeHunili0dLPqVnwLRuIEvpkbuTOH64gCh9oHOowVEzCbvfY2h0wq6jViOx+75ktwFmrTKV55tV9vjoUNq+PohWIylQmoWnM/XtKiAAPx8dFWWFbkOZLdNOoTquDVJR8weFuRmKTVx4+PnyVbcHXquqL7TatZVINbZ2Oe1gtkzxwtuVbg88M+N6w/zY1OkcquXv3kWjJBLg56W0v6y97DYUQEigj/I8MmbBap3bY//1mRifmFLShQZgaHSC0fFJpUNWSgz1xn3rAuJKW/Lf4d/uIQBkWabj2iCpCQYARFmWOf1D2w0FWIm+vdDK9MwsAOIbx2rZU3rSw0hw6KOz5L1cDoB4/JsGz9LYqOaXPymvvhQuDo6aPc1ip7bO68Hiwg7YKJIkwSpaXf8keERW2SqIQf7enuawU4w+eFwsyLnd0xyK0hIj2Zu/vUc8+vpjxEWFepqHhNgwzh0pwtdXaxU1ksgdtxk8zURYkC/hof7A/F/C7AbYgbZZQANzh6OtBobN63YIu5LZMmUPJTtASaJg59B+tZ8nXjtxQ6EcZRspEUB0gPKEbCM1ByVsACjHSEmS6NL5Zkk9fRsgUrYIy66pzZEhJMeHI7gBLooCqQkGosMDl/BZnC3NUlAflORR8lQ2giDQ1N5N7n4j3f2ru6iGBvpSe/Q5MpKikGWZY5UN7Cs7hWO1wDYDiABeWg2Ouiv1Fl4p3KlEKC0xktLnH1wVEMChovvJSIoCQBAEXiy4k5ysW1V+oiOUs6JDTHiQymYI8181VGxEsJP3BKhsks30uYSq+7VDlenXcsE4Vddi156YnOb8xb/UUNJipDQAIQE+Kqf+4XF2HSinrDgXPx8tn5/+jU+qGlcN9cWZ34nSB7I3fzs9AyZKPz7ndF3aZgBBlmX5SEU9xe9Wr3rA9VRWcgwNn70EkCkCRISq5/hma2r+zgfzayo7fQvJ8eEeA/L31XG4KEdpqyp5Z39q5+Fio12ng0/v5P0DeW4PXvTmVxir7dflpRP7lZQxr0zVoafTSo4m24KWW5qZXVmp0gmUOpF66dS2tci2krM4nvqDVVA7UmKU6gfMzfeTD6WtC9TjD6TaJcnMrdEkbdar/ARZlt9yNPYMmnRlxu9Txi2Tumd3bWvPTo8bWhcqoPK7ZkNV3ZX4iLCAsVf33NO6KcRv2sHlw/8BQH5xEOi41Y4AAAAASUVORK5CYII=';

        mapMarker1SVG = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 38.870663 65.01535" xml:space="preserve" width="38.870663" height="65.01535"><path d="m 19.614341,12.25 c -3.859,0 -7,3.141 -7,7 0,3.859 3.141,7 7,7 3.859,0 7,-3.141 7,-7 0,-3.859 -3.141,-7 -7,-7 z m 0,12 c -2.757,0 -5,-2.243 -5,-5 0,-2.757 2.243,-5 5,-5 2.757,0 5,2.243 5,5 0,2.757 -2.243,5 -5,5 z" style="fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:13.9;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /><path d="m 32.997341,5.867 c -3.622,-3.622 -8.438,-5.617 -13.56,-5.617 -5.123,0 -9.9380005,1.995 -13.5600001,5.617 -6.70300004,6.702 -7.536,19.312 -1.804,26.952 l 15.3640001,22.188 15.341,-22.157 c 5.755,-7.671 4.922,-20.281 -1.781,-26.983 z m 0.159,25.814 -13.719,19.812 L 5.6963409,31.65 C 0.49734086,24.718 1.2423409,13.33 7.2923405,7.281 10.536341,4.037 14.849341,2.25 19.437341,2.25 c 4.588,0 8.901,1.787 12.146,5.031 6.05,6.049 6.795,17.437 1.573,24.4 z" style="fill:#949494;fill-opacity:1;stroke:#949494;stroke-width:0.5;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /><path style="fill:#ff0000;fill-opacity:1;stroke:none;stroke-width:50;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="M 12.032534,40.635204 C 7.9812495,34.777493 4.3642549,29.318095 3.9947689,28.503211 c -1.254422,-2.76657 -1.506747,-4.12908 -1.494007,-8.067368 0.01047,-3.235933 0.07525,-3.80559 0.646467,-5.684519 C 4.0157469,11.894463 5.2025649,9.7783 7.0510435,7.790604 12.155492,2.301719 20.002618,0.817712 26.837317,4.048731 c 4.27931,2.02299 7.551287,6.012562 8.978598,10.947744 0.454103,1.570137 0.53289,2.375556 0.532083,5.439368 -0.0012,4.038252 -0.276447,5.456681 -1.606009,8.272173 -0.588137,1.245438 -14.275211,21.444897 -15.183639,22.408095 -0.08791,0.09322 -3.474532,-4.623193 -7.525816,-10.480907 z M 22.898806,25.537479 c 1.229847,-0.59536 2.545801,-2.009926 3.208644,-3.449087 0.744969,-1.617466 0.683254,-4.381381 -0.132739,-5.944941 -2.315334,-4.436504 -8.061833,-5.307308 -11.51848,-1.745469 -1.721222,1.773601 -2.357875,4.80885 -1.52276,7.259775 0.442483,1.298618 1.882222,2.988447 3.208268,3.765563 1.836753,1.076409 4.670428,1.124281 6.757067,0.114159 z" /><circle style="fill:#ff0000;fill-opacity:1;stroke:#000000;stroke-width:0.81510067;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" cx="19.435331" cy="60.352589" r="4.2552137" /></svg>';
        mapMarker1Data = makeDataFromSVG(mapMarker1SVG);

        var mapMarkerSearchData = makeDataFromSVG(makeSearchSVG("#000"));
        var tapSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="32px" height="32px" viewBox="0 0 42.585 42.585" style="enable-background:new 0 0 42.585 42.585;" xml:space="preserve"> <g> <g> <path d="M14.934,32.494c-0.276,0-0.5-0.224-0.5-0.5V15.632c0-1.93,1.481-3.5,3.303-3.5s3.303,1.57,3.303,3.5v10.637 c0,0.276-0.224,0.5-0.5,0.5s-0.5-0.224-0.5-0.5V15.632c0-1.378-1.033-2.5-2.303-2.5s-2.303,1.122-2.303,2.5v16.361 C15.434,32.27,15.21,32.494,14.934,32.494z"/> <path d="M17.099,42.585c-0.128,0-0.256-0.049-0.354-0.146l-7.413-7.412c-0.824-0.824-1.376-1.835-1.555-2.846 c-0.189-1.076,0.062-2.025,0.708-2.67c1.287-1.288,3.415-1.255,4.745,0.074l2.056,2.056c0.195,0.195,0.195,0.512,0,0.707 s-0.512,0.195-0.707,0l-2.056-2.056c-0.94-0.939-2.435-0.972-3.331-0.074c-0.409,0.409-0.562,1.044-0.43,1.79 c0.143,0.811,0.596,1.632,1.277,2.313l7.413,7.412c0.195,0.195,0.195,0.512,0,0.707C17.355,42.537,17.227,42.585,17.099,42.585z" /> <path d="M26.146,27.341c-0.276,0-0.5-0.224-0.5-0.5V24.32c0-1.115-1.033-2.021-2.303-2.021s-2.303,0.907-2.303,2.021v2.521 c0,0.276-0.224,0.5-0.5,0.5s-0.5-0.224-0.5-0.5V24.32c0-1.666,1.482-3.021,3.303-3.021s3.303,1.355,3.303,3.021v2.521 C26.646,27.118,26.422,27.341,26.146,27.341z"/> <path d="M31.75,27.341c-0.276,0-0.5-0.224-0.5-0.5v-2.104c0-0.87-1.054-1.604-2.302-1.604s-2.302,0.735-2.302,1.604v2.104 c0,0.276-0.224,0.5-0.5,0.5s-0.5-0.224-0.5-0.5v-2.104c0-1.436,1.481-2.604,3.302-2.604s3.302,1.168,3.302,2.604v2.104 C32.25,27.118,32.027,27.341,31.75,27.341z"/> <path d="M37.356,33.759c-0.276,0-0.5-0.224-0.5-0.5v-6.877c0-1.378-1.033-2.5-2.303-2.5c-1.357,0-2.303,0.648-2.303,1.229v1.729 c0,0.276-0.224,0.5-0.5,0.5s-0.5-0.224-0.5-0.5v-1.729c0-1.25,1.451-2.229,3.303-2.229c1.821,0,3.303,1.57,3.303,3.5v6.877 C37.856,33.536,37.632,33.759,37.356,33.759z"/> <path d="M33.356,42.582H17.138c-0.276,0-0.518-0.224-0.518-0.5s0.206-0.5,0.482-0.5h16.254c1.93,0,3.5-1.57,3.5-3.5v-5.396 c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v5.396C37.856,40.563,35.837,42.582,33.356,42.582z"/> </g> <path d="M17.737,7.197c-0.276,0-0.5-0.224-0.5-0.5V0.5c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v6.197 C18.237,6.973,18.013,7.197,17.737,7.197z"/> <path d="M21.857,8.916c-0.128,0-0.256-0.049-0.354-0.146c-0.195-0.195-0.195-0.512,0-0.707l4.381-4.382 c0.195-0.195,0.512-0.195,0.707,0s0.195,0.512,0,0.707L22.21,8.769C22.113,8.867,21.985,8.916,21.857,8.916z"/> <path d="M30.244,12.408h-6.197c-0.276,0-0.5-0.224-0.5-0.5s0.224-0.5,0.5-0.5h6.197c0.276,0,0.5,0.224,0.5,0.5 S30.521,12.408,30.244,12.408z"/> <g> <path d="M13.617,8.916c-0.128,0-0.256-0.049-0.354-0.146L8.881,4.387c-0.195-0.195-0.195-0.512,0-0.707s0.512-0.195,0.707,0 l4.382,4.382c0.195,0.195,0.195,0.512,0,0.707C13.873,8.867,13.745,8.916,13.617,8.916z"/> <path d="M11.426,12.408H5.229c-0.276,0-0.5-0.224-0.5-0.5s0.224-0.5,0.5-0.5h6.196c0.276,0,0.5,0.224,0.5,0.5 S11.702,12.408,11.426,12.408z"/> </g> </g> </svg>';
        var tapData = makeDataFromSVG(tapSVG);
        var geolocationMapSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="32px" height="32px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"> <g> <g> <path d="M256,0C114.84,0,0,114.842,0,256s114.84,256,256,256s256-114.842,256-256S397.16,0,256,0z M256,462.452 c-113.837,0-206.452-92.614-206.452-206.452S142.163,49.548,256,49.548S462.452,142.163,462.452,256S369.837,462.452,256,462.452z "/> </g> </g> <g> <g> <path d="M256,132.129c-68.302,0-123.871,55.569-123.871,123.871S187.698,379.871,256,379.871S379.871,324.302,379.871,256 S324.302,132.129,256,132.129z M256,330.323c-40.983,0-74.323-33.341-74.323-74.323c0-40.982,33.339-74.323,74.323-74.323 s74.323,33.341,74.323,74.323C330.323,296.981,296.983,330.323,256,330.323z"/> </g> </g> </svg>';
        var geolocationMapData = makeDataFromSVG(geolocationMapSVG);
        var fromSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 37.541998 52.066015" xml:space="preserve" width="37.542" height="52.066017"><path style="fill:#33cd5f;fill-opacity:1;stroke:#000000;stroke-linecap:butt;stroke-opacity:1;stroke-linejoin:round;stroke-width:1.1;stroke-miterlimit:4;stroke-dasharray:none" d="M 18.771,0.49999809 C 8.695,0.49999809 0.5,8.6989981 0.5,18.770998 c 0,9.461 13.676,19.698 17.63,32.338 0.085,0.273 0.34,0.459 0.626,0.457 0.287,-0.004 0.538,-0.192 0.619,-0.467 3.836,-12.951 17.666,-22.856 17.667,-32.33 C 37.041,8.6989981 28.845,0.49999809 18.771,0.49999809 Z m 0,32.13099991 c -7.9,0 -14.328,-6.429 -14.328,-14.328 0,-7.9 6.428,-14.3279999 14.328,-14.3279999 7.898,0 14.327,6.4279999 14.327,14.3279999 0,7.899 -6.429,14.328 -14.327,14.328 z" /><path d="M 17.491987,32.053536 C 14.72134,31.72142 12.547927,30.865333 10.4178,29.267079 9.6776719,28.711755 8.5836331,27.649072 8.0205177,26.938505 6.3421849,24.820701 5.3150402,22.309714 5.0369017,19.644675 4.9078899,18.408524 5.0175369,16.595491 5.2991384,15.308541 6.3906811,10.320071 10.357268,6.2177124 15.313137,4.9517748 16.66082,4.6075198 17.124594,4.555504 18.821934,4.5582359 c 1.659792,0.00267 2.040614,0.044746 3.313399,0.3660747 1.747467,0.4411677 3.437805,1.2498595 4.920955,2.3542846 0.737616,0.5492649 2.161188,1.965297 2.696138,2.6818603 1.379868,1.8483245 2.2095,3.7634445 2.635509,6.0838005 0.171856,0.936055 0.186303,3.396013 0.02559,4.3577 -0.660389,3.95175 -2.829084,7.293935 -6.149548,9.4771 -1.117319,0.734624 -2.960835,1.533582 -4.244512,1.839523 -1.042011,0.248343 -1.718768,0.324734 -3.027752,0.341764 -0.715908,0.0093 -1.390786,0.0063 -1.499728,-0.0068 z" style="fill:#ff0000;fill-opacity:1;stroke:none;stroke-width:1.69799995;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /></svg>';
        var fromData = makeDataFromSVG(fromSVG);
        var toSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 37.541998 52.066015" xml:space="preserve" width="37.542" height="52.066017"><path style="fill:#387ef5;fill-opacity:1;stroke:#000000;stroke-linejoin:round;stroke-opacity:1;stroke-width:1.1;stroke-miterlimit:4;stroke-dasharray:none" d="M 18.771,0.49999809 C 8.695,0.49999809 0.5,8.6989981 0.5,18.770998 c 0,9.461 13.676,19.698 17.63,32.338 0.085,0.273 0.34,0.459 0.626,0.457 0.287,-0.004 0.538,-0.192 0.619,-0.467 3.836,-12.951 17.666,-22.856 17.667,-32.33 C 37.041,8.6989981 28.845,0.49999809 18.771,0.49999809 Z m 0,32.13099991 c -7.9,0 -14.328,-6.429 -14.328,-14.328 0,-7.9 6.428,-14.3279999 14.328,-14.3279999 7.898,0 14.327,6.4279999 14.327,14.3279999 0,7.899 -6.429,14.328 -14.327,14.328 z" /><path d="M 16.932297,31.971499 C 12.339831,31.3131 8.4926786,28.534608 6.4065867,24.369617 4.4054277,20.374199 4.5435059,15.479076 6.7684711,11.540162 7.6961091,9.8979402 9.2861721,8.1406588 10.851745,7.0274723 c 1.41916,-1.0090817 3.385681,-1.8583995 5.223796,-2.2560971 0.722092,-0.1562331 1.040522,-0.1773919 2.691017,-0.178811 1.665176,-0.00143 1.962502,0.018147 2.691017,0.1772014 5.586243,1.2196281 9.734526,5.4019344 10.857963,10.9470174 0.156108,0.770521 0.178715,1.109403 0.176059,2.639052 -0.0026,1.522894 -0.02641,1.863332 -0.179715,2.574017 -0.642478,2.978462 -2.08033,5.530868 -4.232971,7.514164 -1.88734,1.738867 -4.412284,2.992994 -6.933338,3.443754 -0.999688,0.178743 -3.239992,0.223263 -4.213276,0.08373 z" style="fill:#ff0000;fill-opacity:1;stroke:none;stroke-width:1.10000002;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /></svg>';
        var toData = makeDataFromSVG(toSVG);
        var directionsMapArrowSVG = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" height="575.54266" width="459.91489" id="svg4185" xml:space="preserve" viewBox="0 0 459.91486 575.54263" y="0px" x="0px" version="1.1"><metadata id="metadata4197"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /><dc:title></dc:title></cc:Work></rdf:RDF></metadata><defs id="defs4195" /><path id="path4742" d="M 23.692352,544.60861 229.15147,32.877744 434.65268,544.71349 224.22287,421.61601 Z" style="fill:#efefef;fill-opacity:1;fill-rule:evenodd;stroke:#ffffff;stroke-width:1.22280085px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><path id="path4744" d="m 229.16083,174.26046 -82.44132,201.7643 164.88265,0 z" style="fill:#ff0000;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><path id="path4752" d="M 228.58218,32.311096 24.550304,546.22596 223.97996,422.73299 435.6822,546.22596 Z" style="fill:none;fill-rule:evenodd;stroke:#037;stroke-width:24;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /></svg>';
        var directionsMapArrowData = makeDataFromSVG(directionsMapArrowSVG);

        arrowSquareRightSVG = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" width="294" height="322.97055" viewBox="0 0 293.99999 322.97055" xml:space="preserve"><rect y="-1.3685193" x="0" height="325.70758" width="353.07797" style="fill:#ffffff;fill-opacity:0.00392157;stroke:none;stroke-width:3;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /><path d="m 70.387038,44.185123 c 39.100002,39.100052 78.200002,78.200107 117.300002,117.300157 -39.1,39.1 -78.2,78.2 -117.300002,117.3 11.899997,11.9 23.799997,23.8 35.700002,35.7 51,-51 102,-102 153,-153 -51,-51.00003 -102,-102.000052 -153,-153.0000776 C 94.187035,20.385176 82.287035,32.285149 70.387038,44.185123 Z" style="fill:#45f7f7;fill-opacity:1;stroke:none;stroke-width:12;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /></svg>';
        arrowSquareRightData = makeDataFromSVG(arrowSquareRightSVG);

        arrowSmallRightSVG = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" width="320" height="322.97055" viewBox="0 0 320 322.97055" xml:space="preserve"><rect style="fill:#ffffff;fill-opacity:0.00392157;stroke:none;stroke-width:3;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" width="314.75943" height="325.70758" x="0" y="-1.3685194" /><path d="M 160.31665,162.8538 60.925903,283.00934 309.72225,161.48528 62.294422,46.803742 Z" style="fill:#45f7f7;fill-opacity:1;stroke:none;stroke-width:12;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /></svg>';
        arrowSmallRightData = makeDataFromSVG(arrowSmallRightSVG);

        measuringSVG = '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 80.853 80.854" style="enable-background:new 0 0 80.853 80.854;" xml:space="preserve"> <g> <path stroke="null" d="m76.442612,40.437309c0,-0.127323 -0.054695,-0.231339 -0.068146,-0.353287c-0.024208,-2.757259 -0.234032,-5.544113 -0.716438,-8.319305c-2.197739,-12.695959 -8.09066,-22.629272 -16.184906,-27.25609c-0.36853,-0.216098 -0.800728,-0.330872 -1.248165,-0.330872l-29.184824,0c-1.140566,0 -2.136765,0.763066 -2.428185,1.868661c-0.288727,1.100215 0.197268,2.260507 1.182709,2.820925c5.40423,3.096202 9.761152,9.528916 12.250311,17.702962l-16.678967,0c-0.494961,0 -0.92626,0.179335 -1.319899,0.427713c-1.59697,-0.060974 -3.21546,0.260033 -4.764009,1.035652c-8.132799,4.052952 -12.871703,16.671795 -10.797704,28.722145c1.51896,8.798126 5.70372,15.515091 11.471105,18.440926c1.952948,0.989922 4.018875,1.479507 6.103634,1.479507c0.95047,0 1.90453,-0.106705 2.853205,-0.31205l31.595972,-0.94957c0.364048,-0.009865 0.720924,-0.102219 1.043724,-0.264519c10.163761,-5.087708 16.754292,-19.223713 16.817059,-34.381027c0.026894,-0.111191 0.073524,-0.214306 0.073524,-0.331772zm-48.30722,30.224968c-0.617805,0.308456 -1.232922,0.540688 -1.839968,0.716446l-2.054272,0.058273c-0.326387,0.009865 -0.642015,0.088776 -0.928949,0.210724c-1.040138,-0.102219 -2.066826,-0.407089 -3.081858,-0.921776c-4.274427,-2.164566 -7.560724,-7.698814 -8.793646,-14.808514c-1.659736,-9.651764 2.0471,-20.357109 8.093348,-23.372612c1.446329,-0.719131 2.872932,-0.728096 4.233179,-0.041248c2.482882,1.260719 4.406239,4.563156 5.140612,8.835793c1.105595,6.408501 -1.526133,12.404537 -4.686895,13.979088c-0.674297,0.33894 -1.277756,0.348804 -1.896458,0.034073c-1.027584,-0.520065 -2.30534,-2.105381 -2.806578,-4.994453c-0.612427,-3.551708 0.817762,-7.133907 2.50709,-7.97678c1.245476,-0.618702 1.752094,-2.125107 1.134287,-3.366993c-0.618702,-1.243683 -2.130487,-1.752098 -3.3661,-1.133392c-3.883478,1.928734 -6.179852,7.787579 -5.224897,13.330795c0.703886,4.078056 2.707047,7.222679 5.497484,8.635834c2.034546,1.030273 4.310295,1.020409 6.401333,-0.028698c5.541418,-2.758156 8.792746,-11.252316 7.395735,-19.336693c-0.616909,-3.577717 -1.965502,-6.554661 -3.763327,-8.871658l11.199411,0c0.062767,0.346115 0.154228,0.672504 0.215199,1.025791c2.754574,15.901554 -3.250427,32.961609 -13.374729,38.026001zm29.647507,-0.251076l-21.750534,0.661743c8.598171,-8.36055 13.065388,-24.115047 10.436348,-39.308228c-1.612213,-9.363928 -5.245522,-17.226831 -10.288395,-22.562917l21.353306,0c3.383137,2.104486 6.327801,5.546803 8.645699,9.882203l-14.234642,0c-1.379978,0 -2.511574,1.126219 -2.511574,2.511574c0,1.387148 1.131596,2.51247 2.511574,2.51247l16.47094,0c0.971092,2.642488 1.770927,5.481346 2.286507,8.511196c0.313835,1.758369 0.467171,3.531982 0.564003,5.306496l-14.928665,0c-1.380871,0 -2.51247,1.126217 -2.51247,2.51157c0,1.383568 1.131599,2.511578 2.51247,2.511578l14.899979,0c-0.263618,4.917336 -1.256241,9.627548 -2.875626,13.817688l-16.427002,0c-1.379078,0 -2.51247,1.128014 -2.51247,2.51247c0,1.38356 1.133392,2.512466 2.51247,2.512466l14.014961,0c-2.190563,3.787537 -4.928104,6.862221 -8.166878,8.61969z"/> </g> </svg>';

        dustBinSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="729.837px" height="729.838px" viewBox="0 0 729.837 729.838" style="enable-background:new 0 0 729.837 729.838;" xml:space="preserve"> <g> <path d="M589.193,222.04c0-6.296,5.106-11.404,11.402-11.404S612,215.767,612,222.04v437.476c0,19.314-7.936,36.896-20.67,49.653 c-12.733,12.734-30.339,20.669-49.653,20.669H188.162c-19.315,0-36.943-7.935-49.654-20.669 c-12.734-12.734-20.669-30.313-20.669-49.653V222.04c0-6.296,5.108-11.404,11.403-11.404c6.296,0,11.404,5.131,11.404,11.404 v437.476c0,13.02,5.37,24.922,13.97,33.521c8.6,8.601,20.503,13.993,33.522,13.993h353.517c13.019,0,24.896-5.394,33.498-13.993 c8.624-8.624,13.992-20.503,13.992-33.498V222.04H589.193z"/> <path d="M279.866,630.056c0,6.296-5.108,11.403-11.404,11.403s-11.404-5.107-11.404-11.403v-405.07 c0-6.296,5.108-11.404,11.404-11.404s11.404,5.108,11.404,11.404V630.056z"/> <path d="M376.323,630.056c0,6.296-5.107,11.403-11.403,11.403s-11.404-5.107-11.404-11.403v-405.07 c0-6.296,5.108-11.404,11.404-11.404s11.403,5.108,11.403,11.404V630.056z"/> <path d="M472.803,630.056c0,6.296-5.106,11.403-11.402,11.403c-6.297,0-11.404-5.107-11.404-11.403v-405.07 c0-6.296,5.107-11.404,11.404-11.404c6.296,0,11.402,5.108,11.402,11.404V630.056L472.803,630.056z"/> <path d="M273.214,70.323c0,6.296-5.108,11.404-11.404,11.404c-6.295,0-11.403-5.108-11.403-11.404 c0-19.363,7.911-36.943,20.646-49.677C283.787,7.911,301.368,0,320.73,0h88.379c19.339,0,36.92,7.935,49.652,20.669 c12.734,12.734,20.67,30.362,20.67,49.654c0,6.296-5.107,11.404-11.403,11.404s-11.403-5.108-11.403-11.404 c0-13.019-5.369-24.922-13.97-33.522c-8.602-8.601-20.503-13.994-33.522-13.994h-88.378c-13.043,0-24.922,5.369-33.546,13.97 C278.583,45.401,273.214,57.28,273.214,70.323z"/> <path d="M99.782,103.108h530.273c11.189,0,21.405,4.585,28.818,11.998l0.047,0.048c7.413,7.412,11.998,17.628,11.998,28.818 v29.46c0,6.295-5.108,11.403-11.404,11.403h-0.309H70.323c-6.296,0-11.404-5.108-11.404-11.403v-0.285v-29.175 c0-11.166,4.585-21.406,11.998-28.818l0.048-0.048C78.377,107.694,88.616,103.108,99.782,103.108L99.782,103.108z M630.056,125.916H99.782c-4.965,0-9.503,2.02-12.734,5.274L87,131.238c-3.255,3.23-5.274,7.745-5.274,12.734v18.056h566.361 v-18.056c0-4.965-2.02-9.503-5.273-12.734l-0.049-0.048C639.536,127.936,635.021,125.916,630.056,125.916z"/> </g> </svg>';

        //downloadSVG = '<svg width="29.978" height="29.978" xmlns="http://www.w3.org/2000/svg"> <g> <path stroke="null" d="m24.494501,18.724583l0,6.215084l-19.011004,0l0,-6.215084l-3.653903,0l0,8.042036c0,1.008316 0.816819,1.826044 1.829675,1.826044l22.659461,0c1.01195,0 1.829676,-0.81682 1.829676,-1.826044l0,-8.042036l-3.653904,0z"/> <path stroke="null" d="m14.654558,18.108339l-5.231272,-6.32127c0,0 -0.795944,-0.751473 0.067162,-0.751473s2.947808,0 2.947808,0s0,-0.50552 0,-1.285129c0,-2.222653 0,-6.267723 0,-7.916789c0,0 -0.117078,-0.448343 0.55816,-0.448343c0.680682,0 3.662069,0 4.149439,0c0.486462,0 0.475569,0.377552 0.475569,0.377552c0,1.59915 0,5.783985 0,7.934033c0,0.697019 0,1.148993 0,1.148993s1.671757,0 2.720915,0c1.047344,0 0.258661,0.786869 0.258661,0.786869s-4.450758,5.908321 -5.071538,6.528194c-0.446527,0.449251 -0.874904,-0.052637 -0.874904,-0.052637z"/> </g> </svg>';
        downloadSVG = '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 29.978 29.978" > <path stroke="null" d="m 24.494501,18.724583 0,6.215084 -19.011004,0 0,-6.215084 -3.653903,0 0,8.042036 c 0,1.008316 0.816819,1.826044 1.829675,1.826044 l 22.659461,0 c 1.01195,0 1.829676,-0.81682 1.829676,-1.826044 l 0,-8.042036 -3.653904,0 z" /> <path stroke="null" d="m 14.654558,20.108339 -5.231272,-6.32127 c 0,0 -0.795944,-0.751473 0.067162,-0.751473 0.863106,0 2.947808,0 2.947808,0 0,0 0,-0.50552 0,-1.285129 0,-2.222653 0,-6.267723 0,-7.916789 0,0 -0.117078,-0.448343 0.55816,-0.448343 0.680682,0 3.662069,0 4.149439,0 0.486462,0 0.475569,0.377552 0.475569,0.377552 0,1.59915 0,5.783985 0,7.934033 0,0.697019 0,1.148993 0,1.148993 0,0 1.671757,0 2.720915,0 1.047344,0 0.258661,0.786869 0.258661,0.786869 0,0 -4.450758,5.908321 -5.071538,6.528194 -0.446527,0.449251 -0.874904,-0.05264 -0.874904,-0.05264 z" /> </svg>';

        layersSVG = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" enable-background="new 0 0 12 12" viewBox="0 0 12 12" y="0px" x="0px" version="1.1"><path style="" d="M 6,6 0,3 6,0 12,3 6,6 Z M 6,7.102 2.297,5.25 0,6 6,9 12,6 9.891,5.203 6,7.102 Z m 0,3 L 2.297,8.25 0,9 6,12 12,9 9.891,8.203 6,10.102 Z" /></svg>';

        busSVG = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" style="" viewBox="0 0 36.195457 39.516697" height="40px" width="36px" y="0" x="0" > <g transform="translate(-4.617,-3.543)" > <path d="M 38.959923,13.213912 C 38.650508,10.991005 38.563146,8.5764759 37.310921,6.641368 35.36833,4.8576827 32.569062,4.5648379 30.076842,4.1029589 24.055082,3.3335673 17.856288,3.2476921 11.900967,4.5459668 9.9990492,5.0084702 7.6231346,5.7758159 7.265452,8.007119 6.7944666,9.7082842 6.5885076,11.467905 6.404925,13.219128 c -1.608175,0.139478 -1.8889475,1.850618 -1.761139,3.14856 0.1052295,1.276826 -0.2817203,2.670636 0.3670487,3.833082 1.7260712,0.979844 0.5588763,3.29833 0.8614473,4.992758 0.025404,4.133446 -0.043047,8.300214 0.4620345,12.40219 0.3705824,1.317238 1.860401,0.863544 2.8778727,0.940007 0.3353234,0.318875 0.044906,1.263491 0.1421648,1.820431 -0.2835179,1.450392 0.904532,2.808452 2.400052,2.697158 1.524145,0.114802 2.690639,-1.279576 2.401791,-2.743857 0.132241,-0.530392 -0.271832,-1.597099 0.214168,-1.773732 5.878468,0 11.756935,0 17.635403,0 0.112295,1.22968 -0.30603,2.604211 0.409905,3.685926 1.294617,1.58302 4.675897,0.817738 4.391067,-1.483858 0,-0.734022 0,-1.468045 0,-2.202068 1.796426,0.455141 3.100565,-0.7801 2.566298,-2.622925 0.06559,-4.989054 0.146241,-9.97963 0.02239,-14.968479 1.486068,-0.405159 1.448867,-2.049382 1.396919,-3.284491 -0.127361,-1.372334 0.432771,-3.058416 -0.802022,-4.059576 -0.298387,-0.221692 -0.659819,-0.356985 -1.030401,-0.386342 z m -25.40613,-6.00665 c 6.008098,0 12.016196,0 18.024294,0 0,0.9089657 0,1.8179313 0,2.726897 -6.008098,0 -12.016196,0 -18.024294,0 0,-0.9089657 0,-1.8179313 0,-2.726897 z m 0.257304,28.222559 c -2.080584,0.108147 -3.383411,-2.654906 -1.976877,-4.191541 1.23379,-1.662539 4.173148,-0.933343 4.487413,1.112844 0.35746,1.536857 -0.932524,3.120253 -2.510536,3.078697 z m 17.670501,0 c -2.080337,0.108007 -3.386455,-2.654626 -1.977908,-4.191541 1.23421,-1.662026 4.173671,-0.934052 4.487618,1.112844 0.357733,1.536783 -0.931773,3.12 -2.50971,3.078697 z m 3.257156,-11.21357 c -8.115208,0 -16.230415,0 -24.345623,0 0,-4.256521 0,-8.513043 0,-12.769564 8.115208,0 16.230415,0 24.345623,0 0,4.256521 0,8.513043 0,12.769564 z" /> </g> </svg>';
        busStopSVG = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="19.6" height="30.043739" viewBox="0 0 19.6 30.043739" version="1.1" > <path style="fill-rule:evenodd;stroke:none;stroke-width:1" d="m 8.4,29.089729 0,-0.453553 0,-7.153255 C 3.6507882,20.799928 0,16.693477 0,11.729729 0,6.7659823 3.6507882,2.6595312 8.4,1.9765376 l 0,-0.56897 C 8.4,0.6301895 9.026801,0 9.8,0 c 0.773199,0 1.4,0.6301895 1.4,1.4075676 l 0,0.56897 c 4.749212,0.6829936 8.4,4.7894447 8.4,9.7531914 0,4.963748 -3.650788,9.070199 -8.4,9.753192 l 0,7.153255 0,0.453553 2.8,0 0.466667,0 0,0.938379 -0.466667,0 -2.8,0 0,0.01563 -2.8,0 0,-0.01563 -2.8,0 -0.4666667,0 0,-0.938379 0.4666667,0 2.8,0 z" /> <ellipse style="fill:#ffffff;fill-rule:evenodd;stroke:none;stroke-width:1" ry="7.037838" rx="7" cy="11.72973" cx="9.8000002" /> </svg>';

        var busSVGFillBlue = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" style="fill:#00519e" viewBox="0 0 36.195457 39.516697" height="40px" width="36px" y="0" x="0" > <g transform="translate(-4.617,-3.543)" > <path d="M 38.959923,13.213912 C 38.650508,10.991005 38.563146,8.5764759 37.310921,6.641368 35.36833,4.8576827 32.569062,4.5648379 30.076842,4.1029589 24.055082,3.3335673 17.856288,3.2476921 11.900967,4.5459668 9.9990492,5.0084702 7.6231346,5.7758159 7.265452,8.007119 6.7944666,9.7082842 6.5885076,11.467905 6.404925,13.219128 c -1.608175,0.139478 -1.8889475,1.850618 -1.761139,3.14856 0.1052295,1.276826 -0.2817203,2.670636 0.3670487,3.833082 1.7260712,0.979844 0.5588763,3.29833 0.8614473,4.992758 0.025404,4.133446 -0.043047,8.300214 0.4620345,12.40219 0.3705824,1.317238 1.860401,0.863544 2.8778727,0.940007 0.3353234,0.318875 0.044906,1.263491 0.1421648,1.820431 -0.2835179,1.450392 0.904532,2.808452 2.400052,2.697158 1.524145,0.114802 2.690639,-1.279576 2.401791,-2.743857 0.132241,-0.530392 -0.271832,-1.597099 0.214168,-1.773732 5.878468,0 11.756935,0 17.635403,0 0.112295,1.22968 -0.30603,2.604211 0.409905,3.685926 1.294617,1.58302 4.675897,0.817738 4.391067,-1.483858 0,-0.734022 0,-1.468045 0,-2.202068 1.796426,0.455141 3.100565,-0.7801 2.566298,-2.622925 0.06559,-4.989054 0.146241,-9.97963 0.02239,-14.968479 1.486068,-0.405159 1.448867,-2.049382 1.396919,-3.284491 -0.127361,-1.372334 0.432771,-3.058416 -0.802022,-4.059576 -0.298387,-0.221692 -0.659819,-0.356985 -1.030401,-0.386342 z m -25.40613,-6.00665 c 6.008098,0 12.016196,0 18.024294,0 0,0.9089657 0,1.8179313 0,2.726897 -6.008098,0 -12.016196,0 -18.024294,0 0,-0.9089657 0,-1.8179313 0,-2.726897 z m 0.257304,28.222559 c -2.080584,0.108147 -3.383411,-2.654906 -1.976877,-4.191541 1.23379,-1.662539 4.173148,-0.933343 4.487413,1.112844 0.35746,1.536857 -0.932524,3.120253 -2.510536,3.078697 z m 17.670501,0 c -2.080337,0.108007 -3.386455,-2.654626 -1.977908,-4.191541 1.23421,-1.662026 4.173671,-0.934052 4.487618,1.112844 0.357733,1.536783 -0.931773,3.12 -2.50971,3.078697 z m 3.257156,-11.21357 c -8.115208,0 -16.230415,0 -24.345623,0 0,-4.256521 0,-8.513043 0,-12.769564 8.115208,0 16.230415,0 24.345623,0 0,4.256521 0,8.513043 0,12.769564 z" /> </g> </svg>';
        var busData = makeDataFromSVG(busSVGFillBlue);

        var imgSrcs = [redMarkerData, loadingData, mapMarker1Data, mapMarkerSearchData, tapData, geolocationMapData, fromData, toData,
            directionsMapArrowData, arrowSquareRightData, arrowSmallRightData, busData, busPNGData
        ];

        new tf.dom.ImgsPreLoader({ imgSrcs: imgSrcs, onAllLoaded: onImagesCreated });
    }

    function createRippleClasses() {
        var styleCreator = new tf.dom.StyleSheet({}), cssStyles = [], rippleClasses = {};
        createRippleClass(rippleClasses, "ripple", "#000");
        createRippleClass(rippleClasses, "rippleWhite", "#fff");
        for (var i in rippleClasses) { var cssStr = rippleClasses[i], cssName = '.' + i; cssStyles.push({ styleName: cssName, inherits: cssStr }); }
        styleCreator.AddStyles(cssStyles);
        //console.log(JSON.stringify(styleCreator.GetAllRules()[".ripple:active::after"]));
    }

    function createRippleClass(addToCSSClasses, tagName, endColor) {
        addToCSSClasses[tagName] = { position: "relative", overflow: "hidden", transform: "translate3d(0, 0, 0)" };
        addToCSSClasses[tagName + ":active::after"] = { transform: "scale(0, 0)", opacity: ".2", transition: "0s" };
        addToCSSClasses[tagName + "::after"] = {
            content: "", display: "block", position: "absolute", width: "100%", height: "100%", top: "0", left: "0", pointerEvents: "none",
            backgroundImage: "radial-gradient(circle, " + endColor + " 10%,transparent 10.01%)",
            backgroundRepeat: "no-repeat", backgroundPosition: "50%",
            transform: "scale(10, 10)", opacity: "0", transition: "transform .5s,opacity 1s"
        };
    }

    function calcLayoutSettings() {
        tf.TFMap.LayoutSettings = isSmallScreen ?
            tf.js.ShallowMerge(tf.TFMap.LayoutSettings, tf.TFMap.LayoutSettingsNormal, tf.TFMap.SmallLayoutSettings) :
            tf.js.ShallowMerge(tf.TFMap.LayoutSettings, tf.TFMap.LayoutSettingsNormal);
    }

    function notify(eventName, props) { allEventDispatchers.Notify(eventName, tf.js.ShallowMerge(props, { sender: theThis, eventName: eventName })); }

    function initialize() {
        minNonSmallScreenWidthAddValue = 0;
        minNonSmallScreenWidth = 620;
        minNonSmallScreenHeight = 500;
        if (settings.sidePanelWidthInt != undefined) { minNonSmallScreenWidth += settings.sidePanelWidthInt; }
        layoutChangeEventName = "layoutChange";
        allEventDispatchers = new tf.events.MultiEventNotifier({ eventNames: [layoutChangeEventName] });
        isSmallScreen = theThis.CheckIsSmallScreen();
        calcLayoutSettings();
        createImages();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
