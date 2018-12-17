"use strict";

let gtfsLogin, crudx;

function afterLogin(notification) {
    if (crudx == undefined) {
        ReactDOM.render(<CRUDX />, document.getElementById('crudxContainer'));
    }
};

(function main() {
    window.id = 0;
    ReactDOM.render(<GTFSLogin afterLogin={afterLogin} />, document.getElementById('loginContainer'));
})();
