"use strict";

const StopsMapFeatures = function (options) {
    let theThis = this; if (!(theThis instanceof StopsMapFeatures)) { return new StopsMapFeatures(options); }
    let map, layer;
    let mapFeatures, lastDragged;

    this.SetVisible = (bool) => { if (layer) { layer.SetVisible(bool); } return theThis.GetVisible() };
    this.GetVisible = () => { return layer ? layer.GetIsVisible() : true };

    this.PanTo = stop => {
        let mapFeature = theThis.GetMapFeature(stop.stop_name);
        if (mapFeature) {
            map.AnimatedSetCenterIfDestVisible(mapFeature.GetPointCoords());
        }
    };

    this.GetMapFeature = (stopName) => { return mapFeatures[stopName]; }

    this.RefreshMapFeatureStyle = stopName => {
        let mf = theThis.GetMapFeature(stopName);
        if (mf) { mf.RefreshStyle(); }
    };

    this.Update = (data) => {

        const canDrag = notification => {
            //notification.mapFeature
            if (options.canDrag) {
                return options.canDrag(notification);
            }
            return true;
        };

        const onDragged = notification => {
            if (options.onDrag) {
                if (lastDragged == undefined && notification.mapFeatureToDrag) { lastDragged = notification.mapFeatureToDrag; }
                options.onDrag({ sender: theThis, notification: notification, lastDragged: lastDragged });
                if (!notification) {
                    lastDragged = undefined;
                }
            }
        };

        const getStopStyle = (kf, mapFeature) => {
            var isHover = mapFeature.GetIsDisplayingInHover();
            var stopData = mapFeature.GetSettings().stopData;
            var marker_color = stopData.isWayPoint ? "#c00" : "#61788c";
            var line_color = "#000";
            var font_color = '#f5f5dc';
            var font_height = 11;
            var zindex = isHover ? 3 : 1;
            var opacity = 1;
            var style = [{
                circle: true, circle_radius: 8, fill: true, fill_color: marker_color, line: true, line_color: "#ff0", snaptopixel: false, fill_opacity: 70, line_opacity: 90
            }];
            if (isHover) {
                style.push({
                    opacity: opacity, marker: true, label: stopData.stop_name, zindex: zindex, marker_color: marker_color, font_color: font_color,
                    font_height: font_height, line_color: line_color, line_width: 1, line_opacity: 50, snaptopixel: false, border_width: 2
                });
            }
            return style;
        };

        if (layer) {
            //console.log('updating stops');
            layer.RemoveAllFeatures();
            mapFeatures = {};
            for (var i in data) {
                let d = data[i];
                let geom = {
                    onDragged: onDragged,
                    canDrag: canDrag,
                    stopData: d,
                    type: 'point',
                    coordinates: [d.stop_lon, d.stop_lat],
                    style: getStopStyle,
                    hoverStyle: getStopStyle
                };
                var mapFeature = new tf.map.Feature(geom);
                layer.AddMapFeature(mapFeature, true);
                mapFeatures[d.stop_name] = mapFeature;
            }
            layer.AddWithheldFeatures();
        }
        else {
            //console.log('stops update deferred...');
            setTimeout(() => { theThis.Update(data); }, 500);
        }
    };

    const onMapFeatureClick = (notification) => {
        let mapFeature = notification.mapFeature;
        let stopData = mapFeature.GetSettings().stopData;
        if (stopData) {
            mapFeature.SetIsAlwaysInHover(!mapFeature.GetIsAlwaysInHover());
            mapFeature.RefreshStyle();
        }
    };

    const initialize = () => {
        let layerSettings = {
            name: "stops", isVisible: true, isHidden: true,
            useClusters: false,
            /*clusterFeatureDistance: settings.clusterFeatureDistance,
            clusterStyle: settings.clusterStyle,
            clusterLabelStyle: settings.clusterLabelStyle,*/
            zIndex: 10
        };

        let mapApp = getGlobalMapApp();
        let content = mapApp.GetContent();
        map = content.GetMap();
        layer = content.CreateCustomMapLayer(layerSettings, false);
        map.AddListener(tf.consts.mapFeatureClickEvent, onMapFeatureClick);
    };

    const tryInitialize = () => {
        if (getGlobalMapApp()) { initialize(); } else { setTimeout(() => { return tryInitialize(); }, 500); }
    };

    tryInitialize();
};

