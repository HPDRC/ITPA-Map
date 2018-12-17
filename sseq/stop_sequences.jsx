"use strict";

const StopSequencesMapFeatures = function (options) {
    let theThis = this; if (!(theThis instanceof StopSequencesMapFeatures)) { return new StopSequencesMapFeatures(options); }
    let map, layer, initialized;
    let lastDragged;
    let sseqItem, agency;
    let shapeData, stopsData;
    let polyCode;
    let shapeFeature, shapeHitTestFeature, shapeHitTestFeatureInMap, lastHitTest;
    let selectedStopFeature;
    let pointInShapeFeatures;

    this.GetPolycode = () => polyCode;

    this.RefreshFeatures = () => { if (initialized) { removeAllFeaturesFromMap(); createFeatures(); } };

    this.PanTo = sseqStopItem => {
        if (initialized && sseqStopItem && sseqStopItem.item && sseqStopItem.item.stopsData) {
            let coords = [sseqStopItem.stopItem.lon, sseqStopItem.stopItem.lat];
            map.AnimatedSetCenterIfDestVisible(coords);
        }
    };

    this.SendLineStringToEditor = lineStringCoords => {
        let mapApp = getGlobalMapApp();
        let appContent = mapApp.GetContent();
        let editorUseI = appContent.GetMeasureToolInterface();
        var lineStringEdit = lineStringCoords.slice(0);
        editorUseI.setLineString(lineStringEdit);
        editorUseI.setShowArea(false);
        if (!appContent.IsMeasureToolOn()) { appContent.ToggleMeasureTool(); }
    };

    this.SendShapeToEditor = () => {
        if (shapeFeature) {
            let mapApp = getGlobalMapApp();
            let appContent = mapApp.GetContent();
            let editorUseI = appContent.GetMeasureToolInterface();
            var lineStringCoords = shapeFeature.GetGeom().GetCoordinates();
            var lineStringEdit = lineStringCoords.slice(0);
            editorUseI.setLineString(lineStringEdit);
            editorUseI.setShowArea(false);
            if (!appContent.IsMeasureToolOn()) { appContent.ToggleMeasureTool(); }
        }
    };

    this.SelectStopFeature = index => {
        if (index >= 0 && index < pointInShapeFeatures.length) {
            selectStopFeature(pointInShapeFeatures[index]);
        }
    };

    const removeAllFeaturesFromMap = () => {
        pointInShapeFeatures = [];
        lastHitTest = undefined;
        selectedStopFeature = undefined;
        setShapeHitTest(undefined);
        shapeFeature = undefined;
        layer.RemoveAllFeatures();
    };

    this.SetVisible = (bool) => { if (layer) { layer.SetVisible(bool); } return theThis.GetVisible(); };
    this.GetVisible = () => { return layer ? layer.GetIsVisible() : true };

    this.CenterOnMap = () => {
        if (shapeFeature) {
            let extent = shapeFeature.GetExtent();
            map.SetVisibleExtent(tf.js.ScaleMapExtent(extent, 1.4))
        }
    };

    this.CalcSequence = () => {
        let calcResult;
        if (initialized && isAllLoaded()) {
            calcResult = tf.js.CalcStopDistances(sseqItem.shapeCoordinates, sseqItem.shapeDistances, sseqItem.stopsData, 0.001);
            tf.js.LogCalcStops(calcResult);
            sseqItem.Cdists = calcResult.distances;
            sseqItem.CSPoints = calcResult.shapePoints;
            sseqItem.Shape_indices = calcResult.shapeIndices;
            sseqItem.Shape_projs = calcResult.shapeProjs;
            if (options.onItemChanged) { options.onItemChanged(sseqItem); }
        }
        return calcResult;
    };

    this.Edit = (stopSequenceItem, agencySet) => {
        if (initialized) {
            removeAllFeaturesFromMap();
            agency = agencySet;
            shapeData = undefined;
            stopsData = undefined;
            if (sseqItem = stopSequenceItem) {
                sseqItem.shapeData = sseqItem.stopsData = undefined;
                sseqItem.Csids = polyCode.DecodeValues(JSON.parse(sseqItem.csids), 0);

                sseqItem.Cdists = polyCode.DecodeValues(JSON.parse(sseqItem.cdists), 6);
                sseqItem.CSPoints = polyCode.DecodeLineString(JSON.parse(sseqItem.cspoints), 6);
                sseqItem.Shape_indices = polyCode.DecodeValues(JSON.parse(sseqItem.shape_indices), 0);
                sseqItem.Shape_projs = polyCode.DecodeValues(JSON.parse(sseqItem.shape_projs), 6);

                loadItemShape();
                loadItemStops();
            }
        }
        else if (stopSequenceItem) {
            setTimeout(() => { theThis.Edit(stopSequenceItem); }, 100);
        }
    };

    const loadItemShape = () => {
        let endpoint = 'shapes/' + sseqItem.shape_id + '?agency=' + agency;
        return axios.get(TransitAPI + endpoint).then((res) => {
            if (res.data) { shapeData = res.data; checkAllLoaded(); }
        }).catch(err => { console.log(err.message); });
    };

    const loadItemStops = () => {
        let stopIds = '', nIds = sseqItem.Csids.length;
        for (let i = 0; i < nIds; ++i) { stopIds += sseqItem.Csids[i]; if (i + 1 < nIds) { stopIds += ','; } }
        let endpoint = 'stops/' + stopIds + '?agency=' + agency;
        return axios.get(TransitAPI + endpoint).then((res) => {
            if (res.data) { stopsData = res.data; checkAllLoaded(); }
        }).catch(err => { console.log(err.message); });
    };

    const getShapeStyle = (kf, mapFeature) => {
        let isHover = true;
        let lineWidth = 2;
        let zindex = 8;
        let lineWidthTick = lineWidth * 2 + 1;
        let mapFeatureSettings = mapFeature.GetSettings();
        let lineItemColor = mapFeatureSettings.color ? mapFeatureSettings.color : "#f00";
        return [
            { line: true, line_color: "#000", line_width: lineWidthTick + 2, zindex: 3, line_opacity: 20 },
            { line: true, line_color: lineItemColor, line_width: lineWidthTick, zindex: 4, line_opacity: 70 },
            { line: true, line_color: "#ffdead", line_width: lineWidth + 2, zindex: zindex, line_cap: "butt", line_opacity: 100, line_dash: [16, 10] }
        ];
    };

    const getStopStyle = (kf, mapFeature) => {
        let isHover = mapFeature.GetIsDisplayingInHover(), mapFeatureSettings = mapFeature.GetSettings(), stopItem = mapFeatureSettings.stopItem;
        let marker_color = isHover && mapFeatureSettings.isPointInShape ? "#f00" : "#61788c", line_color = "#000", font_color = '#f5f5dc', font_height = 14, zindex = isHover ? 33 : 30, opacity = 1;
        let style = [];
        let verPos = mapFeatureSettings.isPointInShape ? "bottom" : "top";
        let label = (mapFeatureSettings.indexInSequence + 0) + '';
        if (isHover) { label += ' | ' + stopItem.name; }
        style.push({
            marker_verpos: verPos,
            opacity: opacity, marker: true, label: label,
            zindex: zindex, marker_color: marker_color, font_color: font_color,
            font_height: font_height, line_color: line_color, line_width: 1, line_opacity: 50, snaptopixel: false, border_width: 2
        });
        return style;
    };

    const createFeatures = () => {
        if (sseqItem) {
            let shapeGeom = {
                type: 'linestring',
                style: getShapeStyle,
                hoverStyle: getShapeStyle,
                coordinates: sseqItem.shapeCoordinates
            };

            shapeFeature = new tf.map.Feature(shapeGeom);
            layer.AddMapFeature(shapeFeature, true);
            pointInShapeFeatures = [];
            for (let i = 0; i < sseqItem.nstops; ++i) {
                let stopItem = sseqItem.stopsData[i];
                let geom = {
                    type: 'point',
                    indexInSequence: i,
                    stopSequenceItem: sseqItem,
                    stopItem: stopItem,
                    coordinates: [stopItem.lon, stopItem.lat],
                    style: getStopStyle,
                    hoverStyle: getStopStyle
                };
                let pointInShapeGeom = Object.assign({}, geom);
                pointInShapeGeom.isPointInShape = true;
                //let pointAtDistance = tf.js.GetLSPointAtDistanceMeters(sseqItem.shapeCoordinates, sseqItem.shapeDistances, sseqItem.Cdists[i] * 1000);
                //if (pointAtDistance && pointAtDistance.pointCoords) { pointInShapeGeom.coordinates = pointAtDistance.pointCoords; }
                pointInShapeGeom.coordinates = sseqItem.CSPoints[i];
                var stopFeature = new tf.map.Feature(geom);
                var pointInShapeFeature = new tf.map.Feature(pointInShapeGeom);
                pointInShapeFeatures.push(pointInShapeFeature);
                layer.AddMapFeature(stopFeature, true);
                layer.AddMapFeature(pointInShapeFeature, true);
            }

            layer.AddWithheldFeatures();
        }
    };

    const isAllLoaded = () => { return sseqItem && stopsData && shapeData && shapeData.length > 0; };

    const checkAllLoaded = () => {
        if (isAllLoaded()) {
            let shapeCoordinates = polyCode.DecodeLineString(JSON.parse(shapeData[0].cls), 6);
            sseqItem.shapeData = shapeData;
            sseqItem.stopsData = stopsData;
            sseqItem.shapeDistances = tf.js.GetLSVertexDistancesMeters(sseqItem.shapeCoordinates = shapeCoordinates);
            sseqItem.totalShapeDistance = sseqItem.shapeDistances[sseqItem.shapeDistances.length - 1];
            createFeatures();
            if (options.onItemLoaded) { options.onItemLoaded({ sender: theThis, stopsData: stopsData, shapeData: shapeData, sseqItem: sseqItem }); }
        }
    };

    const selectStopFeature = stopMapFeature => {
        if (selectedStopFeature) { selectedStopFeature.SetIsAlwaysInHover(false); selectedStopFeature = undefined; }
        if (selectedStopFeature = stopMapFeature) { selectedStopFeature.SetIsAlwaysInHover(true); }
    };

    const onMapFeatureClick = (notification) => {
        let mapFeature = notification.mapFeature, mapFeatureSettings = mapFeature.GetSettings();
        if (mapFeatureSettings.isPointInShape) { selectStopFeature(mapFeature); }
        else if (mapFeatureSettings.isShapeHitTestFeature) { setSelectedStopFeatureShapeCoords(); }
    };

    const setShapeHitTest = (coord) => {
        if (coord) {
            shapeHitTestFeature.SetPointCoords(coord);
            shapeHitTestFeature.RefreshStyle();
            if (!shapeHitTestFeatureInMap) {
                shapeHitTestFeatureInMap = true;
                layer.AddMapFeature(shapeHitTestFeature);
            }
        }
        else {
            if (shapeHitTestFeatureInMap) {
                shapeHitTestFeatureInMap = false;
                layer.DelMapFeature(shapeHitTestFeature);
            }
        }
    };

    const onMapMouseMove = (notification) => {
        if (shapeFeature) {
            let coords = notification.eventCoords;
            let shapeCoords = shapeFeature.GetGeom().GetCoordinates();
            lastHitTest = tf.helpers.HitTestMapCoordinatesArray(shapeCoords, coords);
            if (lastHitTest.closestPoint) {
                lastHitTest.distanceInShape = tf.js.GetDistanceMetersAtIndexProj(shapeCoords, sseqItem.shapeDistances, lastHitTest.minDistanceIndex, lastHitTest.proj);
            }
            setShapeHitTest(lastHitTest.closestPoint);
        }
    };

    const setSelectedStopFeatureShapeCoords = () => {
        if (selectedStopFeature && lastHitTest && lastHitTest.closestPoint && options.changeDistance) {
            let featureSettings = selectedStopFeature.GetSettings();
            options.changeDistance(sseqItem, featureSettings.indexInSequence, lastHitTest.distanceInShape / 1000);
        }
    };

    const onMapMouseClick = (notification) => {
        if (shapeFeature) {
            setSelectedStopFeatureShapeCoords();
        }
    };

    const getHitTestStyle = (kf, mapFeature) => {
        let isHover = mapFeature.GetIsDisplayingInHover();
        let fill_color = lastHitTest ? (lastHitTest.angle == 0 ? "#aaf" : (lastHitTest.angle == 1 ? "#00f" : "#f00")) : "#000";
        let style = [{
            circle: true, circle_radius: 8, line: true, line_color: "#fff", fill: true, fill_color: fill_color, snaptopixel: false, zindex: 20
        }];
        if (isHover) {
            let markerLabel = '';
            if (lastHitTest && lastHitTest.closestPoint) {
                markerLabel +=
                    'index: ' + lastHitTest.minDistanceIndex +
                    ' | proj: ' + lastHitTest.proj.toFixed(6) +
                    ' | dist: ' + lastHitTest.distanceInShape.toFixed(2);
            }
            style.push({
                marker: true, label: markerLabel, snaptopixel: false, zindex: 35, marker_color: "#ffdead", font_color: "#000", line_color: "#fff", line_opacity: 70
            });
        }
        return style;

    };

    const initialize = () => {
        polyCode = new tf.map.PolyCode();
        let layerSettings = { name: "stopSequences", isVisible: true, isHidden: true, useClusters: false, zIndex: 20 };
        let mapApp = getGlobalMapApp(), content = mapApp.GetContent();
        //content.SetProcessMapClickedLocation(false);
        map = content.GetMap();
        layer = content.CreateCustomMapLayer(layerSettings, false);
        map.AddListener(tf.consts.mapFeatureClickEvent, onMapFeatureClick);
        map.AddListener(tf.consts.mapMouseMoveEvent, onMapMouseMove);
        map.AddListener(tf.consts.mapClickEvent, onMapMouseClick);
        shapeHitTestFeature = new tf.map.Feature({
            type: 'point',
            isShapeHitTestFeature: true,
            coordinates: [0, 0],
            style: getHitTestStyle,
            hoverStyle: getHitTestStyle
        });
        shapeHitTestFeatureInMap = false;
        initialized = true;
    };

    const tryInitialize = () => { if (getGlobalMapApp()) { initialize(); } else { setTimeout(() => { return tryInitialize(); }, 500); } };

    tryInitialize();
};

