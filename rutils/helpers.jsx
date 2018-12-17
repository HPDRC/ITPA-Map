"use strict";

const serverPrefixes = { dev: "http://192.168.0.105:8080/v1/", centos: "http://192.168.0.81/api/v1/", fiu: "http://transit.cs.fiu.edu/api/v1/" };
const serviceNames = { transit: "transit/", CRUD: "CRUD/", GTFS: "transit/gtfspost" };

//const transitPrefixUse = serverPrefixes.dev;
//const transitPrefixUse = serverPrefixes.centos;
const transitPrefixUse = serverPrefixes.fiu;

//const CRUDPrefixUse = serverPrefixes.dev;
//const CRUDPrefixUse = serverPrefixes.centos;
const CRUDPrefixUse = serverPrefixes.fiu;

//const GTFSPrefixUse = serverPrefixes.dev;
//const GTFSPrefixUse = serverPrefixes.centos;
const GTFSPrefixUse = serverPrefixes.fiu;

const TransitAPI = transitPrefixUse + serviceNames.transit;
const CRUDAPI = CRUDPrefixUse + serviceNames.CRUD;
const GTFSAPI = GTFSPrefixUse + serviceNames.GTFS;

const commonStyles = {
    marginPx: '2px'
};

let globalAgencyPrefix, globalMapApp;

const getGTFSTableName = (agencyPrefix, gtfsSetName) => { return "gtfs_" + agencyPrefix + "_" + gtfsSetName; };

const dataToJSONDump = data => { if (tf.js.GetIsNonEmptyArray(data)) { console.log(JSON.stringify(data)); } };

const remoteDataToJSONDump = crudClient => {
    crudClient.Get(notification => {
        if (notification && notification.ok) { dataToJSONDump(notification.data); }
        else { console.log(notification.message); }
    });
};

const getGlobalMapApp = () => {
    if (!globalMapApp) {
        globalMapApp = window.parent.document.getElementById("mapDiv").contentWindow.globalMapApp;
        if (globalMapApp) {
            let content = globalMapApp.GetContent();
            if (!content || !content.GetMap()) { globalMapApp = undefined; }
        }
    }
    return globalMapApp;
};

const Title = ({ title, count }) => {
    return count !== undefined ? (<div><div><h1>{title} ({count})</h1></div></div>) : (<div><div><h1>{title}</h1></div></div>);
};

const BarButton = ({ value, title, onClick }) => {
    return <TextPressButton text={value} title={title} onClick={onClick}/>
    //return <input style={{ margin: commonStyles.marginPx }} className="" type="button" onClick={() => { onClick(); }} value={value} title={title} />
};

const JustALabel = ({ label, title }) => { return <label style={{ margin: commonStyles.marginPx }} title={title}><small>{label}</small></label> };
const JustASpan = ({ span, title }) => { return <span style={{ cursor: "default", margin: commonStyles.marginPx, display: "inline-block" }} title={title}>{span}</span> };

const LabeledSpan = ({ id, label, title, span, className }) => {
    let marginPx = commonStyles.marginPx;
    if (className === undefined) { className = ""; }
    return (
        <label htmlFor={id} style={{ margin: marginPx }} className={className} title={title}><small>{label}</small>
            <span style={{ margin: marginPx }} type="text" id={id}>{span}</span>
        </label>
    );
};

const LabeledCheckBox = ({ id, label, title, checked, onChange }) => {
    let marginPx = commonStyles.marginPx;
    return (
        <label htmlFor={id} style={{ margin: marginPx }} title={title}><small>{label}</small>
            <input style={{ margin: marginPx }} checked={checked} className="dayOfWeekCheckBox" type="checkbox" id={id}
                onChange={e => onChange(e) } />
        </label>
    );
};

const LabeledTextInput = ({ id, label, title, text, width, onChange, onInput, onBlur }) => {
    let marginPx = commonStyles.marginPx;
    return (
        <label htmlFor={id} style={{ margin: marginPx }} title={title}><small>{label}</small>
            <input style={{ margin: marginPx, width: width }} value={text} className="" type="text" id={id}
                onBlur={e => { if (onBlur) { onBlur(e); } }}
                onChange={e => { if (onChange) { onChange(e, e.target.value); } }}
                onInput={event => {
                    if (onInput) {
                        let inputElement = document.getElementById(id);
                        if (inputElement) {
                            onInput({ sender: this, inputElement: inputElement, event: event });
                        }
                    }
                }}
            />
        </label>
    );
};

