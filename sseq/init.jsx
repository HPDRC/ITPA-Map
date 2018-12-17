"use strict";

let gtfsLogin, transitStopSequences;

function afterLogin(notification) {
    if (transitStopSequences == undefined) {
        ReactDOM.render(<TransitStopSequences />, document.getElementById('stopSequencesContainer'));
    }
};

(function main() {
    window.id = 0;
    ReactDOM.render(<GTFSLogin afterLogin={afterLogin} />, document.getElementById('loginContainer'));
})();