const Stop = ({ item, change, remove, update, pan }) => {
    let marginPx = commonStyles.marginPx;
    let nameId = item.id + 'stop_name';
    let descId = item.id + 'stop_desc';
    let codeId = item.id + 'stop_code';
    let latId = item.id + 'stop_lat';
    let lonId = item.service_id + 'stop_lon';
    let wpId = item.service_id + 'way_point';
    let panId = item.id + 'pan';
    let stopIdId = item.id + 'stop_id';

    if (item.stop_code == undefined) { item.stop_code = ""; }

/*
    onInput={event => {
        let inputElement = document.getElementById(nameId);
        if (inputElement) {
            let regex = /^[a-zA-Z_]+$/;
            if (regex.test(inputElement.value) !== true) {
                inputElement.value = inputElement.value.replace(/[^a-zA-Z_]+/, '');
            }
        }
    }}
*/

    return (
        <div className="gtfsListItem">

            <input style={{ marginLeft: '10px' }} className="" type="button" id="{panId}" onClick={() => { pan(item) }} value="PanTo" title="Center Map to Stop" />

            <label title="Stop id" style={{ margin: marginPx }} htmlFor={stopIdId}><small>stop_id</small>
                <div style={{ display: 'inline-block', margin: marginPx, fontSize: '110%' }} className="" id={stopIdId} >{item.id}</div>
            </label>

            <label title="the Name should be small enough to display on the map as a marker" htmlFor={nameId} style={{ margin: marginPx }}><small>stop_name</small>
                <input style={{ margin: marginPx, width: '140px' }} value={item.stop_name} className="" type="text" id={nameId}
                    onBlur={() => { if (item._needChange) { item._needChange = false; change(item); } }}
                    onChange={(event) => { if (item.stop_name != event.target.value) { item._needChange = true; item.stop_name = event.target.value; update(); } }}
                />
            </label>

            <label title="optional Descripton can provide information not included in the name" htmlFor={descId} style={{ margin: marginPx }}><small>stop_desc</small>
                <input style={{ margin: marginPx, width: '140px' }} value={item.stop_desc} className="" type="text" id={descId}
                onBlur={() => { if (item._needChange) { item._needChange = false; change(item); } }}
                    onChange={(event) => { if (item.stop_desc != event.target.value) { item._needChange = true; item.stop_desc = event.target.value; update(); } }} />
            </label>

            <label title="optional small alphanumeric text for display on the stop sign" htmlFor={codeId} style={{ margin: marginPx }}><small>stop_code</small>
                <input style={{ margin: marginPx, width: '120px' }} value={item.stop_code} className="" type="text" id={codeId}
                    onBlur={() => { if (item._needChange) { item._needChange = false; change(item); } }}
                    onChange={(event) => { if (item.stop_code != event.target.value) { item._needChange = true; item.stop_code = event.target.value; update(); } }} />
            </label>

            <label htmlFor={latId} style={{ margin: marginPx }}><small>stop_lat</small>
                <input style={{ margin: marginPx, width: '80px' }} value={item.stop_lat} className="" type="text" id={latId}
                    onBlur={() => { if (item._needChange) { item._needChange = false; change(item); } }}
                    onChange={(event) => { let newValue = parseFloat(event.target.value); if (item.stop_lat != newValue) { item._needChange = true; item.stop_lat = newValue; update(); } }} />
            </label>

            <label htmlFor={lonId} style={{ margin: marginPx }}><small>stop_lon</small>
                <input style={{ margin: marginPx, width: '80px' }} value={item.stop_lon} className="" type="text" id={lonId}
                    onBlur={() => { if (item._needChange) { item._needChange = false; change(item); } }}
                    onChange={(event) => { let newValue = parseFloat(event.target.value); if (item.stop_lon != newValue) { item._needChange = true; item.stop_lon = newValue; update(); } }} />
            </label>

            <label htmlFor={wpId} style={{ margin: marginPx }}><small>is_way_point</small>
                <input style={{ margin: marginPx }} checked={item.isWayPoint} className="dayOfWeekCheckBox" type="checkbox" id={wpId}
                    onChange={() => { item.isWayPoint = !item.isWayPoint; return change(item); }} />
            </label>

            <input className="delButton" type="button" id="{deleteId}" onClick={() => { remove(item.id) }} value="Del" title="Delete without confirmation!" />
        </div>
    );
};

