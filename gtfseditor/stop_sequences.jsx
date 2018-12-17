"use strict";

const StopSequencesMapFeatures = function (options) {
    let theThis = this; if (!(theThis instanceof StopSequencesMapFeatures)) { return new StopSequencesMapFeatures(options); }
    let map, layer;
    let mapFeatures, lastDragged;

    this.SetVisible = (bool) => { if (layer) { layer.SetVisible(bool); } return theThis.GetVisible(); };
    this.GetVisible = () => { return layer ? layer.GetIsVisible() : true };

    this.PanTo = (item, index) => {
        let mapFeature = theThis.GetStopFeature(item, index);
        if (mapFeature) { map.AnimatedSetCenterIfDestVisible(mapFeature.GetPointCoords()); }
    };

    this.GetStopFeature = (item, index) => {
        let mf = mapFeatures[item.id];
        if (mf) { return mf.stopFeatures[index]; }
    };

    this.UpdateItemVisible = (item) => {
        if (layer && item) {
            let mf = mapFeatures[item.id];
            if (mf) {
                if (mf.visible != item.visible) {
                    mf.visible = item.visible;
                    for (let i in mf.stopFeatures) {
                        let mfsi = mf.stopFeatures[i];
                        if (mf.visible) { layer.AddMapFeature(mfsi); }
                        else { layer.DelMapFeature(mfsi); }
                    }
                }
            }
        }
    };

    this.Update = (data) => {
        const onDragged = notification => {
            if (options.onDrag) {
                if (lastDragged == undefined && notification.mapFeatureToDrag) { lastDragged = notification.mapFeatureToDrag; }
                options.onDrag({ sender: theThis, notification: notification, lastDragged: lastDragged });
                if (!notification) { lastDragged = undefined; }
            }
        };
        const getStopStyle = (kf, mapFeature) => {
            var isHover = mapFeature.GetIsDisplayingInHover(), mapFeatureSettings = mapFeature.GetSettings(), stopData = mapFeatureSettings.stopInSequenceData;
            var marker_color = "#61788c", line_color = "#000", font_color = '#f5f5dc', font_height = isHover ? 12 : 10, zindex = isHover ? 3 : 1, opacity = 1;
            var style = [/*{
                shape: true, shape_radius: 6, shape_points: 5, fill: true, fill_color: "#fff", line: true, line_color: "#000", snaptopixel: false, fill_opacity: 90, line_opacity: 90
            }*/];
            var minsStr = (mapFeatureSettings.stopId.offset_seconds / 60).toFixed(1);
            style.push({
                marker_verpos: "bottom",
                opacity: opacity, marker: true, label: (mapFeatureSettings.indexInSequence + 1) + ' | ' +
                    minsStr + ' mins'
                , zindex: zindex, marker_color: marker_color, font_color: font_color,
                font_height: font_height, line_color: line_color, line_width: 1, line_opacity: 50, snaptopixel: false, border_width: 2
            });
            return style;
        };
        if (layer) {
            layer.RemoveAllFeatures();
            mapFeatures = {};
            for (var i in data) {
                let d = data[i];
                let stopFeatures = [];
                let nStopIds = d.stop_ids.length;
                let visible = d.visible;
                for (var j = 0; j < nStopIds; ++j) {
                    let stopId = d.stop_ids[j];
                    let actualStopId = stopId.stop_id;
                    let stopItem = gtfsStops.getStopItemForId(actualStopId);
                    let geom = {
                        indexInSequence: j,
                        stopSequenceItem: d,
                        stopInSequenceData: stopItem,
                        stopId: stopId,
                        type: 'point',
                        coordinates: [stopItem.stop_lon, stopItem.stop_lat],
                        style: getStopStyle,
                        hoverStyle: getStopStyle,
                        onDragged: onDragged
                    };
                    var mapFeature = new tf.map.Feature(geom);
                    if (visible) { layer.AddMapFeature(mapFeature, true); }
                    stopFeatures.push(mapFeature);
                }
                mapFeatures[d.id] = { stopFeatures, item: d, visible };
            }
            layer.AddWithheldFeatures();
        }
        else { setTimeout(() => { theThis.Update(data); }, 500); }
    };

    const onMapFeatureClick = (notification) => {
        let mapFeature = notification.mapFeature;
        let stopInSequenceData = mapFeature.GetSettings().stopInSequenceData;
        if (stopInSequenceData) {
            mapFeature.SetIsAlwaysInHover(!mapFeature.GetIsAlwaysInHover());
            mapFeature.RefreshStyle();
        }
    };

    const initialize = () => {
        let layerSettings = { name: "stopSequences", isVisible: true, isHidden: true, useClusters: false, zIndex: 20 };
        let mapApp = getGlobalMapApp(), content = mapApp.GetContent();
        map = content.GetMap();
        layer = content.CreateCustomMapLayer(layerSettings, false);
        map.AddListener(tf.consts.mapFeatureClickEvent, onMapFeatureClick);
    };

    const tryInitialize = () => { if (getGlobalMapApp()) { initialize(); } else { setTimeout(() => { return tryInitialize(); }, 500); } };

    tryInitialize();
};

