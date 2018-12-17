"use strict";

const Calendar = ({ calendar, change, remove, update }) => {
    let marginPx = commonStyles.marginPx;
    return (
        <div className="gtfsListItem">

            <label style={{ margin: marginPx }} htmlFor={calendar.service_id + 'id'}><small>service_id</small>
            <input style={{ margin: marginPx, width: '100px' }} value={calendar.service_id} className="" id="{calendar.service_id + 'id'}"
                onBlur={() => { if (calendar._needChange) { calendar._needChange = false; change(calendar); } }}
                onChange={(event) => {
                    if (calendar.service_id != event.target.value) { calendar._needChange = true; calendar.service_id = event.target.value; update(); }
                    }} />
            </label>

            <label htmlFor={calendar.service_id + 'mon'} style={{ margin: marginPx }}><small>mon</small>
                <input style={{ margin: marginPx }} checked={calendar.monday} className="dayOfWeekCheckBox" type="checkbox" id={calendar.service_id + 'mon'}
                    onChange={() => { calendar.monday = !calendar.monday; return change(calendar); }} />
            </label>

            <label htmlFor={calendar.service_id + 'tue'} style={{ margin: marginPx }}><small>tue</small>
                <input style={{ margin: marginPx }} checked={calendar.tuesday} className="dayOfWeekCheckBox" type="checkbox" id={calendar.service_id + 'tue'}
                    onChange={() => { calendar.tuesday = !calendar.tuesday; return change(calendar); }} />
            </label>

            <label htmlFor={calendar.service_id + 'wed'} style={{ margin: marginPx }}><small>wed</small>
                <input style={{ margin: marginPx }} checked={calendar.wednesday} className="dayOfWeekCheckBox" type="checkbox" id={calendar.service_id + 'wed'}
                    onChange={() => { calendar.wednesday = !calendar.wednesday; return change(calendar); }} />
            </label>

            <label htmlFor={calendar.service_id + 'thu'} style={{ margin: marginPx }}><small>thu</small>
                <input style={{ margin: marginPx }} checked={calendar.thursday} className="dayOfWeekCheckBox" type="checkbox" id={calendar.service_id + 'thu'}
                    onChange={() => { calendar.thursday = !calendar.thursday; return change(calendar); }} />
            </label>

            <label htmlFor={calendar.service_id + 'fri'} style={{ margin: marginPx }}><small>fri</small>
                <input style={{ margin: marginPx }} checked={calendar.friday} className="dayOfWeekCheckBox" type="checkbox" id={calendar.service_id + 'fri'}
                    onChange={() => { calendar.friday = !calendar.friday; return change(calendar); }} />
            </label>

            <label htmlFor={calendar.service_id + 'sat'} style={{ margin: marginPx }}><small>sat</small>
                <input style={{ margin: marginPx }} checked={calendar.saturday} className="dayOfWeekCheckBox" type="checkbox" id={calendar.service_id + 'sat'}
                    onChange={() => { calendar.saturday = !calendar.saturday; return change(calendar); }} />
            </label>

            <label htmlFor={calendar.service_id + 'sun'} style={{ margin: marginPx }}><small>sun</small>
                <input style={{ margin: marginPx }} checked={calendar.sunday} className="dayOfWeekCheckBox" type="checkbox" id={calendar.service_id + 'sun'}
                    onChange={() => { calendar.sunday = !calendar.sunday; return change(calendar); }} />
            </label>

            <label htmlFor={calendar.service_id + 'start'} style={{ margin: marginPx }}><small>start</small>
            <input style={{ margin: marginPx, width: '80px' }} value={calendar.start_date} className="" type="text" id={calendar.service_id + 'start'}
                onBlur={() => { if (calendar._needChange) { calendar._needChange = false; change(calendar); } }}
                onChange={(event) => { if (calendar.start_date != event.target.value) { calendar._needChange = true; calendar.start_date = event.target.value; update(); } }}
                />
            </label>

            <label htmlFor={calendar.service_id + 'end'} style={{ margin: marginPx }}><small>end</small>
            <input style={{ margin: marginPx, width: '80px' }} value={calendar.end_date} className="" type="text" id={calendar.service_id + 'end'}
                onBlur={() => { if (calendar._needChange) { calendar._needChange = false; change(calendar); } }}
                onChange={(event) => { if (calendar.end_date != event.target.value) { calendar._needChange = true; calendar.end_date = event.target.value; update(); } }}
                />
            </label>

            <input className="delButton" type="button" onClick={() => { remove(calendar.id) }} value="Del" title="Delete without confirmation!" />

        </div>
    );
};

const CalendarList = ({ calendars, change, remove, update }) => {
    const items = calendars.map((calendar) => { return (<Calendar calendar={calendar} key={calendar.id} remove={remove} change={change} update={update} />); });
    return (<div className="gtfsList">{items}</div>);
};

