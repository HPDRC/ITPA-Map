"use strict";

const BusMapFeatures = function (options) {
    let theThis = this; if (!(theThis instanceof BusMapFeatures)) { return new BusMapFeatures(options); }
    let map, layer;
    let mapFeatures;

    this.SetVisible = (bool) => { if (layer) { layer.SetVisible(bool); } return theThis.GetVisible() };
    this.GetVisible = () => { return layer ? layer.GetIsVisible() : true };

    this.Render = function () {
        if (map) {
            map.Render();
        }
    };

    this.PanToCoords = coords => {
        map.AnimatedSetCenterIfDestVisible(coords);
    };

    this.PanTo = bus => {
        let mapFeature = theThis.GetMapFeature(bus);
        if (mapFeature) { map.AnimatedSetCenterIfDestVisible(mapFeature.GetPointCoords()); }
    };

    this.GetMapFeature = (bus) => { return bus && mapFeatures[bus.key] ? mapFeatures[bus.key].busFeature : undefined; }

    this.GetMapFeatures = (bus) => { return bus && mapFeatures[bus.key] ? mapFeatures[bus.key] : undefined; }

    this.UpdatePos = (data) => {
        let len = data ? data.length : 0;
        if (layer != undefined && len > 0) {
            for (var i in data) {
                let d = data[i];
                var mapFeature = theThis.GetMapFeature(d);
                if (mapFeature) {
                    mapFeature.SetPointCoords([d.lon, d.lat]);
                }
            }
        }
    };

    this.UpdateVisible = (data) => {
        let len = data ? data.length : 0;
        if (layer != undefined && len > 0) {
            for (var i in data) {
                let d = data[i];
                let thisMapFeatures = theThis.GetMapFeatures(d);
                if (thisMapFeatures) {
                    if (thisMapFeatures.shapesVisible != d.shapesVisible) {
                        if (thisMapFeatures.shapesVisible = d.shapesVisible) {
                            layer.AddMapFeature(thisMapFeatures.polyFeature);
                            layer.AddMapFeature(thisMapFeatures.pointsFeature);
                        }
                        else {
                            layer.DelMapFeature(thisMapFeatures.polyFeature);
                            layer.DelMapFeature(thisMapFeatures.pointsFeature);
                        }
                    }
                }
            }
        }
    };

    this.Update = (data) => {
        const getBusStyle = (kf, mapFeature) => {
            var isHover = mapFeature.GetIsDisplayingInHover();
            var busTrackData = mapFeature.GetSettings().busTrackData;
            var marker_color = "#888";
            var line_color = "#000";
            var font_color = '#fff';
            var font_height = 14;
            var zindex = isHover ? 5 : 3;
            var opacity = 1;
            var style = [{
                circle: true, circle_radius: 8, fill: true, fill_color: "#888", line: true, line_color: "#000", snaptopixel: false, fill_opacity: 70, line_opacity: 90
            }];
            if (isHover) {
                style.push({
                    opacity: opacity, marker: true, label: busTrackData.key, zindex: zindex, marker_color: marker_color, font_color: font_color,
                    font_height: font_height, line_color: line_color, line_width: 1, line_opacity: 50, snaptopixel: false, border_width: 2
                });
            }
            return style;
        };

        const getBusTrackStyle = (kf, mapFeature) => {
            var isHover = mapFeature.GetIsDisplayingInHover();
            var marker_color = "#888";
            var line_color = "#000";
            var font_color = '#fff';
            var font_height = 14;
            var zindex = 2;
            var opacity = 1;
            var style = [{
                shape: true, shape_radius: 4, shape_npoints: 4, fill: true, fill_color: "#888", line: true, line_color: "#000", snaptopixel: false, fill_opacity: 30, line_opacity: 80
            }];
            return style;
        };

        const getPolyStyle = (kf, mapFeature) => {
            var isHover = mapFeature.GetIsDisplayingInHover();
            var zindex = 1;
            var opacity = 1;
            var style = [{
                line:true, line_width: 8, line_color: "#f00", line_opacity: 30, snap_to_pixel: false
            }];
            return style;
        };

        let len = data ? data.length : 0;
        layer.RemoveAllFeatures();
        mapFeatures = {};
        if (layer != undefined &&  len > 0) {
            for (var i in data) {
                let d = data[i];
                let shapesVisible = d.shapesVisible;
                let geom = {
                    busTrackData: d,
                    type: 'point',
                    coordinates: [d.lon, d.lat],
                    style: getBusStyle,
                    hoverStyle: getBusStyle
                };
                var mapFeature = new tf.map.Feature(geom);
                layer.AddMapFeature(mapFeature, true);
                mapFeatures[d.key] = {};
                mapFeatures[d.key].busFeature = mapFeature;
                let polyCoords = [];
                for (let j in d.events) {
                    polyCoords.push(d.events[j].coords.slice(0));
                }
                let polyGeom = {
                    isTrackFeature: true,
                    type: 'linestring',
                    coordinates: polyCoords,
                    style: getPolyStyle,
                    hoverStyle: getPolyStyle
                };
                let polyFeature = new tf.map.Feature(polyGeom);
                if (shapesVisible) { layer.AddMapFeature(polyFeature, true); }
                mapFeatures[d.key].polyFeature = polyFeature;
                let pointsGeom = {
                    isTrackFeature: true,
                    type: 'multipoint',
                    coordinates: polyCoords,
                    style: getBusTrackStyle,
                    hoverStyle: getBusTrackStyle
                };
                let pointsFeature = new tf.map.Feature(pointsGeom);
                if (shapesVisible) { layer.AddMapFeature(pointsFeature, true); }
                mapFeatures[d.key].pointsFeature = pointsFeature;
                mapFeatures[d.key].shapesVisible = shapesVisible;
            }
            layer.AddWithheldFeatures();
        }
    };

    const onMapFeatureClick = (notification) => {
        let mapFeature = notification.mapFeature, mapFeatureSettings = mapFeature.GetSettings();
        let busTrackData = mapFeatureSettings.busTrackData;
        if (busTrackData) {
            mapFeature.SetIsAlwaysInHover(!mapFeature.GetIsAlwaysInHover());
            mapFeature.RefreshStyle();
        }
        else if (mapFeatureSettings.isTrackFeature) {
            gtfsShapes.shapesMapFeatures.PanToShapeFeature(mapFeature);
        }
    };

    const onMapPostCompose = notification => { options.onPostCompose(notification); };

    const initialize = () => {
        let layerSettings = { name: "buses", isVisible: true, isHidden: true, useClusters: false, zIndex: 100 };
        let mapApp = getGlobalMapApp();
        let content = mapApp.GetContent();
        map = content.GetMap();
        layer = content.CreateCustomMapLayer(layerSettings, false);
        map.AddListener(tf.consts.mapFeatureClickEvent, onMapFeatureClick);
        if (tf.js.GetFunctionOrNull(options.onPostCompose)) { map.AddListener(tf.consts.mapPostComposeEvent, onMapPostCompose); }
        mapFeatures = {};
        theThis.SetVisible(options.initiallyVisible);
    };

    const tryInitialize = () => { if (getGlobalMapApp()) { initialize(); } else { setTimeout(() => { return tryInitialize(); }, 500); } };

    tryInitialize();
};

