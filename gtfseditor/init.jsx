"use strict";

let gtfsBusTracking, gtfsPostAgency, gtfsLogin, gtfsCalendar, gtfsCalendarDates, gtfsRoutes, gtfsStops, gtfsShapes, gtfsStopSequences, gtfsTrips;

function afterLogin(notification) {
    if (gtfsCalendar == undefined) {
        ReactDOM.render(<GTFSBusTracking />, document.getElementById('busTrackingContainer'));
        ReactDOM.render(<GTFSCalendar />, document.getElementById('calendarContainer'));
        ReactDOM.render(<GTFSRoutes />, document.getElementById('routesContainer'));
        ReactDOM.render(<GTFSStops />, document.getElementById('stopsContainer'));
        ReactDOM.render(<GTFSShapes />, document.getElementById('shapesContainer'));
    }
};

(function main() {
    let params = tf.urlapi.ParseURLAPIParameters(window.location.href);
    globalAgencyPrefix = tf.js.GetNonEmptyString(params.agency, "UTMA");
    window.id = 0;
    ReactDOM.render(<GTFSLogin afterLogin={afterLogin} />, document.getElementById('loginContainer'));
})();