//function onWhatever(notification) { console.log('here'); }

class GTFSCalendar extends React.Component {
    constructor(props) {
        super(props);
        this.state = { data: [] };
        this.JSONInputId = "calendarJSONInput";
        this.crudClient = tf.services.CRUDClient({ tableName: this.makeTableName(globalAgencyPrefix), serverURL: CRUDAPI, authForm: gtfsLogin.getAuthForm() });
        //this.crudClient.ListTables(onWhatever);
        gtfsCalendar = this;
    };

    makeTableName(agencyPrefix) { return getGTFSTableName(agencyPrefix, "calendar"); }
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
    refreshSetState() {
        this.setState(Object.assign({}, this.state));
        this.notifyDependants();
    };
    setStateData(data) { this.state.data = data; this.refreshSetState(); };
    notifyCalendarDates() {
        if (gtfsCalendarDates === undefined) { ReactDOM.render(<GTFSCalendarDates />, document.getElementById('calendarDatesContainer')); }
        else { gtfsCalendarDates.onCalendarChanged(); }
    };
    notifyTrips() { if (gtfsTrips !== undefined) { gtfsTrips.onCalendarChanged(); } };
    notifyDependants() { this.notifyCalendarDates(); this.notifyTrips(); };
    getIdForServiceId(serviceId) { for (let i in this.state.data) { var d = this.state.data[i]; if (d.service_id == serviceId) { return d.id; } } };
    getServiceIdForId(id) { for (let i in this.state.data) { var d = this.state.data[i]; if (d.id == id) { return d.service_id; } } };
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
    addCalendar(val) {
        if (!this.getIdForServiceId(val)) {
            var nowDate = new Date(), oneYearLater = new Date();
            oneYearLater.setFullYear(nowDate.getFullYear() + 1);
            const record = {
                service_id: val,
                start_date: tf.js.GetYYYYMMDDStr(nowDate),
                end_date: tf.js.GetYYYYMMDDStr(oneYearLater)
            };
            this.crudClient.Post(notification => {
                if (notification && notification.ok) {
                    Array.prototype.push.apply(this.state.data, notification.data);
                    this.refreshSetState();
                    this.notifyDependants();
                }
                else {
                    console.log(notification.message);
                    this.refresh();
                }
            }, record);
        }
    };
    handleRemove(id) {
        const remainder = this.state.data.filter((todo) => { if (todo.id !== id) return todo; });
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
                this.notifyDependants();
            }
            else {
                console.log(notification.message);
                this.refresh();
            }
        }, item);
    };
    handleUpdate() { this.refreshSetState(); };
    render() {
        return (
            <div className="gtfsList">
                <Title title="Calendar" count={this.state.data.length} />
                <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                <BarButton value="Clear" title="Clear List" onClick={this.clear.bind(this)} />
                <BarButton value="Dump" title="Dump List JSON into editor" onClick={this.dump.bind(this)} />
                <p></p>
                <SingleLineInputForm
                    inputId={this.JSONInputId}
                    inputLabel="Type or paste JSON and press enter to replace list"
                    sendSubmitValue={this.updateFromJSON.bind(this)}
                />
                <SingleLineInputForm
                    inputId="newCalendarInput"
                    inputLabel="Type a new service id and press enter to add it"
                    sendSubmitValue={this.addCalendar.bind(this)}
                />
                <CalendarList
                    calendars={this.state.data}
                    remove={this.handleRemove.bind(this)}
                    change={this.handleChange.bind(this)}
                    update={this.handleUpdate.bind(this)}
                />
            </div>
        );
    };
};

class GTFSServiceIdSelect extends React.Component {
    selectedId = null;
    constructor(props) {
        super(props);
        this.state = { data: [], serviceIdListProps: null };
        this.fillListProps();
    };
    componentDidMount() { };
    handleUpdate() {
        this.selectedId = undefined;
        this.internalHandleUpdate();
    };
    internalHandleUpdate() {
        this.fillListProps();
        this.setState({ data: this.state.data, serviceIdListProps: this.state.serviceIdListProps });
    };
    render() { return (<ListSelect props={this.state.serviceIdListProps} />); };
    fillListProps() {
        let options = [], index = 0;
        for (let i in gtfsCalendar.state.data) {
            let d = gtfsCalendar.state.data[i], sid = d.service_id;
            options.push({ key: index, value: sid, text: sid });
            ++index;
        }
        if (this.selectedId == undefined) {
            if (options.length) { this.selectedId = options[0].value; } else { this.selectedId = undefined; }
        }
        this.state.serviceIdListProps = {
            name: 'serviceIdSelect',
            title: 'Select a Service ID',
            handleChange: (e) => {
                this.selectedId = e.target.value;
                this.internalHandleUpdate();
            },
            value: this.selectedId,
            options: options
        };
    };
};
