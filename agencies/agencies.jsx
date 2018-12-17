"use strict";

const AgenciesMapFeatures = function (options) {
    let theThis = this; if (!(theThis instanceof AgenciesMapFeatures)) { return new AgenciesMapFeatures(options); }
    let map, layer;
    let mapFeatures, lastDragged;

    this.SetVisible = (bool) => { if (layer) { layer.SetVisible(bool); } return theThis.GetVisible() };
    this.GetVisible = () => { return layer ? layer.GetIsVisible() : true };

    this.PanTo = item => {
        if (item && tf.js.GetIsArrayWithMinLength(item.center, 2)) {
            map.AnimatedSetCenterIfDestVisible(item.center);
        }
    };

    const initialize = () => {
        let layerSettings = {
            name: "agencies", isVisible: true, isHidden: true,
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
        //map.AddListener(tf.consts.mapFeatureClickEvent, onMapFeatureClick);
    };

    const tryInitialize = () => {
        if (getGlobalMapApp()) { initialize(); } else { setTimeout(() => { return tryInitialize(); }, 500); }
    };

    tryInitialize();
};

const Agency = ({ item, remove, change, update, panTo, edit }) => {
    let marginPx = commonStyles.marginPx;
    let displayDel = item.acceptsPost ? "inline-block" : "none";
    let agencyNameId = item.id + 'agencyName';
    return (
        <div className="gtfsListItem">
            <label style={{ margin: marginPx }} htmlFor={item.id + 'prefix'} title='Prefix uniquely identifies the agency' ><small>prefix</small>
                <input style={{ marginLeft: '10px' }} className="" type="button" onClick={() => {
                    panTo(item);
                    //document.getElementById(agencyNameId).select();
                    //document.execCommand('copy');
                }} id={item.id + 'prefix'} value={item.prefix} title="Center Map to Agency" />
            </label>

            <label style={{ margin: marginPx }} htmlFor={item.id + 'lastUpdated'}><small>last_updated</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '100px', fontSize: '110%' }} className="" id={item.id + 'lastUpdated'} >{item.last_updated}</div>
            </label>

            <label htmlFor={item.id + 'acceptsPost'} style={{ margin: marginPx }} title='Read only: whether the agency can be edited remotely' ><small>accepts_post</small>
                <input style={{ margin: marginPx }} checked={item.acceptsPost} className="dayOfWeekCheckBox" type="checkbox" id={item.id + 'acceptsPost'}
                    onChange={() => { return false; }}
                    onClick={() => { return false; }}
                />
            </label>

            <label htmlFor={item.id + 'hasRTBuses'} style={{ margin: marginPx }} title='Read only: whether agency real time bus tracking is available' ><small>has_rt_buses</small>
                <input style={{ margin: marginPx }} checked={item.hasRTBuses} className="dayOfWeekCheckBox" type="checkbox" id={item.id + 'hasRTBuses'}
                    onChange={() => { return false; }}
                    onClick={() => { return false; }}
                />
            </label>

            <label htmlFor={item.id + 'centerLat'} style={{ margin: marginPx }} title="Read only: calculated center latitude" ><small>center_lat</small>
                <input readOnly="true" style={{ margin: marginPx, width: '80px' }} value={item.center[1] + ''} className="" type="text" id={item.id + 'centerLat'} />
            </label>

            <label htmlFor={item.id + 'centerLon'} style={{ margin: marginPx }} title="Read only: calculated center longitude" ><small>center_lon</small>
                <input readOnly="true" style={{ margin: marginPx, width: '80px' }} value={item.center[0] + ''} className="" type="text" id={item.id + 'centerLon'} />
            </label>

            <label htmlFor={item.id + 'maxNumberOfHistoryHours'} style={{ margin: marginPx }} title="Maximum number of bus tracking history hours to store"><small>max_history_hours</small>
                <input style={{ margin: marginPx, width: '40px' }} value={item.maxNumberOfHistoryHours + ''} className="" type="text" id={item.id + 'maxNumberOfHistoryHours'}
                    onBlur={() => { if (item._needChange) { delete item._needChange; change(item); } }}
                    onChange={(event) => {
                        let newValue = tf.js.GetNonNegativeIntFrom(parseInt(event.target.value, 10), 0);
                        if (item.maxNumberOfHistoryHours != newValue) { item._needChange = true; item.maxNumberOfHistoryHours = newValue; update(); }
                    }} />
            </label>

            <label htmlFor={item.id + 'isStage'} style={{ display: displayDel, margin: marginPx }} title='By default, Stage agencies are not included in Trip planning / directions'><small>is_stage</small>
                <input style={{ margin: marginPx }} checked={item.isStage} className="dayOfWeekCheckBox" type="checkbox" id={item.id + 'isStage'}
                    onChange={() => { item.isStage = !item.isStage; return change(item); }} />
            </label>

            <label title="Agency name for display by frontend applications" htmlFor={agencyNameId} style={{ margin: marginPx }}><small>agency_name</small>
                <input style={{ margin: marginPx, width: '280px' }} value={item.name} className="" type="text" id={agencyNameId}
                    onBlur={() => { if (item._needChange) { item._needChange = false; change(item); } }}
                    onChange={(event) => { if (item.name != event.target.value) { item._needChange = true; item.name = event.target.value; update(); } }} />
            </label>

            <label title="Agency region for display by frontend applications" htmlFor={item.id + 'agencyRegion'} style={{ margin: marginPx }}><small>agency_region</small>
                <input maxLength="2" style={{ margin: marginPx, width: '30px' }} value={item.region} className="" type="text" id={item.id + 'agencyRegion'}
                    onBlur={() => { if (item._needChange) { item._needChange = false; change(item); } }}
                    onChange={(event) => { if (item.region != event.target.value) { item._needChange = true; item.region = event.target.value; update(); } }} />
            </label>

            <input style={{ margin: marginPx, display: displayDel }} type="button" id="{item.id + 'edit'}" onClick={() => { edit(item) }} value="Edit" title="Edit GTFS" />

            <input style={{display: displayDel}} className="delButton" type="button" id="{item.id + 'delete'}" onClick={() => { remove(item) }} value="Del" title="Delete without confirmation!" />

        </div>
    );
};