const StopSequenceItem = ({ item, moveItemUp, moveItemDown, removeItem, panTo, updateItem, changeItem }) => {
    let marginPx = commonStyles.marginPx;
    let nameId = item.id + 'name';
    let secondsId = item.id + 'seconds';
    let metersId = item.id + 'meters';
    let panToId = item.id + 'panTo';
    let sequenceIndexId = item.id + 'sequenceIndexId';

    let sseqItem = item.item.stop_ids[item.index];

    let sequenceIndex = item.index + 1;

    return (
        <div className="gtfsListItem">

            <label style={{ margin: marginPx }} htmlFor={sequenceIndexId}><small>sequence_index</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '30px', fontSize: '110%' }} className="" id={sequenceIndexId}>{sequenceIndex}</div>
            </label>

            <input style={{ marginLeft: '10px' }} className="" type="button" onClick={() => { moveItemUp(item) }} value="Up" title="Move Up!" />
            <input style={{ marginLeft: '10px' }} className="" type="button" onClick={() => { moveItemDown(item) }} value="Down" title="Move Down!" />

            <label htmlFor={nameId} style={{ margin: marginPx }}><small>stop name</small>
                <input style={{ marginLeft: '10px' }} className="" type="button" onClick={() => { panTo(item) }} id={nameId} value={item.stop_name} title="Center Map to Stop" />
            </label>

            <label htmlFor={secondsId} style={{ margin: marginPx }}><small>offset_seconds</small>
                <input style={{ margin: marginPx, width: '40px' }} value={sseqItem.offset_seconds} className="" type="text" id={secondsId}
                    onBlur={() => { if (item.item._needChange) { delete item.item._needChange; changeItem(item); } }}
                    onChange={(event) => {
                        let newOffset = tf.js.GetNonNegativeIntFrom(parseInt(event.target.value, 10), 0);
                        if (sseqItem.offset_seconds != newOffset) { item.item._needChange = true; sseqItem.offset_seconds = newOffset; updateItem(item); }
                    }} />
            </label>

            <label htmlFor={metersId} style={{ margin: marginPx }}><small>offset_meters</small>
                <input style={{ margin: marginPx, width: '40px' }} value={sseqItem.offset_meters} className="" type="text" id={metersId}
                    onBlur={() => { if (item.item._needChange) { delete item.item._needChange; changeItem(item); } }}
                    onChange={(event) => {
                        let newOffsetMeters = tf.js.GetNonNegativeIntFrom(parseInt(event.target.value, 10), 0);
                        if (sseqItem.offset_meters != newOffsetMeters) { item.item._needChange = true; sseqItem.offset_meters = newOffsetMeters; updateItem(item); }
                    }} />
            </label>

            <input className="delButton" type="button" onClick={() => { removeItem(item) }} value="Del" title="Delete without confirmation!" />
        </div>
    );
};