const LabeledSlider = ({ id, label, title, minValue, maxValue, value, onChange}) => {
    return (
        <label style={{ margin: commonStyles.marginPx, width: '96%' }} htmlFor={id} title={title} ><small>{label}</small>
            <input style={{ marginLeft: '0px' }} className="" type="range"
                id={id} min={minValue} max={maxValue} value={value}
                onChange={(e) => { return onChange(e, parseInt(e.target.value, 10)); }}
            />
        </label>
    );
};

const TextPressButton = ({ text, title, onClick, className }) => {
    let marginPx = commonStyles.marginPx;
    if (className == undefined) { className = ""; }
    return (
        <input style={{ margin: marginPx }} className={className} type="button" onClick={(e) => { onClick(e); }} value={text} title={title} />
    );
};

const SingleLineInputForm = ({ sendSubmitValue, inputId, inputLabel, inputType, maxLength, onInput, initialValue, readOnly }) => {
    let input, inputTypeUse = inputType ? inputType : "text", maxLengthUse = maxLength !== undefined ? maxLength : 524288;
    let onInputCB = tf.js.GetFunctionOrNull(onInput);
    initialValue = tf.js.GetNonEmptyString(initialValue, "");
    if (!readOnly) { readOnly = false; }
    return (
        <form style={{ overflow: 'hidden', marginBottom: "10px" }} onSubmit={(e) => {
            e.preventDefault();
            if (sendSubmitValue) {
                if (!sendSubmitValue(input.value)) {
                    input.value = '';
                }
            }
        }}>
            <label style={{ width: '100%' }} htmlFor={inputId}><small>{inputLabel}</small>
                <input readOnly={readOnly} type={inputTypeUse} maxLength={maxLengthUse} className="form-control col-md-12" id={inputId} value={initialValue} ref={node => { input = node; }}
                    onChange={event => { }}
                    onInput={event => {
                        if (onInputCB) {
                            let inputElement = document.getElementById(inputId);
                            if (inputElement) {
                                onInputCB({ sender: this, inputElement: inputElement });
                            }
                        }
                    }}
                />
            </label>
        </form>
    );
};

const EmailPasswordInputForm = ({ sendSubmitValue, emailId, passwordId }) => {
    let emailInput, passwordInput;
    return (
        <form style={{ overflow: 'hidden', marginBottom: "10px" }} onSubmit={(e) => {
            e.preventDefault();
            sendSubmitValue();
        }}>
            <label style={{ width: '100%' }} htmlFor={emailId}><small>type your email address</small>
                <input type="text" className="form-control col-md-12" id={emailId} ref={node => { emailInput = node; }} />
            </label>
            <label style={{ width: '100%' }} htmlFor={passwordId}><small>and your password</small>
                <input type="password" className="form-control col-md-12" id={passwordId} ref={node => { passwordInput = node; }} />
            </label>
            <input type="submit" value="Login" title="Login" />
        </form>
    );
};

const ListSelect = ({ props }) => {
    return props !== undefined ? (
        <select style={{ margin: '6px' }} id={props.id !== undefined ? props.id : ""} name={props.name} value={props.value} title={props.title} onChange={event => { props.handleChange(event); }}>
            {props.options.map(opt => <option key={opt.key} value={opt.value} > {opt.text}</option>)}
        </select>
    ) : (<br />);
};

class StartTripTimeSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            startTripHour: 6,
            startTripMinutes: 0,
            incTripMinutes: 30,
            nTripsAdd: 1,
            startTripHourId: "startTripHour",
            startTripMinutesId: "startTripMinutes",
            incTripMinutesId: "incTripMinutes",
            nTripsAddId: "nTripsAdd"
        };
        this.fillStartHourListProps();
        this.fillStartMinutesListProps();
    };
    componentDidMount() { };
    refreshSetStateData() { this.setState(Object.assign({}, this.state)); }
    render() {
        let marginPx = commonStyles.marginPx;
        return (
            <div>
                <label title="Select first trip start hour" htmlFor={this.state.startTripHourId}><small>start_hour</small>
                    <ListSelect props={this.state.startHourListProps} />
                </label>
                <label title="Select first trip start hour" htmlFor={this.state.startTripMinutesId}><small>start_minutes</small>
                    <ListSelect props={this.state.startMinuteListProps} />
                </label>
                <label title="Select minutes interval between trips" htmlFor={this.state.incTripMinutesId}><small>inc_minutes</small>
                    <input style={{ margin: marginPx, width: '30px' }} value={this.state.incTripMinutes + ''} className="" type="text" id={this.state.incTripMinutesId}
                        onChange={(event) => {
                            this.state.incTripMinutes = tf.js.GetNonNegativeIntFrom(event.target.value, 0);
                            this.refreshSetStateData();
                        }}
                    />
                </label>
                <label title="Select number of trips to add" htmlFor={this.state.nTripsAdd}><small>ntrips_add</small>
                    <input style={{ margin: marginPx, width: '30px' }} value={this.state.nTripsAdd + ''} className="" type="text" id={this.state.nTripsAddId}
                        onChange={(event) => {
                            this.state.nTripsAdd = tf.js.GetIntNumberInRange(event.target.value, 0, 10000, 0);
                            this.refreshSetStateData();
                        }}
                    />
                </label>
            </div>
        );
    };
    fillStartHourListProps() {
        let options = [];
        for (let i = 0; i < 27; ++i) { options.push({ key: (i + 1) + '', value: i + '', text: i + '' }); }
        this.state.startHourListProps = {
            id: this.state.startTripHourId, name: 'startHour', title: 'Select 1st Trip start hour', options: options,
            value: this.state.startTripHour + '',
            handleChange: (e) => {
                this.state.startTripHour = parseInt(e.target.value, 10);
                this.fillStartHourListProps();
                this.refreshSetStateData();
            }
        };
    };
    fillStartMinutesListProps() {
        let options = [];
        for (let i = 0; i < 60; ++i) { options.push({ key: (i + 1) + '', value: i + '', text: i + '' }); }
        this.state.startMinuteListProps = {
            id: this.state.startTripMinutesId, name: 'startMinute', title: 'Select 1st Trip start minutes', options: options,
            value: this.state.startTripMinutes + '',
            handleChange: (e) => {
                this.state.startTripMinutes = parseInt(e.target.value, 10);
                this.fillStartMinutesListProps();
                this.refreshSetStateData();
            }
        };
    };
};

const GetDirectionShapeFromCoords2By2 = function (options) {
    let theThis = this; if (!(theThis instanceof GetDirectionShapeFromCoords2By2)) { return new GetDirectionShapeFromCoords2By2(options); }
    let distanceInMetersPieces, timeInSecondsPieces, shapePiecesRoutedPoly, allCallCoords, iCall;

    const callRouting = () => {
        let nCalls = allCallCoords.length;
        if (iCall < nCalls) {
            new tf.services.Routing({
                findAlternatives: false, level: 14, lineStringCoords: allCallCoords[iCall],
                mode: tf.consts.routingServiceModeCar, optionalScope: theThis, instructions: false,
                callBack: (notification) => {
                    //console.log('received ' + iCall);
                    let requestProps = notification.requestProps, routeSummary = notification.route_summary;
                    if (requestProps && requestProps.sender == theThis) {
                        if (notification.status == 0 && tf.js.GetIsNonEmptyArray(notification.route_geometry)) {
                            shapePiecesRoutedPoly[requestProps.iCall] = notification.route_geometry;
                            timeInSecondsPieces[requestProps.iCall] = routeSummary.total_time;
                            distanceInMetersPieces[requestProps.iCall] = routeSummary.total_distance;
                            ++iCall;
                            callRouting();
                        }
                        //else { console.log('error!!!'); }
                    }
                }, requestProps: { sender: theThis, iCall: iCall }
            });
        }
        else {
            let allPoly = [];
            for (let i = 0; i < nCalls; ++i) { Array.prototype.push.apply(allPoly, shapePiecesRoutedPoly[i]); }
            options.callback({ sender: theThis, coordinates: allPoly, distances_in_meters: distanceInMetersPieces, times_in_seconds: timeInSecondsPieces, options: options });
            timeInSecondsPieces = distanceInMetersPieces = shapePiecesRoutedPoly = allCallCoords = null;
        }
    };
    const getDirectionShapeFromCoords = (coordsParam, isClosed) => {
        let nCoords = coordsParam ? coordsParam.length : 0;
        if (nCoords > 1) {
            let coords = coordsParam.slice(0);
            if (isClosed) { coords.push(coordsParam[0]); ++nCoords; }
            allCallCoords = [];
            shapePiecesRoutedPoly = [];
            timeInSecondsPieces = [];
            distanceInMetersPieces = [];
            for (let i = 0; i < nCoords - 1; ++i) { allCallCoords.push([coords[i], coords[i + 1]]); }
            iCall = 0;
            callRouting();
        }
    };
    const initialize = () => {
        if (tf.js.GetFunctionOrNull(options.callback)) {
            getDirectionShapeFromCoords(options.coordinates, options.isClosed);
        }
    };
    initialize();
};

class TransitAgencySelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            firstRefresh: true,
            isError: false,
            isRefreshing: true,
            selectAgencyId: "selectAgencyId",
            selectAgencyProps: null,
            selectedAgency: null,
            selectAgencyOptions: null
        };
    };
    componentDidMount() {
        this.refreshAgencies();
    };
    refreshSetStateData() {
        this.setState(Object.assign({}, this.state));
    };
    refreshAgencies() {
        if (!this.state.isRefreshing || this.state.firstRefresh) {
            this.state.isRefreshing = true;
            this.refreshSetStateData();
            return axios.get(TransitAPI + 'agencies' + '?include_stage=true').then((res) => {
                this.state.isError = false;
                this.state.isRefreshing = false;
                if (res.data) {
                    let filteredData = res.data.filter(item => {
                        if ((this.props.acceptStage || !item.isStage) &&
                            (this.props.acceptNoPost || item.acceptsPost)
                            ){
                            return item;
                        }
                    });
                    this.state.selectAgencyOptions = this.createFillAgencyOptions(filteredData);
                    this.fillAgencyProps();
                    let isFirst = this.state.firstRefresh;
                    if (isFirst) { delete this.state.firstRefresh; }
                    if (isFirst && this.props.onFirstRefresh) {
                        setTimeout(() => { this.props.onFirstRefresh(); }, 1);
                    }
                }
                else { this.state.isError = true; }
                this.refreshSetStateData();
            }).catch(err => {
                this.state.isError = true;
                this.state.isRefreshing = false;
                let isFirst = this.state.firstRefresh;
                if (isFirst) { delete this.state.firstRefresh; }
                this.refreshSetStateData();
                console.log(err.message);
            });
        }
    };
    render() {
        let marginPx = commonStyles.marginPx;
        if (this.state.isError) {
            return (<div><label title=""><small>Error!</small></label></div>)
        }
        if (this.state.isRefreshing) {
            return (<div><label title=""><small>refreshing...</small></label></div>)
        }
        else {
            let displayStr = this.props.inlineBlock ? "inline-block" : "block";
            return (
                <div style={{ display: displayStr, margin: marginPx }}>
                    <label title="Select agency" htmlFor={this.state.selectAgencyId}><small>select agency</small>
                        <ListSelect props={this.state.selectAgencyProps} />
                    </label>
                </div>
            );
        }
    };
    createFillAgencyOptions(data) {
        let options = [];
        let dataLen = data.length;
        //if (dataLen > 2) { dataLen = 2; }
        let selectedValue = undefined;
        for (let i = 0; i < dataLen; ++i) {
            let di = data[i], diValue = di.prefix + '';
            options.push({ key: di.prefix + '', value: diValue, text: di.prefix });
            if (this.state.selectedAgency !== undefined && diValue == this.state.selectedAgency) {
                selectedValue = diValue;
            }
        }
        if (dataLen > 0) {
            if (selectedValue == undefined) { selectedValue = options[0].value; }
            this.state.selectedAgency = selectedValue;
        }
        else {
            this.state.selectedAgency = undefined;
        }
        return options;
    };
    fillAgencyProps() {
        let thisSelectedValue = this.state.selectedAgency !== undefined ? this.state.selectedAgency + '' : undefined;
        this.state.selectAgencyProps = {
            id: this.state.selectAgencyId, name: 'transitAgenciesSelect', title: 'Select a Transit Agency', options: this.state.selectAgencyOptions,
            value: thisSelectedValue,
            handleChange: (e) => {
                this.state.selectedAgency = e.target.value;
                this.fillAgencyProps();
                this.refreshSetStateData();
                if (this.props.onChange) { this.props.onChange(this); }
            }
        };
    };
};
