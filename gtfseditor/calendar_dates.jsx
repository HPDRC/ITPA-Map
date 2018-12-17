"use strict";

const CalendarDate = ({ item, change, remove, update }) => {
    let marginPx = commonStyles.marginPx;
    let serviceId = item.service_id + 'id';
    let dateId = item.service_id + 'date';
    let typeId = item.service_id + 'type';

    item.actualServiceId = gtfsCalendar.getServiceIdForId(item.service_id);
    if (item.exception_type != 1 && item.exception_type != 2) { item.exception_type = 1; }

    let exceptionTypeListProps = {
        id: typeId,
        name: 'exceptionType',
        title: 'Select an exception type',
        value: item.exception_type,
        handleChange: (e) => {
            item.exception_type = parseInt(e.target.value, 10);
            change(item);
        },
        options: [
            { key: '1', value: 1, text: '1 - Service Added' },
            { key: '2', value: 2, text: '2 - Service Unavailable' }
        ]
    };

    return (
        <div className="gtfsListItem">

            <label style={{ margin: marginPx }} htmlFor={serviceId}><small>service_id</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '100px', fontSize: '110%' }} className="" id={serviceId} >{item.actualServiceId}</div>
            </label>

            <label title="type exception date in YYYYMMDD format" htmlFor={dateId} style={{ margin: marginPx }}><small>date</small>
            <input style={{ margin: marginPx, width: '100px' }} value={item.date} className="" type="text" id={dateId}
                onBlur={() => { if (item._needChange) { item._needChange = false; change(item); } }}
                    onChange={(event) => { if (item.date != event.target.value) { item._needChange = true; item.date = event.target.value; update(); } }} />
            </label>

            <label title={exceptionTypeListProps.title} htmlFor={typeId}><small>exception_type</small>
                <ListSelect props={exceptionTypeListProps} />
            </label>

            <input className="delButton" type="button" onClick={() => { remove(item.id) }} value="Del" title="Delete without confirmation!" />

        </div>
    );
};

const CalendarDatesList = ({ data, change, remove, update }) => {
    const items = data.map((item) => { return (<CalendarDate item={item} key={item.id} remove={remove} change={change} update={update} />); });
    return (<div className="gtfsList">{items}</div>);
};

class GTFSCalendarDates extends React.Component {
    serviceIdSelect = 0;
    constructor(props) {
        super(props);
        this.state = { data: [] };
        this.JSONInputId = "calendarDatesJSONInput";
        this.crudClient = tf.services.CRUDClient({ tableName: this.makeTableName(globalAgencyPrefix), serverURL: CRUDAPI, authForm: gtfsLogin.getAuthForm() });
        gtfsCalendarDates = this;
    };

    makeTableName(agencyPrefix) { return getGTFSTableName(agencyPrefix, "calendar_dates"); }
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
    refreshSetState() { this.setState(Object.assign({}, this.state)); };
    setStateData(data) { this.state.data = data; this.refreshSetState(); };
    handleUpdate() { this.refreshSetState(); };
    render() {
        return (
            <div className="gtfsList">
                <Title title="Calendar Dates" count={this.state.data.length} />
                <BarButton value="Add" title="Add new calendar date for selected service id" onClick={this.addItem.bind(this)} />
                <GTFSServiceIdSelect ref={node => { this.serviceIdSelect = node; }} />
                <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                <BarButton value="Clear" title="Clear List" onClick={this.clear.bind(this)} />
                <BarButton value="Dump" title="Dump List in JSON format" onClick={this.dump.bind(this)} />
                <p></p>
                <SingleLineInputForm
                    inputId={this.JSONInputId}
                    inputLabel="Type or paste JSON and press enter to replace list"
                    sendSubmitValue={this.updateFromJSON.bind(this)}
                />
              <CalendarDatesList
                    data={this.state.data}
                    remove={this.handleRemove.bind(this)}
                    change={this.handleChange.bind(this)}
                    update={this.handleUpdate.bind(this)}
                />
            </div>
        );
    };
    onCalendarChangedOngoing() {
        let delIds = [];
        for (var i in this.state.data) {
            var thisD = this.state.data[i];
            if (!gtfsCalendar.getServiceIdForId(thisD.service_id)) {
                delIds.push(thisD.id);
            }
        }
        if (delIds.length > 0) {
            this.crudClient.Del(notification => {
                if (notification && notification.ok) {
                }
                else {
                    console.log(notification.message);
                }
                this.refresh();
            }, delIds);
        }
        else {
            this.refreshSetState();
        }
    };
    onCalendarChanged() {
        this.serviceIdSelect.handleUpdate();
        this.onCalendarChangedOngoing();
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
        var itemId = gtfsCalendar.getIdForServiceId(this.serviceIdSelect.selectedId);
        if (itemId !== undefined) {
            var nowDate = new Date();
            const record = {
                service_id: itemId,
                date: tf.js.GetYYYYMMDDStr(nowDate),
                exception_type: 1
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