const StopSequence = ({ item, addStop, change, remove, update, moveItemUp, moveItemDown, removeItem, panTo, updateItem, changeItem, changeShape, calcShape }) => {
    let marginPx = commonStyles.marginPx;
    let nameId = item.id + 'sseq_name';
    let visibleId = item.id + 'visible';
    let expandedId = item.id + 'expanded';
    let stopIds = item.stop_ids;
    let stopNamesAndIds = [];

    if (tf.js.GetIsNonEmptyArray(stopIds)) {
        let len = stopIds.length;
        for (let i = 0; i < len; ++i) {
            let stopId = stopIds[i];
            stopNamesAndIds.push({
                stop_name: gtfsStops.getStopNameForId(stopId.stop_id), stopId: stopId, item: item, id: item.id + '|' + i, index: i
            });
        }
    }

    const stopSequenceItems = stopNamesAndIds.map((seqItem) => {
        return (<StopSequenceItem
            item={seqItem} key={seqItem.id} moveItemUp={moveItemUp} moveItemDown={moveItemDown} removeItem={removeItem} panTo={panTo}
            updateItem={updateItem} changeItem={changeItem}
            changeShape={changeShape}
        />);
    });

    let expandedStr = "list expanded?";
    let displayStr = item.listExpanded ? "block" : "none";

    return (
        <div className="gtfsListItem">

            <label htmlFor={visibleId} style={{ margin: marginPx }} title="Show or hide this Stop Sequence on the map" ><small>visible</small>
                <input style={{ marginLeft: '10px' }} className="" type="checkbox" id={visibleId}
                    onChange={() => {
                    item.visible = !item.visible; delete item._needChange; change(item);
                }} checked={item.visible} />
            </label>

            <label htmlFor={expandedId} style={{ margin: marginPx }} title="Show or hide list of stops in sequence" ><small>{expandedStr}</small>
                <input style={{ marginLeft: '10px' }} className="" type="checkbox" id={expandedId} onChange={() => {
                    item.listExpanded = !item.listExpanded; delete item._needChange; change(item);
                }} checked={item.listExpanded} />
            </label>

            <label title="Used to link this Stop Sequence to other objects, like Trips" htmlFor={nameId} style={{ margin: marginPx }}><small>sequence_name</small>
            <input style={{ margin: marginPx, width: '90px' }} value={item.sseq_name} className="" type="text" id={nameId}
                onBlur={() => { if (item._needChange) { delete item._needChange; change(item); } }}
                    onChange={(event) => { if (item.sseq_name != event.target.value) { item._needChange = true; item.sseq_name = event.target.value; update(); } }} />
            </label>

            <label title="Click to change the Shape associated with this Stop Sequence" htmlFor={item.id + 'shape_name'} style={{ margin: marginPx }}><small>shape_name</small>
                <input style={{ marginLeft: '10px' }} className="" type="button" onClick={() => { changeShape(item) }} id={item.id + 'shape_name'} value={item.shape_name}  />
            </label>

            <input title="Add a new stop at the end of this Stop Sequence"
                style={{ marginLeft: '10px' }} className="" type="button" onClick={() => { addStop(item) }} value="Add Stop" />

            <input title="Re-calculate Shape based on Stop locations"
                style={{ marginLeft: '10px' }} className="" type="button" onClick={() => { calcShape(item) }} value="Calc Shape" />

            <input className="delButton" type="button" onClick={() => { remove(item.id) }} value="Del" title="Delete without confirmation!" />

            <div style={{ display: displayStr }} className="gtfsList">{stopSequenceItems}</div>

        </div>
    );
};