const AgenciesList = ({ data, remove, change, update, panTo, edit }) => {
    const items = data.map((item) => {
        return (<Agency item={item} key={item.id}
            remove={remove}
            change={change}
            update={update}
            panTo={panTo}
            edit={edit}
        />);
    });
    return (<div style={{ maxHeight: "initial" }} className="gtfsList">{items}</div>);
};

class TransitAgencies extends React.Component {
    constructor(props) {
        super(props);
        this.emailInputId = "emailInputId";
        this.passwordInputId = "passwordInputId";
        this.newAgencyInputId = "newAgencyInputId";
        this.mapFeatures = AgenciesMapFeatures({ });
        this.state = { data: [] };
        transitAgencies = this;
    };
    onDrag = (notification) => {
        return;
    };
    componentDidMount() { this.refresh(); };
    setStateData(data) { this.state.data = data; this.refreshSetState(); };
    refreshSetState() {
        this.setState(Object.assign({}, this.state));
    };
    refresh() {
        let endpoint = 'agencies?include_stage=true';
        return axios.get(TransitAPI + endpoint).then((res) => {
            if (res.data) {
                for (var i in res.data) { res.data[i].id = res.data[i].prefix; }
                res.data.sort((a, b) => { return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0) ; });
                this.setStateData(res.data);
            }
        }).catch(err => {
            console.log(err.message);
        });
    };
    getEndPointStart(item) {
        let authForm = gtfsLogin.getAuthForm();
        return 'agency?agency=' + item.prefix + '&email=' + authForm.email + '&password=' + authForm.password;
    };
    handleChange(item) {
        this.refreshSetState();
        let endpoint = this.getEndPointStart(item);
        endpoint += '&name=' + item.name + '&region=' + item.region + '&max_number_of_history_hours=' + item.maxNumberOfHistoryHours + '&isStage=' + (item.isStage ? 'true' : 'false');
        return axios.put(TransitAPI + endpoint).then((res) => {
            this.refresh();
        }).catch(err => {
            console.log(err.message);
        });
    };
    edit(item) {
        window.open("../gtfseditor/index.html?agency=" + item.prefix, "_blank");
    };
    handleRemove(item) {
        let endpoint = this.getEndPointStart(item);
        return axios.delete(TransitAPI + endpoint).then((res) => {
            this.refresh();
        }).catch(err => {
            console.log(err.message);
        });
    };
    handleUpdate() { this.refreshSetState(); };
    panTo(item) {
        this.mapFeatures.PanTo(item);
    };
    createAgency(value) {
        if (value && value.length > 2) {
            value = value.toUpperCase();
            for (let i in this.state.data) { if (value == this.state.data[i].prefix) { return; } }
            let item = { prefix: value, name: 'new agency', region: '??', isStage: true };
            this.handleChange(item);
        }
    };
    onNewAgencyInput(notification) {
        if (notification && notification.inputElement) {
            let inputElement = notification.inputElement, regex = /^[a-zA-Z_]+$/;
            if (regex.test(inputElement.value) !== true) { inputElement.value = inputElement.value.replace(/[^a-zA-Z_]+/, ''); }
        }
    };
    render() {
        return (
            <div>
                <Title title="GTFS Agencies" count={this.state.data.length} />
                <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                <p></p>
                <SingleLineInputForm
                    inputId={this.newAgencyInputId}
                    inputLabel="Type a prefix and press enter to create a new agency"
                    sendSubmitValue={this.createAgency.bind(this)}
                    maxLength="5"
                    onInput={this.onNewAgencyInput.bind(this)}
                />
                <AgenciesList
                    data={this.state.data}
                    remove={this.handleRemove.bind(this)}
                    change={this.handleChange.bind(this)}
                    update={this.handleUpdate.bind(this)}
                    panTo={this.panTo.bind(this)}
                    edit={this.edit.bind(this)}
                />
            </div>
        );
    };
};

