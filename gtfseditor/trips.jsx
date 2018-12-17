"use strict";

const Trip = ({ item, change, remove, update }) => {
    let marginPx = commonStyles.marginPx;
    let visibleId = item.id + 'visible';
    let expandedId = item.id + 'expanded';
    let serviceId = item.id + 'service';
    let routeId = item.id + 'route';
    let sseqId = item.id + 'sseq';
    let incMinutesId = item.id + 'incMinutes';
    let nTripsId = item.id + 'nTrips';
    let firstStartTimeId = item.id + 'firstStartTime';
    let firstEndTimeId = item.id + 'firstEndTime';
    let lastStartTimeId = item.id + 'lastStartTime';
    let lastEndTimeId = item.id + 'lastEndTime';

    let serviceName = gtfsCalendar.getServiceIdForId(item.service_id);
    let routeName = gtfsRoutes.getRouteShortNameForId(item.route_id);
    let sseqName = gtfsStopSequences.getStopSequenceNameForId(item.stop_sequence_id);

    let firstStartTime = tf.js.TranslateHourMinSec(item.start_time_hms).HM;
    let firstEndTime = firstStartTime;
    let incMinutes = item.inc_hms / 60;

    let sseq = gtfsStopSequences.getStopSequenceItemForId(item.stop_sequence_id);

    let durationHMS = 0;

    if (sseq && tf.js.GetIsNonEmptyArray(sseq.stop_ids)) {
        let len = sseq.stop_ids.length;
        durationHMS = sseq.stop_ids[len - 1].offset_minutes * 60;
        firstEndTime = tf.js.TranslateHourMinSec(item.start_time_hms + durationHMS).HM;
    }

    let nTripsUse = item.ntrips > 0 ? item.ntrips - 1 : 0;
    let firstToLastOffsetHMS = nTripsUse * item.inc_hms;
    let lastStartTime = item.start_time_hms + firstToLastOffsetHMS;
    let lastEndTime = lastStartTime + durationHMS;

    lastStartTime = tf.js.TranslateHourMinSec(lastStartTime).HM;
    lastEndTime = tf.js.TranslateHourMinSec(lastEndTime).HM;

    return (
        <div className="gtfsListItem">

            <label title="Calendar" style={{ margin: marginPx }} htmlFor={serviceId}><small>service_id</small>
                <div style={{ display: 'inline-block', margin: marginPx, fontSize: '110%' }} className="" id={serviceId} >{serviceName}</div>
            </label>

            <label title="Route" style={{ margin: marginPx }} htmlFor={routeId}><small>route_short_name</small>
                <div style={{ display: 'inline-block', margin: marginPx, fontSize: '110%' }} className="" id={routeId} >{routeName}</div>
            </label>

            <label title="Stop Sequence" style={{ margin: marginPx }} htmlFor={sseqId}><small>sseq_name</small>
                <div style={{ display: 'inline-block', margin: marginPx, fontSize: '110%' }} className="" id={sseqId} >{sseqName}</div>
            </label>

            <label title="The Trip headsign can be between 10 to 20 characters long" htmlFor={item.id + 'headsign'} style={{ margin: marginPx }}><small>trip_headsign</small>
                <input style={{ margin: marginPx, width: '100px' }} value={item.headsign} className="" type="text" id={item.id + 'headsign'}
                    onBlur={() => { if (item._needChange) { delete item._needChange; change(item); } }}
                    onChange={(event) => { if (item.headsign != event.target.value) { item._needChange = true; item.headsign = event.target.value; update(); } }} />
            </label>

            <label title="First Trip start time" style={{ margin: marginPx }} htmlFor={firstStartTimeId}><small>first_start</small>
                <div style={{ display: 'inline-block', margin: marginPx, fontSize: '110%' }} className="" id={firstStartTimeId} >{firstStartTime}</div>
            </label>

            <label title="First Trip end time" style={{ margin: marginPx }} htmlFor={firstEndTimeId}><small>first_end</small>
                <div style={{ display: 'inline-block', margin: marginPx, fontSize: '110%' }} className="" id={firstEndTimeId} >{firstEndTime}</div>
            </label>

            <label title="Last Trip start time" style={{ margin: marginPx }} htmlFor={lastStartTimeId}><small>last_start</small>
                <div style={{ display: 'inline-block', margin: marginPx, fontSize: '110%' }} className="" id={lastStartTimeId} >{lastStartTime}</div>
            </label>

            <label title="Last Trip end time" style={{ margin: marginPx }} htmlFor={lastEndTimeId}><small>last_end</small>
                <div style={{ display: 'inline-block', margin: marginPx, fontSize: '110%' }} className="" id={lastEndTimeId} >{lastEndTime}</div>
            </label>

            <label title="Minutes between trips" style={{ margin: marginPx }} htmlFor={incMinutesId}><small>inc_minutes</small>
                <div style={{ display: 'inline-block', margin: marginPx, fontSize: '110%' }} className="" id={incMinutesId} >{incMinutes}</div>
            </label>

            <label title="Number of trips" style={{ margin: marginPx }} htmlFor={nTripsId}><small>ntrips</small>
                <div style={{ display: 'inline-block', margin: marginPx, fontSize: '110%' }} className="" id={nTripsId} >{item.ntrips}</div>
            </label>

            <input className="delButton" type="button" onClick={() => { remove(item.id) }} value="Del" title="Delete without confirmation!" />

        </div>
    );
};