const StopSequenceItem = ({ item, panTo, changeDistance }) => {
    let marginPx = commonStyles.marginPx;
    let maxScale = 1000, kmToMeter = 1000;
    let thisDistance = maxScale * item.stop_distance_in_shape_km * kmToMeter / item.item.totalShapeDistance;

    let distanceStr = item.stop_distance_in_shape_km == 0 ? "0." : item.stop_distance_in_shape_km + '';

    return (
        <div className="gtfsListItem">
            <label style={{ margin: marginPx }} htmlFor={item.id + 'stop_index'}><small>stop_index</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '16px', fontSize: '110%' }} className="" id={item.id + 'stop_index'}>{item.indexInSequence}</div>
            </label>

            <label style={{ margin: marginPx }} htmlFor={item.id + 'stop_id'}><small>stop_id</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '16px', fontSize: '110%' }} className="" id={item.id + 'stop_id'}>{item.stopItem.id_in_agency}</div>
            </label>

            <label style={{ margin: marginPx }} htmlFor={item.id + 'stop_name'}><small>stop_name</small>
                <input style={{ marginLeft: '10px' }} className="" type="button" onClick={() => { panTo(item) }} id={item.id + 'stop_name'} value={item.stopItem.name} title="Center Map to Stop" />
            </label>

            <label style={{ margin: marginPx }} htmlFor={item.id + 'stop_shape_index'}><small>stop_shape_index</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '16px', fontSize: '110%' }} className="" id={item.id + 'stop_shape_index'}>{item.stop_shape_index}</div>
            </label>

            <label style={{ margin: marginPx }} htmlFor={item.id + 'stop_shape_proj'}><small>stop_shape_proj</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '16px', fontSize: '110%' }} className="" id={item.id + 'stop_shape_proj'}>{item.stop_shape_proj}</div>
            </label>

            <label title="Distance of stop projection in shape" htmlFor={item.id + 'input_stop_distance_in_shape_km'}><small>stop_distance_in_shape_km</small>
                <input style={{ margin: marginPx, width: '80px' }} value={distanceStr} className="" type="text" id={item.id + 'input_stop_distance_in_shape_km'}
                    onChange={(event) => {
                        item.stop_distance_in_shape_km = tf.js.GetFloatNumberInRange(parseFloat(event.target.value), 0, item.item.totalShapeDistance, item.stop_distance_in_shape_km);
                        changeDistance(item.item, item.indexInSequence, item.stop_distance_in_shape_km);
                    }}
                    />
            </label>

            <label style={{ margin: marginPx, width: '360px' }} htmlFor={item.id + 'adjustDistance'}><small>stop_distance_in_shape_km_slider</small>
                <input style={{ marginLeft: '10px' }} className="" type="range"
                    min="0" max={maxScale + ''}
                    onChange={(e) => {
                        item.stop_distance_in_shape_km = (e.target.value / maxScale) * (item.item.totalShapeDistance / kmToMeter);
                        changeDistance(item.item, item.indexInSequence, item.stop_distance_in_shape_km);
                    }}
                    id={item.id + 'adjustDistance'}
                    value={thisDistance} title="Adjust distance in shape" />
            </label>

        </div>
    );
};