const BusStopTime = ({ item, panToStopTime, setAnimationTime }) => {
    return (
        <div className="gtfsListItem">
            <JustALabel label={(item.index + 1) + ''} title={"stop index"} />
            <TextPressButton text={item.timeStr} title={"Set animation time"} onClick={e => { setAnimationTime(item.animationTime); }} />
            <JustASpan span={item.stop.id + ''} title={"stop id"} />
            <TextPressButton text={item.stop.stop_name} title={"Pan to stop"} onClick={e => { panToStopTime(item); }} />
        </div>
        );
};

const BusStopTimesList = ({ data, panToStopTime, setAnimationTime }) => {
    const items = data.map((item) => {
        return (<BusStopTime item={item} key={item.key} panToStopTime={panToStopTime} setAnimationTime={setAnimationTime} />);
    });
    return (<div className="gtfsList">{items}</div>);
};

const Bus = ({ item, pan, changeStartEnd, calc, setAnimationTime, getCurAnimationTime, changeShapesVisible, panToStopTime, changeStopTimesVisible }) => {
    let marginPx = commonStyles.marginPx;
    let latId = item.busId + 'lat', lonId = item.busId + 'lon';
    let latStr = item.lat.toFixed(5) + '';
    let lonStr = item.lon.toFixed(5) + '';
    let theCLSText = item.eventsCoordsCLS;
    let minTrackTime = new Date(), maxTrackTime = new Date();
    let startTrackTime = new Date(), endTrackTime = new Date();

    minTrackTime.setTime(item.minTrackTime);
    maxTrackTime.setTime(item.maxTrackTime);

    minTrackTime = tf.js.GetAMPMHourWithSeconds(minTrackTime);
    maxTrackTime = tf.js.GetAMPMHourWithSeconds(maxTrackTime);

    startTrackTime.setTime(item.startTrackTime);
    endTrackTime.setTime(item.endTrackTime);

    startTrackTime = tf.js.GetAMPMHourWithSeconds(startTrackTime);
    endTrackTime = tf.js.GetAMPMHourWithSeconds(endTrackTime);

    let stopTimesList = item.stopTimesVisible ? 
        <BusStopTimesList data={item.stopTimes} panToStopTime={panToStopTime} setAnimationTime={setAnimationTime} /> :
        <div></div>;

    let nStops = item.stopTimes.length;

    return (
        <div className="gtfsListItem">

            <TextPressButton text={item.key} title={"Center Map to Bus"} onClick={e => { pan(item); }} />

            <LabeledCheckBox
                id={item.busId + 'allShapesVisible'} title={'Show or hide tracking shape'} label={'shapes_visible'} checked={item.shapesVisible}
                onChange={e => {
                    item.shapesVisible = !item.shapesVisible;
                    return changeShapesVisible(item);
                }}
            />

            <LabeledSpan id={item.busId + 'bus_lat'} title={'current Latitude of the bus in animation'} label={'bus_lat'} span={latStr} />
            <LabeledSpan id={item.busId + 'bus_lon'} title={'current Longitude of the bus in animation'} label={'bus_lon'} span={lonStr} />

            <TextPressButton text={minTrackTime} title={"Set animation time to first tracking event"} onClick={e => { setAnimationTime(item.minTrackTime); }} />
            <TextPressButton text={maxTrackTime} title={"Set animation time to last tracking event"} onClick={e => { setAnimationTime(item.maxTrackTime); }} />

            <TextPressButton text={'Start at ' + startTrackTime} title={"Set polyline start time from animation time"} onClick={e => { item.startTrackTime = getCurAnimationTime(); changeStartEnd(item); }} />
            <TextPressButton text={'End at ' + endTrackTime} title={"Set polyline end time from animation time"} onClick={e => { item.endTrackTime = getCurAnimationTime(); changeStartEnd(item); }} />

            <SingleLineInputForm inputId={item.id + 'CLS'} inputLabel="Compressed Polyline" initialValue={theCLSText} />

            <TextPressButton text={"Calc All Stops"} title={"Calc proximity times to all stops"} onClick={e => { calc(item); }} />

            <LabeledCheckBox
                id={item.busId + 'allStopTimesVisible'} title={'Show or hide list of stops'} label={nStops + ' stops_visible'} checked={ item.stopTimesVisible }
                onChange={e => { item.stopTimesVisible = !item.stopTimesVisible; return changeStopTimesVisible(item); }}
            />

            {stopTimesList}

        </div>
    );
};