const StopSequencesList = ({ data, addStop, change, remove, update, moveItemUp, moveItemDown, removeItem, panTo, updateItem, changeItem, changeShape, calcShape }) => {
    const items = data.map((item) => {
        return (<StopSequence item={item} key={item.id} addStop={addStop} remove={remove} change={change} update={update}
            moveItemUp={moveItemUp} moveItemDown={moveItemDown} removeItem={removeItem} panTo={panTo}
            updateItem={updateItem} changeItem={changeItem} changeShape={changeShape} calcShape={calcShape}
        />);
    });
    return (<div className="gtfsList">{items}</div>);
};

class GTFSStopSequences extends React.Component {
    stopSequencesMapFeatures = null;
    shapeNameSelect = null;
    stopNameSelect = null;
    constructor(props) {
        super(props);
        this.stopSequencesMapFeatures = StopSequencesMapFeatures({ onDrag: this.onDrag });
        this.state = { data: [], stopSequencesVisible: true, averageStopDwellTimeInSeconds: 30, timeMultiplier: 1 };
        this.JSONInputId = "stopSequencesJSONInput";
        this.crudClient = tf.services.CRUDClient({ tableName: this.makeTableName(globalAgencyPrefix), serverURL: CRUDAPI, authForm: gtfsLogin.getAuthForm() });
        gtfsStopSequences = this;
    };

    makeTableName(agencyPrefix) { return getGTFSTableName(agencyPrefix, "stop_sequences"); }
    getJSON() { return JSON.stringify(this.state.data); };
    dump() { document.getElementById(this.JSONInputId).value = this.getJSON(); };

    updateTableWithJSON(overridePrefix) { return this.doUpdateTableWithJSON(this.getJSON(), overridePrefix); }
    doUpdateTableWithJSON(value, overridePrefix) {
        if (tf.js.GetIsNonEmptyString(value)) {
            try {
                value = JSON.parse(value);
                if (tf.js.GetIsNonEmptyArray(value)) {
                    this.crudClient.Put(notification => {
                        if (!(notification && notification.ok)) {
                            console.log(notification.message);
                        }
                        this.refresh();
                    }, value, this.makeTableName(tf.js.GetNonEmptyString(overridePrefix, globalAgencyPrefix)));
                }
            }
            catch (e) { console.log(e.message); }
        }
    };
    updateFromJSON(value) { return this.doUpdateTableWithJSON(value, undefined); };


    getIdForStopSequenceName(sseq_name) { for (let i in this.state.data) { let d = this.state.data[i]; if (d.sseq_name == sseq_name) { return d.id; } } };
    getStopSequenceNameForId(id) { for (let i in this.state.data) { let d = this.state.data[i]; if (d.id == id) { return d.sseq_name; } } };
    getStopSequenceItemForId(id) { for (let i in this.state.data) { let d = this.state.data[i]; if (d.id == id) { return d; } } };