const StopSequence = ({ item, sseqInEditor, editSequence, centerSequence, calcSequence, updateSequence, panTo, changeDistance, calcShapeFromStops }) => {
    let marginPx = commonStyles.marginPx;
    let isInEditor = !!sseqInEditor && sseqInEditor.id == item.id;

    let stopSequenceItems = [];
    let displayStr = "none";
    let calcDisplayStr = "none";

    let editOrClose = isInEditor ? "Close" : "Edit";
    let editOrCloseTitle = isInEditor ? "Close editor" : "Edit Stop Sequence";

    let editOrCloseItem = isInEditor ? undefined : item;

    if (isInEditor) {
        if (!item.Csids) {
            console.log('in editor but no Csids?!');
            isInEditor = false;
        }
        if (isInEditor) {
            displayStr = "block";
            calcDisplayStr = "inline-block";
            for (let i = 0; i < item.nstops; ++i) {
                let stopId = item.Csids[i];
                let stopItem = item.stopsData[i];
                let key = item.id + '|' + i + '|' + stopId;
                let seqItem = {
                    id: key,
                    item: item,
                    indexInSequence: i,
                    stop_distance_in_shape_km: item.Cdists[i],
                    stop_shape_index: item.Shape_indices[i],
                    stop_shape_proj: item.Shape_projs[i],
                    stopItem: stopItem
                };
                let stopSequenceItem = (
                    <StopSequenceItem
                        item={seqItem} key={seqItem.id}
                        panTo={panTo}
                        changeDistance={changeDistance}
                    />
                );
                stopSequenceItems.push(stopSequenceItem);
            }
        }
    }

    return (
        <div className="gtfsListItem">

            <label style={{ margin: marginPx }} htmlFor={item.id + 'id'}><small>id</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '16px', fontSize: '110%' }} className="" id={item.id + 'id'}>{item.id}</div>
            </label>

            <label style={{ margin: marginPx }} htmlFor={item.id + 'hsign'}><small>headsign</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '30px', fontSize: '110%' }} className="" id={item.id + 'hsign'}>{item.hsign}</div>
            </label>

            <label style={{ margin: marginPx }} htmlFor={item.id + 'nstops'}><small>nstops</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '30px', fontSize: '110%' }} className="" id={item.id + 'nstops'}>{item.nstops}</div>
            </label>

            <input style={{ margin: marginPx }} type="button" onClick={() => { editSequence(editOrCloseItem) }} value={editOrClose} title={editOrCloseTitle} />

            <input style={{ display: calcDisplayStr, margin: marginPx }} type="button" onClick={() => { centerSequence(item) }} value="Center" title="Center to shape" />

            <input style={{ display: calcDisplayStr, margin: marginPx }} type="button" onClick={() => { calcSequence(item) }} value="Calc Stops" title="Calc Stop Distances" />

            <input style={{ display: calcDisplayStr, margin: marginPx }} type="button" onClick={() => { calcShapeFromStops(item) }} value="Calc Shape" title="Calc Shape from Stops" />

            <input style={{ margin: marginPx }} type="button" onClick={() => { updateSequence(item) }} value="Update" title="Update Stop Sequence" />

            <div style={{ display: displayStr }} className="gtfsList">{stopSequenceItems}</div>

        </div>
    );
};