const BusesList = ({ data, pan, changeStartEnd, calc, setAnimationTime, getCurAnimationTime, changeShapesVisible, panToStopTime, changeStopTimesVisible }) => {
    const items = data.map((item) => {
        return (<Bus item={item} key={item.key} pan={pan} changeStartEnd={changeStartEnd}
            changeShapesVisible={changeShapesVisible} calc={calc} setAnimationTime={setAnimationTime}
            getCurAnimationTime={getCurAnimationTime}
            panToStopTime={panToStopTime}
            changeStopTimesVisible={changeStopTimesVisible}
        />);
    });
    return (<div className="gtfsList">{items}</div>);
};

const TimeSlider = ({ trackStartDate, nMillis, curMillis, change }) => {
    let tsd;
    if (trackStartDate) {
        tsd = new Date();
        tsd.setTime(trackStartDate.getTime() + curMillis);
        tsd = tf.js.GetTimeStampFromDate(tsd);
        tsd = tsd.substring(0, tsd.length - 2);
    }
    else { tsd = '??'; }
    return <LabeledSlider id={"busTrackingTimeSlider"} title={"Adjust animation time"} label={tsd} minValue={"0"} maxValue={nMillis + ''} value={curMillis}
        onChange={(e, newValue) => { change(newValue); }}
    />
};