const StopsList = ({ data, change, remove, update, pan }) => {
    const items = data.map((item) => {
        return (<Stop item={item} key={item.id} remove={remove} change={change} update={update} pan={pan}/>); });
    return (<div className="gtfsList">{items}</div>);
};

class GTFSStops extends React.Component {
    stopsMapFeatures = null;
    constructor(props) {
        super(props);
        this.state = { data: [], stopsVisible: true, stopsDraggable: false };
        this.stopsMapFeatures = StopsMapFeatures({ onDrag: this.onDrag, canDrag: this.canDrag });
        this.JSONInputId = "stopsJSONInput";
        this.crudClient = tf.services.CRUDClient({ tableName: this.makeTableName(globalAgencyPrefix), serverURL: CRUDAPI, authForm: gtfsLogin.getAuthForm() });
        gtfsStops = this;
    };

    makeTableName(agencyPrefix) { return getGTFSTableName(agencyPrefix, "stops"); }
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

    canDrag = (notification) => {
        return this.state.stopsDraggable;
    };

    onDrag = (notification) => {
        let mf = notification.lastDragged;
        let stop = mf.GetSettings().stopData;
        if (notification.notification) {
            let coords = mf.GetPointCoords();
            stop.stop_lon = coords[0];
            stop.stop_lat = coords[1];
            this.refreshSetStateData();
        }
        else { this.handleChange(stop); }
    };
    componentDidMount() { this.refresh(); };

    getIdForStopName(stopName) { for (let i in this.state.data) { let d = this.state.data[i]; if (d.stop_name == stopName) { return d.id; } } };
    getStopNameForId(id) { for (let i in this.state.data) { let d = this.state.data[i]; if (d.id == id) { return d.stop_name; } } };
    getStopItemForId(id) { for (let i in this.state.data) { let d = this.state.data[i]; if (d.id == id) { return d; } } };