const StopSequencesList = ({ data, sseqInEditor, editSequence, centerSequence, calcSequence, updateSequence, panTo, changeDistance, calcShapeFromStops }) => {
    const items = data.map((item) => {
        return (<StopSequence item={item} key={item.id}
            sseqInEditor={sseqInEditor}
            editSequence={editSequence}
            updateSequence={updateSequence}
            centerSequence={centerSequence}
            calcSequence={calcSequence}
            panTo={panTo}
            changeDistance={changeDistance}
            calcShapeFromStops={calcShapeFromStops}
        />);
    });
    return (<div style={{ maxHeight: "initial" }} className="gtfsList">{items}</div>);
};

class TransitStopSequences extends React.Component {
    stopSequencesMapFeatures = null;
    transitAgencySelect = null;
    constructor(props) {
        super(props);
        this.emailInputId = "emailInputId";
        this.passwordInputId = "passwordInputId";
        this.stopSequencesMapFeatures = StopSequencesMapFeatures({
            onItemLoaded: this.onStopSequenceLoaded.bind(this),
            changeDistance: this.changeDistance.bind(this),
            onItemChanged: this.onStopSequenceItemChanged.bind(this)
        });
        this.calcShapeCount = 0;
        this.state = {
            data: [],
            sseqInEditor: null
        };
        transitStopSequences = this;
    };
    onDrag = (notification) => {
        return;
    };
    componentDidMount() { /*this.refresh();*/ };
    setStateData(data) { this.state.data = data; this.refreshSetState(); };
    refreshSetState() {
        this.setState(Object.assign({}, this.state));
        this.stopSequencesMapFeatures.RefreshFeatures();
    };
    handleUpdate() { this.refreshSetState(); };
    calcNext(params) {
        let count = params.context.state.data.length;
        //let count = 298;
        if (params.index < count) {
            console.log('calc ' + params.index);
            let item = params.context.state.data[params.index];
            item.params = params;
            params.context.editSequence.call(params.context, item);
        }
        else {
            console.log('nFunny: ' + params.funnyAngles.length);
            console.log(JSON.stringify(params.funnyAngles));
        }
    };
    calcAll() {
        this.editSequence(undefined);
        let startIndex = 0;
        //let startIndex = 298;
        let params = { context: this, index: startIndex, funnyAngles: [] };
        this.calcNext(params);
    };
    encodeItem(item) {
        let polyCode = this.stopSequencesMapFeatures.GetPolycode();
        item.cdists = JSON.stringify(polyCode.EncodeValues(item.Cdists, 6));
        item.cpoints = JSON.stringify(polyCode.EncodeLineString(item.CPoints, 6));
        item.shape_indices = JSON.stringify(polyCode.EncodeValues(item.Shape_indices, 0));
        item.shape_projs = JSON.stringify(polyCode.EncodeValues(item.Shape_projs, 6));
    };
    changeDistance(item, indexInSequence, stop_distance_in_shape_km) {
        console.log('changing distance');
        item.Cdists[indexInSequence] = stop_distance_in_shape_km;
        let pointAtDistance = tf.js.GetLSPointAtDistanceMeters(item.shapeCoordinates, item.shapeDistances, item.Cdists[indexInSequence] * 1000);
        item.Shape_indices[indexInSequence] = pointAtDistance.index;
        item.Shape_projs[indexInSequence] = pointAtDistance.proj;
        this.onStopSequenceItemChanged(item);
    };
    panTo(sseqStopItem) {
        this.stopSequencesMapFeatures.PanTo(sseqStopItem);
        this.stopSequencesMapFeatures.SelectStopFeature(sseqStopItem.indexInSequence);
    };
    setSseqInEditor(sseqInEditor) {
        this.state.sseqInEditor = sseqInEditor;
        this.refreshSetState();
    };
    onStopSequenceItemChanged(item) {
        this.encodeItem(item);
        this.handleUpdate();
    };
    onStopSequenceLoaded(notification) {
        if (notification.sseqItem.params) {
            let params = notification.sseqItem.params;
            params.context.setSseqInEditor.call(params.context, notification.sseqItem);
            delete notification.sseqItem.params;
            let calcResult = params.context.calcSequence.call(params.context, notification.sseqItem);
            if (calcResult && calcResult.funnyAngles && calcResult.funnyAngles.length > 0) {
                params.funnyAngles.push({ id: notification.sseqItem.id, funnyAngles: calcResult.funnyAngles });
            }
            ++params.index;
            params.context.calcNext.call(params.context, params);
        }
        else {
            this.setSseqInEditor(notification.sseqItem);
        }
    };
    editSequence(item) {
        if (item && item.params) {
            item.params.context.stopSequencesMapFeatures.Edit(item, item.params.context.transitAgencySelect.state.selectedAgency);
        }
        else {
            let newSequence = item != this.state.sseqInEditor;
            this.setSseqInEditor(null);
            if (newSequence) {
                this.stopSequencesMapFeatures.Edit(item, this.transitAgencySelect.state.selectedAgency);
            }
        }
    };
    onPartialShapeRouted(notification) {
        let requestProps = notification.requestProps;
        if (requestProps && requestProps.calcShapeCount == this.calcShapeCount) {
            if (notification.status == 0 && tf.js.GetIsNonEmptyArray(notification.route_geometry)) {
                this.shapePiecesRoutedPoly[requestProps.iCall] = notification.route_geometry;
                if (++this.nShapePiecesRouted == requestProps.nCalls) {
                    let allPoly = [];
                    for (let i = 0; i < requestProps.nCalls; ++i) {
                        Array.prototype.push.apply(allPoly, this.shapePiecesRoutedPoly[i]);
                    }
                    this.stopSequencesMapFeatures.SendLineStringToEditor(allPoly);
                }
            }
        }
    };
    calcShapeFromStops(item) {
        if (this.state.sseqInEditor == item) {
            let totalStops = item.nstops;
            let maxStopsAtOnce = 25;
            let nCalls = Math.floor(totalStops / maxStopsAtOnce);
            let calcShapeCount = ++this.calcShapeCount;
            if (totalStops % maxStopsAtOnce != 0) { ++nCalls; }
            this.nShapePiecesRouted = 0;
            this.shapePiecesRoutedPoly = [];
            for (let iStopIndex = 0, iCall = 0; iStopIndex < totalStops; iStopIndex += maxStopsAtOnce, ++iCall) {
                let coords = [];
                for (let i = 0; i < maxStopsAtOnce && i + iStopIndex < totalStops; ++i) {
                    let stopItem = item.stopsData[i + iStopIndex];
                    coords.push([stopItem.lon, stopItem.lat]);
                }
                new tf.services.Routing({
                    findAlternatives: false, level: 14, lineStringCoords: coords,
                    mode: tf.consts.routingServiceModeCar, optionalScope: this, instructions: false,
                    callBack: this.onPartialShapeRouted.bind(this), requestProps: { calcShapeCount: calcShapeCount, item: item, iStopIndex: iStopIndex, nCalls: nCalls, iCall: iCall }
                });
            }
        }
    };
    calcSequence(item) {
        if (this.state.sseqInEditor == item) {
            return this.stopSequencesMapFeatures.CalcSequence();
        }
    };
    centerSequence(item) {
        if (this.state.sseqInEditor == item) {
            this.stopSequencesMapFeatures.CenterOnMap();
        }
    };
    extractEmailPassword() {
        this.state.authForm.email = document.getElementById(this.emailInputId).value;
        this.state.authForm.password = document.getElementById(this.passwordInputId).value;
        this.refreshSetState();
    };
    updateSequence(item) {
        //console.log('updating sequence');
        let endpoint = 'stopseq?agency=' + this.transitAgencySelect.state.selectedAgency;
        endpoint += '&email=' + this.state.email;
        endpoint += '&password=' + this.state.password;
        endpoint += '&id=' + item.id;
        endpoint += '&dists=' + item.cdists;
        endpoint += '&points=' + item.cpoints;
        endpoint += '&indices=' + item.shape_indices;
        endpoint += '&projs=' + item.shape_projs;
        //console.log(endpoint);
        return axios.put(TransitAPI + endpoint, undefined)
            .then((res) => {
                //console.log('updated');
            }).catch(err => {
                console.log(err.message);
            });
    };
    onAgencyFirstRefresh() {
        //console.log('agencies initialized, starting first stop sequences refresh...');
        this.refresh();
    };
    onAgencyChange() {
        //console.log('agency changed');
        this.setSseqInEditor(null);
        this.stopSequencesMapFeatures.Edit(undefined);
        this.refresh();
    };
    refresh() {
        if (this.transitAgencySelect.state.isError) {
            this.transitAgencySelect.state.firstRefresh = true;
            this.transitAgencySelect.refreshAgencies();
        }
        else if (!this.transitAgencySelect.state.firstRefresh) {
            this.editSequence(undefined);
            let endpoint = 'stopseqs?agency=' + this.transitAgencySelect.state.selectedAgency;
            return axios.get(TransitAPI + endpoint).then((res) => {
                if (res.data) {
                    res.data.sort((a, b) => { return a.id - b.id; });
                    this.setStateData(res.data);
                }
            }).catch(err => {
                console.log(err.message);
            });
        }
    };
    render() {
        return (
            <div>
                <Title title="StopSequences" count={this.state.data.length} />
                <TransitAgencySelect
                    acceptStage={true}
                    acceptNoPost={true}
                    onChange={this.onAgencyChange.bind(this)}
                    onFirstRefresh={this.onAgencyFirstRefresh.bind(this)}
                    ref={node => { this.transitAgencySelect = node; }} />
                <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                <BarButton value="Calc All" title="Calc Distances for All Sequences" onClick={this.calcAll.bind(this)} />
                <StopSequencesList
                    sseqInEditor={this.state.sseqInEditor}
                    data={this.state.data}
                    editSequence={this.editSequence.bind(this)}
                    updateSequence={this.updateSequence.bind(this)}
                    calcSequence={this.calcSequence.bind(this)}
                    centerSequence={this.centerSequence.bind(this)}
                    panTo={this.panTo.bind(this)}
                    changeDistance={this.changeDistance.bind(this)}
                    calcShapeFromStops={this.calcShapeFromStops.bind(this)}
                />
            </div>
        );
    };
};