class GTFSBusTracking extends React.Component {
    mapFeatures = null;
    constructor(props) {
        super(props);
        let initiallyVisible = false;
        this.polyCode = new tf.map.PolyCode();
        this.mapFeatures = BusMapFeatures({ onPostCompose: this.onMapPostCompose.bind(this), initiallyVisible: initiallyVisible });
        this.historyTimer = new tf.helpers.Timer();
        this.historyTimer.SetLimit(1);
        this.historyTimer.SetSpeed(1);
        this.historyTimer.Pause(true);
        this.state = {
            data: [], mapFeaturesVisible: initiallyVisible, trackStartDate: undefined, nMillis: 0, curMillis: 0, dayOffset: 0, speed: 1, busId: "",
            stopRadiusMeters: 15.0
        };
        gtfsBusTracking = this;
    };

    onMapPostCompose(notification) {
        if (!this.historyTimer.GetIsPaused()) {
            var nextTimeMillis = this.historyTimer.GetElapsedTime();
            this.state.curMillis = nextTimeMillis;
            this.calcBusPos();
            this.refreshSetState();
            notification.continueAnimation();
        }
    };

    componentDidMount() { this.refresh(); };

    refreshSetState() {
        this.setState(Object.assign({}, this.state));
    };
    setStateData(data) {
        this.state.data = data;
        this.refreshSetState();
    };
    refreshSetStateData() { this.setStateData(this.state.data); };
    handleUpdate() { this.refreshSetStateData(); };
    handlePan(item) {
        this.mapFeatures.PanTo(item);
        let mf = this.mapFeatures.GetMapFeature(item);
        if (mf) { mf.SetIsAlwaysInHover(true); mf.RefreshStyle(); }
    };
    show() {
        this.state.mapFeaturesVisible = this.mapFeatures.SetVisible(!this.mapFeatures.GetVisible());
        this.refreshSetStateData();
    };

    getPartialLineString(item, fromTimeMillis, toTimeMillis) {
        let partialLineString = [];
        if (toTimeMillis < fromTimeMillis) { toTimeMillis = fromTimeMillis; }
        let startRecord = this.getTrackRecord(item, fromTimeMillis);
        let endRecord = this.getTrackRecord(item, toTimeMillis);
        partialLineString.push(startRecord.coords);
        if (startRecord.nextHistoryIndex !== undefined && endRecord.prevHistoryIndex !== undefined) {
            let history = item.events;
            for (let i = startRecord.nextHistoryIndex; i <= endRecord.prevHistoryIndex; ++i) {
                partialLineString.push(history[i].coords.slice(0));
            }
        }
        partialLineString.push(endRecord.coords);
        return partialLineString;
    };

    getTrackRecord(item, atTimeMillis) {
        let history = item.events, len = history.length, coords;
        let index = tf.js.BinarySearch(history, atTimeMillis, function (a, b) { return a - b.trackTime; });
        let nextHistoryIndex, prevHistoryIndex;
        if (index < 0) {
            let prevCoords, prevMillis, nextCoords, nextMillis;
            index = -(index + 1);
            let hPrev = history[index - 1], hNext = history[index];
            if (index > 0) { prevCoords = hPrev.coords; prevMillis = hPrev.trackTime; prevHistoryIndex = index - 1; }
            if (index < len) { nextCoords = hNext.coords; nextMillis = hNext.trackTime; }
            if (!!prevCoords) {
                coords = prevCoords;
                let diffMillis = nextMillis - prevMillis;
                let dMilis01 = diffMillis > 0 ? (atTimeMillis - prevMillis) / diffMillis : 0;
                if (dMilis01 > 0) {
                    let dlon = nextCoords[0] - prevCoords[0], dlat = nextCoords[1] - prevCoords[1];
                    coords = [prevCoords[0] + dlon * dMilis01, prevCoords[1] + dlat * dMilis01];
                }
                nextHistoryIndex = index;
            }
            else {
                if (index + 1 < len) { nextHistoryIndex = index + 1; }
                coords = nextCoords;
            }
        }
        else {
            if (index >= len) { index = len - 1; }
            coords = history[index].coords;
            if (index > 0) { prevHistoryIndex = index - 1; }
            if (index + 1 < len) { nextHistoryIndex = index + 1; }
        }
        return { coords: coords, nextHistoryIndex: nextHistoryIndex, prevHistoryIndex: prevHistoryIndex };
    };

