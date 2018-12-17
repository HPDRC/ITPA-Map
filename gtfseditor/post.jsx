"use strict";

class GTFSPostAgency extends React.Component {
    constructor(props) {
        super(props);
        let agencyName = "Agency " + globalAgencyPrefix;
        this.copyAgencyGTFSButtonId = "copyAgencyGTFSId";
        this.state = { agencyName: agencyName, postingToServer: false };
        gtfsPostAgency = this;
    };
    componentDidMount() { };
    refreshSetState() { this.setState(Object.assign({}, this.state)); };
    doPostGTFSToServer(agencyPrefixUse) {
        if (!this.state.postingToServer) {
            if (gtfsCalendar && gtfsCalendarDates && gtfsRoutes && gtfsStops && gtfsStopSequences && gtfsTrips) {
                this.state.postingToServer = true;
                let record = {
                    authForm: gtfsLogin.getAuthForm(),
                    gtfsContent: {
                        agency_prefix: agencyPrefixUse,
                        calendar: gtfsCalendar.getJSON(),
                        calendar_dates: gtfsCalendarDates.getJSON(),
                        routes: gtfsRoutes.getJSON(),
                        shapes: gtfsShapes.getJSON(),
                        stops: gtfsStops.getJSON(),
                        stop_sequences: gtfsStopSequences.getJSON(),
                        trip_groups: gtfsTrips.getJSON(),
                        first_trip_id: 1000
                    }
                };
                this.refreshSetState();
                new tf.ajax.JSONGet().Request(GTFSAPI, function (notification) {
                    if (this.state.postingToServer) {
                        this.state.postingToServer = false;
                        this.refreshSetState();
                    }
                }, this, undefined, false, undefined, undefined, JSON.stringify(record));
            }
        }
    };
    postGTFSToServer() {
        this.doPostGTFSToServer(globalAgencyPrefix);
    };
    copyGTFS() {
        if (!this.state.postingToServer) {
            let elem = document.getElementById(this.copyAgencyGTFSButtonId);
            if (elem) {
                let value = elem.value;
                elem.value = "";
                if (!!value && value.length > 0) {
                    value = value.toUpperCase();
                    if (value != globalAgencyPrefix) {
                        gtfsCalendar.updateTableWithJSON(value);
                        gtfsCalendarDates.updateTableWithJSON(value);
                        gtfsRoutes.updateTableWithJSON(value);
                        gtfsShapes.updateTableWithJSON(value);
                        gtfsStops.updateTableWithJSON(value);
                        gtfsStopSequences.updateTableWithJSON(value);
                        gtfsTrips.updateTableWithJSON(value);
                    }
                }
            }
        }
    };
    onCopyAgencyNameInput(notification) {
        if (notification && notification.inputElement) {
            let inputElement = notification.inputElement, regex = /^[a-zA-Z_]+$/;
            if (regex.test(inputElement.value) !== true) { inputElement.value = inputElement.value.replace(/[^a-zA-Z_]+/, ''); }
        }
    };
    render() {
        if (this.state.postingToServer) {
            return (
                <div className="gtfsList">
                    <Title title={this.state.agencyName} />
                </div>
            );
        }
        else {
            return (
                <div className="gtfsList">
                    <Title title={this.state.agencyName} />
                    <SingleLineInputForm
                        inputId={this.copyAgencyGTFSButtonId}
                        inputLabel="Type an agency prefix to copy this GTFS to"
                        sendSubmitValue={this.copyGTFS.bind(this)}
                        maxLength="5"
                        onInput={this.onCopyAgencyNameInput.bind(this)}
                    />
                    <BarButton value="Copy To" title="Copy GTFS to agency prefix above" onClick={this.copyGTFS.bind(this)} />
                    <BarButton value="Publish" title="Publish GTFS to server" onClick={this.postGTFSToServer.bind(this)} />
                </div>
            );
        }
    };
};