    notifyStopSequences() {
        if (gtfsStopSequences === undefined) {
            if (gtfsShapes !== undefined) { ReactDOM.render(<GTFSStopSequences />, document.getElementById('stopSequencesContainer')); }
        }
        else { gtfsStopSequences.onStopsChanged(); }
    };
    refreshSetState() { this.setState(Object.assign({}, this.state)); };
    setStateData(data) {
        this.state.data = data;
        this.refreshSetState();
        this.stopsMapFeatures.Update(data);
        this.notifyStopSequences();
    };
    refreshSetStateData() { this.setStateData(this.state.data); };
    handleUpdate() { this.setStateData(this.state.data); };
    handlePan(item) {
        this.stopsMapFeatures.PanTo(item);
        let mf = this.stopsMapFeatures.GetMapFeature(item.stop_name);
        //if (mf) { mf.SetIsAlwaysInHover(!mf.GetIsAlwaysInHover()); mf.RefreshStyle();}
        if (mf) { mf.SetIsAlwaysInHover(true); mf.RefreshStyle(); }
    };
    show() {
        this.state.stopsVisible = this.stopsMapFeatures.SetVisible(!this.stopsMapFeatures.GetVisible());
        this.refreshSetStateData();
    };
    toggleStopDrag() {
        this.state.stopsDraggable = !this.state.stopsDraggable;
        this.refreshSetState()
    };
    render() {
        let marginPx = commonStyles.marginPx;
        return (
            <div className="gtfsList">
                <Title title="Stops" count={this.state.data.length} />
                <label htmlFor="StopsVisibleId" style={{ margin: marginPx }} title="Show or hide Stops on the map" ><small>visible</small>
                    <input style={{ marginLeft: '10px' }} className="" type="checkbox" id="StopsVisibleId"
                        onChange={() => { this.show(); }} checked={this.state.stopsVisible} />
                </label>
                <label htmlFor="StopsDragId" style={{ margin: marginPx }} title="Allow dragging stops on the map" ><small>can_drag</small>
                    <input style={{ marginLeft: '10px' }} className="" type="checkbox" id="StopsDragId"
                        onChange={() => { this.toggleStopDrag(); }} checked={this.state.stopsDraggable} />
                </label>
                <BarButton value="Add" title="Add new Stop" onClick={this.addItem.bind(this)} />
                <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                <BarButton value="Clear" title="Clear List" onClick={this.clear.bind(this)} />
                <BarButton value="Dump" title="Dump List in JSON format" onClick={this.dump.bind(this)} />
                <p></p>
                <SingleLineInputForm
                    inputId={this.JSONInputId}
                    inputLabel="Type or paste JSON and press enter to replace list"
                    sendSubmitValue={this.updateFromJSON.bind(this)}
                />
                <StopsList
                    data={this.state.data}
                    remove={this.handleRemove.bind(this)}
                    change={this.handleChange.bind(this)}
                    update={this.handleUpdate.bind(this)}
                    pan={this.handlePan.bind(this)}
                />
            </div>
        );
    };
    refresh() {
        this.crudClient.Get(notification => {
            if (notification && notification.ok) {
                for (let i in notification.data) {
                    let d = notification.data[i];
                    if (d.isWayPoint == undefined) {
                        d.isWayPoint = false;
                    }
                }
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
        const record = {
            stop_name: "Main St & 1st Av",
            stop_desc: "ACME headquarters",
            //stop_code: "AAA-999-ZZZ",
            stop_code: "",
            stop_lat: tf.consts.defaultLatitude,
            stop_lon: tf.consts.defaultLongitude
        };
        this.crudClient.Post(notification => {
            if (notification && notification.ok) {
                Array.prototype.push.apply(this.state.data, notification.data);
                //this.refreshSetState();
                this.refresh();
            }
            else {
                console.log(notification.message);
                this.refresh();
            }
        }, record);
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
    handleChange(item) {
        this.crudClient.Put(notification => {
            if (notification && notification.ok) {
                this.refreshSetState();
                this.stopsMapFeatures.RefreshMapFeatureStyle(item.stop_name);
            }
            else {
                console.log(notification.message);
                this.refresh();
            }
        }, item);
    };
};

class GTFSStopSelect extends React.Component {
    constructor(props) { super(props); this.state = { data: [], listProps: null, selectedId: null }; this.fillListProps(); };
    componentDidMount() { };
    handleUpdate() { this.selectedId = undefined; this.internalHandleUpdate(); };
    refreshSetStateData() { this.setState({ data: this.state.data, listProps: this.state.listProps, selectedId: this.state.selectedId }); }
    internalHandleUpdate() { this.fillListProps(); this.refreshSetStateData(); };
    render() { return (<ListSelect props={this.state.listProps} />); };
    fillListProps() {
        let options = [], index = 0;
        for (let i in gtfsStops.state.data) {
            let d = gtfsStops.state.data[i], stop_name = d.stop_name;
            options.push({ key: index, value: d.id, text: stop_name });
            ++index;
        }
        if (this.state.selectedId == undefined) {
            if (options.length) { this.state.selectedId = options[0].value; }
            else { this.state.selectedId = undefined; }
        }
        this.state.listProps = {
            name: 'stopSelect', title: 'Select the name of a Stop',
            handleChange: (e) => { this.state.selectedId = e.target.value; this.internalHandleUpdate(); },
            value: this.state.selectedId, options: options
        };
    };
};