    getCurAnimationTimeMillis() {
        return this.state.trackStartDate.getTime() + this.state.curMillis;
    };

    positionItemAtTime(item) {
        let tr = this.getTrackRecord(item, this.getCurAnimationTimeMillis());
        if (tr.coords !== undefined) { item.lon = tr.coords[0]; item.lat = tr.coords[1]; }
    };

    calcBusPos() {
        for (let i in this.state.data) {
            this.positionItemAtTime(this.state.data[i]);
        }
        this.mapFeatures.UpdatePos(this.state.data);
    };
    refresh() {
        if (this.transitAgencySelect.state.isError) {
            this.transitAgencySelect.state.firstRefresh = true;
            this.transitAgencySelect.refreshAgencies();
        }
        else if (!this.transitAgencySelect.state.firstRefresh) {
            let dateTrack = new Date();
            dateTrack.setHours(0);
            dateTrack.setMinutes(0)
            dateTrack.setSeconds(0);
            dateTrack.setMilliseconds(0);
            dateTrack.setDate(dateTrack.getDate() + this.state.dayOffset);
            let nHours = 24;
            let nSeconds = nHours * 3600;
            //dateTrack.setSeconds(dateTrack.getSeconds() - nSeconds);
            let dateTrackTimeStamp = tf.js.GetTimeStampFromDate(dateTrack);
            let endpoint = 'gettrackhistory?agency=' + this.transitAgencySelect.state.selectedAgency + '&date=' + dateTrackTimeStamp + '&secs=' + nSeconds;
            if (this.state.busId.length > 0) {
                endpoint += '&busid=' + this.state.busId;
            }
            this.state.trackStartDate = dateTrack;
            this.state.data = [];
            this.refreshSetState();
            this.mapFeatures.Update([]);
            return axios.get(TransitAPI + endpoint).then((res) => {
                if (res.data) {

                    let data = res.data;
                    let events = data.events, nEvents = events ? events.length : 0;
                    let busIds = {}
                    let busData = [];
                    for (let i = 0; i < nEvents; ++i) {
                        let ev = events[i];
                        let busId = ev.busId, key = busId + '';
                        let existing = busIds[key];
                        let trackDate = tf.js.GetDateFromTimeStamp(ev.trackDate);
                        if (existing == undefined) {
                            busData.push(existing = busIds[key] = { busId: busId, key: key, events: [] });
                        }
                        existing.events.push({ trackDate: trackDate, trackTime: trackDate.getTime(), trackDateTimeStamp: ev.trackDate, lon: ev.lon, lat: ev.lat, coords: [ev.lon, ev.lat] });
                    }
                    for (let i in busData) {
                        let bus = busData[i];
                        bus.events.sort((a, b) => { return a.trackDate.getTime() - b.trackDate.getTime(); });
                        bus.lon = bus.events[0].lon;
                        bus.lat = bus.events[0].lat;
                        bus.shapesVisible = true;
                        bus.minTrackTime = bus.events[0].trackTime;
                        bus.maxTrackTime = bus.events[bus.events.length - 1].trackTime;
                        bus.startTrackTime = bus.minTrackTime;
                        bus.endTrackTime = bus.maxTrackTime;
                        let eventsCoords = [], nev = bus.events.length;
                        for (let j = 0; j < nev; ++j) {
                            eventsCoords.push(bus.events[j].coords);
                        }
                        bus.eventsCoordsCLS = this.polyCode.EncodeLineString(eventsCoords, 6);
                        bus.stopTimes = [];
                        bus.stopTimesVisible = false;
                    }
                    this.state.curMillis = 0;
                    this.state.nMillis = data.nsecs * 1000;
                    this.state.trackStartDate = dateTrack;
                    this.mapFeatures.Update(busData);
                    this.setStateData(busData);
                    this.historyTimer.SetLimit(this.state.nMillis);
                    this.historyTimer.SetElapsedTime(0);
                    this.historyTimer.Pause(false);
                    this.calcBusPos();
                }
            }).catch(err => {
                console.log(err.message);
            });
        }
    };
    onAgencyFirstRefresh() {
        this.refresh();
    };
    onAgencyChange() {
        this.refresh();
    };
    onChangeTimeSlider(toValue) {
        this.state.curMillis = tf.js.GetFloatNumberInRange(toValue, 0, this.state.nMillis, this.state.curMillis);
        this.historyTimer.SetElapsedTime(this.state.curMillis);
        this.calcBusPos();
        this.refreshSetState();
    };
    prevNextDay(off) {
        this.state.dayOffset += off;
        this.refresh();
    };
    onBusChangeStartEnd(bus) {
        //let subStartTime = this.state.trackStartDate.getTime();
        let partial = this.getPartialLineString(bus, bus.startTrackTime/* - subStartTime*/, bus.endTrackTime/* - subStartTime*/);
        partial = tf.map.SimplifyLS(partial, 1)
        bus.eventsCoordsCLS = this.polyCode.EncodeLineString(partial, 6);
        this.refreshSetState();
    };
    changeStopTimesVisible(bus) {
        this.refreshSetState();
    };
    onBusShapesVisibleChange(bus) {
        this.mapFeatures.UpdateVisible(this.state.data);
        this.refreshSetState();
    };
    toggleTrackPause() {
        this.historyTimer.Pause(!this.historyTimer.GetIsPaused());
        this.refreshSetState();
        this.mapFeatures.Render();
    };
    changeSpeed(newSpeed) {
        this.state.speed = newSpeed;
        this.historyTimer.SetSpeed(this.state.speed);
        this.refreshSetState();
    };
    calcBus(bus) {
        let events = bus.events, nEvents = events.length;
        let stops = gtfsStops.state.data, nStops = stops.length;
        let lastStopIndex = -1;
        bus.stopTimes = [];
        for (let i = 0; i < nEvents; ++i) {
            let ev = events[i];
            let evCoords = [ev.lon, ev.lat];
            let bestStopIndex = -1, bestDistance = 0, maxDistance = this.state.stopRadiusMeters;
            for (let j = 0; j < nStops; ++j) {
                let stop = stops[j];
                let stopCoords = [stop.stop_lon, stop.stop_lat];
                let distance = tf.units.GetHaversineDistance(evCoords, stopCoords);
                if ((bestStopIndex == -1 || distance < bestDistance) && distance <= maxDistance) {
                    bestStopIndex = j;
                    bestDistance = distance;
                }
            }
            if (bestStopIndex != -1) {
                if (lastStopIndex != bestStopIndex) {
                    lastStopIndex = bestStopIndex;
                    let stop = stops[lastStopIndex];
                    //console.log(ev.trackDateTimeStamp.substring(11) + ': ' + (lastStopIndex + 1) + ' -- ' + stops[lastStopIndex].stop_name);
                    let stopTimeLen = bus.stopTimes.length;
                    let key = "busStopTime|" + bus.busId + '|' + stopTimeLen + '|' + stop.id;
                    let stopTime = {
                        animationTime: ev.trackTime,
                        id: key,
                        key: key,
                        index: stopTimeLen,
                        stop: stop,
                        timeStr: ev.trackDateTimeStamp.substring(11)
                    };
                    bus.stopTimes.push(stopTime);
                }
            }
        }
        bus.stopTimesVisible = true;
        this.refreshSetState();
    };
    timeChange(offsetSeconds) {
        let setSeconds = Math.floor(this.state.curMillis / 1000) + offsetSeconds;
        this.onChangeTimeSlider(setSeconds * 1000);
    };
    zeroMinutes() {
        let setHours = Math.floor(this.state.curMillis / 1000 / 60 / 60);
        this.onChangeTimeSlider(setHours * 1000 * 60 * 60);
    };
    zeroSeconds() {
        let setMinutes = Math.floor(this.state.curMillis / 1000 / 60) ;
        this.onChangeTimeSlider(setMinutes * 1000 * 60);
    };
    setAnimationTime(toTime) {
        this.onChangeTimeSlider(toTime - this.state.trackStartDate.getTime());
    };
    panToStopTime(item) {
        gtfsStops.handlePan(item.stop);
        //this.mapFeatures.PanToCoords([item.stop.stop_lon, item.stop.stop_lat]);
    };
    render() {
        let marginPx = commonStyles.marginPx;
        let topPart = (
            <div>
                <Title title="Buses" count={this.state.data.length} />
                <TransitAgencySelect
                    acceptStage={false}
                    acceptNoPost={false}
                    inlineBlock={true}
                    onChange={this.onAgencyChange.bind(this)}
                    onFirstRefresh={this.onAgencyFirstRefresh.bind(this)}
                    ref={node => { this.transitAgencySelect = node; }} />

                <LabeledTextInput
                    id={"trackBusIdId"} label={"bus_id"} title={"filter tracking events to a single bus id"} text={this.state.busId} width={"40px"}
                    onChange={(event, newValue) => {
                        this.state.busId = newValue;
                    }}
                />

                <LabeledCheckBox
                    id={'busTrackingMapFeaturesVisibleId'} title={'Show or hide bus tracking features on the map'} label={'visible'} checked={this.state.mapFeaturesVisible}
                    onChange={e => { this.show(); }}
                />
            </div>
        );

        let bottomPart;
        if (this.state.mapFeaturesVisible) {
            bottomPart = (
                <div>
                    <BarButton value="Prev" title="Previous day" onClick={e => this.prevNextDay(-1)} />
                    <BarButton value="Next" title="Next day" onClick={e => this.prevNextDay(1)} />

                    <LabeledCheckBox
                        id={'trackPausedId'} title={'Play or pause tracking events'} label={'paused'} checked={this.historyTimer.GetIsPaused()}
                        onChange={e => { this.toggleTrackPause(); }}
                    />

                    <BarButton value="1x" title="Replay speed in real time" onClick={e => this.changeSpeed(1)} />
                    <BarButton value="10x" title="Replay speed 10 x real time" onClick={e => this.changeSpeed(10)} />
                    <BarButton value="100x" title="Replay speed 100 x real time" onClick={e => this.changeSpeed(100)} />
                    <JustASpan span={'replaying @' + this.state.speed + 'x'} title={'current animation replay speed'}/>
                    <BarButton value="-H" title="Previous hour" onClick={e => this.timeChange(-3600)} />
                    <BarButton value="+H" title="Next hour" onClick={e => this.timeChange(3600)} />
                    <BarButton value="-H/4" title="Previous quarter hour" onClick={e => this.timeChange(-3600 / 4)} />
                    <BarButton value="+H/4" title="Next quarter hour" onClick={e => this.timeChange(3600 / 4)} />
                    <BarButton value="-M" title="Previous minute" onClick={e => this.timeChange(-60)} />
                    <BarButton value="+M" title="Next minute" onClick={e => this.timeChange(60)} />
                    <BarButton value="-M/4" title="Previous quarter minute" onClick={e => this.timeChange(-15)} />
                    <BarButton value="+M/4" title="Next quarter minute" onClick={e => this.timeChange(15)} />
                    <BarButton value="-S" title="Previous second" onClick={e => this.timeChange(-1)} />
                    <BarButton value="+S" title="Next second" onClick={e => this.timeChange(1)} />
                    <BarButton value="zM" title="Zero minutes" onClick={e => this.zeroMinutes()} />
                    <BarButton value="zS" title="Zero seconds" onClick={e => this.zeroSeconds()} />
                    <TimeSlider
                        trackStartDate={this.state.trackStartDate}
                        nMillis={this.state.nMillis}
                        curMillis={this.state.curMillis}
                        change={this.onChangeTimeSlider.bind(this)}
                    />

                    <LabeledTextInput
                        id={"calcAllStopsRadiusId"} label={"calc_stops_radius"} title={"radius in meters for stops proximity detection"} text={this.state.stopRadiusMeters} width={"40px"}
                        onBlur={e => {
                            this.state.stopRadiusMeters = tf.js.GetFloatNumberInRange(this.state.stopRadiusMeters, 1.0, 100.0, 15.0);
                        }}
                        onChange={(event, newValue) => {
                            this.state.stopRadiusMeters = newValue;
                        }}
                    />

                    <BusesList
                        data={this.state.data}
                        pan={this.handlePan.bind(this)}
                        changeStartEnd={this.onBusChangeStartEnd.bind(this)}
                        changeShapesVisible={this.onBusShapesVisibleChange.bind(this)}
                        calc={this.calcBus.bind(this)}
                        setAnimationTime={this.setAnimationTime.bind(this)}
                        getCurAnimationTime={this.getCurAnimationTimeMillis.bind(this)}
                        panToStopTime={this.panToStopTime.bind(this)}
                        changeStopTimesVisible={this.changeStopTimesVisible.bind(this)}
                    />
                </div>
                );
        }
        else { bottomPart = ""; }

        return <div className="gtfsList"> {topPart} {bottomPart} </div>;
    };
};