const TripsList = ({ data, change, remove, update }) => {
    const items = data.map((item) => {
        return (<Trip item={item} key={item.id} remove={remove} change={change} update={update} />);
    });
    return (<div className="gtfsList">{items}</div>);
};

class GTFSTrips extends React.Component {
    routeNameSelect = null;
    serviceIdSelect = null;
    stopSequenceNameSelect = null;
    startTripTimeSelect = null;
    constructor(props) {
        super(props);
        this.state = { data: [] };
        this.JSONInputId = "tripsJSONInput";
        this.crudClient = tf.services.CRUDClient({ tableName: this.makeTableName(globalAgencyPrefix), serverURL: CRUDAPI, authForm: gtfsLogin.getAuthForm() });
        gtfsTrips = this;
    };

    makeTableName(agencyPrefix) { return getGTFSTableName(agencyPrefix, "trips"); }
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

    componentDidMount() { this.tryInitialRefresh(); };
    tryInitialRefresh() {
        if (gtfsCalendar && gtfsStopSequences && gtfsRoutes) {
            this.refresh();
            this.onCalendarChanged();
            this.onStopSequencesChanged();
            this.onRoutesChanged();
            if (gtfsPostAgency === undefined) { ReactDOM.render(<GTFSPostAgency />, document.getElementById('postAgencyContainer')); }
        }
        else {
            console.log('trips delayed initial refresh');
            setTimeout(() => { this.tryInitialRefresh(); }, 500);
        }
    };
    setStateData(data) {
        this.setState({ data: data });
    };
    refreshSetState() { this.setStateData(this.state.data); };
    onCalendarChanged() {
        this.serviceIdSelect.handleUpdate();
        this.refresh();
    };
    onStopSequencesChanged() {
        this.stopSequenceNameSelect.handleUpdate();
        this.refresh();
    };
    onRoutesChanged() {
        this.routeNameSelect.handleUpdate();
        this.refresh();
    };
    handleUpdate() { this.refreshSetState(); };
    render() {
        return (
            <div className="gtfsList">
                <Title title="Trip Groups" count={this.state.data.length} />

                <BarButton value="Add" title="Add new Trips" onClick={this.addItem.bind(this)} />

                <GTFSServiceIdSelect ref={node => { this.serviceIdSelect = node; }} />
                <GTFSRouteSelect ref={node => { this.routeNameSelect = node; }} />
                <GTFSStopSequenceSelect ref={node => { this.stopSequenceNameSelect = node; }} />

                <StartTripTimeSelect ref={node => { this.startTripTimeSelect = node; }} />

                <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                <BarButton value="Clear" title="Clear List" onClick={this.clear.bind(this)} />
                <BarButton value="Dump" title="Dump List in JSON format" onClick={this.dump.bind(this)} />
                <p></p>
                <SingleLineInputForm
                    inputId={this.JSONInputId}
                    inputLabel="Type or paste JSON and press enter to replace list"
                    sendSubmitValue={this.updateFromJSON.bind(this)}
                />
                <TripsList
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
        if (this.routeNameSelect.state.selectedId &&
            this.serviceIdSelect.selectedId &&
            this.stopSequenceNameSelect.state.selectedId) {
            let startHMS = (this.startTripTimeSelect.state.startTripHour * 60 + this.startTripTimeSelect.state.startTripMinutes) * 60;
            let incHMS = this.startTripTimeSelect.state.incTripMinutes * 60;
            let nTrips = this.startTripTimeSelect.state.nTripsAdd;
            let sseqName = gtfsStopSequences.getStopSequenceNameForId(this.stopSequenceNameSelect.state.selectedId);
            const record = {
                service_id: gtfsCalendar.getIdForServiceId(this.serviceIdSelect.selectedId),
                route_id: this.routeNameSelect.state.selectedId,
                stop_sequence_id: this.stopSequenceNameSelect.state.selectedId,
                headsign: sseqName,
                start_time_hms: startHMS,
                inc_hms: incHMS,
                ntrips: nTrips
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
