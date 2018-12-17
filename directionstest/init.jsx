"use strict";

let gtfsLogin, gtfsAddresses;

function afterLogin(notification) {
    if (gtfsAddresses == undefined) {
        ReactDOM.render(<DirectionsTest />, document.getElementById('addressesContainer'));
    }
};

(function main() {
    window.id = 0;
    ReactDOM.render(<GTFSLogin afterLogin={afterLogin} />, document.getElementById('loginContainer'));
})();
