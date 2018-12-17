"use strict";

const Route = ({ item, change, remove, update }) => {
    let marginPx = commonStyles.marginPx;
    let shortNameId = item.id + 'short_name';
    let longNameId = item.id + 'long_name';
    let routeTypeId = item.id + 'route_type';
    let colorId = item.service_id + 'route_color';

    if (item.route_type < 0 || item.route_type > 7) { item.route_type = 3; }
    if (item.route_color === undefined || !typeof item.route_color === "string" || item.route_color.length != 6) {
        console.log('fixed route color');
        item.route_color = "808080";
    }

    let routeTypeListProps = {
        id: routeTypeId,
        name: 'routeType',
        title: 'Select the GTFS type of the route',
        value: item.route_type,
        handleChange: (e) => {
            item.route_type = parseInt(e.target.value, 10);
            update();
        },
        options: [
            { key: '0', value: 0, text: '0 - Tram, Streetcar, Light rail' },
            { key: '1', value: 1, text: '1 - Subway, Metro, underground' },
            { key: '2', value: 2, text: '2 - Rail intercity, long distance' },
            { key: '3', value: 3, text: '3 - Bus short and long routes' },
            { key: '4', value: 4, text: '4 - Ferry short and long distance' },
            { key: '5', value: 5, text: '5 - Cable car street level' },
            { key: '6', value: 6, text: '6 - Gondola suspended cable car' },
            { key: '7', value: 7, text: '7 - Funicular rail for steep inclines' }
        ]
    };

    return (
        <div className="gtfsListItem">

            <label title="The short name should be 2-4 characters long" htmlFor={shortNameId} style={{ margin: marginPx }}><small>route_short_name</small>
                <input style={{ margin: marginPx, width: '40px' }} value={item.route_short_name} className="" type="text" id={shortNameId}
                    onBlur={() => { if (item._needChange) { delete item._needChange; change(item); } }}
                    onChange={(event) => { if (item.route_short_name != event.target.value) { item._needChange = true; item.route_short_name = event.target.value; update(); } }} />
            </label>

            <label title="The long name should not be longer than 30 characters" htmlFor={longNameId} style={{ margin: marginPx }}><small>route_long_name</small>
                <input style={{ margin: marginPx, width: '150px' }} value={item.route_long_name} className="" type="text" id={longNameId}
                    onBlur={() => { if (item._needChange) { delete item._needChange; change(item); } }}
                    onChange={(event) => { if (item.route_long_name != event.target.value) { item._needChange = true; item.route_long_name = event.target.value; update(); } }} />
            </label>

            <label title={routeTypeListProps.title} htmlFor={routeTypeId}><small>route_type</small>
                <ListSelect props={routeTypeListProps} />
            </label>

            <label title="Color of the route in the hex format RRGGBB (without #)"  htmlFor={colorId} style={{ margin: marginPx }}><small>route_color</small>
                <input style={{ margin: marginPx, width: '60px' }} value={item.route_color} className="" type="text" id={colorId}
                    onBlur={() => { if (item._needChange) { delete item._needChange; change(item); } }}
                    onChange={(event) => { if (item.route_color != event.target.value) { item._needChange = true; item.route_color = event.target.value; update(); } }} />
            </label>

            <input className="delButton" type="button" onClick={() => { remove(item.id) }} value="Del" title="Delete without confirmation!" />
        </div>
    );
};

const RoutesList = ({ data, change, remove, update }) => {
    const items = data.map((item) => { return (<Route item={item} key={item.id} remove={remove} change={change} update={update} />); });
    return (<div className="gtfsList">{items}</div>);
};

class GTFSRoutes extends React.Component {
    constructor(props) {
        super(props);
        this.state = { data: [] };
        this.JSONInputId = "routesJSONInput";
        this.crudClient = tf.services.CRUDClient({ tableName: this.makeTableName(globalAgencyPrefix), serverURL: CRUDAPI, authForm: gtfsLogin.getAuthForm() });
        gtfsRoutes = this;
    };

    makeTableName(agencyPrefix) { return getGTFSTableName(agencyPrefix, "routes"); }
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

    componentDidMount() { this.refresh(); };

    getIdForRouteShortName(routeShortName) { for (let i in this.state.data) { let d = this.state.data[i]; if (d.route_short_name == routeShortName) { return d.id; } } };
    getRouteShortNameForId(id) { for (let i in this.state.data) { let d = this.state.data[i]; if (d.id == id) { return d.route_short_name; } } };
    getRouteItemForId(id) { for (let i in this.state.data) { let d = this.state.data[i]; if (d.id == id) { return d; } } };
    refreshSetState() { this.setState(Object.assign({}, this.state)); };
    setStateData(data) {
        this.state.data = data;
        this.refreshSetState();
        this.notifyDependants();
    };
    notifyTrips() { if (gtfsTrips) { gtfsTrips.onRoutesChanged(); } };
    notifyDependants() {
        this.notifyTrips();
    };
    refreshStateData() { this.setStateData(this.state.data); };
    handleUpdate() { this.refreshStateData(); };
    render() {
        return (
            <div className="gtfsList">
                <Title title="Routes" count={this.state.data.length} />
                <BarButton value="Add" title="Add new Route" onClick={this.addItem.bind(this)} />
                <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                <BarButton value="Clear" title="Clear List" onClick={this.clear.bind(this)} />
                <BarButton value="Dump" title="Dump List in JSON format" onClick={this.dump.bind(this)} />
                <p></p>
                <SingleLineInputForm
                    inputId={this.JSONInputId}
                    inputLabel="Type or paste JSON and press enter to replace list"
                    sendSubmitValue={this.updateFromJSON.bind(this)}
                />
                <RoutesList
                    data={this.state.data}
                    remove={this.handleRemove.bind(this)}
                    change={this.handleChange.bind(this)}
                    update={this.handleUpdate.bind(this)}
                />
            </div>
        );
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
        const record = {
            route_short_name: "1",
            route_long_name: "Main Street USA NW",
            route_color: "808080",
            route_type: 3
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
            }
            else {
                console.log(notification.message);
                this.refresh();
            }
        }, item);
    };
};

class GTFSRouteSelect extends React.Component {
    constructor(props) { super(props); this.state = { data: [], listProps: null, selectedId: null }; this.fillListProps(); };
    componentDidMount() { };
    handleUpdate() { this.state.selectedId = undefined; this.internalHandleUpdate(); };
    refreshSetState() { this.setState(Object.assign({}, this.state)); };
    internalHandleUpdate() { this.fillListProps(); this.refreshSetState(); };
    render() { return (<ListSelect props={this.state.listProps} />); };
    fillListProps() {
        let options = [], index = 0;
        for (let i in gtfsRoutes.state.data) {
            let d = gtfsRoutes.state.data[i], route_name = d.route_short_name;
            options.push({ key: index, value: d.id, text: route_name });
            ++index;
        }
        if (this.state.selectedId == undefined) {
            if (options.length) { this.state.selectedId = options[0].value; }
            else { this.state.selectedId = undefined; }
        }
        this.state.listProps = {
            name: 'routeSelect', title: 'Select the short name of a Route',
            handleChange: (e) => { this.state.selectedId = e.target.value; this.internalHandleUpdate(); },
            value: this.state.selectedId, options: options
        };
    };
};
