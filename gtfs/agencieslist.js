"use strict";

tf.GTFS.AgenciesList = function (settings) {
    var theThis, KL, usersKLListener;

    this.GetKL = function () { return KL; }

    function makeListEmpty() { updateKL([]); }

    function updateKL(withJSON) {
        KL.UpdateFromNewData(withJSON);
        //tf.GTFS.DumpKL(KL);
    }

    function onListFromAPI(response) {
        if (!!response && !!response.responseJSON && !!tf.js.GetIsArray(response.responseJSON)) {
            updateKL(response.responseJSON);
        }
        else {
            makeListEmpty();
        }
    }

    function refreshFromAPI() {
        var auth = settings.apiClient.GetAuth();
        if (auth.email) {
            if (auth.isAdmin) { settings.apiClient.AdminAgencyGet(onListFromAPI); }
            else { settings.apiClient.UserAgenciesGet(onListFromAPI); }
        }
        else {
            makeListEmpty();
        }
    }

    function refreshSignInState() {
        refreshFromAPI();
    }

    function onAuthChange(/*newAuth*/) { refreshSignInState(); }

    function createKL() {
        KL = new tf.js.KeyedList({
            name: "agencies",
            getKeyFromItemData: function (d) {
                return d.id;
            },
            needsUpdateItemData: function (u) { return true },
            filterAddItem: function (d) { return true; }
        });
    };

    function onRefreshFromNotification(notification) {
        //console.log(notification.eventName);
        refreshSignInState();
        console.log('refreshed agencies');
    }

    function onRefreshFromNotificationIfNotAdmin(notification) {
        var auth = settings.apiClient.GetAuth();
        if (!(auth.email && auth.isAdmin)) {
            onRefreshFromNotification(notification);
        }
    }

    function onAgencyDeleted(notification) {
        console.log('agency deleted');
        return onRefreshFromNotification(notification);
    }

    function initialize() {
        createKL();
        settings.apiClient.AddAuthListener(onAuthChange);

        settings.notify.AddAgencyAddedListener(onRefreshFromNotification);
        settings.notify.AddAgencyDeletedListener(onAgencyDeleted);
        settings.notify.AddAgencyChangedListener(onRefreshFromNotification);

        settings.notify.AddUserAddedToAgencyListener(onRefreshFromNotificationIfNotAdmin);
        settings.notify.AddUserRemovedFromAgencyListener(onRefreshFromNotificationIfNotAdmin);

        refreshSignInState();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
