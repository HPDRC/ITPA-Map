"use strict";

//const mvideoServer = 'http://131.94.133.214';
const mvideoServer = 'http://192.168.0.82';
//const mvideoServer = 'http://utma-video.cs.fiu.edu';
const videoImgWidthPxInt = 320, videoImgWidthPx = videoImgWidthPxInt + 'px';

const makeVideoIdForItem = item => { return item ? item.key + 'video' : ""; };

const VideoMapFeatures = function (options) {
    let theThis = this; if (!(theThis instanceof VideoMapFeatures)) { return new VideoMapFeatures(options); }
    let map, layer;
    let polyFeature, pointsFeature, busFeature;

    this.SetVisible = (bool) => { if (layer) { layer.SetVisible(bool); } return theThis.GetVisible() };
    this.GetVisible = () => { return layer ? layer.GetIsVisible() : true };

    this.Render = function () { if (map) { map.Render(); } };

    this.PanToCoords = coords => {
        if (map && coords) {
            let nowCenter = map.GetCenter();
            let tolerance = 0.00001;
            if (Math.abs(nowCenter[0] - coords[0]) > tolerance || Math.abs(nowCenter[1] - coords[1]) > tolerance) {
                map.AnimatedSetCenterIfDestVisible(coords);
            }
        }
    };

    this.PanToShapeFeature = mapFeature => {
        if (mapFeature && map) {
            let extent = mapFeature.GetExtent();
            map.SetVisibleExtent(tf.js.ScaleMapExtent(extent, 1.4))
        }
    };

    this.PanToTrackFeature = () => {
        return theThis.PanToShapeFeature(polyFeature);
    };

    this.SetBusFeatureCoords = (coords) => {
        if (busFeature && coords) {
            busFeature.SetPointCoords(coords);
        }
    };

    this.CenterTo = (coords) => {
        if (coords && busFeature) {
            map.SetCenter(coords);
        }
    };

    this.Update = (trackCoords) => {
        const getBusStyle = (kf, mapFeature) => {
            var isHover = mapFeature.GetIsDisplayingInHover();
            var marker_color = "#888";
            var fill_color = "#37f";
            var line_color = "#000";
            var font_color = '#fff';
            var font_height = 14;
            var zindex = isHover ? 5 : 3;
            var opacity = 1;
            var style = [{
                circle: true, circle_radius: 8, fill: true, fill_color: fill_color, line: true, line_color: line_color, snaptopixel: false, fill_opacity: 70, line_opacity: 90
            }];
            if (isHover) {
                style.push({
                    opacity: opacity, marker: true, label: "vehicle", zindex: zindex, marker_color: marker_color, font_color: font_color,
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
                line: true, line_width: 8, line_color: "#f00", line_opacity: 30, snap_to_pixel: false
            }];
            return style;
        };

        polyFeature = pointsFeature = undefined;

        if (!map) { return; }

        let len = trackCoords ? trackCoords.length : 0;
        layer.RemoveAllFeatures();
        if (layer != undefined && len > 0) {
            let polyGeom = {
                isTrackFeature: true,
                type: 'linestring',
                coordinates: trackCoords,
                style: getPolyStyle,
                hoverStyle: getPolyStyle
            };
            polyFeature = new tf.map.Feature(polyGeom);
            layer.AddMapFeature(polyFeature, true);

            let pointsGeom = {
                isTrackFeature: true,
                type: 'multipoint',
                coordinates: trackCoords,
                style: getBusTrackStyle,
                hoverStyle: getBusTrackStyle
            };
            pointsFeature = new tf.map.Feature(pointsGeom);
            layer.AddMapFeature(pointsFeature, true);

            let geom = {
                type: 'point',
                coordinates: trackCoords[0].slice(0),
                style: getBusStyle,
                hoverStyle: getBusStyle
            };

            busFeature = new tf.map.Feature(geom);
            layer.AddMapFeature(busFeature, true);

            layer.AddWithheldFeatures();
            //this.PanToTrackFeature();
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
            //gtfsShapes.shapesMapFeatures.PanToShapeFeature(mapFeature);
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
        theThis.SetVisible(options.initiallyVisible);
    };

    const tryInitialize = () => { if (getGlobalMapApp()) { initialize(); } else { setTimeout(() => { return tryInitialize(); }, 500); } };

    tryInitialize();
};

const MVideo = ({ item, currentVideo, playVideo, onTimeUpdate, byDate, onDelete,
    onReallyDelete, itemToDelete, authToken, canDelete }) => {
    let marginPx = commonStyles.marginPx;
    let isCurrent = currentVideo && item.key == currentVideo.key;
    let isToDelete = itemToDelete && item.key == itemToDelete.key;
    let imgVideo;
    let isLive = !item.thumbnail;
    let thumbImgSrc = isLive ? "./live.jpg" : thumbImgSrc = mvideoServer + '/' + item.thumbnail;

    canDelete = canDelete && (authToken !== undefined && !isLive);
    //canDelete = canDelete && (authToken !== undefined);

    item.newVideo = false;

    if (isCurrent) {
        let now = new Date();
        let videoSrc = mvideoServer + '/' + item.url + '?' + now.getTime();
        let videoId = makeVideoIdForItem(item);
        imgVideo = (
            <video id={videoId} src={videoSrc} autoPlay={true} preload={"true"} controls onTimeUpdate={e => onTimeUpdate(e, item, videoId)} style={{
                width: videoImgWidthPx, height: "auto", marginLeft: "calc(50% - " + (videoImgWidthPxInt / 2) + "px)"
            }}>
                <a href={videoSrc}>Download video</a>
            </video>
        );
        item.newVideo = true;
    }
    else {
        imgVideo = (
            <button title="play video" className="gtfsListItem" style={{ display: "block", width: "calc(100% - 4px)", textAlign: "left" }}
                onClick={e => { playVideo(item); }}
            >
                <img src={thumbImgSrc} width={videoImgWidthPx} height="auto" style={{ marginLeft: "calc(50% - " + (videoImgWidthPxInt / 2) + "px)"}} />
            </button>
        );
    }

    let dateLabel, liveLabel;
    
    if (isLive) {
        liveLabel = <LabeledSpan id={item.key + 'islive'} title={'live feed is being recorded'} label={''} span={'LIVE'} />
    }
    else {
        liveLabel = '';
    }

    if (byDate) { dateLabel = ""; }
    else {
        dateLabel = <LabeledSpan id={item.key + 'vdate'} title={'date live feed started'} label={'date'} span={item.createdDateStr} />
    }

    let confirmDelete, deleteButtonText, deleteButtonTitle;

    if (isToDelete) {
        confirmDelete = <TextPressButton text={'REALLY Delete?'} title={"REALLY Delete Video from Server?"} onClick={e => { onReallyDelete(item); }} className="delButton" />
        deleteButtonText = 'Cancel Delete';
        deleteButtonTitle = 'Cancel Delete Request';
    }
    else {
        confirmDelete = '';
        deleteButtonText = 'Delete';
        deleteButtonTitle = 'Delete Video from Server';
    }

    let deleteButton = canDelete ? <TextPressButton text={deleteButtonText} title={deleteButtonTitle} onClick={e => { onDelete(item); }} className="delButton" /> : '';

    return (
        <div className="gtfsListItem" style={{ backgroundColor: "navajowhite" }}>
            {dateLabel}
            {liveLabel}
            <LabeledSpan id={item.key + 'vtime'} title={'time live feed started'} label={'time'} span={item.createdTimeStr} />
            <LabeledSpan id={item.key + 'name'} title={'name of the live feed'} label={'name'} span={item.name} />
            <LabeledSpan id={item.key + 'id'} title={'uuid of the live feed'} label={'uuid'} span={item.id} />
            {deleteButton}
            {confirmDelete}
            {imgVideo}
        </div>
    );
};

const MVideosOnDate = ({ item, currentVideo, playVideo, selectedDateItem, selectDateItem, onTimeUpdate,
    onDelete, onReallyDelete, itemToDelete, authToken, canDelete }) => {
    let marginPx = commonStyles.marginPx;
    let isSelected = selectedDateItem !== undefined && selectedDateItem.key == item.key;
    let videosInSelected;

    if (isSelected) {
        let videoItems = item.videos.map((item) => {
            return (<MVideo item={item} key={item.id} currentVideo={currentVideo}
                playVideo={playVideo} onTimeUpdate={onTimeUpdate}
                byDate={true}
                onDelete={onDelete}
                onReallyDelete={onReallyDelete}
                itemToDelete={itemToDelete}
                authToken={authToken}
                canDelete={canDelete}
            />);
        });
        videosInSelected = (<div className="gtfsList" style={{ paddingBottom: "10px" }}>{videoItems}</div>);
    }
    else {
        videosInSelected = "";
    }

    return (
        <div>
            <button title="view feeds" className="gtfsListItem" style={{ display: "block", width: "calc(100% - 4px)", textAlign: "left" }}
                onClick={e => { selectDateItem(item); }}
            >
                <LabeledSpan id={item.key + 'date'} title={'date feeds recorded'} label={'date'} span={item.createdDateStr} />
                <LabeledSpan id={item.key + 'count'} title={'number of feeds recorded'} label={'count'} span={item.videos.length} />
            </button>
            {videosInSelected}
        </div>
    );
};

const MVideoList = ({ data, currentVideo, playVideo, selectedDateItem, selectDateItem, byDate, onTimeUpdate, onDelete,
    onReallyDelete, itemToDelete, authToken, canDelete }) => {
    let items;

    if (byDate) {
        let itemsByDateMap = {}, itemsByDateArray = [];
        for (let i in data) {
            let item = data[i];
            let itemDay = item.createdYYYYMMDD;
            let existing = itemsByDateMap[itemDay];
            if (existing == undefined) {
                itemsByDateArray.push(existing = itemsByDateMap[itemDay] = {
                    createdDateStr: item.createdDateStr,
                    createdTimeStr: item.createdTimeStr,
                    itemDay: item.itemDay,
                    id: itemDay,
                    key: itemDay,
                    videos: []
                });
            }
            existing.videos.push(item);
        }
        itemsByDateArray.sort((a, b) => {
            //return a.key < b.key ? -1 : (a.key > b.key ? 1 : 0);
            return a.key < b.key ? 1 : (a.key > b.key ? -1 : 0);
        });
        items = itemsByDateArray.map((item) => {
            return (<MVideosOnDate item={item} key={item.id} selectedDateItem={selectedDateItem} selectDateItem={selectDateItem}
                currentVideo={currentVideo} playVideo={playVideo}
                onTimeUpdate={onTimeUpdate}
                onDelete={onDelete}
                onReallyDelete={onReallyDelete}
                itemToDelete={itemToDelete}
                authToken={authToken}
                canDelete={canDelete}
            />);
        });
    }
    else {
        items = data.map((item) => {
            return (<MVideo item={item} key={item.id}
                currentVideo={currentVideo} playVideo={playVideo}
                onTimeUpdate={onTimeUpdate}
                byDate={false}
                onDelete={onDelete}
                onReallyDelete={onReallyDelete}
                itemToDelete={itemToDelete}
                authToken={authToken}
                canDelete={canDelete}
            />);
        });
    }
    return (<div style={{ height: "100%" }} className="gtfsListNoMaxHeight">{items}</div>);
};

class MVideoVideos extends React.Component {
    constructor(props) {
        super(props);
        this.mapFeatures = VideoMapFeatures({ initiallyVisible: true, onPostCompose: this.onPostCompose.bind(this) });
        this.emptyState = {
            data: [], currentVideo: undefined, byDate: true, trackPlaying: true, /*selectedDateItem: undefined, */trackCoords: undefined, trackTimeStamps: undefined,
            itemToDelete: undefined
        };
        this.authToken = undefined;
        this.state = Object.assign({}, this.emptyState);
        //this.clearState();
        mvideoVideos = this;
    };
    componentDidMount() {
        this.authenticate();
        //this.refresh();
    };
    setStateData(data) { this.state.data = data; this.refreshSetState(); };
    refreshSetState() {
        this.setState(Object.assign({}, this.state));
        this.mapFeatures.Update(this.state.trackCoords);
    };
    handleUpdate() { this.refreshSetState(); };
    clearState() {
        this.state = Object.assign(this.state, this.emptyState);
        this.refreshSetState();
    };
    refresh() {
        this.clearState();
        let endpoint = mvideoServer + '/api/videos/?format=json&ordering=-created';

//        return axios.get(endpoint).then((res) => {
        return axios({
            method: 'get',
            url: endpoint,
            data: null/*,
            withCredentials: true,
            headers: {
                "Authorization": "Token a4c8ddfaf51bbdc48300c970f03a7c471bf3ebf4"
            }*/
        }).then((res) => {
            let data = res ? res.data : [];

            /*
            created: "2018-06-14T13:27:19.079427Z"
            name: "MPV-3-InsideCam"
            thumbnail: "/srv/videos/d8291c02-6fd1-11e8-afbc-e114563785a9__MPV-3-InsideCam__.png"
            url: "/srv/videos/d8291c02-6fd1-11e8-afbc-e114563785a9__MPV-3-InsideCam__.webm"
            uuid: "d8291c02-6fd1-11e8-afbc-e114563785a9"
            */

            for (let i in data) {
                let d = data[i];
                d.key = d.id = d.uuid;
                d.createdDate = new Date(d.created);
                d.createdYYYYMMDD = tf.js.GetYYYYMMDDStr(d.createdDate);
                //012345678
                //20180101
                d.createdDateStr = d.createdYYYYMMDD.substring(4, 6) + '-' + d.createdYYYYMMDD.substring(6, 8) + '-' + d.createdYYYYMMDD.substring(0, 4);
                d.createdTimeStr = tf.js.GetAMPMHourWithSeconds(d.createdDate);
                d.playPos = 0;
                d.newVideo = false;
                d.adjustedVideoDuration = false;
            }
            this.setStateData(data);
        }).catch(err => {
            console.log(err.message);
        });
    };
    selectDateItem(dateItem) {
        this.state.selectedDateItem = dateItem;
        this.state.currentVideo = undefined;
        this.state.trackCoords = undefined;
        this.state.trackTimeStamps = undefined;
        this.refreshSetState();
    };
    playVideo(videoItem) {
        this.state.currentVideo = undefined;
        this.state.trackCoords = undefined;
        this.state.trackTimeStamps = undefined;
        this.refreshSetState();
        let endpoint = mvideoServer + '/api/tracks/' + videoItem.uuid + '?format=json';
        return axios.get(endpoint).then((res) => {
            let data = res ? res.data : [];
            if (data && data.uuid == videoItem.uuid) {
                if (tf.js.GetIsNonEmptyArray(data.path)) {
                    let nPath = data.path.length;
                    if (tf.js.GetIsArrayWithLength(data.timestamps, nPath)) {
                        let trackCoords = [];
                        let trackTimeStamps = [];
                        let firstTimeStampTime = new Date(data.timestamps[0]).getTime();
                        for (let i = 0; i < nPath; ++i) {
                            let cpath = data.path[i], ctimestamp = data.timestamps[i];
                            trackCoords.push([parseFloat(cpath.longitude), parseFloat(cpath.latitude)]);
                            let thisTimeStampTime = new Date(ctimestamp).getTime();
                            trackTimeStamps.push(thisTimeStampTime - firstTimeStampTime);
                        }
                        this.state.trackCoords = trackCoords;
                        this.state.trackTimeStamps = trackTimeStamps;
                    }
                }
            }
            this.state.currentVideo = videoItem;
            this.refreshSetState();
        }).catch(err => {
            console.log(err.message);
            this.state.currentVideo = videoItem;
            this.refreshSetState();
        });
    };
    /*onTimeUpdate(ev, videoItem) {
        if (ev.target.duration == Infinity) {
            ev.target.currentTime = 1000000000;
        }
        else if (ev.target.currentTime == ev.target.duration) {
            videoItem.playPos = ev.target.currentTime;
            ev.target.currentTime = 0;
            ev.target.play();
        }
        this.mapFeatures.Render();
    };*/
    onTimeUpdate(ev, videoItem) {
        if (videoItem.newVideo) {
            if (ev.target.duration == Infinity) {
                ev.target.currentTime = 1000000000;
                videoItem.adjustedVideoDuration = true;
            }
            else if (videoItem.adjustedVideoDuration) {
                ev.target.currentTime = 0;
                ev.target.play();
                videoItem.newVideo = false;
            }
            else {
                videoItem.newVideo = false;
                ev.target.currentTime = videoItem.playPos;
            }
        }
        else {
            if (ev.target.currentTime == ev.target.duration) {
                ev.target.currentTime = 0;
                ev.target.play();
            }
            videoItem.playPos = ev.target.currentTime;
        }
        this.mapFeatures.Render();
    };
    positionAt(seconds) {
        let currentVideo = this.state.currentVideo;
        let timeStamps = this.state.trackTimeStamps;
        let trackCoords = this.state.trackCoords;
        let nextHistoryIndex, prevHistoryIndex, coords;
        if (currentVideo && timeStamps && trackCoords) {
            let len = trackCoords.length;
            let atTimeMillis = seconds * 1000;
            let index = tf.js.BinarySearch(timeStamps, atTimeMillis, function (a, b) { return a - b; });
            if (index < 0) {
                let prevCoords, prevMillis, nextCoords, nextMillis;
                index = -(index + 1);
                let coordsPrev = trackCoords[index - 1], coordsNext = trackCoords[index];
                let timeStampPrev = timeStamps[index - 1], timeStampNext = timeStamps[index];
                if (index > 0) { prevCoords = coordsPrev; prevMillis = timeStampPrev; prevHistoryIndex = index - 1; }
                if (index < len) { nextCoords = coordsNext; nextMillis = timeStampNext; }
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
                coords = trackCoords[index];
                if (index > 0) { prevHistoryIndex = index - 1; }
                if (index + 1 < len) { nextHistoryIndex = index + 1; }
            }
        }
        return { coords: coords, nextHistoryIndex: nextHistoryIndex, prevHistoryIndex: prevHistoryIndex };
    };
    onPostCompose(notification) {
        let currentVideo = this.state.currentVideo;
        if (currentVideo) {
            let videoId = makeVideoIdForItem(currentVideo);
            let videoElem = document.getElementById(videoId);
            if (videoElem) {
                let trackDate = new Date(currentVideo.createdDate);
                let trackRecord = this.positionAt(videoElem.currentTime);
                if (trackRecord && trackRecord.coords) {
                    this.mapFeatures.SetBusFeatureCoords(trackRecord.coords);
                    if (this.state.trackPlaying) {
                        this.mapFeatures.PanToCoords(trackRecord.coords);
                    }
                }
                //console.log('position bus at:' + trackDate);
                //if (!videoElem.paused) { notification.continueAnimation(); }
            }
        }
    };
    onDelete(item) {
        if (item == this.state.itemToDelete) { item = undefined; }
        this.state.itemToDelete = item;
        this.refreshSetState();
    };
    authenticate() {
        let endpoint = mvideoServer + '/api-token-auth/';
        //let data = { username: 'test', password: 'notakula4less' };
        //let data = { username: 'leon', password: 'notakula4less' };
        let data = { username: 'leo', password: 'notakula4less' };
        this.authToken = undefined;
        this.canDelete = false;
        return axios.post(endpoint, data).then((res) => {
            let res_data = res.data;
            this.authToken = res_data.token;
            this.canDelete = res_data.can_delete;
            this.userName = res_data.user_name;
            this.userEmail = res.data.email;
            console.log('auth token: ' + this.authToken);
        }).catch(err => {
            console.log(err.message);
        }).then(() => {
            this.refresh();
        });
    };
    onReallyDelete(item) {
        if (item == this.state.itemToDelete) {
            this.state.itemToDelete = null;
            this.refreshSetState();
            if (this.canDelete) {
                let endpoint = mvideoServer + '/api/videos/' + item.key;
                return axios.delete(endpoint, {
                    headers: { "Authorization": "Token " + this.authToken }
                }).then((res) => {
                }).catch(err => {
                    console.log(err.message);
                }).then(() => {
                    this.refresh();
                });
            }
        }
    };
    testGetCookie() {
        //let data = { username: 'leo', password: 'notakula4less' };
        //let endpoint = mvideoServer + '/api/tracks/d8d0ceaf-7548-4f0d-81b0-30ffdd80825c';
        let endpoint = mvideoServer + '/api/tracks/';
        let headerauth = { "Authorization": "Token " + this.authToken };
        let uuid = 'd8d0ceaf-7548-4f0d-81b0-30ffdd80825c';
        return axios.post(endpoint, { data: { uuid: uuid } }, { headers: headerauth }).then((res) => {
            console.log('here');
        }).catch(err => {
            console.log(err.message);
        });
    };
    test() {
        this.testGetCookie();
    };
    render() {
        let heightTop = 90;
        return (
            <div style={{ height: "100%", overflow: "hidden" }}>
                <div style={{ height: heightTop + "px" }}>
                    <Title title="Archived Videos" count={this.state.data.length} />
                    <BarButton value="TEST" title="Test stuff" onClick={this.test.bind(this)} />
                    <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                    <LabeledCheckBox
                        id={'groupByDateId'} title={'Group videos by date'} label={'Group'} checked={this.state.byDate}
                        onChange={e => {
                            this.state.byDate = !this.state.byDate;
                            this.refreshSetState();
                        }}
                    />
                    <LabeledCheckBox
                        id={'trackPlayingId'} title={'Track vehicle on map when playing video'} label={'Track'} checked={this.state.trackPlaying}
                        onChange={e => {
                            this.state.trackPlaying = !this.state.trackPlaying;
                            this.forceUpdate();
                            //this.setState(this.state);
                            //this.refreshSetState();
                        }}
                    />
                </div>
                <div style={{ height: "calc(100% - " + (heightTop + 10) + "px)", overflowY: "auto" }}>
                    <MVideoList
                        data={this.state.data}
                        byDate={this.state.byDate}
                        authToken={this.authToken}
                        canDelete={this.canDelete}
                        selectedDateItem={this.state.selectedDateItem}
                        selectDateItem={this.selectDateItem.bind(this)}
                        itemToDelete={this.state.itemToDelete}
                        currentVideo={this.state.currentVideo}
                        playVideo={this.playVideo.bind(this)}
                        onTimeUpdate={this.onTimeUpdate.bind(this)}
                        onDelete={this.onDelete.bind(this)}
                        onReallyDelete={this.onReallyDelete.bind(this)}
                    />
                </div>
            </div>
        );
    };
};