    onDrag = (notification) => {
        return;
        /*let mf = notification.lastDragged;
        let stop = mf.GetSettings().stopInSequenceData;
        if (notification.notification) {
            let coords = mf.GetPointCoords();
            stop.stop_lon = coords[0];
            stop.stop_lat = coords[1];
            this.setState({ data: this.state.data });
        }
        else { this.handleChange(stop); }*/
    };
    componentDidMount() { this.refresh(); };
    setStateData(data) {
        this.state.data = data;
        this.refreshSetState();
    };
    notifyTrips() {
        if (gtfsTrips === undefined) { ReactDOM.render(<GTFSTrips />, document.getElementById('tripsContainer')); }
        else { gtfsTrips.onStopSequencesChanged(); }
    };
    refreshSetState() {
        this.setState(Object.assign({}, this.state));
        this.stopSequencesMapFeatures.Update(this.state.data);
        this.notifyTrips();
    };
    onStopsChangedOngoing() {
        this.refresh();
        return;
    };
    onStopsChanged() {
        if (this.stopNameSelect) { this.stopNameSelect.handleUpdate(); }
        this.onStopsChangedOngoing();
    };
    onShapesChanged() {
        if (this.shapeNameSelect) { this.shapeNameSelect.handleUpdate(); }
        this.refreshShapeNames(this.state.data);
        this.refreshSetState();
    };
    handleUpdate() { this.refreshSetState(); };
    show() {
        this.state.stopSequencesVisible = this.stopSequencesMapFeatures.SetVisible(!this.stopSequencesMapFeatures.GetVisible());
        this.refreshSetState();
    };
    render() {
        let marginPx = commonStyles.marginPx;
        return (
            <div className="gtfsList">
                <Title title="StopSequences" count={this.state.data.length} />

                <label htmlFor="StopSequencesVisibleId" style={{ margin: marginPx }} title="Show or hide Stop Sequences on the map" ><small>visible</small>
                    <input style={{ marginLeft: '10px' }} className="" type="checkbox" id="StopSequencesVisibleId"
                        onChange={() => { this.show(); }} checked={ this.state.stopSequencesVisible } />
                </label>

                <label title="Used to scale travel time between stops" htmlFor={"StopSequencesTimeMultiplierId"} style={{ margin: marginPx }}><small>time_multiplier</small>
                    <input style={{ margin: marginPx, width: '40px' }} value={this.state.timeMultiplier} className="" type="text" id={"StopSequencesTimeMultiplierId"}
                        onBlur={() => {
                            //this.refreshSetState();
                        }}
                        onChange={(event) => {
                            this.state.timeMultiplier = tf.js.GetFloatNumberInRange(parseFloat(event.target.value), 0.1, 5, 1);
                            this.handleUpdate();
                        }} />
                </label>

                <label title="Average Stop dwell time in seconds" htmlFor={"StopSequencesStopDwellTime"} style={{ margin: marginPx }}><small>average_stop</small>
                    <input style={{ margin: marginPx, width: '40px' }} value={this.state.averageStopDwellTimeInSeconds} className="" type="text" id={"StopSequencesStopDwellTime"}
                        onBlur={() => {
                            //this.refreshSetState();
                        }}
                        onChange={(event) => {
                            this.state.averageStopDwellTimeInSeconds = tf.js.GetNonNegativeIntFrom(parseInt(event.target.value, 10), 0);
                            this.handleUpdate();
                        }} />
                </label>

                <BarButton value="Add" title="Add new stopSequence" onClick={this.addItem.bind(this)} />
                <GTFSShapeSelect ref={node => { this.shapeNameSelect = node; }} />
                <GTFSStopSelect ref={node => { this.stopNameSelect = node; }} />
                <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                <BarButton value="Clear" title="Clear List" onClick={this.clear.bind(this)} />
                <BarButton value="Dump" title="Dump List in JSON format" onClick={this.dump.bind(this)} />
                <p></p>
                <SingleLineInputForm
                    inputId={this.JSONInputId}
                    inputLabel="Type or paste JSON and press enter to replace list"
                    sendSubmitValue={this.updateFromJSON.bind(this)}
                />
                <StopSequencesList
                    data={this.state.data}
                    addStop={this.addStop.bind(this)}
                    remove={this.handleRemove.bind(this)}
                    change={this.handleChange.bind(this)}
                    update={this.handleUpdate.bind(this)}
                    moveItemUp={this.moveItemUp.bind(this)}
                    moveItemDown={this.moveItemDown.bind(this)}
                    removeItem={this.removeItem.bind(this)}
                    panTo={this.panTo.bind(this)}
                    updateItem={this.updateItem.bind(this)}
                    changeItem={this.changeItem.bind(this)}
                    changeShape={this.changeShape.bind(this)}
                    calcShape={this.calcShape.bind(this)}
                />
            </div>
        );
    };
    addStop(item) {
        item.stop_ids.push({
            offset_seconds: 0,
            offset_meters: 0,
            stop_id: this.stopNameSelect.state.selectedId
        });
        this.handleChange(item);
    };
    panTo(stopSequenceItem) {
        let nowIndex = stopSequenceItem.index;
        if (nowIndex >= 0 && nowIndex < stopSequenceItem.item.stop_ids.length) {
            gtfsStops.handlePan(gtfsStops.getStopItemForId(stopSequenceItem.item.stop_ids[nowIndex].stop_id));
        }
    };
    moveItemUp(stopSequenceItem) {
        let nowIndex = stopSequenceItem.index;
        if (nowIndex > 0) {
            let savedIndex = stopSequenceItem.item.stop_ids[nowIndex];
            stopSequenceItem.item.stop_ids.splice(nowIndex - 1, 0, savedIndex);
            stopSequenceItem.item.stop_ids.splice(nowIndex + 1, 1);
            this.handleChange(stopSequenceItem.item);
        }
    };
    moveItemDown(stopSequenceItem) {
        let nowIndex = stopSequenceItem.index;
        if (nowIndex < stopSequenceItem.item.stop_ids.length - 1) {
            let savedIndex = stopSequenceItem.item.stop_ids[nowIndex];
            stopSequenceItem.item.stop_ids.splice(nowIndex, 1);
            stopSequenceItem.item.stop_ids.splice(nowIndex + 1, 0, savedIndex);
            this.handleChange(stopSequenceItem.item);
        }
    };
    removeItem(stopSequenceItem) {
        let nowIndex = stopSequenceItem.index;
        if (nowIndex >= 0 && nowIndex < stopSequenceItem.item.stop_ids.length) {
            stopSequenceItem.item.stop_ids.splice(nowIndex, 1);
            this.handleChange(stopSequenceItem.item);
        }
    };
    updateItem(stopSequenceItem) {
        this.handleUpdate();
    };
    changeItem(stopSequenceItem) {
        this.handleChange(stopSequenceItem.item);
    };
    refreshShapeNames(data) {
        for (let i in data) {
            let di = data[i], shape_name = gtfsShapes.getShapeNameForId(di.shape_id);
            if (shape_name) {
                di.shape_name = shape_name;
                let nStops = di.stop_ids.length;
                for (let iStopIndex = 0; iStopIndex < nStops; ++iStopIndex) {
                    if (di.stop_ids[iStopIndex].offset_seconds == undefined) {
                        if (di.stop_ids[iStopIndex].offset_minutes != undefined) {
                            di.stop_ids[iStopIndex].offset_seconds = di.stop_ids[iStopIndex].offset_minutes * 60;
                            delete di.stop_ids[iStopIndex].offset_minutes;
                        }
                        else {
                            di.stop_ids[iStopIndex].offset_seconds = 0;
                        }
                    }
                }
            }
            else { delete data[i]; }
        }
    };
    refresh() {
        this.crudClient.Get(notification => {
            if (notification && notification.ok) {
                this.setStateData(notification.data);
            }
            else {
                this.setStateData([]);
                console.log(notification.message);
            }
        });
    };
    clear() {
        this.crudClient.Del(notification => {
            if (!(notification && notification.ok)) {
                console.log(notification.message);
            }
            this.refresh();
        });
    }
    addItem() {
        if (this.shapeNameSelect.selectedId) {
            let stopId = this.stopNameSelect.selectedId;
            let stopIds = stopId ? [stopId] : [];
            const record = {
                sseq_name: "1",
                visible: true,
                listExpanded: false,
                shape_id: this.shapeNameSelect.selectedId,
                shape_name: gtfsShapes.getShapeNameForId(this.shapeNameSelect.selectedId),
                stop_ids: stopIds
            };
            this.crudClient.Post(notification => {
                if (notification && notification.ok) {
                    Array.prototype.push.apply(this.state.data, notification.data);
                    this.refreshSetState();
                }
                else {
                    console.log(notification.message);
                    this.refresh();
                }
            }, record);
        }
    };
    handleRemove(id) {
        const remainder = this.state.data.filter((item) => { if (item.id !== id) return item; });
        this.crudClient.Del(notification => {
            if (notification && notification.ok) {
                this.setStateData(remainder);
            }
            else {
                console.log(notification.message);
                this.refresh();
            }
        }, id);
    };
    onShapeFromStopsLoaded(notification) {
        if (notification.coordinates) {
            let item = notification.options.item, nStops = item.stop_ids.length;
            let totalDistanceMeters = 0, totalTimeSeconds = 0;
            item.stop_ids[0].offset_seconds = 0;//this.state.averageStopDwellTimeInSeconds;
            item.stop_ids[0].offset_meters = 0;
            for (let i = 1, j = 0; i < nStops; ++i, ++j) {
                let itemStopIdsI = item.stop_ids[i], stop = gtfsStops.getStopItemForId(itemStopIdsI.stop_id);
                if (stop) {
                    let thisTimeInSeconds = notification.times_in_seconds[j] * this.state.timeMultiplier;
                    totalDistanceMeters += notification.distances_in_meters[j];
                    totalTimeSeconds += thisTimeInSeconds + this.state.averageStopDwellTimeInSeconds;
                    itemStopIdsI.offset_meters = totalDistanceMeters;
                    itemStopIdsI.offset_seconds = totalTimeSeconds;
                }
            }
            gtfsShapes.sendLineStringToEditor(notification.coordinates);
            notification.options.theThis.handleChange(item);
        }
    };
    calcShape(item) {
        let coords = [], nStops = item.stop_ids.length;
        for (let i = 0; i < nStops; ++i) {
            let stop = gtfsStops.getStopItemForId(item.stop_ids[i].stop_id);
            if (stop) { coords.push([stop.stop_lon, stop.stop_lat]); }
        }
        new GetDirectionShapeFromCoords2By2({ callback: this.onShapeFromStopsLoaded.bind(this), coordinates: coords, isClosed: false, item: item, theThis: this });
    };
    changeShape(item) {
        item.shape_name = gtfsShapes.getShapeNameForId(this.shapeNameSelect.selectedId);
        item.shape_id = this.shapeNameSelect.selectedId;
        this.handleChange(item);
    };
    handleChange(item) {
        this.crudClient.Put(notification => {
            if (notification && notification.ok) {
                this.refreshSetState();
            }
            else {
                console.log(notification.message);
                this.refresh();
            }
        }, item);
    };
};

