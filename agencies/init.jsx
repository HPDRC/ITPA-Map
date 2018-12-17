"use strict";

let gtfsLogin, transitAgencies;

function afterLogin(notification) {
    if (transitAgencies == undefined) {
        ReactDOM.render(<TransitAgencies />, document.getElementById('agenciesContainer'));
    }
};

(function main() {
    window.id = 0;
    ReactDOM.render(<GTFSLogin afterLogin={afterLogin} />, document.getElementById('loginContainer'));
})();