class GTFSStopSequenceSelect extends React.Component {
    constructor(props) { super(props); this.state = { data: [], listProps: null, selectedId: null }; this.fillListProps(); };
    componentDidMount() { };
    handleUpdate() { this.selectedId = undefined; this.internalHandleUpdate(); };
    refreshSetState() {
        //this.setState({ data: this.state.data, listProps: this.state.listProps, selectedId: this.state.selectedId });
        this.setState(Object.assign({}, this.state));
    }
    internalHandleUpdate() { this.fillListProps(); this.refreshSetState(); };
    render() { return (<ListSelect props={this.state.listProps} />); };
    fillListProps() {
        let options = [], index = 0;
        for (let i in gtfsStopSequences.state.data) {
            let d = gtfsStopSequences.state.data[i], stopSequence_name = d.sseq_name;
            options.push({ key: index, value: d.id, text: stopSequence_name });
            ++index;
        }
        if (this.state.selectedId == undefined) {
            if (options.length) { this.state.selectedId = options[0].value; }
            else { this.state.selectedId = undefined; }
        }
        this.state.listProps = {
            name: 'stopSequenceSelect', title: 'Select the name of a StopSequence',
            handleChange: (e) => { this.state.selectedId = e.target.value; this.internalHandleUpdate(); },
            value: this.state.selectedId, options: options
        };
    };
};
